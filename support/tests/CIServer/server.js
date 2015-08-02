"use strict";

var helper = require('./helper.js'),
	async = require("async"),
	http = require("http"),
	path = require("path"),
	childprocess = require("child_process"),
	fs = require('fs');

var report = { tests: {}, gitLog: "" };

var RUNNING = helper.state.RUNNING,
	READY = helper.state.READY,
	COMPLETE = helper.state.READY,
	ERROR = helper.state.ERROR,
	UPDATING = helper.state.UPDATING,
	BUSY = helper.state.BUSY;


var status = READY;
var tests = [];
var testQueue = [];

var files = helper.files;
var findFiles = helper.findFiles;
var runner;
var sandbox;

function readFiles(nextStep) {
	logger.log("readFiles")
	//for each file
	nextStep = nextStep ? nextStep : function(){};
	async.eachSeries(files, function(filename, nextfile) {
		logger.log(filename);
		try {
			var newTests = helper.getAllTestData(filename);
			tests = tests.concat(newTests)
			for (var i in newTests) {
				var test = helper.createTest(newTests[i].title, filename);
				var id = test.filename + ":" + test.title;
				report.tests[id] = test;
			}
		} catch (e) {
			report.tests[filename] = helper.createTest(filename, filename);
			report.tests[filename].status = "test load error";
		}
		nextfile();
	}, nextStep);
}

function gitLog() {
	var log = childprocess.spawn("git", ["log", '-1'], {
		cwd: "../../../"
	});

	log.stdout.on('data', function(data) {
		//Wait for startup complete
		report.gitLog += data.toString();
	});
}

function gitPull(pullComplete) {
	logger.log("Git Pull");
	var gitpull = childprocess.spawn("git", ["pull"], {
		cwd: "../../../",
		//stdio:'inherit'
	});
	//log errors
	gitpull.stdout.on('data', function(data) {
		report.gitLog += data.toString();
	});
	gitpull.stderr.on('data', function(data) {
		report.gitLog += data.toString();
	});
	//wait for process to complete
	gitpull.on('close', function(code) {
		if (code !== 0) {
			logger.log('ps process exited with code ' + code);
		}
		pullComplete();
	});
}

function startSandbox(cb) {
	logger.log("Sandbox start");
	//start the sandbox server
	sandbox = childprocess.spawn("node", ["app.js"], {
		cwd: "../../../"
	});
	var startupGood = false;
	sandbox.stdout.on('data', function(data) {
		//Wait for startup complete
		if (data.toString().indexOf("Startup complete") > -1) {
			startupGood = true;
			sandbox.removeAllListeners('exit')
			cb();
		}
	})
	sandbox.on('exit', function(code) {
		if (sandbox && startupGood == false) {
			logger.log('sandbox exit without good start')
			sandbox = null;
			cb();
		}
	});
}

function killSandbox(cb) {
	logger.log("Sandbox stop");
	var called = false;
	if (sandbox) {
		var timeoutid = setTimeout(function() {
			called = true;
			logger.log('exiting calling callback')
			cb();
		}, 2000)
		sandbox.on('exit', function(code) {
			sandbox = null;
			if (!called) {
				clearTimeout(timeoutid)
				called = true;
				logger.log('exiting calling callback')
				cb();
			}
		});
		sandbox.kill();
	} else {
		cb()
	}
}

function handleIncomingMessage(message, handler){
	console.log("Server status", status);
	var command = message[0];
	var param = message[1];

	switch(status){
		case RUNNING: handleRunningState(command, param); break;
		case READY: handleReadyState(command, param); break;
		case COMPLETE: handleReadyState(command, param); break;
		case ERROR: handleErrorState(command, param); break;
		case UPDATING: handleUpdatingState(command, param); break;
		case BUSY: handleBusyState(command, param); break;
	}

	handleStateless(command, param);
}

function handleStateless(command, param){
	if(param.isHTTP){
		if(command === helper.command.STOP){
			testQueue.length = 0;
		}

		param.response.end();
	}

	//It doesn't matter when we get results... always update report.
	if(command == helper.command.RESULT){
		console.log("The server received the results of the test!: ", param);
		updateReport(param);
	}
}

function handleBusyState(command, param){
	//If command is from runner and runner is ready, then we can leave busy state
	if(!param.isHTTP && checkState(command, param, READY)){
		status = READY;
		doRunCommand();
	}
}
function handleUpdatingState(command, param){
	if(!param.isHTTP && checkState(command, param, READY)){
		doReload();
	}
}

