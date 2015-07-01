//Link one Prim to Another
//AND Unlink one prim from parent
//Create two prims
//Link one to the other
//Test the parent and output it's child's name
//Unlink the child from the parent 
//and test the parent is no longer a parent
//and select parent from the child goes to index-vwf

module.exports = {
	'Link One Prim to Another Then Unlink It (A19, 21)': function (browser, finished) {
		global.browser = browser;
		var testUtils = require('../../utils/testUtils.js'),
			passed = true,
			outStr = "",
            parent = null,
			child = null;
		
		browser.loadBlankScene()
				
		//Show side tab hierarchy
		//parentage can be watched here as well
		.pause(1000)
		.$click('#SideTabShow')
		.waitForVisible('#editorPanelhierarchyManagertitle')
		.$click('#editorPanelhierarchyManagertitle')
		.pause(2000)
        
		//Create Box and Cone
		.nextGUID('Box')
		.$click('#MenuCreateBoxicon')
		.pause(1000)
		.nextGUID('Cone')
		.$click('#MenuCreateConeicon')
		// .nextGUID('Child')
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
		.nextGUID('Child')
		.$click('#MenuSetParenticon')
		.pause(1000)
		.selectNodes(["Cone"], function (err, r) {	})

		//Get Parent
		//unable to directly select a Child with .SelectObject("...")
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
        //if so selectParent will select node id = "index.vwf" 
        //and node.children.name = "Box"
        //test parent should really only test children !== undefined
        //that is the easiest most reliable test for parent
        // .pause(1000)
        // .pause(1000)
        // .$click('#MenuSelectParenticon')
        .pause(2000)
        .getSelectedNodes(function (err, r) {
            parent = r[0];   //this will be the parent/cone
			child = Object.keys(parent.children);  //this gets the array of children's names. add to "box2-vwf-" to make id
        })
        .pause(1000)
		
        .then(function () {
            if (!parent || parent.id === "") {
                passed = false;
				outStr += "Parent not selected. ";
            } else {
                outStr += "Parent is " + parent.id + ". ";
				outStr += "Child name: " + child[0] + ". ";
				outStr += "Child id: box2-vwf-" + child[0] + ". ";
            }
        })

		
		//Unlink one prim from parent (A21)
		
		//Parentage established, select the child
		//were it so easy
		.pause(3000)
		
		//hard coded the name
		.selectNodesWithID(["box2-vwf-Child"], function (err, r) {
			if (!err && r) {
				outStr += "box is selected. ";
			} else {
				passed = false;
				outStr += "box is not selected. ";
			}
			
		})
		
		//Hit unlink button
		.pause(9000)
		.nextGUID('Unlinked')
		.pause(1000)
		.$click('#MenuRemoveParenticon')
		.pause(3000)
		
		//box (new box) will be selected
		//Store the new box in child though it is not
		.getSelectedNodes(function (err, r) {
			if (!err && r) {
				child = r[0];   //this will be the new box
				outStr += child.id + "; ";
			} else {
				passed = false;
				outStr += "Didn't get the new box. "
			}
			// browser.pause(3000).then(finished(passed, outStr, true));
		})

		.pause(2000)
		//Get the parent node, which is not anymore
		.selectNodes(["Cone"], function (err, r) {
			if (!err && r) {
				//nothing - all good keep going
			} else {
				passed = false;
				outStr += "Couldn't get the cone. "
			}
		})
		.getSelectedNodes(function (err, r) {
			if (!err && r.length > 0) {
				parent = r[0];   //this will be the old cone with no children
				outStr += parent.id;
			} else {
				passed = false;
				outStr += "Didn't get the new box. "
			}
			// browser.pause(3000).then(finished(passed, outStr, true));
        })
		
		.pause(2000)
		//Test that child and parent are no longer linked
		.then(function () {
            if (!parent || parent.id === "") {
                passed = false;
				outStr += "Parent not selected. ";
            } else if (parent.children) {
				outStr += "Parent is " + parent.id + ". ";
				outStr += "Children are " + Object.keys(parent.children) + ". ";
			} else {
				outStr += "" + child.id + " and " + parent.id + " are independent. ";
            }
			browser.pause(3000).then(finished(passed, outStr, true));
        });

	}
}