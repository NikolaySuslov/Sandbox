module.exports = {
	'Create a plane from the menu': function(browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testutils.js');
		browser.loadBlankScene()
		.nextGUID('testPlane')
		.click('#MenuCreate')
		//gets the ul that is the sibling of #MenuCreate
		.waitForVisible('#MenuPrimitives', 1000)
		.click('#MenuPrimitives')
		.waitForVisible('#MenuCreatePlane', 1000)
		.click('#MenuCreatePlane')
		.pause(3000).then(function() {
			testUtils.assertNodeExists("testPlane", finished)
		})
	}
};