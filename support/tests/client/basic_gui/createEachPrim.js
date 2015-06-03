function createMenu(topMenu, button, _extends, finished) {
    global.browser = browser;
    var testUtils = require('../../utils/testutils.js');
    browser.loadBlankScene()
        .nextGUID('test')

    .click('#MenuCreate')
    //gets the ul that is the sibling of #MenuCreate
    .waitForVisible(topMenu, 1000)
        .click(topMenu)
        .waitForVisible(button, 1000)
        .click(button)
        .pause(3000).getNode("test", function(err,node) {


            if (!node) {
                finished(false, "Node not created");
                return;
            }
            if (node.extends == _extends) {
                finished(true, node.id + " Expected:" + _extends + " got:" + node.extends);
            } else {
                finished(false, "Node wrong type. Expected:" + _extends + " got:" + node.extends);
            }
        });


}
module.exports = function() {
	
    return [{
        title: "Test Create Each Object:Sphere",
        test: function(browser, cb) {
            createMenu('#MenuPrimitives', '#MenuCreateSphere', 'sphere2.vwf', cb)
        }
    }, {
        title: "Test Create Each Object:Box",
        test: function(browser, cb) {
            createMenu('#MenuPrimitives', '#MenuCreateBox', 'box2.vwf', cb)
        }
    }, {
        title: "Test Create Each Object:Cylinder",
        test: function(browser, cb) {
            createMenu('#MenuPrimitives', '#MenuCreateCylinder', 'cylinder2.vwf', cb)
        }
    }, {
        title: "Test Create Each Object:Cone",
        test: function(browser, cb) {
            createMenu('#MenuPrimitives', '#MenuCreateCone', 'cone2.vwf', cb)
        }
    }, {
        title: "Test Create Each Object:Plane",
        test: function(browser, cb) {
            createMenu('#MenuPrimitives', '#MenuCreatePlane', 'plane2.vwf', cb)
        }
    }, {
        title: "Test Create Each Object:Text",
        test: function(browser, cb) {
            createMenu('#MenuPrimitives', '#MenuCreateText', 'text2.vwf', cb)
        }
	    }, {
        title: "Test Create Each Object:Torus",
        test: function(browser, cb) {
            createMenu('#MenuPrimitives', '#MenuCreateTorus', 'torus2.vwf', cb)
        }
    }]
}