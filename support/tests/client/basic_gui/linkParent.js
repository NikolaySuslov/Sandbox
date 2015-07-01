//Link to Self
//Nodes may not link to themselves
//An alert pops up to notify the user of such
//We hit the okay button and move on

module.exports = {
	'Link to Current Parent (A34)': function (browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testutils.js'),
			passed = true,
			outStr = "";
			
		browser.loadBlankScene()
		
		//Show side tab hierarchy
		//easy visual of parent child relationships
		.pause(1000)
		.$click('#SideTabShow')
		.waitForVisible('#editorPanelhierarchyManagertitle')
		.$click('#editorPanelhierarchyManagertitle')
		.pause(1000)
		
		//Create some prims
		.nextGUID('John')	//parent
		.$click('#MenuCreateSphereicon')
		.nextGUID('Paul')	//child
		.$click('#MenuCreateCylindericon')
		
		//Link to parent
		.pause(3000)
		.$click('#MenuSetParenticon')
		.pause(1000)
		.selectNodes(["John"], function (err, r) {	})
		.pause(5000)
		
		//Link again to current parent
		.$click('#MenuSetParenticon')
		.pause(1000)
		.selectNodes(["John"], function (err, r) {	})
		.pause(3000)
		.waitForVisible('#alertify-ok', 3000)
		.$click('#alertify-ok')
		.pause(2000)
		
		//Get and output parent name and children's names
		.getSelectedNodes(function (err, r) {
			//No error and result is an object (not null or undefined)
			if (!err && r) {
				outStr += "This object is already the selected objects parent. "
				outStr += "The selected object is " + r[0].id + "; ";
			} else {
				passed = false;
				outStr += "Something has gone wrong. "
			}
		})
		.pause(2000)
		.$click('#MenuSelectParenticon')
		.pause(2000)
		.getSelectedNodes(function (err, r) {
			if (!err && r) {
				outStr += "The parent is " + r[0].id + "; ";
				outStr += "With children: " + Object.keys(r[0].children) + "; ";
			} else {
				passed = false;
				outStr += "Something is wrong with the parent. "
			}
			browser.pause(3000).then(finished(passed, outStr, false));
		});
		
		
	}
}