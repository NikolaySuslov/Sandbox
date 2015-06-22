module.exports = {
    'Simulate physics with two spheres': function(browser, finished) {
        global.browser = browser;
        var testUtils = global.testUtils;
		var passed = true;
		var outStr = "";
		var minDist = 2;
		
		var initial1 = [];
		var initial2 = [];
		
        browser.loadBlankScene();
		
		addSphere("testSphere1", initial1, -0.5, 0, 15);
		addSphere("testSphere2", initial2, 0.5, 0, 5);
		
		browser
			.setProperty("testSphere1", "___physics_enabled", true)
			.setProperty("testSphere2", "___physics_enabled", true)
			.click("#playButton")
			.pause(5000)
			.getProperty("testSphere1", "transform", function(err, prop){
				checkDistance("testSphere1", initial1, prop.value);
			})
			.getProperty("testSphere2", "transform", function(err, prop){
				checkDistance("testSphere2", initial2, prop.value);
				console.log('test finished')
				finished(passed, outStr);
			});
		
		function checkDistance(name, initial, transform){
			var dist = Math.round(testUtils.getDistance(initial.slice(12, 15), transform.slice(12, 15))* 100) / 100;
			if(dist > minDist) outStr += " " + name + " traveled: " + dist + " > min " + minDist + "; ";
			else{
				passed = false;
				outStr += " " + name + " traveled: " + dist + " <= min " + minDist + "; ";
			}
		}
		
		function addSphere(name, outArr, deltaX, deltaY, deltaZ){
			browser.nextGUID(name)
			.$click("#MenuCreateSphereicon")
			.pause(6000).then(function(){
				testUtils.assertNodeExists(name, function(assertStatus, msg){
					outStr += msg + ";";
					passed = passed && !!assertStatus;
				});
			})
			.getProperty(name, "transform", function(err, prop){
				outArr.push.apply(outArr, prop.value);
				outArr[12] = deltaX;
				outArr[13] = deltaY;
				outArr[14] = deltaZ;
			})
			.setProperty(name, "transform", outArr);
		};
    }
}
