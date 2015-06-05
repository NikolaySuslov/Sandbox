//Test Copy and Paste from button
module.exports = {
    'Test GUI copy/paste button (A11)': function(browser, finished) {
        global.browser = browser;
        var testUtils = require('../../utils/testutils.js');
		var passed = true;
		var outStr = "";
        browser.loadBlankScene()

        //Create testBox from button
        .nextGUID('testBox')
        .$click('#MenuCreateBoxicon')
        //gets the ul that is the sibling of #MenuCreate
        // .waitForVisible('#MenuPrimitives', 1000)
        // .click('#MenuPrimitives')
        // .waitForVisible('#MenuCreateBox', 1000)
        // .click('#MenuCreateBox')
		//Verify testBox exists
        .pause(3000).then(function() {
            testUtils.assertNodeExists("testBox", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "testBox created: " + msg + "; ";
			});
        })
		//Copy testBox from button
        // .click('#MenuEdit')
		// .waitForVisible('#MenuCopy', 1000)
		.$click('#MenuCopyicon')
		.pause(1000)
		//Paste copyBox from menu
		.nextGUID('copyBox')
		// .click('#MenuEdit')
		// .waitForVisible('#MenuPaste', 1000)
		.$click('#MenuPasteicon')
		//verify copyBox exists
		.pause(3000).then(function() {
			testUtils.assertNodeExists("copyBox", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "testBox copied and pasted as copyBox: " +msg + "; ";
				finished(passed, outStr);
			});
		})
    }
};