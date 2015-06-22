//Test Prim Buttons - Cylinder button
//This creates a cylinder
//and verifies the cylinder
module.exports = {
	'Test cylinder button': function(browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testutils.js');
		var passed = true;
		var outStr = "";
		browser.loadBlankScene()

		//Create cylinder from button
		.nextGUID('testCylinder')
		.$click('#MenuCreateCylindericon')
		//Verify cylinder
		.pause(6000).then(function() {
			testUtils.assertNodeExists("testCylinder", function(assertStatus, msg){
				passed = passed && !!assertStatus;
				outStr += "Cylinder exists: " + msg + "; ";
				finished(passed, outStr);
			});
		})
	}
};