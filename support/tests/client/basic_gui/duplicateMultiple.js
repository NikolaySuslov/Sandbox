//Duplicate by Button, Menu, and Context Menu with Multiple Selected
//Note: duplicate creates another prim in the exact same space as the original
//so there will be no visual evidence of duplicate working

module.exports = {
	'Duplicate via Button, Menu, and Context Menu with Multiple Selected (A16)':
	function(browser, finished) {
		global.browser = browser;
		var testUtils = global.testUtils,
			passed = true,
			outStr = "",
			dupNodes = [];
			
		browser.loadBlankScene()

		//Create Prims
		//Sphere and Cylinder were chosen because both can be seen when 
		//created over top of one another.  Not much help later though.
		.nextGUID('Sphere')
		.$click('#MenuCreateSphereicon')
		.pause(3000)
		
		.pause(1000)
		.nextGUID('Cylinder')
		.$click('#MenuCreateCylindericon')
		
		//Verify Original Prims
		.pause(3000).then(function() {
			testUtils.assertNodeExists('Sphere', function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Sphere exists: " + msg + "; ";
			});
		})
		.then(function() {
			testUtils.assertNodeExists('Cylinder', function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Cylinder exists: " + msg + "; ";
			});
		})


		.pause(6000)
		//Select Both Prims
		.selectNodes(["Sphere", "Cylinder"], function(err, r) {
			if(!err && r) {
				outStr += "Nodes are selected. ";
			} else {
				passed = false;
				outStr += "Nodes are not selected. ";
			}
		})
		
		
		//Duplicate via Button
		.$click('#MenuDuplicateicon')
		.pause(1000).getSelectedNodes(function(err, r) {
			for(var i = 0; i < r.length; i++) {
				dupNodes.push(r[i].name);
			}
		})
		
		//Duplicate via Menu
		.pause(1000)
		.click('#MenuEdit')
		.waitForVisible('#MenuDuplicate')
		// .pause(1000)
		.click('#MenuDuplicate')
		.pause(1000).getSelectedNodes(function(err, r) {
			for(var i = 0; i < r.length; i++) {
				dupNodes.push(r[i].name);
			}
		})

		//Duplicate via Context Menu
		//Sphere and Cylinder just created from duplication are selected
		.pause(1000)
		.rightClick('#index-vwf')
		.waitForVisible('#ContextMenu')
		.$click('#ContextMenuDuplicate')
		.pause(1000).getSelectedNodes(function(err, r) {
			for(var i = 0; i < r.length; i++) {
				dupNodes.push(r[i].name);
			}
		})
		
		//Verify Duplicates
		.pause(3000).then(function() {
			testUtils.assertNodeExists(dupNodes[0], function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Dup Button: " + msg + "; ";
			});
		})
		.pause(3000).then(function() {
			testUtils.assertNodeExists(dupNodes[1], function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Dup Button: " + msg + "; ";
			});
		})
		.pause(3000).then(function() {
			testUtils.assertNodeExists(dupNodes[2], function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Dup Menu: " + msg + "; ";
				// finished(passed, outStr);
			});
		})
		.pause(3000).then(function() {
			testUtils.assertNodeExists(dupNodes[3], function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Dup Menu: " + msg + "; ";
				// finished(passed, outStr);
			});
		})
		.pause(3000).then(function() {
			testUtils.assertNodeExists(dupNodes[4], function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Dup Context Menu: " + msg + "; ";
			})
		})
		.pause(3000).then(function() {
			testUtils.assertNodeExists(dupNodes[5], function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Dup Context Menu: " + msg + "; ";
				finished(passed, outStr);
			});
		});
		
		//Verify Duplicates replacing with a for loop
		// .pause(3000)
		// .then(function () {
			// for (var i = 0; i < dupNodes.length; i++) {
				// browser.pause(3000).then(function() {
					// testUtils.assertNodeExists(dupNodes[i], function(assertStatus, msg) {
						// passed = passed && !!assertStatus;
						// outStr += "Dup Context Menu: " + msg + "; ";
					// })
				// });
			// }
			// browser.pause(2000);
			// finished(passed, outStr);
		// });

	
	}
}