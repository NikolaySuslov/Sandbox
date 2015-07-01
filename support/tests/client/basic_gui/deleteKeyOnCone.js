//Test Delete Key
//This is simplified down to create a cone
//verify the cone
//press the delete key the cone via context menu
//verify the deletion
//leave and have a good day
module.exports = {
	'Delete via delete key (A17)': function(browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testutils.js');
		var passed = true;
		var outStr = "";
		browser.loadBlankScene()

		//Create cone from menu
		.nextGUID('Cone')
		.click('#MenuCreate')
		.waitForVisible('#MenuPrimitives', 1000)
		.click('#MenuPrimitives')
		.waitForVisible('#MenuCreateCone', 1000)
		.click('#MenuCreateCone')
		//Verify cone
		.pause(6000).then(function() {
			testUtils.assertNodeExists("Cone", function(assertStatus, msg){
				passed = passed && !!assertStatus;
				outStr += "Cone first time (exists): " + msg + "; ";
				
			});
		})
		//Pause and then delete cone by key
		.pause(2000)
		
		//Not working - What is the delete key to put in there??
		.$keydown("canvas", 0xE017).then(browser.$keyup("canvas", 127))
		//Verify deletion of cone
		.pause(6000).then(function() {
			testUtils.assertNodeExists("Cone", function(assertStatus, msg){
				passed = passed && !assertStatus;
				outStr += "Cone second time (deleted): " + msg + "; ";
				finished(passed, outStr);
			});
			
		})
	}
};