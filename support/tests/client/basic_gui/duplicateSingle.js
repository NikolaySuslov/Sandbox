//Duplicate by Button, Menu, and Context Menu
//Note: duplicate creates another prim in the exact same space as the original
//so there will be no visual evidence of duplicate working

module.exports = {
	'Duplicate via Button, Menu, and Context Menu (A15)': function(browser, finished) {
		global.browser = browser;
		var testUtils = global.testUtils;
			passed = true;
			outStr = "";
			
		browser.loadBlankScene()
		.nextGUID('Sphere')
		.$click('#MenuCreateSphereicon')
		
		//Verify Original Sphere
		.pause(3000).then(function() {
			testUtils.assertNodeExists('Sphere', function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Sphere exists: " + msg + "; ";
			});
		})

		.pause(6000)
		//Duplicate via Button
		.nextGUID('DupSphere1')
		.$click('#MenuDuplicateicon')
		
		//Duplicate via Menu
		.pause(1000)
		.nextGUID('DupSphere2')
		.click('#MenuEdit')
		.waitForVisible('#MenuDuplicate')
		.click('#MenuDuplicate')
		
		//Duplicate via Context Menu
		.pause(1000)
		.nextGUID('DupSphere3')
		.rightClick('#index-vwf')
		.waitForVisible('#ContextMenu', 1000)
		.$click('#ContextMenuDuplicate')
		
		//Verify Duplicates
		.pause(3000).then(function() {
			testUtils.assertNodeExists('DupSphere1', function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Dup Button: " + msg + "; ";
			});
		})
		.pause(3000).then(function() {
			testUtils.assertNodeExists('DupSphere2', function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Dup Menu: " + msg + "; ";
				// finished(passed, outStr);
			});
		})
		.pause(3000).then(function() {
			testUtils.assertNodeExists('DupSphere3', function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Dup Context Menu: " + msg + "; ";
				finished(passed, outStr);
			});
		})
		

	
	}
}