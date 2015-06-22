module.exports = {
    'Tests creating multiple modifiers': function(browser, finished) {
        global.browser = browser;
        var testUtils = global.testUtils;
		var passed = true;
		var outStr = "";
		var worldId;
		var oldUUID = "";
		var secondUUID = "";
		
		var nodeName = "testWorldPrim";
		var modifiers = [{name: "Bend", vwf: ""}, {name: "Twist", vwf: ""}];
		
        browser
			.loadBlankScene()
			
			.waitForExist('#preloadGUIBack', 60000)
			.waitForVisible('#preloadGUIBack', 60000, true)
			
			//Create sphere
			.nextGUID(nodeName)
			.$click("#MenuCreateSphereicon")
			.pause(6000).then(function() {
				testUtils.assertNodeExists(nodeName, function(assertStatus, msg){
					passed = passed && !!assertStatus;
					outStr += msg + " exists; ";
				});
			})
			
			//Get the original UUID
			.pause(1000)
			.getUUID(nodeName, function(err, uuid){
				if(err || !uuid){
					passed = false;
					outStr += "Prim UUID not found; ";
				}
				else oldUUID = uuid;	
			})
			
			//Create the Bend modifier
			.then(function(){
				return addModifier(modifiers[0].name);
			})			
			.pause(1000)
			
			//Ensure that the first modifier exists and is a child of the prim..
			.getChildren(nodeName, function(err, children){
				var i = 0;
				if(children && children[0] && children[0].indexOf(modifiers[i].name.toLowerCase()) > -1){
					
					modifiers[i].vwf = children[0];
					outStr += modifiers[i].name + " (" + children[0] + ") modifier found; ";
				}
				else{
					passed = false;
					outStr += modifiers[i].name + " modifier NOT found; ";
				}
			})
			
			//Adjust the bend amount
			.then(function(){
				return browser.setProperty(modifiers[0].vwf, "amount", 1);
			})
			.pause(1000)
			
			//The prim should now have a new UUID..
			.getUUID(nodeName, function(err, uuid){
				if(err || !uuid){
					passed = false;
					outStr += "Prim UUID not found; ";
				}
				else if(uuid == oldUUID){
					passed = false;
					outStr += "Prim UUID not changed after " + modifiers[0].name + "; ";
				}
				else{
					secondUUID = uuid;	
					outStr += "UUID successfully changed after " + modifiers[0].name + "; ";
				}					
			})
			
			//Create the Twist modifier
			.then(function(){
				return addModifier(modifiers[1].name);
			})
			.pause(1000)
			
			//Ensure that the second modifier exists and is a child of the first modifier
			.then(function(){
				return browser.getChildren(modifiers[0].vwf, function(err, children){
					var i = 1;
					if(children && children[0] && children[0].indexOf(modifiers[i].name.toLowerCase()) > -1){
						
						modifiers[i].vwf = children[0];
						outStr += modifiers[i].name + " (" + children[0] + ") modifier found; ";
					}
					else{
						passed = false;
						outStr += modifiers[i].name + " modifier NOT found; ";
					}
				});
			})
			.pause(1000)
			
			//Adjust the twist amount
			.then(function(){
				return browser.setProperty(modifiers[1].vwf, "amount", 1);
			})
			.pause(1000)
			
			//The prim should now have a new UUID (again)..
			.getUUID(nodeName, function(err, uuid){
				if(err || !uuid){
					passed = false;
					outStr += "Prim UUID not found; ";
				}
				else if(uuid == oldUUID || uuid == secondUUID){
					passed = false;
					outStr += "Prim UUID not changed after " + modifiers[1].name + "; ";
				}
				else{ 
					outStr += "UUID successfully changed after " + modifiers[1].name + "; ";
				}

				finished(passed, outStr);					
			});
			
		function addModifier(modifier){
			return browser
				.nextGUID(modifier)
				.$click("#MenuCreate")
				.pause(500)
				.$click("#MenuModifiers")
				.pause(500)
				.$click("#MenuCreate" + modifier)
				.pause(500);
		}
    }
}
