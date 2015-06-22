//Test Prim Buttons - Cone button
//This creates a cone
//and verifies the cone
module.exports = {
	'Test cone button': function(browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testutils.js');
		var passed = true;
		var outStr = "";
		browser.loadBlankScene()

		//Create cone from button
		.nextGUID('testCone')
		.$click('#MenuCreateConeicon')
		//Verify cone
		.pause(6000).then(function() {
			testUtils.assertNodeExists("testCone", function(assertStatus, msg){
				passed = passed && !!assertStatus;
				outStr += "Cone exists: " + msg + "; ";
				finished(passed, outStr);
			});
		})
	}
};