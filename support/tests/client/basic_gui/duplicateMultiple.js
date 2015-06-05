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
			dupNodes = []
			
		browser.loadBlankScene()

		//Create Prims
		//Sphere and Cylinder were chosen because both can be seen when 
		//created over top of one another.  Not much help later though.
		.nextGUID('Sphere')
		.$click('#MenuCreateSphereicon')
		.pause(3000)
			// .getNodeID(function(err, r) {
				// sphereID = r;
			// })
		
		
		
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
		//Verify no other sphere or cylinder
		.then(function() {
			testUtils.assertNodeExists('DupSphere1', function(assertStatus, msg) {
				passed = passed && !assertStatus;
				outStr += "DupSphere1 exists: " + msg + "; ";
			});
		})
		.then(function() {
			testUtils.assertNodeExists('DupCylinder1', function(assertStatus, msg) {
				passed = passed && !assertStatus;
				outStr += "DupCylinder1 exists: " + msg + "; ";
			});
		})

		.pause(6000)
		//Select Both Prims
		//Cylinder is already selected
		// .click('#MenuEdit')
		// .waitForVisible('#MenuSelect')
		// .click('#MenuSelect')
		// .waitForVisible('#MenuSelectName')
		// .click('#MenuSelectName')
		// .waitForVisible('#selectionEditor')
		// .then(function() {
			// return browser.click("#"+sphereID+"_treeviewitem_anchor")
		// })
		
		//Click the Select button of the Selection Editor menu
		// .$click('.ui-dialog .ui-button:contains(Select)')
		
		// Okay for selecting one node - not multiple
		.selectNodes(["Sphere", "Cylinder"], function(err, r) {
			if(!err && r) {
				outStr += "Nodes are selected. ";
			} else {
				passed = false;
				outStr += "Nodes are not selected. ";
			}
		})
		
		
		
		
		
		//Duplicate via Button
		// .nextGUID('DupSphere1')
		// .nextGUID('DupCylinder1')
		.$click('#MenuDuplicateicon')
		.pause(1000).getSelectedNodes(function(err, r) {
			for(var i = 0; i < r.length; i++) {
				dupNodes.push(r[i].name);
			}
		})
		
		//Duplicate via Menu
		.pause(1000)
		// .nextGUID('DupSphere2')
		// .nextGUID('DupCylinder2')
		.$click('#MenuEdit')
		// .waitForVisible('#MenuDuplicate')
		.pause(1000)
		.$click('#MenuDuplicate')
		.pause(1000).getSelectedNodes(function(err, r) {
			for(var i = 0; i < r.length; i++) {
				dupNodes.push(r[i].name);
			}
		})
		//Duplicate via Context Menu
		// .pause(1000)
		// .nextGUID('DupSphere3')
		
		
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
				finished(passed, outStr);
			});
		})
		// .pause(3000).then(function() {
			// testUtils.assertNodeExists('DupSphere3', function(assertStatus, msg) {
				// passed = passed && !!assertStatus;
				// outStr += "Dup Context Menu: " + msg + "; ";
				// finished(passed, outStr);
			// });
		// })
		

	
	}
}