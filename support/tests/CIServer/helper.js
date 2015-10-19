"use strict";

var fs = require('fs');

exports.files = [];

exports.command = {
	/* Shared commands */
	STATE: "/status",
	RUN_ONE: "/runOne",
	QUIT: "/quit",

	/* Server-only commands */
	RUN: "/runTests",
	RELOAD: "/reload",
	RESULT: "result",
	STOP: "/stop",

	/* Runner-only command */
	ERROR: "error",
};

exports.state = {
	RUNNING: "running",
	READY: "ready",
	ERROR: "error",
	UPDATING: "updating",
	BUSY: "busy",
};

/*
* Internal Properties
*/

var cacheTests = {};
var sandbox;
var webdriverio;

/*
* Public Functions
*/

exports.sendMessage = function(runner, command, param){
	console.log("sending command...", command);

	//if(param)
	runner.send([command, param]);
	//else runner.send([command]);
};

exports.clearCache = function(){
	for(filename in cacheTests){
		// remove so the results are not cached, and the git pull can update tests
		if(cacheTests.hasOwnProperty(filename)){
			delete require.cache["../client/" + filename];
			delete cacheTests[filename];
		}
	}
};

exports.getAllTestData = function(filename){
	//each test can be a function that returns an array of tests, or a single test
	if(cacheTests[filename]){
		return cacheTests[filename];
	}

	var test = require("../client/" + filename);
	var testData = null;

	//the module is a function that returns an array of tests
	if (test instanceof Function)
		testData = test();

	//the module is a test
	else if (test.test instanceof Function)
		testData = [test]

	else //the module is a nightwatch style test
	{
		var title = Object.keys(test)[0]
		var newtest = test[title];
		if (newtest instanceof Function){
			testData = [{
				title: title,
				test: newtest,
			}];
		}
	}

	//Add the filename to each of the tests
	for(var i = 0; i < testData.length; i++){
		testData[i].filename = filename;
	}

	cacheTests[filename] = testData;
	return testData;
};

exports.getSingleTestData = function(testId){
	var tempArr = testId.split(":");

	//Doing this allows colons to appear in the title
	var filename = tempArr.shift();
	var title = tempArr.join(":");

	//Given a filename, get an array of test objects
	var allTests = exports.getAllTestData(filename);

	//Search for single test with matching title and return it if found
	for(var i = 0; i < allTests.length; i++){
		if(title === allTests[i].title){
			return allTests[i];
		}
	}

	return null;
};

exports.createTest = function(title, filename){
	return {
		status: "not started",
		result: null,
		message: null,
		title: title,
		filename: filename,
		runs: []
	};
};

exports.findFiles = function(nextStep, dir){
	exports.files.length = 0;
	findFiles(nextStep, dir)
};

exports.initWebdriver = function(browserOptions){
	webdriverio = require('webdriverio');

	global.browser = webdriverio.remote(browserOptions);
	console.log(Object.keys(global.browser));

	global.testUtils = require('../utils/testutils');
	global.testUtils.hookupUtils(browser);
};

/*
* Internal Utility Functions
*/

function findFiles(nextStep, dir) {
	logger.log("findFiles")
	var foundFiles;
	var baseDir = "../client/";
	var dirList = [];

	dir = dir ? dir : "";

	try {
		foundFiles = fs.readdirSync(baseDir + dir);
	} catch (e) {
		console.log("Error reading files: ", e);
		if (nextStep) nextStep();
		return;
	}

	//iterate over "foundFiles" and if directory, recursively call findFiles...
	for (var i = 0; i < foundFiles.length; i++) {
		if (fs.lstatSync(baseDir + dir + foundFiles[i]).isDirectory())
			dirList.push(dir + foundFiles[i] + "/");

		else
			exports.files.push(dir + foundFiles[i]);
	}

	for (var i = 0; i < dirList.length; i++)
		findFiles(null, dirList[i]);

	if (nextStep) nextStep();
}

/*
* Global Functions
*/

global.logger = {
	log: function() {
		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (arg instanceof Number)
				this._log += arg + '\n';
			else if (arg instanceof String)
				this._log += arg + '\n';
			else if (arg instanceof Object)
				this._log += JSON.stringify(arg) + '\n';
			else if (arg)
				this._log += arg.toString() + '\n';
		}

		var strLen = this._log.length;
		if(strLen > 5000) this._log = this._log.substr(strLen - 5000);
	},
	_log: ""
};
