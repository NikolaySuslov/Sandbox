var globalBase = "http://localhost:3000/adl/sandbox/";
var outArr = [];
module.exports = function(){ return outArr; };

var tests = [
	{ title: "Import Collada without animation", model: "gameboard.DAE", base: globalBase + "examples/collada/"},
	{ title: "Import Collada with animation", model: "usmale.dae", animation: true, i: 0},
	{ title: "Import 3DR JSON file", model: "house2.json", base: globalBase + "examples/3drjson/", i: 1},
	{ title: "Import glTF JSON file", model: "monster.json", base: globalBase + "examples/gltfAsset/", i: 2, animation: true}
];
		
for(var i = 0; i < tests.length; i++){
	outArr.push({
		title: tests[i].title, 
		test: 
			function(i){
				return function(browser, finished){
					runTest(browser, finished, tests[i]);
				}
			}(i)
	});
}

function runTest(browser, finished, test){
	global.browser = browser;
	var testUtils = global.testUtils;
	var outStr = "";
	var passed = true;
	var i = test.i !== undefined ? test.i : tests.indexOf(test);
	
	browser.loadBlankScene();

	//do not run nonexistent test when loading glTF JSON
	if(i != 2){
		loadModel("this_shouldnt_exist", test.base)
			.pause(1000)
			.hasViewNode("this_shouldnt_exist", function(err, exists){
				passed = passed && !exists;
				outStr += "Nonexistent model: " + exists + ", expected: false; ";
			})
			.getText("#alertify .alertify-message", function(err, msg){
				var success = msg.toLowerCase().indexOf("error") > -1;
				passed = passed && success;
				outStr += "Error message: "+success+", expected: true; ";
			})
			.click("#alertify-ok");
	}
	else{
		outStr += "WARNING: glTF JSON loading does NOT test importing nonexistent files; ";
	}
		
	loadModel(test.model, test.base)	
		.pause(6000).then(function() {
			testUtils.assertNodeExists(test.model, function(assertStatus, msg){
				passed = passed && !!assertStatus;
				outStr += msg + "; ";
			});
		})
		.pause(2000)
		.getProperty(test.model, "animationLength", function(err, obj){
			var length = obj.value;
			
			if(test.animation){
				passed = passed && length>0;
				outStr += "Animation: " + length + ", expected > 0; ";
			}
			else{
				passed = passed && length===0;
				outStr += "Animation: " + length + ", expected: 0; ";
			}
		})
		.hasViewNode(test.model, function(err, exists){
			passed = passed && exists;
			outStr += test.model + ": " + exists + ", expected: true; ";
			console.log('test finished');
			
			finished(passed, outStr);
		});
		
	function loadModel(modelName, base){
		return browser.nextGUID(modelName)
			.click("#MenuAssets")
			.pause(500)
			
			.click("#MenuCreateLoadMeshURL")
			
			.waitForExist("#choice" + i, 2000)
			.click("#choice" + i)
			
			.pause(1000)
			.waitForExist("#alertify-ok", 2000)
			.click("#alertify-ok")
			
			.waitForExist("#alertify-text", 2000)
			.setValue("#alertify-text", base ? base + modelName : globalBase + modelName)
			.click("#alertify-ok");
	}
}

