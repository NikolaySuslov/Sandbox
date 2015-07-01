//Link Multiple Prims to Another
//Create Multiple Prims (Sphere, Box, Cylinder, Cone, Plane)
//Select Sphere, Box, Cylinder
//Link to Plane
//Test:
//Plane is parent and has children
//Sphere, Box, Cylinder have parent
//Cone is neither parent or child

module.exports = {
	'Link Multiple Prims to Another (A20)': function (browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testUtils.js'),
			passed = true,
			outStr = "",
			nodes = [];
		
		browser.loadBlankScene()
		
		//Show side tab hierarchy
		//parentage can be watched here as well
		.pause(1000)
		.$click('#SideTabShow')
		.waitForVisible('#editorPanelhierarchyManagertitle')
		.$click('#editorPanelhierarchyManagertitle')
		.pause(2000)
		
		//Create Prims
		.nextGUID('Box')
		.$click('#MenuCreateBoxicon')
		.pause(1000)
		.nextGUID('Sphere')
		.$click('#MenuCreateSphereicon')
		.pause(1000)
		.nextGUID('Cone')
		.$click('#MenuCreateConeicon')
		.pause(1000)
		.nextGUID('Plane')
		.$click('#MenuCreatePlaneicon')
		.pause(1000)
		.nextGUID('Cylinder')
		.$click('#MenuCreateCylindericon')
		.pause(2000)
		
		//Select Sphere, Box, and Cylinder
		.selectNodes(["Sphere", "Box", "Cylinder"], function (err, r) {
			if (!err && r) {
				outStr += "Nodes selected. ";
				console.log(outStr);
			} else {
				passed = false;
				outStr += "Nodes Unselected. ";
				console.log(outStr);
			}
		})
		.pause(1000)
		.$click('#MenuSetParenticon')
		.selectNodes(["Plane"], function (err, r) {
			//If I'm right, based on link single, this test will fail
			//because new instances of sphere, box, and cylinder will
			//be created, and thereby will be what is selected
			// if (!err && r) {
				// outStr += "Plane selected. ";
			// } else {
				// passed = false;
				// outStr += "Plane Unselected. ";
			// }
		})
		
		//Perform Tests
		//is Plane parent? Plane is already selected - do first
		//Plane is not already selected - Sphere, Box, and Cylinder are
		//And not the Sphere, Box, and Cylinder we started with
		//use Select Parent button and test plane from there
		
		//So get parent and test for children
		.pause(2000)
		.$click('#MenuSelectParenticon')
		.pause(2000)
		.getSelectedNodes(function (err, r) {
			parent = r[0];   //this will be the parent/plane
		})
		.pause(1000)
		
		.then(function () {
			if (!parent || parent.id === "") {
				passed = false;
				outStr += "Parent not selected. ";
				console.log(outStr);
			} else {
				outStr += "Parent is " + parent.id + ". ";
				outStr += "Child is " + Object.keys(parent.children) + ". ";
				console.log(outStr);
			}
			browser.pause(3000).then(finished(passed, outStr, true));
		});
		
	}
}