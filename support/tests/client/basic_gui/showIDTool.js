//Get Node Id from Tools Menu

module.exports = {
	'Get Node Id from Tools Menu': function (browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testUtils.js'),
			passed = true,
			outStr = "",
			primID = "";
		
		browser.loadBlankScene()
		
		//Create a Box
		.pause(1000)
		.$click('#MenuCreateBoxicon')
		.pause(2000)
		
		//Use Tools Menu
		.click('#MenuTools')
		.waitForVisible('#ToolsShowID')
		.click('#ToolsShowID')
		.waitForVisible('#alertify-text')
		.getValue('#alertify-text', function (err, r) {
			if (!err && r) {
				primID = r;
				outStr += "Box id is: " + primID + "; "
			} else {
				passed = false;
				outStr += "Trouble getting text: " + err;
			}
			browser.pause(1000)
			.click('#alertify-ok')
			.pause(1000)
			.then(finished(passed, outStr, true));
		})
		
		
	}
}