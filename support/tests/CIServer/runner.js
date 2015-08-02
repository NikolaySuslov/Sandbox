"use strict";

var async  = require('async'),
	helper = require('./helper.js'),
	state  = helper.state.READY,
	currentReport = {runs: []},
	currentTestID,
	browsersList = ['chrome','firefox'/*,'ie11'*/];

//Set up error handlers
var domain = require('domain').create();
process.on('uncaughtException', handleException);
domain.on('error', handleException);

//Initialize the web driver
helper.initWebdriver({
	desiredCapabilities: {
		browserName: browsersList[0]
	}
});

//Listen for messages from the server
process.on("message", function(message, handle){
	var command = message[0];
	var param = message[1];

	console.log("Runner received a message:", message);

	switch(state){
		//for now, runner does not accept commands while running
		case helper.state.RUNNING: break;
		case helper.state.READY: handleReadyState(command, param); break;
	}

	//"Remind" the server that we are ready if the state hasn't changed from ready
	if(state === helper.state.READY){
		updateState(helper.state.READY);
	}
});

//Runner is in ready state; handle incoming commands
function handleReadyState(command, param){
	if(command === helper.command.RUN_ONE){
		doRunCommand(param);
	}
	else if(command === helper.command.QUIT){
		exit();
	}
}

function doRunCommand(param){
	if(!param) return;

	var testObj = helper.getSingleTestData(param);
	currentTestID = param;

	currentReport = {
		id: currentTestID,
		status: 'complete',
		result: null,
		message: null,
		filename: testObj.filename,
		title: testObj.title,
		runs: [],
	};

	//let server know about updated state, if necessary.
	//This must only happen once so we don't overwrite the cancel state
	updateState(helper.state.RUNNING);

	//For each browser, run a single test, then send a message to server when all tests are complete.
	async.eachSeries(browsersList, runSingleTest, function sendResults(){
		helper.sendMessage(process, helper.command.RESULT, currentReport);
		updateState(helper.state.READY);
	});
}

function runSingleTest(browserName, done){
	if(state === helper.state.RUNNING){
		global.browser.desiredCapabilities.browserName = browserName;

		//Start the browser and run the test
		async.series([
			startBrowser,
			_executeActualTestAsync
		], done);
	}
	else done();
}

//Should not be called directly. Use runSingleTest instead.
//Could move into runSingleTest function block, but this is cleaner.
function _executeActualTestAsync(cb){
	var browserName = global.browser.desiredCapabilities.browserName;
	var testObj = helper.getSingleTestData(currentTestID);

	var handledTest = domain.bind(testObj.test);
	handledTest(global.browser, global.testUtils.completeTest(function(success, message) {
		console.log("Finished running test using ", browserName, message);

		currentReport.runs.push({
			status: "complete",
			result: success ? "passed" : "failed",
			message: "" + message,
			browsername: browserName
		});

		global.browser.end();
		runLater(cb);
	}));
}

function startBrowser(cb){
	browser.init().then(function() {
		cb()
	});
}

function updateState(newState){
	//Whenever there's a change in state, notify server
	helper.sendMessage(process, helper.command.STATE, newState);
	state = newState;
}

function runLater(fn, timeout){
	timeout = timeout ? timeout : 500;
	global.setTimeout(fn, timeout);
}

function handleException(e){
	var browserName = global.browser.desiredCapabilities.browserName;
	
	currentReport.runs.push({
		status: "error",
		result: "error",
		message: " " + e.toString() + "; ",
		browsername: browserName
	});

	helper.sendMessage(process, helper.command.ERROR, currentReport);

	global.browser.endAll().then(exitWithError);
	runLater(exitWithError, 10000);
}

function exitWithError(){
	exit(1);
}
function exit(errorCode){
	process.removeListener('uncaughtException', handleException);
	domain.exit();
	process.exit(errorCode?errorCode:0);
}

//Send server initial ready state
updateState(helper.state.READY);
console.log("I am running!");
