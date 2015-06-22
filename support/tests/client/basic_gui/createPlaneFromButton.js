//Test Prim Buttons - Plane button
//This creates a plane
//and verifies the plane
module.exports = {
	'Test plane button': function(browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testutils.js');
		var passed = true;
		var outStr = "";
		browser.loadBlankScene()

		//Create plane from button
		.nextGUID('testPlane')
		.$click('#MenuCreatePlaneicon')
		//Verify plane
		.pause(6000).then(function() {
			testUtils.assertNodeExists("testPlane", function(assertStatus, msg){
				passed = passed && !!assertStatus;
				outStr += "Plane exists: " + msg + "; ";
				finished(passed, outStr);
			});
		})
	}
};