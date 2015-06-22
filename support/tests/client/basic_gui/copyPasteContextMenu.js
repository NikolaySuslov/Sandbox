//Test Copy and Paste with the Context Menu
module.exports = {
    'Test GUI copy/paste with context menu (A11)': function(browser, finished) {
        global.browser = browser;
        var testUtils = require('../../utils/testutils.js'),
			passed = true,
			outStr = "";

        browser.loadBlankScene()

        //Create testBox from menu
        .nextGUID('Box')
        .$click('#MenuCreateBoxicon')
		//Verify testBox exists
        .pause(3000).then(function() {
            testUtils.assertNodeExists("Box", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Initial Box created: " + msg + "; ";
			});
        })

		//Focus on the box
		// .pause(1000)
		// .$click('#MenuFocusSelectedicon')
		
		.pause(3000)
		// .moveToObject('#index-vwf')
		//Copy
		.rightClick('#index-vwf')
		.waitForVisible('#ContextMenu')
		.$click('#ContextMenuCopy')
		.nextGUID('copyBox')
		.pause(1000)
		//Paste
		.rightClick('#index-vwf')
		.waitForVisible('#ContextMenu')
		.$click('#ContextMenuPaste')
		
		//Copy testBox with ctrl-c
		// .pause(1000).$keydown("canvas", "ctrlKey")
		// .then(browser.$keypress("canvas", "c")
		// .then(browser.$keyup("canvas", "ctrlKey")))
		// .pause(1000)

		// Paste copyBox with ctrl-v
		// .nextGUID('copyBox')
		// .$keydown("canvas", "ctrlKey")
		// .then(browser.$keypress("canvas", "v")
		// .then(browser.$keyup("canvas", "ctrlKey")))
		
		// tested other functioning - the trouble is just above
		// .$click('#MenuCreateConeicon')

		//Verify copyBox exists
		.pause(3000).then(function() {
			testUtils.assertNodeExists("copyBox", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "testBox copied and pasted as copyBox: " + msg + "; ";
				finished(passed, outStr);
			});
		})

	}
};