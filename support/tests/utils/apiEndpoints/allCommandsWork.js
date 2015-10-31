 /*This is the ambitious idea to run all commands from one file and run them
    with various data to test the SandboxAPI endpoints and find what crashes
    and excepts, so that we can make them work.
    file: Sandbox / support / server / sandboxAPI.js
    That is the file we are testing against.To test against it we use an array
    of command objects which include name, array of methods, array of keys, and array of values.
    An array of data(empty string, garbage string...) to
    try and
    break the API.
    Cookie to hold the valid session cookie(we could
    	try making up garbage here)
    Could also use variables to hold valid profile names, states, and such.
    Run all kinds of scenarios - come back to this
    As of October 2015, this is how I am working it.I run this program(node allCommandsWork.js) with all the commands I want to test uncommented(or I comment out all the commands I don 't wish to run/test).  I cna then manually hardcode in changes I want to try against the endpoints and run it again.  This is not the best way, but it is the way it is currently working.  Feel free to make it better.  I have completely wrugn myself out trying to work a second loop.  And it has also been enough work teasing out what data each endpoint needs in order to work.  Comments at each command help by saying what an expected good result is and what conditions will cause a crash or server error.

    		For more complete documentation on what causes server crashes and errors, see SandboxAPI Crash Report.md.Other files
    		for use in testing are:
    		commandOptions.js - the commands and options extracted into a separate file available through module.exports createProfile.js - runs commands without loggin in (unlike allCommandsWork.js) useful
    		for testing createprofile which does not work when logged in , or other commands without loggin in .loginLocal10.js - useful
    		for simply testing against loging in
    		CreateProfile.txt - logged output of the most recent run of commands with createProfile.js EndpointReport.txt - log of all 5 xx type responses from the server froom the most recent run of allCommandsWork.js EndpointResults.txt - log of all results of the most recent run of allCommandsWork.js Do make sure that uid 's and sid'
    		s and everything
    		else correspond to the instance of the vw Sandbox you are using.Use responsibly and have fun!!!

    			*/
 // console.log('Howdy!');//intro - we're working
 //loading modules
 var request = require('request');
 var fs = require('fs');
 var async = require('async');
 //URI help
 var root = 'http://localhost:3000/';
 var sandbox = 'sandbox/adl/';
 var vwf = 'vwfdatamanager.svc/';
 var auth = 'auth/local/';
 //Command help
 var sid = '?SID=_adl_sandbox_L8BnGGj85ZHAmsy1_';
 // var UID = 'Postman';
 // var pword = 'Postman123';
 var UID = 'joe';
 var pword = 'Abc123456'; //"793af97e52c796fdf016c2f242663a8e203b1ff93e14b4c3a1bea4798d081ff0"
 var SID = '_adl_sandbox_L8BnGGj85ZHAmsy1_';
 var salt = ""; //"e099584b-b004-d202-f948-6b6eac9da36 "
 var cookie = "";
 var AID;
 var thumbnail = "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";
 var winston = require('winston');
 winston.emitErrs = false;
 var logger = new winston.Logger(
 {
 	transports: [
 		new winston.transports.Console(
 		{
 			level: 'info',
 			handleExceptions: true,
 			json: false,
 			colorize: 'all',
 		})
 	],
 	exitOnError: false
 });
 //array of strings to be used in trying to break the api
 var badData = [, //undefined	0
 		'', //empty string	1
 		'abc123', //	2
 		'*^%#@', //please don't swear	3
 		'>}<:>)P{?>^%}', //random other symbols	4
 		'\t\n\'', //escape sequences	5
 		'&#2045&#x2045', //weird characters	6
 		'whats\x45\x99\xa3\x0athis', //weirder characters	7
 		'Rob is great', //propaganda	8
 		'Andy is better', //better propaganda	9
 		'_willthiswork', //underscore start	10
 		'Mick "the Mick" Muzac', //double quotes	11
 		"Steven 'the Steve' Vergenz", //single quotes	12
 	]
 	//setting up the command objects
 var queryStringParams = [
 	"SID",
 	"UID",
 	"S",
 	"CID", "AID", "title", "type", "P", "statename", "backup", "auto",
 	'', //empty string	1
 	'abc123', //	2
 	'*^%#@', //please don't swear	3
 	'>}<:>)P{?>^%}', //random other symbols	4
 	'\t\n\'', //escape sequences	5
 	'&#2045&#x2045', //weird characters	6
 	"BRxmrirkQp80UdeU" // a real state name
 ]
 var bodies = [
 	"{}",
 	"{'foo':'bar'}",
 	"{'fo%o':'bar'}",
 	"{'foo':null}",
 	"this is a string",
 	new Float32Array(200)
 ]
 var commands = [
 	none = {
 		//this command is a setup it is never going to produce a favorable response
 		name: '',
 		method: 'GET',
 		url: root + sandbox + vwf,
 	},
 	none = {
 		//this command is a setup it is never going to produce a favorable response
 		name: '',
 		method: 'POST',
 		url: root + sandbox + vwf,
 	},
 	none = {
 		//this command is a setup it is never going to produce a favorable response
 		name: '',
 		method: 'DELETE',
 		url: root + sandbox + vwf,
 	},
 	drdownload = {
 		//401
 		name: '3drdownload',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + '3drdownload',
 	},
 	drmetadata = {
 		//401 and the page
 		name: '3drmetadata',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + '3drmetadata',
 	},
 	drpermission = {
 		//401 ""
 		name: '3drpermission',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + '3drpermission',
 	},
 	drsearch = {
 		//comes back 200; however i give it nothing to search for and it comes back with nothing.  It would be nice to search for different files and find a few
 		name: '3drsearch',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + '3drsearch',
 	},
 	drtexture = {
 		//401
 		name: '3drtexture',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + '3drtexture',
 	},
 	drthumbnail = {
 		//401
 		name: '3drthumbnail',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + '3drthumbnail',
 	},
 	drupload = {
 		//404 404 not found
 		//and with uid and sid i'm getting 500
 		//how did I get the 404??
 		name: '3drupload',
 		method: 'POST',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		form:
 		{},
 		url: root + sandbox + vwf + '3drupload',
 	},
 	apppath = {
 		//this one works as is
 		//login not required, qs not required
 		//returns the path to the application
 		name: 'apppath',
 		method: 'GET',
 		// qs : {
 		// 	'UID' : UID,
 		// 	'SID' : SID,
 		// },
 		url: root + sandbox + vwf + 'apppath',
 	},
 	cameras = {
 		//requires login and sid
 		//returns empty array if world contains no added cameras
 		//works as is.  Would like to add a camera to double check
 		// 200 [{"name":"Camera1","id":"SandboxCamera-vwf-N32196c51"}]
 		//with no SID - big ugly 500 TypeError
 		name: 'cameras',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			//this sid has a camera
 			// 'SID' : "_adl_sandbox_E8acu9xeKsoaARn7_",
 			// 'SID' : SID,
 		},
 		url: root + sandbox + vwf + 'cameras',
 	},
 	copyinstance = {
 		//weird - 200 _adl_sandbox_jzfyZYS4Vwt9iXh3_ find out more about this instance
 		//yep I seem to be creating instances left and right about 60+ worlds now
 		name: 'copyinstance',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,
 			// 'SID' : '_adl_sandbox_jzfyZYS4Vwt9iXh3_',
 		},
 		url: root + sandbox + vwf + 'copyinstance',
 	},
 	createprofile = {
 		// 500 user Postman already exists
 		// do I have to be logged out to do this - yes
 		//see: createProfile.js, createprofile.txt, and createProfileSeries.js
 		//requires UID, and form with Username, Password, and Email
 		name: 'createprofile',
 		method: 'POST',
 		// qs : {
 		// 	'UID' : UID,
 		// 	'SID' : SID,
 		// },
 		// form : {
 		// 	Username : 'Remy',
 		// 	Email : 'remy@mail.com',
 		// 	password : 'beware333Squirrels',
 		// 	password2 : 'beware333Squirrels',
 		// 	dateofbirth : '01022015',
 		// 	sex : 'male',
 		// 	relationshipstatus: 'none',
 		// 	fullname : "Remy 'Dude' Creighton",
 		// 	location : 'Orlando FL',
 		// 	homepage : 'remy.com',
 		// 	employer : 'no need',
 		// },
 		url: root + sandbox + vwf + 'createprofile',
 	},
 	createstate = {
 		//401 'text/plain' 'Anonymous users cannot create instances\n'
 		//200 Created state _adl_sandbox_AWtJY9uwVKvInoV4_
 		//must be logged in, no other data is needed
 		name: 'createstate',
 		method: 'POST',
 		// qs : {
 		// 	// 'UID' : UID,
 		// 	// 'SID' : SID,
 		// },
 		url: root + sandbox + vwf + 'createstate',
 	},
 	datafile = {
 		//404 file not found
 		//Still not sure of this one
 		name: 'datafile',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + 'datafile',
 	},
 	docdir = {
 		//works fine as is, find way to suppress or shorten
 		name: 'docdir',
 		method: 'GET',
 		// qs : {	'UID' : UID,
 		// 	'SID' : SID,},
 		url: root + sandbox + vwf + 'docdir',
 	},
 	error = {
 		//200
 		//must be logged in
 		//qs and form seems to have no effect
 		name: 'error',
 		method: 'POST',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		form:
 		{
 			// msg : 'Does this show up in Error??',
 			msg: '',
 		},
 		url: root + sandbox + vwf + 'error',
 	},
 	forgotpassword = {
 		//200
 		//seems to be working just fine, logging in with the old password keeps the old one valid
 		//can use while logged out with a valid UID in qs
 		//or while logged in with no UID
 		//or logged in and any valid UID - in this case resets password of valid UID
 		name: 'forgotpassword',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : "joe",
 			// 'SID' : SID,
 		},
 		url: root + sandbox + vwf + 'forgotpassword',
 	},
 	getanalytics = {
 		//200 //Analytics not found, find analytics
 		//What is an analyticsObj??
 		name: 'getanalytics.js',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + 'getanalytics.js',
 	},
 	getassets = {
 		//200 and array of assets
 		//with no SID in qs - 500 TypeError - big ugly
 		//with or without login - must have state id
 		//with invalid state id - returns empty array []
 		name: 'getassets',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,
 			// 'SID' : 'SID',
 			'SID': 'nope',
 		},
 		url: root + sandbox + vwf + 'getassets',
 	},
 	geteditorcss = {
 		//used to be library, now covers more
 		//beware returns the css approx 2800 lines
 		//no login or qs needed
 		name: 'geteditorcss',
 		method: 'GET',
 		// qs : {
 		// 	'UID' : UID,
 		// 	'SID' : SID,
 		// },
 		url: root + sandbox + vwf + 'geteditorcss',
 	},
 	globalassetP = {
 		// 200 e445fe78-0e58-4383-aba5-6fbe347cf118
 		//UID and SID are not needed
 		//title, type, formdata are optional
 		//must be logged in
 		name: 'globalasset',
 		method: 'POST',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,
 			title: 'chair',
 			type: 'wooden',
 		},
 		form:
 		{
 			foo: 'Nothing here really',
 		},
 		url: root + sandbox + vwf + 'globalasset',
 	},
 	globalassetD = {
 		//200 ok
 		//with valid active AID in qs
 		//does not need UID or SID, do need to be logged in
 		//no AID handled - 500 no AID in query string
 		//Invalid AID crashes sandbox!!!!!!!!!!!!!!!!!!!
 		name: 'globalasset',
 		method: 'DELETE',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,
 			'AID': 'bc6c676b-5b0d-420b-9e2f-b3dcb16d25a0',
 			// title : 'chair',
 			// type : 'wooden',
 		},
 		// form : {},
 		url: root + sandbox + vwf + 'globalasset',
 	},
 	globalassetassetdata = {
 		//200 {}
 		//must be logged in and have valid AID
 		//no AID - 500 no AID in query string
 		//want to find a valid AID which produces more than {}
 		name: 'globalassetassetdata',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,
 			// 'AID' : 'c2d07f9e-4e4c-4fed-8c19-61a077e59b50'
 			// 'AID' : '88f3a909-df90-4bdf-a3dc-fc305f381f8e'
 			// 'AID' : '0189f50e-1c4a-40d7-8532-1cc29b8c83f6'
 			'AID': '8fe41520-e46a-47c6-9834-23674a5063fc'
 		},
 		url: root + sandbox + vwf + 'globalassetassetdata',
 	},
 	globalassetmetadata = {
 		//200 {"uploader":"Postman","title":"chair","uploaded":"2015-09-14T19:36:58.020Z","description":"","type":"wooden"}
 		//must be logged in and have valid AID
 		//500 no AID in query string
 		name: 'globalassetmetadata',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,
 			// 'AID' : '88f3a909-df90-4bdf-a3dc-fc305f381f8e'
 			'AID': '8fe41520-e46a-47c6-9834-23674a5063fc'
 		},
 		url: root + sandbox + vwf + 'globalassetmetadata',
 	},
 	globalassets = {
 		//200 [Array of asset objects]
 		//got plenty now
 		name: 'globalassets',
 		method: 'GET',
 		// qs : {
 		// 	'UID' : UID,
 		// 	'SID' : SID,
 		// },
 		url: root + sandbox + vwf + 'globalassets',
 	},
 	inventory = {
 		//200 [Array of inventory objects]
 		name: 'inventory',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 			// 'SID' : '_adl_sandbox_jzfyZYS4Vwt9iXh3_',
 		},
 		url: root + sandbox + vwf + 'inventory',
 	},
 	inventoryitemP = {
 		//200 9ab2d1de-20c3-4c2e-8548-f4e9dfd6960f
 		// looks good to me
 		//qs and form optional
 		//must be logged in
 		name: 'inventoryitem',
 		method: 'POST',
 		// qs : {
 		// 	'UID' : UID,
 		// 	'SID' : SID,
 		// },
 		// form : {},
 		url: root + sandbox + vwf + 'inventoryitem',
 	},
 	inventoryitemD = {
 		//200 ok
 		//I keep getting 200 ok for the same inventory item AID, not good
 		//does delete if in inventory,
 		//but always returns 200 ok whether anything was deleted or not
 		//500 no AID in query string
 		name: 'inventoryitem',
 		method: 'DELETE',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,
 			//let's try this - should only work once
 			'AID': '8ce7fb6b-5758-4574-8dee-10a7509b5899',
 		},
 		// form : {},
 		url: root + sandbox + vwf + 'inventoryitem',
 	},
 	inventoryitemassetdata = {
 		//200 {}
 		//with AID and logged in
 		name: 'inventoryitemassetdata',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,
 			'AID': 'c259bccb-e016-481d-a870-f0d78f6712d4'
 		},
 		url: root + sandbox + vwf + 'inventoryitemassetdata',
 	},
 	inventoryitemmetadataG = {
 		//200 {"uploaded":"2015-08-25T16:50:04.480Z","description":""}
 		//must be logged in and valid AID
 		name: 'inventoryitemmetadata',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,
 			'AID': '05ee3e67-660c-4cd8-9abc-05bcf7b93ce0'
 		},
 		url: root + sandbox + vwf + 'inventoryitemmetadata',
 	},
 	inventoryitemmetadataP = {
 		//200 ok
 		//must be logged in and valid AID
 		//without valid AID still 200 ok , but nothing is added
 		name: 'inventoryitemmetadata',
 		method: 'POST',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,
 			'AID': '05ee3e67-660c-4cd8-9abc-05bcf7b93ce0'
 		},
 		form:
 		{
 			description: "Mary had a little lamb."
 		},
 		url: root + sandbox + vwf + 'inventoryitemmetadata',
 	},
 	/*This command has been replaced with geteditorcss in the dev branch
 	library is still active on the master branch*/
 	library = {
 		//404 404 not found, find the library
 		name: 'library',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : 'model',
 			// 'UID' : UID,
 			// 'SID' : SID,
 			// path : '/my-entities$/',
 		},
 		url: root + sandbox + vwf + 'library',
 	},
 	login = {
 		//200 no longer supported...
 		//that's as good as it gets
 		name: 'login',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + 'login',
 	},
 	logindata = {
 		//200 {object...}
 		//keep this active as a test againt good session
 		name: 'logindata',
 		method: 'GET',
 		// qs : {
 		// 	'UID' : UID,
 		// 	'SID' : SID,
 		// },
 		url: root + sandbox + vwf + 'logindata',
 	},
 	logout = {
 		//200 Client was not Logged into undefined
 		//looks like it takes a state id 'S' and a client id 'CID'
 		//with a good sid for s it sends:
 		//200 Client was not Logged into _adl_sandbox_L8BnGGj85ZHAmsy1_
 		//not logged in - 500 TypeError big ugly
 		name: 'logout',
 		method: 'GET',
 		qs:
 		{
 			'S': SID,
 			'CID': UID,
 		},
 		url: root + sandbox + vwf + 'logout',
 	},
 	profileG = {
 		//200 {Object...}
 		name: 'profile',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,
 		},
 		url: root + sandbox + vwf + 'profile',
 	},
 	profileP = {
 		//200 {Object...}
 		//need to have something to POST
 		//also think about arranging to create, post, get, delete and show deleted from profiles in that order
 		//logged out - 500 ReferenceError
 		name: 'profile',
 		method: 'POST',
 		// qs : {
 		// 	'UID' : UID,
 		// 	// 'UID' : 'Name',
 		// 	'SID' : SID,
 		// },
 		// form : {
 		// 	'DOB' : "1492",
 		// 	Shoes : "Combat Boots"
 		// },
 		url: root + sandbox + vwf + 'profile',
 	},
 	profileG = {
 		//200 {Object...}
 		name: 'profile',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + 'profile',
 	},
 	profileD = {
 		//200 {Object...}
 		//doesn't delete anything
 		name: 'profile',
 		method: 'DELETE',
 		// qs : {
 		// 	'UID' : UID,
 		// 	// 'UID' : 'Name',
 		// 	'SID' : SID,
 		// },
 		// form : {},
 		url: root + sandbox + vwf + 'profile',
 	},
 	profileG = {
 		//200 {Object...}
 		name: 'profile',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + 'profile',
 	},
 	profiles = {
 		//200 [Array of profile names]
 		name: 'profiles',
 		method: 'GET',
 		// qs : {
 		// 	'UID' : UID,
 		// 	'SID' : SID,
 		// },
 		url: root + sandbox + vwf + 'profiles',
 	},
 	publish = {
 		//401 Anonymous users cannot copy instances
 		// 500 Settings format incorrect
 		//with good SID and any non null form 200 _adl_sandbox_nTnwFDCAq5zOKh0M_
 		name: 'publish',
 		method: 'POST',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,
 			'SID': "_adl_sandbox_NOGEv5q7kmL6VSN4_",
 		},
 		form:
 		{
 			say: 'something',
 			"allowAnonymous": true,
 			"SinglePlayer": true,
 			"camera": null,
 			"createAvatar": true,
 			"allowTools": true,
 			"persistence": true
 		},
 		url: root + sandbox + vwf + 'publish',
 	},
 	restorebackup = {
 		//500 You must be the owner of a world you publish
 		//find out more about this
 		//500 State ID is incorrect
 		//qs statename and backup
 		//crashes if statename and backup are undefined or left null
 		//correction: if statename is left undefined (commented out or does not exist), null or emptystring works fine (doesn't crash):
 		//500 Unable to restore backup
 		name: 'restorebackup',
 		method: 'GET',
 		// qs : {
 		// 	'UID' : UID,
 		// 	// 'SID' : SID,	//500 State ID is incorrect
 		// 	'SID' : "_adl_sandbox_i3wJoCHDUJ4ibIEX_",	//500 State ID is incorrect
 		// 	// 'SID' : "_adl_sandbox_E8acu9xeKsoaARn7_",	//crash!!!!!!
 		// 	statename : "statebackup20ff4fcf-d788-4005-a557-7d580446822f",
 		// 	backup : 'state',
 		// },
 		url: root + sandbox + vwf + 'restorebackup',
 	},
 	salt = {
 		//200 salt string
 		name: 'salt',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + 'salt',
 	},
 	saspath = {
 		//200 /sas
 		name: 'saspath',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + 'saspath',
 	},
 	sitelogin = {
 		//401 Already Logged in - yay!!! Victory!!!
 		//must be logged out, yet getting hung up on check password
 		name: 'sitelogin',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'P': '1164a4a2a16700439c1863872b3cf2176a41c38f49005c0183bf58e6f4d61c48',
 		},
 		url: root + sandbox + vwf + 'sitelogin',
 	},
 	sitelogout = {
 		//200
 		//would it be different is we could login to site
 		//looks like there would be no difference in what we see
 		//now after this command the sandbox console shows null for session instead of it's ususal info, so it looks like we do indeed logout
 		name: 'sitelogout',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + 'sitelogout',
 	},
 	stateG = {
 		//200 {"GetStateResult"...}
 		name: 'state',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			'SID': '_adl_sandbox_xReWilVZ1l0wfL2U_', //SID,
 		},
 		url: root + sandbox + vwf + 'state',
 	},
 	stateD = {
 		//200 deleted instance
 		//cannot reuse the same SID all the time - go fig
 		//must be full id - "_adl_sandbox_xkTMz9miCKQmBDwU_"
 		//less returns - 500 instance does not exist
 		//ie - 	'_xkTMz9miCKQmBDwU_'
 		//		'xkTMz9miCKQmBDwU'
 		name: 'state',
 		method: 'DELETE',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,	//500 instance does not exist
 			'SID': "_adl_sandbox_qZPBcAVIpMIjD8F5_", //200 deleted instance
 		},
 		form:
 		{},
 		url: root + sandbox + vwf + 'state',
 	},
 	statedataG = {
 		//works fine with uid and sid in qs
 		//it is our chief crasher when qs is empty
 		//with uid and sid works great
 		//SID of undefined crashes!!!!!
 		//it is our chief crasher when qs is empty
 		name: 'statedata',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : '_adl_sandbox_AndrewWWCreighton_', //SID,
 			'SID': NaN,
 		},
 		url: root + sandbox + vwf + 'statedata',
 	},
 	statedataP = {
 		//200 Created state _adl_sandbox_AN91bJqZY29N7Cbz_
 		//nothing changes nor is created with valid sid
 		//with new sid - 401 State not found. State _adl_sandbox_AndrewWCreighton_
 		name: 'statedata',
 		method: 'POST',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,	//401 State not found.
 			// 'SID' : '_AN91bJqZY29N7Cbz_',	//401 State not found.
 			'SID': '_adl_sandbox_i3wJoCHDUJ4ibIEX_', //works
 			// 'SID' : 'AN91bJqZY29N7Cbz',	//401 State not found.
 		},
 		form:
 		{
 			"objects": 1,
 			"owner": "joe",
 			"lastUpdate": "2015-44-14T19:59:26.043Z",
 			"created": "2015-09-14T19:59:26.044Z",
 			"publishSettings":
 			{
 				"allowAnonymous": false,
 				"SinglePlayer": false,
 				"camera": null,
 				"createAvatar": true,
 				"allowTools": true,
 				"persistence": true
 			},
 			foo: 'nonsense',
 		},
 		url: root + sandbox + vwf + 'statedata',
 	},
 	statedataG = {
 		//works fine with uid and sid in qs
 		//it is our chief crasher when qs is empty
 		//with uid and sid works great
 		//SID of undefined crashes!!!!!
 		//it is our chief crasher when qs is empty
 		name: 'statedata',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			'SID': '_adl_sandbox_i3wJoCHDUJ4ibIEX_', //SID,
 		},
 		url: root + sandbox + vwf + 'statedata',
 	},
 	statehistory = {
 		//200 {"children":[...], "parents":[...]}
 		//200 {"error":"inner state not found"} for invalid sid
 		//caution can get large quick
 		name: 'statehistory',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			// 'SID' : '_adl_sandbox_r8oyUpB6DiAi2VWx_', //SID,
 			// 'SID' : undefined,
 		}, //aoWX23JPeUj7YMTb, r8oyUpB6DiAi2VWx, 3IkxhPjXTgunIOuG
 		url: root + sandbox + vwf + 'statehistory',
 	},
 	states = {
 		//200 {"_adl_sandbox_..."...}
 		//this one has gotten huge
 		name: 'states',
 		method: 'GET',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		url: root + sandbox + vwf + 'states',
 	},
 	stateslist = {
 		//200 [{"file":"statebackup..."}, ...]
 		//500 Error in trying to retrieve backup list - when no backup history
 		name: 'stateslist',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			'SID': "_adl_sandbox_i3wJoCHDUJ4ibIEX_", //SID,
 		},
 		url: root + sandbox + vwf + 'stateslist',
 	},
 	texture = {
 		//200 + file
 		//..\Sandbox\data\Textures
 		name: 'texture',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : 'george.jpeg',
 			// 'UID' : UID,
 			// 	'SID' : SID,
 		},
 		url: root + sandbox + vwf + 'texture',
 	},
 	textures = {
 		//200 {"GetTextureResult"...}
 		//..\Sandbox\data\Textures
 		name: 'textures',
 		method: 'GET',
 		// qs : {
 		// 	'UID' : UID,
 		// 	'SID' : SID,
 		// },
 		url: root + sandbox + vwf + 'textures',
 	},
 	texturethumbnail = {
 		//200 + file
 		//..\Sandbox\data\Thumbnails
 		name: 'texturethumbnail',
 		method: 'GET',
 		qs:
 		{
 			'UID': 'george.jpeg',
 			// 'UID' : UID,
 			// 'SID' : SID,
 		},
 		url: root + sandbox + vwf + 'texturethumbnail',
 	},
 	thumbnailG = {
 		//200 ?png - prints out the whole png
 		//works fine need to find way to suppress printing whole file
 		//printing to console produces a lot of beeps - a lot
 		//and tie up the console until they are done
 		//no sid - big ugly 500 TypeError
 		//still works when logged out however file is returned with different encoding - when logged out encoding does not cause console to beep
 		name: 'thumbnail',
 		method: 'GET',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : SID,
 		},
 		url: root + sandbox + vwf + 'thumbnail',
 	},
 	thumbnailP = {
 		//500 TypeError: Cannot call method &#39;replace&#39; of undefined<br> &nbsp; &nbsp;at SaveThumbnail
 		//this is currently a big ugly
 		//SID is necessary
 		//auto is an option in the qs - not needed
 		//so the SID's
 		name: 'thumbnail',
 		method: 'POST',
 		qs:
 		{
 			// 'UID' : UID,
 			// 'SID' : undefined,
 			// 'SID' : '_AN91bJqZY29N7Cbz_',	//500 state does not exist
 			'SID': 'r8oyUpB6DiAi2VWx', //200
 			// 'SID' : '_adl_sandbox_E8acu9xeKsoaARn7_',	//200
 			// auto : false,
 		},
 		form:
 		{
 			image: thumbnail,
 		},
 		url: root + sandbox + vwf + 'thumbnail',
 	},
 	updatepassword = {
 		//200
 		//that's good that's all I need
 		//if I wanted to get really fancy, i'd go ahead and login and change the password to something new
 		name: 'updatepassword',
 		method: 'GET',
 		qs:
 		{
 			'P': '1164a4a2a16700439c1863872b3cf2176a41c38f49005c0183bf58e6f4d61c48'
 				// 'P' : '1164a4a2a16700439c1863872b3cf2176a41c38f49005c0183bf58e6f4d61c48'
 		},
 		url: root + sandbox + vwf + 'updatepassword',
 	},
 	uploadtemp = {
 		//404 404 Not Found
 		//is this uploading formData
 		//and where/when does this happen??
 		//it happens in Sandbox/tempupload - the file has no extension
 		//i do not understand why the 404 response but i'm moving on
 		//looks like the if statement should have a return line 1830
 		//i think we end up in the default 404 in the switch statement line 1910
 		name: 'uploadtemp',
 		method: 'POST',
 		qs:
 		{
 			'UID': UID,
 			'SID': SID,
 		},
 		form:
 		{
 			something: "Here is a great big long string and story about nothing, although the title says that it is something.",
 			rabbitSeason: 'duckSeason',
 			note: "This will post into tempupload however the response from the server will still be - uploadtemp 404 Not Found.  This seems like an incorrect or misleading response.",
 			here: "Ang was here 09-24-2015",
 		},
 		url: root + sandbox + vwf + 'uploadtemp',
 	},
 ];
 //set up data variables (profiles, states, inventory, textures)
 //don't know that these are helpful at all
 setupUrl = root + sandbox + vwf;
 var profiles, states, inventory, textures;
 //EncryptPassword function for login
 var EncryptPassword = function(password, username, salt)
 	{
 		console.log('In EncryptPassword');
 		var CryptoJS = require('crypto-js');
 		var unencrpytedpassword = password + username + salt;
 		for (var i = 0; i < 1000; i++)
 		{
 			unencrpytedpassword = CryptoJS.SHA256(unencrpytedpassword) + '';
 		}
 		// console.log('In Encrypt: ', password, username, salt, unencrpytedpassword);
 		return unencrpytedpassword;
 	}
 	//get salt - returns the salt
 var reqSalt = function()
 	{
 		console.log('In reqSalt');
 		request(
 		{
 			url: root + sandbox + vwf + 'salt?UID=' + UID
 		}, reqLogin);
 	}
 	//Our new fancy make the call and get the cookie then use the cookie to
 	//unlock all sorts of mysteries
 var reqLogin = function(error, response, salt)
 	{
 		console.log('In reqLogin');
 		if (!error && (response.statusCode === 200))
 		{
 			var pw = EncryptPassword(pword, UID, salt.trim());
 			// console.log("Here's what went into the pw: " + pword + UID + salt);
 			// console.log('Is this the right password: ' + pw);
 			//Create form-data
 			var formData = {
 				username: UID,
 				password: pw
 			};
 			// var cookie = "";
 			request = request.defaults(
 			{
 				jar: true
 			});
 			var options = {
 					uri: root + auth,
 					form: formData,
 					method: 'POST',
 				}
 				// console.log('The salt is: ' + salt);
 				// console.log('with response code: ' + response.statusCode);
 			request(options, reqLoginData);
 		}
 		else
 		{
 			console.log('The salt has lost its taste.' + error);
 		}
 	}
 	//Make the login request in order to get the session cookie
 var reqLoginData = function(err, response, data)
 {
 	console.log('In reqLoginData');
 	console.log(response.statusCode);
 	if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 200)
 	{
 		console.log('good');
 		console.log(response.headers['content-type']);
 		cookie = response.headers['set-cookie'][1].split(';')[0].trim();
 		// var cookie = response.headers['set-cookie'][1].split(';')[0].trim();
 		console.log("cookie : " + cookie + "\n");
 		var jar = request.jar();
 		jar.setCookie(cookie, root, function()
 		{
 			// console.log("These are cool cookies:", jar.getCookies(root) + '\n');
 			request(
 				{
 					url: root + sandbox + vwf + 'logindata',
 					jar: jar
 				}, runEmAll)
 				.on('response', function(response)
 				{
 					console.log(response.statusCode);
 					console.log(response.headers['content-type']);
 				})
 				.on('data', function(chunk)
 				{
 					console.log(chunk.toString() + "\n");
 				})
 				.on('error', function(err)
 				{
 					console.log('Bad news, Dude: ' + err + '\n');
 				});
 		});
 	}
 	else
 	{
 		console.log('error logging in: not okay nor redirect' + err);
 	}
 }

 function doRequest(i, cb)
 {
 	// var options = setOptions(i);
 	request(i, function(err, response, body)
 		{
 			cb(err, response, body)
 		}) //request
 } //doRequest function
 var runEmAll = function(error, response, data)
 	{
 		var jar2 = request.jar();
 		jar2.setCookie(cookie, root, function()
 		{
 			// console.log("These are cool cookies:", jar2.getCookies(root) + '\n');
 		});
 		//setting up the loop
 		var results = "Results from Testing SandboxAPI Endpoints on " + new Date().toISOString().replace('T', ' ').substr(0, 19) + '\nSession Cookie: '; // + jar2.getCookies(root) + '\n\n';
 		var report = "Report of Testing SandboxAPI Endpoints on " + new Date().toISOString().replace('T', ' ').substr(0, 19) + '.\nRequests which produce Server Errors or Crashes.\n\n';
 		var filename = 'EndpointResults.txt';
 		var fileReport = 'EndpointReport.txt';
 		var len = commands.length;
 		async.eachSeries(commands, function(i, cbi)
 		{
 			async.eachSeries(queryStringParams, function(j, cbj)
 			{
 				async.eachSeries(badData, function(k, cbk)
 				{
 					var queryKey = j;
 					var queryData = k;
 					var command = i;
 					var thisCommand = {};
 					thisCommand.method = command.method;
 					thisCommand.url = command.url + "?" + queryKey + "=" + queryData;
 					thisCommand.name = command.name;
 					logger.info(thisCommand);
 					doRequest(thisCommand, function(err, response, body)
 					{
 						if (response && (!err || response.status == 404))
 						{
 							logger.warn(err, response.statusCode)
 							cbk();
 						}
 						else
 						{
 							if (logger.error(err, response && response.statusCode, body))
 								cbk(err);
 						}
 					});
 				}, function(err)
 				{
 					console.log("next j")
 					cbj();
 				})
 			}, function(err)
 			{
 				console.log("next i")
 				cbi(err);
 			})
 		}, function(err)
 		{
 			if (err)
 			{
 				logger.error("exiting with ", err);
 			}
 		})
 	} //runEmAll
 reqSalt();