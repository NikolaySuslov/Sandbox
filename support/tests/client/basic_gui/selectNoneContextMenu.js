//Select None via button, menu,
//context menu will be saved for later

module.exports = {
	'Select none via context menu (A14)': function(browser, finished) {
		global.browser = browser;
		var testUtils = global.testUtils;
			passed = true,
			outStr = "";
		
		browser.loadBlankScene()
		
		//Show side tab hierarchy
		//selection can be watched here as well
		.pause(1000)
		.$click('#SideTabShow')
		.waitForVisible('#editorPanelhierarchyManagertitle')
		.$click('#editorPanelhierarchyManagertitle')
		.pause(2000)
   
		//Create Sphere and Cylinder
		.nextGUID('Jim')
		.$click('#MenuCreateSphereicon')
		.nextGUID('Dwight')
		.$click('#MenuCreateCylindericon')

		//Verify Sphere
		.pause(3000).then(function() {
			testUtils.assertNodeExists("Jim", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Sphere exists: " + msg + "; ";
				// finished(passed, outStr);
			});
		})
		//Verify Cylinder
		.pause(3000).then(function() {
			testUtils.assertNodeExists("Dwight", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Cylinder exists: " + msg + "; ";
				console.log(outStr);
			});
		// });
		})
		
		//Select None via context menu
		//Sphere is not selected, cylinder is selected
		//rightClick in middle of canvas
		.pause(3000)
		.rightClick('#index-vwf')
		.waitForVisible('#ContextMenu')
		.$click('#ContextMenuSelectNone')
		.pause(3000)
		
		//Verify Sphere is not selected
		.isNodeSelected('Jim', function(err, r) {
			if(!r) {
				outStr += "Sphere is not selected. ";
			} else {
				passed = false;
				outStr += "Sphere is selected. ";
			}
		})
		//Verify Cylinder is not selected
		.isNodeSelected('Dwight', function(err, r) {
			if(!r) {
				outStr += "Cylinder is not selected either. ";
			} else {
				passed = false;
				outStr += "Cylinder is selected. ";
			}
			browser.pause(2000).then(finished(passed, outStr));
		});
		

	}
}