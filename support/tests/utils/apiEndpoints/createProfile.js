/*
The createprofile command works only when not logged in (by the way, being
logged in catches with: 500 user Postman already exists). This is to run it separately without the login data that is required for so many commands, and test against a variety of data.

Utility has subsequently been found in running various commands while not logged in and testing endpoints in that way.
*/

//loading modules
var request = require('request');
var fs = require('fs');

//URI help
var root = 'http://localhost:3000/';
var sandbox = 'sandbox/adl/';
var vwf = 'vwfdatamanager.svc/';
var auth = 'auth/local/';
//Command help
var sid = '?SID=_adl_sandbox_L8BnGGj85ZHAmsy1_';
var UID = 'Postman';
var pword = 'Postman123';
var SID = '_adl_sandbox_L8BnGGj85ZHAmsy1_';
var salt = "";
var cookie = "";
var AID;

//array of strings to be used in trying to break the api
var badData = [
	,	//undefined	0
	'',	//empty string	1
	'abc123',	//	2
	'*^%#@',	//please don't swear	3
	'>}<:>)P{?>^%}',	//random other symbols	4
	'\t\n\'',	//escape sequences	5
	'&#2045&#x2045',	//weird characters	6
	'whats\x45\x99\xa3\x0athis',	//weirder characters	7
	'Rob is great',	//propaganda	8
	'Andy is better', 	//better propaganda	9
	'_willthiswork',	//underscore start	10
	'Mick "the Mick" Muzac',	//double quotes	11
	"Steven 'the Steve' Vergenz",	//single quotes	12
]

var command = {
    // 500 user Postman already exists
    // do I have to be logged out to do this
    //see also createprofile.txt
    //must have a nonempty UID in qs
    name : 'createprofile',
    method : 'POST',
    qs : {
		'UID' : 'Fred',
        // 'SID' : SID,
	},
    form : {
        // Username : 'Remy',
        Username : 'Frodo',
        Email : 'remy@mail.com',
        Password : 'beware333Squirrels',
        Password2 : 'beware333Squirrels',
        dateofbirth : '01022015',
        sex : 'male',
        relationshipstatus: 'none',
        fullname : "Frodo Tikki Tavi",
        location : 'Orlando FL',
        homepage : 'remy.com',
        employer : 'no need',
		badField : 'bad data',
    },
    url : root + sandbox + vwf + 'createprofile',

//Testing commands without logging in - go ahead and delete and uncomment the above to restore to original working condition
// name : 'restorebackup',
// method : 'GET',
// // qs : {
// // 	'UID' : UID,
// // 	// 'SID' : SID,	//500 State ID is incorrect
// // 	'SID' : "_adl_sandbox_i3wJoCHDUJ4ibIEX_",	//500 State ID is incorrect
// 	// 'SID' : "_adl_sandbox_E8acu9xeKsoaARn7_",	//crash!!!!!!
// // 	statename : "statebackup20ff4fcf-d788-4005-a557-7d580446822f",
// // 	backup : 'state',
// // },
// url : root + sandbox + vwf + 'restorebackup',

},

    profiles = {
        name : 'profiles',
        method : 'GET',
        url : root + sandbox + vwf + 'profiles',
    };


var outStr = "";

request(profiles, function (err, resp, body) {
    // body...
    if (err) {
        outStr += err;
        console.error(err);
        createProfile();
    } else {
        outStr += 'Profiles before: ' + body + '\n\n';
        createProfile();
    }
})

function createProfile () {
    request(command, function (err, resp, body) {
        // body...
        if (err) {
            outStr += err;
            console.error(err);
            checkProfiles();
        } else {
            outStr += resp.statusCode + ' ' + resp.headers['content-type'] + '\n' + body + '\n';

            console.log(resp.statusCode, resp.headers['content-type'], body);   //why am i getting a visible \n here
            checkProfiles();
        }
    })
}

function checkProfiles () {
    request(profiles, function (err, resp, body) {
        if (err) {
            outStr += err;
            console.error(err);
        } else {
            outStr += '\nProfiles after: ' + body + '\n\n';
            console.log(body);
        }
        fs.writeFile('CreateProfile.txt', outStr);
    })
}
