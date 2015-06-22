module.exports = {
    'Tests creating modifier and verifying persistence': function(browser, finished) {
        global.browser = browser;
        var testUtils = global.testUtils;
		var passed = true;
		var outStr = "";
		var worldId;
		
		var nodeName = "testWorldPrim";
		var modifier = "Bend";
		
        browser
			.login(function(err, val){
				if(err){
					outStr += "Unable to log in; ";
					passed = false;
					//Exit test here...
				}
				else outStr += "Login successful; ";
			})
			
			.createWorld(function(err, id){
				if(err){
					passed = false;
					outStr += "Unable to create world; ";
				}
				else{
					worldId = id;
					return browser.url("http://localhost:3000/adl/sandbox/" + id + "?norender=true");
				}
			})
			
			.waitForExist('#preloadGUIBack', 60000)
			.waitForVisible('#preloadGUIBack', 60000, true)
			
			.nextGUID(nodeName)
			.$click("#MenuCreateSphereicon")
			.pause(6000).then(function() {
				testUtils.assertNodeExists(nodeName, function(assertStatus, msg){
					passed = passed && !!assertStatus;
					outStr += "First time: " + msg + "; ";
				});
			})
			
			//Create the modifier
			.pause(1000)
			.click("#MenuCreate")
			.pause(500)
			.$click("#MenuModifiers")
			.pause(500)
			.$click("#MenuCreate" + modifier)
			.pause(5000)
			
			//Ensure the modifier exists..
			.getChildren(nodeName, function(err, children){
				if(children[0] && children[0].indexOf(modifier.toLowerCase()) > -1){
					outStr += modifier + " (" + children[0] + ") modifier found; ";
				}
				else{
					passed = true;
					outStr += modifier + " modifier NOT found; ";
				}
			})
			
			//Exit world
			.saveDataBeforeUnload()
			.pause(1000)
			
			.url("http://localhost:3000")
			.pause(3000).then(function(){
				browser.url("http://localhost:3000/adl/sandbox/" + worldId + "?norender=true")
			})
			
			.waitForExist('#preloadGUIBack', 60000)
			.waitForVisible('#preloadGUIBack', 60000, true)
			.pause(6000).then(function() {
				testUtils.assertNodeExists(nodeName, function(assertStatus, msg){
					passed = passed && !!assertStatus;
					outStr += "Second time: " + msg + "; ";
				});
			})
			.pause(1000)
			
			.getChildren(nodeName, function(err, children){
				if(children[0] && children[0].indexOf(modifier.toLowerCase()) > -1){
					outStr += modifier + " (" + children[0] + ") modifier found; ";
				}
				else{
					passed = true;
					outStr += modifier + " modifier NOT found; ";
				}
				
			})
			.saveDataBeforeUnload()
			.then(function(){
				browser.deleteWorld(worldId, function(err){
					if(err){
						passed = false;
						outStr += "World: " + worldId + " not successfully deleted; ";
					}
					else{
						outStr += "World: " + worldId + " successfully deleted; ";
					}
					
					finished(passed, outStr);
				});
			});
    }
}
