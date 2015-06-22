//Select by Clicking
module.exports = {
	'Select by right clicking (A12)': function(browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testUtils.js'),
			passed = true,
			outStr = "";
			
		browser.loadBlankScene()
		
		//Create box from button
		.nextGUID('testBox')
		.$click('#MenuCreateBoxicon')
		//Verify box
		.pause(3000).then(function() {
			testUtils.assertNodeExists("testBox", function(assertStatus, msg) {
				passed = passed && !!assertStatus;
				outStr += "Box exists: " + msg + "; ";
				
			});
		})
		
		//Focus on the box
		// .pause(1000)
		// .$click('#MenuFocusSelectedicon')
		
		//Select none
		.pause(1000)
		.$click('#MenuSelectNoneicon')
		
		//Verify box is not selected
		.pause(1000)
		.isNodeSelected('testBox', function(err,r) {
			if (!err && !r) {
				passed = passed && true;
				outStr += "Not Selected; "
			} else {
				passed = false;
				outStr += "Box still Selected; ";
			}
		})
		
		//Select box by clicking in middle of canvas
		//move to object - Canvas
		// click
		.pause(3000)
		// .moveToObject('#index-vwf')	//moves mouse to center of canvas
		// .click('#index-vwf')	//no arguments - clicks in the center
		// .pause(1000).click('#index-vwf')	//unnecessary
		.rightClick('#index-vwf')
		.waitForVisible('#ContextMenu', 1000)
		.click('#ContextMenuSelect')
		
		//Verify that the box is selected and we go home
		.pause(10000)
		.isNodeSelected('testBox', function(err,r) {
			if (!err && r) {
				passed = passed && true;
				outStr += "Box Selected by clicking!! ";

			} else {
				passed = false;
				outStr += "Box not Selected:( ";

			}
			finished(passed, outStr);
		})
		

		
		/*
		Commands for Selecting a Sandbox Object
		(courtesy of Rob Chadwick)

			vwf.find(vwf.application(),'test')[0]
			 find an ID given a name

			_Editor.GetSelectedVWFID()
			 get the 1st selected ID

			_Editor.SelectObject(ID)
			 select an object by ID

			GUID.nextGUID = "test"
			 for the next randomly generate name to be "test"
		*/
		

	}
}