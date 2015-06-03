//Test Copy and Paste from menu
module.exports = {
    'Test GUI copy/paste menu (A11)': function(browser, finished) {
        global.browser = browser;
        var testUtils = require('../../utils/testutils.js');
		var passed = true;
		var outStr = "";
        browser.loadBlankScene()

        //Create testBox from menu
        .nextGUID('testBox')
        .click('#MenuCreate')
        //gets the ul that is the sibling of #MenuCreate
        .waitForVisible('#MenuPrimitives', 1000)
        .click('#MenuPrimitives')
        .waitForVisible('#MenuCreateBox', 1000)
        .click('#MenuCreateBox')
		//Verify testBox exists
        .pause(3000).then(function() {
            testUtils.assertNodeExists("testBox", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "testBox created: " + msg + "; ";
			});
        })
		//Copy testBox from menu
        .click('#MenuEdit')
		.waitForVisible('#MenuCopy', 1000)
		.click('#MenuCopy')
		.pause(1000)
		//Paste copyBox from menu
		.nextGUID('copyBox')
		.click('#MenuEdit')
		.waitForVisible('#MenuPaste', 1000)
		.click('#MenuPaste')
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