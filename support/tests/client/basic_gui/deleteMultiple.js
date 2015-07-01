//Delete Multiple Items at Once
//using menu, button, context menu, and key
//Create multiple prims
//verify the prims
//delete the prims via context menu
//verify the deletion
//do it another way
//leave and have a good day
module.exports = {
	'Delete Multiple (A18)': function(browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testutils.js'),
			passed = true,
			outStr = "",
			Nodes = [];
		
		browser.loadBlankScene();

		//Create 10 boxes by button
		for (var i = 1; i <= 10; i++) {
			browser
			.pause(6000)
			.nextGUID("box" + i)
			.$click('#MenuCreateBoxicon');
		}
		

		
		//Verify boxes
		//if the tenth box exists I find it reasonable to assume
		//1 through 9 made it as well
		browser.pause(10000)
		.then(function() {
			testUtils.assertNodeExists("box10", function(assertStatus, msg){
				passed = passed && !!assertStatus;
				outStr += "box10 exists: " + msg + "; ";
				browser.pause(9000).then(finished(passed, outStr, true));
			});
		})
		
		//Select two nodes
		.pause(6000)
		.selectNodes(["box1", "box2"], function(err, r) {
			if(!err && r) {
				outStr += "Nodes are selected. ";
			} else {
				passed = false;
				outStr += "Nodes are not selected. ";
			}
			//Delete those nodes by menu
			browser
			.pause(2000)
			.$click('#MenuEdit')
			.waitForVisible('#MenuDelete')
			.$click('#MenuDelete')
		})
		
		//Select three nodes
		.pause(6000)
		.selectNodes(["box3", "box4", "box5"], function(err, r) {
			if(!err && r) {
				outStr += "Nodes are selected. ";
			} else {
				passed = false;
				outStr += "Nodes are not selected. ";
			}
			//Delete those nodes by button
			browser
			.pause(2000)
			.$click('#MenuDeleteicon')
		})
		
		// Select two nodes
		// .pause(6000)
		// .selectNodes(["Box6", "Box7"], function(err, r) {
			// if(!err && r) {
				// outStr += "Nodes are selected. ";
			// } else {
				// passed = false;
				// outStr += "Nodes are not selected. ";
			// }
		// })
		// Delete those nodes by context menu
		// .pause(2000)
		// .rightClick('#index-vwf')
		// .waitForVisible('#ContextMenu')
		// .click('#ContextMenuDelete')
		
		// Select two nodes
		// .pause(6000)
		// .selectNodes(["Box8", "Box9"], 
					 // function(err, r) {
			// if(!err && r) {
				// outStr += "Nodes are selected. ";
			// } else {
				// passed = false;
				// outStr += "Nodes are not selected. ";
			// }
		// })
		// Delete those nodes by key
		// .pause(2000)
		// .$click(#MenuEdit)
		// .waitForVisible(#MenuDelete)
		// .$click(#MenuDelete)
		
		//Verify deletion of Boxes - this can wait until the end
		.pause(6000).then(function() {
			for(var j = 1; j <= 5; j++) {
				testUtils.assertNodeExists("box" + j, function(assertStatus, msg){
					passed = passed && !assertStatus;
					outStr += "box" +j+ " deleted: " + msg + "; ";
				});
			}
		})
		//Verify existence of other Boxes
		.pause(6000).then(function() {
			for(var k = 6; k <=10; k++) {
				testUtils.assertNodeExists("box" + k, function(assertStatus, msg){
					passed = passed && !!assertStatus;
					outStr += "box" +k+ " exists: " + msg + "; ";
					
				});
			} i 
			browser.pause(6000).then(function() {finished(passed, outStr, false);});
			
		});
		
		//Would have been nice to use two for loops, but it isn't working
		//Let's use something that works and can come back later to figure out
		//No loop, test test boxes
		// .pause(10000).then(function () {
			// testUtils.assertNodeExists(Box)
		// });
		//Wait a second...
		
	}
};