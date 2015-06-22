//Test Prim Buttons - Box button
//This creates a box
//and verifies the box
module.exports = {
	'Test box button': function (browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testutils.js'),
		    passed = true,
		    outStr = "";
		browser.loadBlankScene()

		//Create box from button
		.nextGUID('testBox')
		.$click('#MenuCreateBoxicon')
		//Verify box
		.pause(6000).then(function () {
			testUtils.assertNodeExists("testBox", function (assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Box exists: " + msg + "; ";
				finished(passed, outStr);
			});
		})
	}
};