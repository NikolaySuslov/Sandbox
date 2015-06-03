//Test delete menu
//This is simplified down to create a cone
//verify the cone
//delete the cone via menu
//verify the deletion
//leave and have a good day
module.exports = {
	'Test delete menu': function(browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testutils.js');
		var passed = true;
		var outStr = "";
		browser.loadBlankScene()

		//Create cone from menu
		.nextGUID('testCone')
		.click('#MenuCreate')
		.waitForVisible('#MenuPrimitives', 1000)
		.click('#MenuPrimitives')
		.waitForVisible('#MenuCreateCone', 1000)
		.click('#MenuCreateCone')
		//Verify cone
		.pause(6000).then(function() {
			testUtils.assertNodeExists("testCone", function(assertStatus, msg){
				passed = passed && !!assertStatus;
				outStr += "Cone first time (exists): " + msg + "; ";
				
			});
		})
		//Pause and then delete cone by delete menu
		.pause(2000)
		.click('#MenuEdit')
		.waitForVisible('#MenuDelete', 1000)
		.click('#MenuDelete')
		//Verify deletion of cone
		.pause(2000).then(function() {
			testUtils.assertNodeExists("testCone", function(assertStatus, msg){
				passed = passed && !assertStatus;
				outStr += "Cone second time (deleted): " + msg + "; ";
				finished(passed, outStr);
			});
			
		})
	}
};