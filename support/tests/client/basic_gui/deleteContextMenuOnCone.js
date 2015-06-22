//Test Delete Context Menu
//This is simplified down to create a cone
//verify the cone
//right click and delete the cone via context menu
//verify the deletion
//leave and have a good day
module.exports = {
	'Delete via context menu (A17)': function(browser, finished) {
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
		//Pause and then delete cone by context menu
		.pause(2000)
		.rightClick('#index-vwf')
		.waitForVisible('#ContextMenu', 1000)
		.click('#ContextMenuDelete')
		//Verify deletion of cone
		.pause(2000).then(function() {
			testUtils.assertNodeExists("Cone", function(assertStatus, msg){
				passed = passed && !assertStatus;
				outStr += "Cone second time (deleted): " + msg + "; ";
				finished(passed, outStr);
			});
			
		})
	}
};