function handleErrorState(command, param){
	//This ensures that we ignore all commands until the runner is back up and running
	if(!param.isHTTP && checkState(command, param, READY)){
		doRunCommand();
	}
}
function handleReadyState(command, param){
	console.log("We are in the ready state, command is:", command);
	//command is http request
	if(param.isHTTP){
		if(command == helper.command.RUN){
			queueAllTests();
			status = UPDATING;
			doReload();
		}
		else if(command === helper.command.RUN_ONE){
			addTestToQueue(param.query);
			doRunCommand();
		}
		else if(command === helper.command.QUIT){
			quitRunner();
		}
		//Change status, do actual reload when runner is ready
		else if(command === helper.command.RELOAD){
			status = UPDATING;
			doReload();
		}
	}

	//Response from runner.. test is complete
	else{
		//if runner is "updating" state to ready...
		if(checkState(command, param, READY)){
			doRunCommand();
		}
	}
}

function handleRunningState(command, param){
	//command from client
	if(param.isHTTP){
		if(command == helper.command.RUN){
			queueAllTests();
			status = UPDATING;
		}
		else if(command == helper.command.RUN_ONE){
			addTestToQueue(param.query);
		}
		//Change status, do actual reload when runner is ready
		else if(command === helper.command.RELOAD){
			status = UPDATING;
		}
	}

	//command from runner
	else{
		//The runner is going to exit. Handle final report.
		if(command == helper.command.ERROR){
			logger.log(param);
			updateReport(param);
			status = ERROR;
		}
		else if(checkState(command, param, READY)){
			console.log("The runner is ready again... run next test... ", param);

			//get next item off of queue
			doRunCommand();
		}
	}
}

function doRunCommand(){
	if(testQueue.length > 0){
		//get item at front of "queue"
		var tid = testQueue.shift();
		status = RUNNING;

		report.tests[tid].status = "running";
		helper.sendMessage(runner, helper.command.RUN_ONE, tid);
	}
	else status = READY;
}

function doReload(){
	status = helper.state.BUSY;

	async.series([
		gitPull,
		helper.findFiles,
		readFiles,
		killSandbox,
		startSandbox,
		quitRunner
	]);
}

function quitRunner(cb){
	//Do not accept any commands from other states until reload is complete
	status = helper.state.BUSY;

	helper.sendMessage(runner, helper.command.QUIT);
	if(cb) cb();
}

function setTestQueue(arr){
	testQueue.length = 0;
	testQueue.push.apply(testQueue, arr);
}

function addTestToQueue(tid){
	var testIds = Array.isArray(tid) ? tid : [tid];

	for(var i = 0; i < testIds.length; i++){
		var tid = decodeURIComponent(testIds[i]);
		if(testQueue.indexOf(tid) < 0){
			testQueue.push(tid);
			logger.log(tid, "added to queue");
		}
		else{
			logger.log(tid, "is already in queue");
		}
	}
}

function checkState(command, test, state){
	return command === helper.command.STATE && test === state;
}

function updateReport(update){
	report.tests[update.id] = update;
}

function createRunner(cb){
	runner = childprocess.fork("runner.js");
	runner.on("message", handleIncomingMessage);
	runner.on("error", function(message, handle){
		console.log("Server received error from runner: ", message);
	});
	runner.on("exit", function(message, handle){
		console.log("Runner exited with message: " + message);

		//If necessary, we can check message to determine if this actually was an error.
		//As of now, it doesn't really matter since the flow is more or less the same.
		if(status != UPDATING) status = ERROR;
		createRunner();
	});

	if(cb) cb();
}

var server = http.createServer();
server.on('request', function(request, response) {
	request.url = decodeURI(request.url);
	if (request.url.indexOf("/ui/") == 0) {
		if (request.url === "/ui/") {
			request.url += 'tests.html'
		}

		try {
			var data = fs.readFileSync("." + request.url);
			response.write(data)
		} catch (e) {
			response.writeHead(500);
			response.write(e.toString())
		}
		response.end();
		return;
	}

	else if(request.url == helper.command.STATE) {
		report.status = status;
		report.log = logger._log;
		response.write(JSON.stringify(report));
		response.end();
		return;
	}

	else{
		var tempArr = request.url.split("?");
		var command = tempArr[0];
		var param = tempArr[1];
		handleIncomingMessage([command, {request: request, response: response, isHTTP: true, query: param}]);
		response.end();
		return;
	}
});

function queueAllTests(cb){
	var allIDs = Object.keys(report.tests);
	setTestQueue(allIDs);

	if(cb) cb();
}

function listen(){
	global.setTimeout(function(){
		console.log("Server is listening");
		server.listen(port);
	}, 3000);
}

gitLog();
var port = 8181;

var p = process.argv.indexOf('-p');
port = p >= 0 ? parseInt(process.argv[p + 1]) : 8181;


if (process.argv.indexOf('start') > -1){
	async.series([gitPull, startSandbox, helper.findFiles, readFiles, queueAllTests, createRunner], listen);
}
else{
	async.series([gitPull, helper.findFiles, startSandbox, readFiles, createRunner], listen);
}
