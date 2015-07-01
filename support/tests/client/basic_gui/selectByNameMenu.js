//Select by Name Menu (A23)

module.exports = {
	'Select by Name Menu (A16)': function (browser, finished) {
		global.browser = browser;
		var testUtils = global.tsetUtils,
			passed = true,
			outStr = "",
			nodes = [],
			names = ["Box", "Sphere", "Cylinder", "Plane", "Cone"];
			
		browser.loadBlankScene()
		
		//Open and close select by name menu
		.click('#MenuEdit')
		.waitForVisible('#MenuSelect')
		.click('#MenuSelect')
		.waitForVisible('#MenuSelectName')
		.click('#MenuSelectName')
		.pause(2000)
		//Need selection magic here
		//
		
		//Create prims
		for (var i in names) {
			browser.nextGUID(names[i])
			.pause(3000)
		}
		
		//Select by name and verify
		browser.pause(3000)
		.getSelectedNodes(function (err, r) {
			outStr += "Expected " + names[names.length-1];
			outStr += " Actual " + r[0].name + "; ";
			if (names[length-1] !== r[0].name) {
				passed = false;
			}
		})
		.pause(4000)
		.then(function () {
			for (var i in names) {
				browser.selectNodes([names[i]], function (err, r) {
					
				})
				browser
				.click('#MenuEdit')
				.waitForVisible('#MenuSelect')
				.click('#MenuSelect')
				.waitForVisible('#MenuSelectName')
				.click('#MenuSelectName')
				//More advanced selection magic here
				//
				.pause(2000)
				.getSelectedNodes(function (err, r) {
					outStr += "Expected " + names[names.length-1];
					outStr += "Actual " + r[0].name + "; ";
					if (names[length-1] !== r[0].name) {
						passed = false;
					}
				});
			}
			browser.pause(3000).then(finished(passed, outStr, true));
		});
		
		//that's the end here, but still waiting on the selection magic
		
	}
}