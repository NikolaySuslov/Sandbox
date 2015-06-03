module.exports = {
    'Create a box from the menu (A9)': function(browser, finished) {
        global.browser = browser;
        var testUtils = require('../../utils/testutils.js');
        browser.loadBlankScene().
        nextGUID('testBox')
        .click('#MenuCreate')
        //gets the ul that is the sibling of #MenuCreate
        .waitForVisible('#MenuPrimitives', 1000)
        .click('#MenuPrimitives')
        .waitForVisible('#MenuCreateBox', 1000)
        .click('#MenuCreateBox')
        .pause(3000).then(function() {
            testUtils.assertNodeExists("testBox", finished)
        })

    }
};