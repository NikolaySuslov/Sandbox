var globalBase = "http://localhost:3000/adl/sandbox/";
var outArr = [];
module.exports = function(){ return outArr; };

var modifiers = ["Bend", "Twist", "Taper", "PerlinNoise", "SimplexNoise", "Offset", "Stretch", "Push", "UVMap", "CenterPivot", "Extrude", "PathExtrude", "Lathe"];
		
for(var i = 0; i < modifiers.length; i++){
	outArr.push({
		title: "Test creation and deletion of " + modifiers[i] + " modifier", 
		test: 
			function(i){
				return function(browser, finished){
					runAssetTest(browser, finished, modifiers[i]);
				}
			}(i)
	});
}

function runAssetTest(browser, finished, nodeName){
	global.browser = browser;
	var testUtils = global.testUtils;
	var outStr = "";
	var passed = true;
	var i = modifiers.indexOf(nodeName);
	var currentModifierID = "";
	
	browser.loadBlankScene();
		
	loadModel(nodeName)	
		.pause(6000).then(function() {
			testUtils.assertNodeExists(nodeName, function(assertStatus, msg){
				passed = passed && !!assertStatus;
				outStr += msg + "; ";
			});
		})
		.pause(2000);
		
	addModifier(i)		
		.getConsoleLog(testUtils.SEVERE, function(err, arr){
			outStr += "Log error: " + JSON.stringify(err) + ", Log message: " + JSON.stringify(arr) + " ";
		})
		.pause(5000)
		.getChildren(nodeName, function(err, children){
			if(children[0] && children[0].indexOf(modifiers[i].toLowerCase()) > -1){
				outStr += modifiers[i] + " (" + children[0] + ") modifier found; ";
			}
			else{
				passed = true;
				outStr += modifiers[i] + " modifier NOT found; ";
			}
			
			currentModifierID = children[0];
		});
		
	deleteModifier()
		.getChildren(nodeName, function(err, children){
			if(children[0] && children[0].indexOf(modifiers[i].toLowerCase()) > -1){
				outStr += modifiers[i] + " (" + children[0] + ") NOT deleted; ";
				passed = false;
			}
			else{
				outStr += modifiers[i] + " modifier successfully deleted; ";
			}
			finished(passed, outStr);
		});
		
	function deleteModifier(){
		return browser.click("#SideTabShow")
			.pause(500)
			.click("#editorPanelPrimitiveEditortitle")
			.pause(500)
			.then(function(){
				return browser.$click("#basicSettings" + currentModifierID + " span:contains(Delete)");
			})
			.pause(2000);
	}
	
	function addModifier(i){
		return browser.click("#MenuCreate")
			.pause(500)
			.click("#MenuModifiers")
			.pause(500)
			.click("#MenuCreate" + modifiers[i])
			.pause(500);
	}
		
	function loadModel(modelName){
		return browser.nextGUID(modelName)
			.$click("#MenuCreateCylindericon")
			.pause(500);
	}
}

