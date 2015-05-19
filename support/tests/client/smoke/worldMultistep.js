module.exports = {
    'Tests creating and deleting world and verifying persistence': function(browser, finished) {
        global.browser = browser;
        var testUtils = global.testUtils;
		var passed = true;
		var outStr = "";
		var worldId;
		
        browser
			.login(function(err, val){
				if(err){
					outStr += "Unable to log in; ";
					passed = false;
					//Exit test here...
				}
				else outStr += "Login successful; ";
			})
			
			//Create world
			.url("http://localhost:3000/adl/sandbox/createNew2/noTemplate")
			.waitForExist("#txtInstanceName", 5000)
			.setValue("#txtInstanceName", "worldMultistep.Test.Title")
			.click('input[type="submit"]').pause(1000)
			
			//Once created, get world id
			.waitForExist("#content", 5000)
			.url(function(err, url){
				var tempArr = url.value.split('/');
				worldId = tempArr[tempArr.length-1];
				
				//navigate to newly created world using id
				browser.url("http://localhost:3000/adl/sandbox/" + worldId + "?norender=true")
			})
			
			.waitForExist('#preloadGUIBack', 60000)
			.waitForVisible('#preloadGUIBack', 60000, true)
			
			.nextGUID("testWorldPrim")
			.$click("#MenuCreateSphereicon")
			.pause(6000).then(function() {
				testUtils.assertNodeExists("testWorldPrim", function(assertStatus, msg){
					passed = passed && !!assertStatus;
					outStr += "First time: " + msg + "; ";
				});
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
				testUtils.assertNodeExists("testWorldPrim", function(assertStatus, msg){
					passed = passed && !!assertStatus;
					outStr += "Second time: " + msg + "; ";
				});
			})
			
			.saveDataBeforeUnload()
			.pause(1000).then(function(){
				//Go straight to the delete page because we can safely assume that
				//the existence of the world has already been tested above
				browser.url("http://localhost:3000/adl/sandbox/remove?id=" + worldId)	
			})
	
			.waitForExist("input[value='Delete']", 5000)
			.click("input[value='Delete']")
			.pause(1000).then(function(){
				//World should be deleted, attempt to navigate to deleted world page
				browser.url("http://localhost:3000/adl/sandbox/world/" + worldId)
			})
			.pause(2000)
			.url(function(err, url){
				//if worldId is in the url, we were not redirected to homepage
				if(url.value.indexOf(worldId) > 0){
					passed = false;
					outStr += "World: " + worldId + " not successfully deleted; ";
				}
				else{
					outStr += "World: " + worldId + " successfully deleted; ";
				}
				
				finished(passed, outStr);
			});			
    }
}
