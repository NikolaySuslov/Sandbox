//Select None via button, menu,
//context menu will be saved for later

module.exports = {
	'Test select none via button and menu (A14)': function(browser, finished) {
		global.browser = browser;
		var testUtils = global.testUtils;
			passed = true,
			outStr = "",
			// noSel = "No Selection";
		
		browser.loadBlankScene()
		.nextGUID('testSphere')
		.$click('#MenuCreateSphereicon')

		//Verify Selection of Sphere
		.pause(3000).isNodeSelected("testSphere", function(err, r) {
			if(r) {
				outStr += "testSphere is selected. " /*+ msg + "; "*/;
			} else {
				passed = false;
				outStr += "testSphere is not selected. " /*+ msg + "; "*/;
			}
		})
		//Select None and Verify
		.pause(3000).$click('#MenuSelectNoneicon')
		.isNodeSelected('testSphere', function(err, r) {
			if(!r) {
				outStr += "testSphere is not selected. " /*+ msg + "; "*/;
			} else {
				passed = false;
				outStr += "testSphere is selected. " /*+ msg + "; "*/;
			}
		})
		
		//Verify Sphere
		.pause(3000).then(function() {
			testUtils.assertNodeExists("testSphere", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Sphere exists: " + msg + "; ";
				// finished(passed, outStr);
			});
		})
		
		
		//Use the Menu to Select None
		.nextGUID('testCylinder')
		.$click('#MenuCreateCylindericon')
		//Verify Selection of Cylinder
		.pause(3000).isNodeSelected("testCylinder", function(err, r) {
			if(r) {
				outStr += "testCylinder is selected. " /*+ msg + "; "*/;
			} else {
				passed = false;
				outStr += "testCylinder is not selected. " /*+ msg + "; "*/;
			}
		})
		//Select None and Verify
		.pause(3000)
		.click('#MenuEdit')
		.waitForVisible('#MenuSelect')
		.click('#MenuSelect')
		.waitForVisible('#MenuSelectNone')
		.click('#MenuSelectNone')
		
		.isNodeSelected('testCylinder', function(err, r) {
			if(!r) {
				outStr += "testCylinder is not selected. " /*+ msg + "; "*/;
			} else {
				passed = false;
				outStr += "testCylinder is selected. " /*+ msg + "; "*/;
			}
		})
		//Verify Sphere is still not selected
		.isNodeSelected('testSphere', function(err, r) {
			if(!r) {
				outStr += "testSphere is not selected either. " /*+ msg + "; "*/;
			} else {
				passed = false;
				outStr += "testSphere is selected. " /*+ msg + "; "*/;
			}
		})
		
		//Verify Cylinder
		browser.pause(3000).then(function() {
			testUtils.assertNodeExists("testCylinder", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Cylinder exists: " + msg + "; ";
				finished(passed, outStr);
			});
		});
	
	}
}