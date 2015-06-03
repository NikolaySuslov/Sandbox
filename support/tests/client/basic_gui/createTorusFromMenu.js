module.exports = {
    'Create a torus from the menu': function(browser, finished) {
        global.browser = browser;
        var testUtils = require('../../utils/testutils.js');
        browser.loadBlankScene()
        .nextGUID('testTorus')
        .click('#MenuCreate')
        //gets the ul that is the sibling of #MenuCreate
        .waitForVisible('#MenuPrimitives', 1000)
        .click('#MenuPrimitives')
        .waitForVisible('#MenuCreateTorus', 1000)
        .click('#MenuCreateTorus')
        .pause(3000).then(function() {
            testUtils.assertNodeExists("testTorus", finished)
        })

    }
};