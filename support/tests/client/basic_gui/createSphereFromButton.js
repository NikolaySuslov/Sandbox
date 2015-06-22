//Test Prim Buttons - Sphere button
//This creates a sphere
//and verifies the sphere
module.exports = {
	'Test sphere button': function(browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testutils.js');
		var passed = true;
		var outStr = "";
		browser.loadBlankScene()

		//Create sphere from button
		.nextGUID('testSphere')
		.$click('#MenuCreateSphereicon')
		//Verify sphere
		.pause(6000).then(function() {
			testUtils.assertNodeExists("testSphere", function(assertStatus, msg){
				passed = passed && !!assertStatus;
				outStr += "Sphere exists: " + msg + "; ";
				finished(passed, outStr);
			});
		})
	}
};