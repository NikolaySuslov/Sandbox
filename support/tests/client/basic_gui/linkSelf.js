//Link to Self
//Nodes may not link to themselves
//An alert pops up to notify the user of such
//We hit the okay button and move on

module.exports = {
	'Link to Self (A33)': function (browser, finished) {
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
        
		//Create some prim
		.nextGUID('John')
		.$click('#MenuCreateSphereicon')
		
		//Link to self
		.pause(3000)
		.$click('#MenuSetParenticon')
		.pause(1000)
		.selectNodes(["John"], function (err, r) {
			if (!err && r) {
				outStr += "Selection success. ";
			} else {
				passed = false;
				outStr += "Selection difficulties. ";
			}
		})
		.waitForVisible('#alertify-ok', 3000)
		.$click('#alertify-ok')
		.getSelectedNodes(function (err, r) {
			//No error and result is an object (not null or undefined)
			if (!err && r) {
				//The node has no child field
				outStr += "" + r[0].id + " can not select itself; ";
			} else {
				passed = false;
				outStr += "Something has gone wrong. "
			}
			browser.pause(3000).then(finished(passed, outStr, false));
		});
		
	}
}