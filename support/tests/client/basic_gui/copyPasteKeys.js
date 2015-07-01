//Test Copy and Paste with Shortcut Keys (ctrl-c, ctrl-v)
module.exports = {
	'Test GUI copy/paste keyboard shortcuts (A11)': function(browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testutils.js'),
			passed = true,
			outStr = "";

		browser.loadBlankScene()

		//Show side tab hierarchy
		//boxes can be watched here as well
		.pause(1000)
		.$click('#SideTabShow')
		.waitForVisible('#editorPanelhierarchyManagertitle')
		.$click('#editorPanelhierarchyManagertitle')
		.pause(2000)
		
		//Create testBox from menu
		.nextGUID('testBox')
		.$click('#MenuCreateBoxicon')
		//Verify testBox exists
		.pause(3000).then(function() {
			testUtils.assertNodeExists("testBox", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "testBox created: " + msg + "; ";
			});
		})

		//Focus on the box
		// .pause(1000)
		// .$click('#MenuFocusSelectedicon')
		//box is already in center of screen
		
		.pause(3000)
		// .moveToObject('#index-vwf')
		// .$click('#index-vwf')
		
		//Copy testBox with ctrl-c
		.pause(1000).$keydown("canvas", "ctrlKey")
		.then(browser.$keypress("canvas", "c")
		.then(browser.$keyup("canvas", "ctrlKey")))
		.pause(1000)

		//Paste copyBox with ctrl-v
		.nextGUID('copyBox')
		.pause(1000)
		.$keydown("canvas", "ctrlKey")
		.then(browser.$keypress("canvas", "v")
		.then(browser.$keyup("canvas", "ctrlKey")))
		
		// tested other functioning - the trouble is just above
		// .$click('#MenuCreateConeicon')

		//Verify copyBox exists
		.pause(3000).then(function() {
			testUtils.assertNodeExists("copyBox", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "testBox copied and pasted as copyBox: " + msg + "; ";
				finished(passed, outStr, true);
			});
		})

	}
};