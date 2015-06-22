//Link one Prim to Another
//Create two prims
//Link one to the other
//Test the parent and output it's child's name

module.exports = {
	'Link One Prim to Another (A19)': function (browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testUtils.js'),
			passed = true,
			outStr = "",
            parent = null,
			child = null;
		
		browser.loadBlankScene()
		
		//Create Box and Cone
		.nextGUID('Box')
		.$click('#MenuCreateBoxicon')
		.pause(1000)
		.nextGUID('Cone')
		.$click('#MenuCreateConeicon')
		.pause(1000)
		//Link Box to Cone
		//the first selected will become the child
		//and be linked to the parent - the next selected
		//so in our case the box will be the child of the cone the parent
		.selectNodes(["Box"], function (err, r) {
			if (!err && r) {
				outStr += "Box/Child is selected. ";
			} else {
				passed = false;
				outStr += "Box/Child is not selected. ";
			}
		})
		.$click('#MenuSetParenticon')
		.pause(1000)
		.selectNodes(["Cone"], function (err, r) {
			//Commented out because the cone does not stay selected
			//the newly created box/child is selected
			// if (!err && r) {
				// outStr += "Cone is selected. ";
			// } else {
				// passed = false;
				// outStr += "Cone is not selected. ";
			// }
		})

		//Get Parent
        .pause(2000)
        .selectNodes(["Cone"], function (err, r) {
			if (!err && r) {
				outStr += "Cone/Parent is selected. ";
			} else {
				passed = false;
				outStr += "cone/Parent is not selected. ";
			}
		})
		
		//Test for Children
		//is Cone parent?
        .pause(2000)
        .getSelectedNodes(function (err, r) {
            parent = r[0];   //this will be the parent/cone
        })
        .pause(1000)
		
        .then(function () {
            if (!parent || parent.id === "") {
                passed = false;
				outStr += "Parent not selected. ";
            } else {
                outStr += "Parent is " + parent.id + ". ";
				outStr += "Child is " + Object.keys(parent.children) + ". ";
            }
			browser.pause(3000).then(finished(passed, outStr, true));
        });
		
	}
}