//Create each Line (D3)
//Shapes: Line, Circle, Star, Rectangle, L-section, T-section
module.exports = {
	'Create each line (D3)': function(browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testUtils.js'),
			passed = true,
			outStr = "";
			
		browser.loadBlankScene()
		
		//Create Line from shapes menu
		.nextGUID('testLine')
		.$click('#MenuCreate')
		.waitForVisible('#MenuShapes')
		.$click('#MenuShapes')
		.waitForVisible('#MenuCreateLine')
		.$click('#MenuCreateLine')
		
		//Create Circle from menu
		.pause(1000)
		.nextGUID('testCircle')
		.$click('#MenuCreate')
		.waitForVisible('#MenuShapes')
		.$click('#MenuShapes')
		.waitForVisible('#MenuCreateCircle')
		.$click('#MenuCreateCircle')
		
		//Create Star from menu
		.pause(1000)
		.nextGUID('testStar')
		.$click('#MenuCreate')
		.waitForVisible('#MenuShapes')
		.$click('#MenuShapes')
		.waitForVisible('#MenuCreateStar')
		.$click('#MenuCreateStar')
		
		//Create Rectangle from menu
		.pause(1000)
		.nextGUID('testRectangle')
		.$click('#MenuCreate')
		.waitForVisible('#MenuShapes')
		.$click('#MenuShapes')
		.waitForVisible('#MenuCreateRectangle')
		.$click('#MenuCreateRectangle')
		
		//Create lSection from menu
		.pause(1000)
		.nextGUID('testLSection')
		.$click('#MenuCreate')
		.waitForVisible('#MenuShapes')
		.$click('#MenuShapes')
		.waitForVisible('#MenuCreateLSection')
		.$click('#MenuCreateLSection')
		
		//Create tSection from menu
		.pause(1000)
		.nextGUID('testTSection')
		.$click('#MenuCreate')
		.waitForVisible('#MenuShapes')
		.$click('#MenuShapes')
		.waitForVisible('#MenuCreateTSection')
		.$click('#MenuCreateTSection')
		
		//Verify Line
		.pause(3000).then(function() {
			testUtils.assertNodeExists("testLine", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Line exists: " + msg + "; ";
			});
		})
		
		//Verify Circle
		.then(function() {
			testUtils.assertNodeExists("testCircle", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Circle: " + msg + "; ";
			});
		})

		//Verify Star
		.then(function() {
			testUtils.assertNodeExists("testStar", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Star: " + msg + "; ";
			});
		})

		//Verify Rectangle
		.then(function() {
			testUtils.assertNodeExists("testRectangle", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Rectangle: " + msg + "; ";
			});
		})

		//Verify L-section
		.then(function() {
			testUtils.assertNodeExists("testLSection", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "L-section: " + msg + "; ";
			});
		})

		//Verify T-section
		.then(function() {
			testUtils.assertNodeExists("testTSection", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "T-section exists: " + msg + "; ";
				finished(passed, outStr);
			});
		});
	}
}