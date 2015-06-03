//Test Undo and Redo
module.exports = {
    'Test Undo and Redo (A13)': function(browser, finished) {
	    global.browser = browser;
		var testUtils = require('../../utils/testutils.js')
			passed = true,
			outStr = "";
		//This is the start of great big long list of things to do
		browser.loadBlankScene()
		
		//Create and verify a box and a cone with buttons
		.nextGUID('testBox')
		.$click('#MenuCreateBoxicon')
		.pause(3000).then(function() {
			testUtils.assertNodeExists("testBox", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Box exists: " + msg + "; ";
				
			});
		})
		
		.nextGUID('testCone')
		.$click('#MenuCreateConeicon')
		.pause(3000).then(function() {
			testUtils.assertNodeExists("testCone", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Cone first time (exists): " + msg + "; ";
				
			});
		})
		
		//3 Undo's to make the cone disappear (button)
		.$click('#MenuUndoicon').$click('#MenuUndoicon').$click('#MenuUndoicon')
		//Verify the cone is not
		.pause(3000).then(function() {
			testUtils.assertNodeExists("testCone", function(assertStatus, msg) {
				passed = passed && !assertStatus;	//Negate to assert non-existence
				outStr += "Cone Undone: " + msg + "; ";
				
			});
		})

		//3 Redo's to make the cone reappear and be selected (button)
		.pause(7000)	//seven seconds seems to work consistently
		// .nextGUID('coneRedone')	//not needed after all, nextGUID is restored with redo
		.$click('#MenuRedoicon').$click('#MenuRedoicon').$click('#MenuRedoicon')
		//Verify the cone is
		.pause(3000).then(function() {
			testUtils.assertNodeExists("testCone", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Cone Redone: " + msg + "; ";
				finished(passed, outStr);
			});
		})
	}
}