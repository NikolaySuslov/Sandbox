//Link Multiple Prims to Another
//Create Multiple Prims (Sphere, Box, Cylinder, Cone, Plane)
//Select Sphere, Box, Cylinder
//Link to Plane
//Test:
//Plane is parent and has children
//Sphere, Box, Cylinder are children
//Unlink:
//Select the Sphere, Box and Cylinder again
//Unlink tests
//Scene ("index-vwf") will be parent
//Plane: the former parent will have no children

module.exports = {
	'Link Multiple Prims and Unlink (A20, 22)':
	function (browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testUtils.js'),
			passed = true,
			outStr = "",
			parent = null,
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
			} else {
				passed = false;
				outStr += "Nodes Unselected. ";
			}
		})
		.pause(1000)
		.$click('#MenuSetParenticon')
		.selectNodes(["Plane"], function (err, r) {
			//If I'm right, based on link single, this test will fail
			//because new instances of sphere, box, and cylinder will
			//be created, and thereby will be what is selected
		})
		
		//Perform Tests
		//Plane is not already selected - Sphere, Box, and Cylinder are
		//And not the Sphere, Box, and Cylinder we started with
		//use Select Parent button and test plane from there
		
		//Get the children
		.pause(2000)
		.getSelectedNodes(function (err, r) {
			for (var i = 0, len = r.length; i < len; i++) {
				nodes.push(r[i]);
			}
		})
		
		//So get parent and test for children
		.pause(2000)
		.then (function () {
			browser.$click('#MenuSelectParenticon')
			.pause(1000)
			.getSelectedNodes(function (err, r) {
				parent = r[0];   //this will be the parent/plane
			})
		})
		.pause(1000)
		.then(function () {
			if (parent && parent.id !== "") {
				outStr += "Parent is " + parent.id + ". ";
				outStr += "Child is " + Object.keys(parent.children) + ". ";
			} else {
				passed = false;
				outStr += "Parent not selected. ";
			}
		})
		
		//Unlink multiple prims from parent (A22)
		.pause(3000).then(function() {
			console.log(nodes.length + " I")
			browser.selectNodesWithID([nodes[0].id, nodes[1].id, nodes[2].id], function (err, r) {
				if (!err && r) {
					outStr += "Nodes are selected. ";
				} else {
					passed = false;
					outStr += "Nodes NOT selected. " + nodes;
				}
				// browser.pause(3000).then(finished(passed, outStr, true));
			});
		})
		.pause(2000)
		.$click('#MenuRemoveParenticon')
		.pause(2000)
		
		//Select the new parent verify it is the scene
		.$click('#MenuSelectParenticon')
		.pause(2000)
		.getSelectedNodes(function (err, r) {
			if (err || r.length <= 0 ) {
				passed = false;
				outStr += "Something went wrong with unlinking and then selecting the parent. ";
			} else if (r[0].id === "index-vwf") {
				outStr += "Hooray: the parent is the scene " + r[0].id + "; ";
			} else if (parent.id === r[0].id) {
				passed = false;
				outStr += "Wrong: The Plane is still the parent. ";
			} else {
				passed = false;
				outStr += "Wrong: good luck, I don't know what happened. "
			}
		})
		.pause(3000)
		
		//Select the plane and verify it has no children
		.selectNodes(["Plane"], function (err, r) {
			if (!err && r) {
				//nothing - all good keep going
			} else {
				passed =  false;
				outStr += "Didn't catch the plane. "
			}
		})
		//Update the 'parent' node
		.getSelectedNodes(function (err, r) {
			if (!err && r.length > 0) {
				parent = r[0];
				outStr += parent.id;
			} else {
				passed = false;
				outStr += "Didn't get the old parent. "
			}
		})
		.pause(3000)
		.then(function () {
			if (!parent || parent.id === "") {
				passed = false;
				outStr += "Parent not selected. ";
			} else if (parent.children) {
				passed = false;
				outStr += "Parent is " + parent.id + ". ";
				outStr += "Children are " + Object.keys(parent.children) + ". ";
			} else {
				outStr += "Success: " + parent.id + " is no longer parent of other nodes.";
			}
			browser.pause(3000).then(finished(passed, outStr, false));
		});
		
	}
}