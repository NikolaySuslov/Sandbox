var node;
module.exports = {
    'Test behavior accessing parents transformAPI': function(browser, finished) {
        
        var vwfNode = {"children": {"N359a2e02": {"extends": "http://vwf.example.com/behavior.vwf", "properties": {"DisplayName": "behavior1", "owner": "Anonymous_DOgxDIdFVIflhSK8AAAA", "type": "behavior"}, "random": {"c": 1, "s0": 0.378416438354179, "s1": 0.496655165916309, "s2": 0.829365765675902 }, "sequence": 0 } }, "extends": "sphere2.vwf", "methods": {"tick": {"body": "\n  //This function was created for you by the system. \n      //The tick function is called 20 times every second. \n      // Write code here to animate over time\n      this.transformAPI.move(.1,0,0);\n", "parameters": [] } }, "properties": {"DisplayName": "sphere1", "___physics_activation_state": 1, "___physics_deactivation_time": 0, "___physics_velocity_angular": [0, 0, 0], "___physics_velocity_linear": [0, 0, 0], "materialDef": {"alpha": 1, "ambient": {"b": 1, "g": 1, "r": 1 }, "color": {"a": 1, "b": 1, "g": 1, "r": 1 }, "emit": {"b": 0, "g": 0, "r": 0 }, "layers": [{"alpha": 1, "blendMode": 0, "mapInput": 0, "mapTo": 1, "offsetx": 0, "offsety": 0, "rot": 0, "scalex": 1, "scaley": 1, "src": "checker.jpg"}], "reflect": 0.8, "shadeless": false, "shadow": true, "shininess": 15, "specularColor": {"b": 0.577350269189626, "g": 0.577350269189626, "r": 0.577350269189626 }, "specularLevel": 1 }, "owner": "Anonymous_DOgxDIdFVIflhSK8AAAA", "transform": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0.0010000000474974513, 1], "type": "Primitive"}, "random": {"c": 1, "s0": 0.63245929707773, "s1": 0.44253749679774, "s2": 0.948766567977145 }, "sequence": 0, "source": "vwf/model/threejs/sphere.js", "type": "subDriver/threejs"};

        browser
        .loadBlankScene()
        .nextGUID('testSphere')
        .createNode(vwfNode)
        .click('#playButton')
        .pause(2000)
        .click('#pauseButton').pause(200)
        .getProperty('testSphere','transform', function(err, prop){
        	console.log("transform is " + prop.value);  //we must pass the whole return object, because for some strange reason, we cannot pass an array
        })
        .getNode('testSphere', function(err, n){
        	node = n
			//finished(node.properties.transform[12] !== 0, node.properties.transform);
        }).
		pause(1000).then(function(){

        	//throw new Error('need to cancel this queue after finished!')
        	finished(node.properties.transform[12] !== 0, node.properties.transform);

        })
    }
}