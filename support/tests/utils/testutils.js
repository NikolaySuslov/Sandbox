var async = require("async");

module.exports.USER = "joe";
module.exports.PASS = "Abc123456";
module.exports.INFO = parseInt("001", 2);
module.exports.WARNING = parseInt("010", 2);
module.exports.SEVERE = parseInt("100", 2);

module.exports.hookupUtils = function(browser) {
	console.log('hook up utils');

	browser.addCommand("login", function(cb) {
		module.exports.login(cb);
	});
	browser.addCommand("loadBlankScene", function(cb) {
		module.exports.loadBlankScene(cb)
	});
	browser.addCommand("nextGUID", function(GUID,cb) {
		browser.execute(function(id) {
			window.GUID.nextGUID = id;
		}, GUID,function(err,r){
			cb()
		})
	});
	browser.addCommand("createNode", function(nodeDef) {
		var cb = arguments[arguments.length -1]
		browser.execute(function(node) {

            var name = GUID();
            vwf_view.kernel.createChild(vwf.application(), name, node);
            return name;
        }, nodeDef, function(err, nodename) {
            console.log('wait for node ' + nodename.value)
            module.exports.waitForNode(nodename.value, 10000, function(node) {
                if (!node)
                    throw (new Error('Node not created'))
                cb(null,nodename.value);
            })
        })
    });
    browser.addCommand("getNode", function(nodename, cb) {
        
        //var cb = arguments[arguments.length -1]
        module.exports.waitForNode(nodename, 10000, function(node) {
            if (!node)
                throw (new Error('Node not created'))
            cb(null,node);
        })
    });
    browser.addCommand("getProperty", function(newnodename, propname) {
        
        var cb = arguments[arguments.length -1]
        browser.execute(function(a,b) {
            var id = vwf.find(vwf.application(), a)[0];
			if(!id) id = a;
        	return vwf.getProperty("" + id,b);
        }, newnodename,propname,function(err, r)
        {
        	
        	cb(null,r)
        });
    });
    browser.addCommand("setProperty", function(newnodename, propname, value) {
        
        var cb = arguments[arguments.length -1]
        browser.execute(function(a,b,c) {
            var id = vwf.find(vwf.application(), a)[0];
			if(!id) id = a;
        	return vwf_view.kernel.setProperty("" + id,b,c);
        }, newnodename,propname,value,function(err, r)
        {
        	cb(null,r.value)
        });
    });
    browser.addCommand("deleteNode", function(newnodename) {
        
        var cb = arguments[arguments.length -1]
        browser.execute(function(a) {
            var id = vwf.find(vwf.application(), a)[0];
			if(!id) id = a;
        	return vwf_view.kernel.deleteChild(vwf.application(),"" + id);
        }, newnodename,function(err, r)
        {
        	cb(null,r.value)
        });
    });
	browser.addCommand("$click", function(cssSelector) {
		var cb = arguments[arguments.length -1];
		browser.execute(function(a) {
			return $(a).click();
		}, cssSelector,function(err, jqObj)
		{
			cb(null, jqObj);
		});
	});	
	browser.addCommand("$keydown", function(cssSelector, key) {
		var cb = arguments[arguments.length -1];
        browser.execute(function(c, k) {
			var e = $.Event("keydown");
			e.which = e.keyCode = k.charCodeAt(0);
        	return $(c).trigger(e);
        }, cssSelector, key, function(err, jqObj)
        {
        	cb(null, jqObj);
        });
	});
	browser.addCommand("$keyup", function(cssSelector, key) {
		var cb = arguments[arguments.length -1];
        browser.execute(function(c, k) {
			var e = $.Event("keyup");
			e.which = e.keyCode = k.charCodeAt(0);
        	return $(c).trigger(e);
        }, cssSelector, key, function(err, jqObj)
        {
        	cb(null, jqObj);
        });
	});
	browser.addCommand("$keypress", function(cssSelector, key) {
		var cb = arguments[arguments.length -1];
        browser.execute(function(c, k) {
			var e = $.Event("keypress");
			e.which = e.keyCode = k.charCodeAt(0);
			return $(c).trigger(e);
		}, cssSelector, key, function(err, jqObj)
		{
			cb(null, jqObj);
		});
	});
	browser.addCommand("saveDataBeforeUnload", function(){
		var cb = arguments[arguments.length -1];
        browser.execute(function(){
			window.onbeforeunload = function(){};
			if(_UserManager.GetCurrentUserName() && _DataManager.getInstanceData().publishSettings.persistence){
				_DataManager.saveToServer(true);
				return true;
			}
			
			return false;
		}, function(err, didSave)
		{
			cb(null, didSave);
		});
	});	
	browser.addCommand("hasViewNode", function(nodeName) {

		var cb = arguments[arguments.length -1];
        browser.execute(function(a) {
			try{
				var id = vwf.find(vwf.application(), a)[0];
				if(!id) id = a;
				return findviewnode(id).children[0].children[0] ? true : false;
			} 
			catch(e){
				return false;
			}
        }, nodeName, function(err, viewNode)
        {
        	cb(err, viewNode.value);
        });
	});		
	browser.addCommand("getChildren", function(nodeName) {
		var cb = arguments[arguments.length -1];
		browser.execute(function(name){
			var id = vwf.find(vwf.application(), name)[0];
			if(!id) id = name;
			return vwf.children(id);
		}, nodeName, function(err, children){
			cb(err, children.value);
		});
	});	
	browser.addCommand("getConsoleLog", function(level, contains) {
		if(typeof contains === "string"){
			var cb = arguments[arguments.length -1];
			module.exports.getConsoleLog(level, contains, cb);
		}
		else{
			var cb = contains;
			module.exports.getConsoleLog(level, '', cb);
		}
	});
	browser.addCommand("completeTest", function(status, message, finished) {
		module.exports.completeTest(status, message, finished);
	});	
	
	browser.addCommand("createWorld", function(){
		var cb = arguments[arguments.length -1];
		
		//Create world
		browser.url("http://localhost:3000/adl/sandbox/createNew2/noTemplate")
			.waitForExist("#txtInstanceName", 5000)
			.setValue("#txtInstanceName", "worldMultistep.Test.Title")
			.click('input[type="submit"]').pause(1000)
			
			//Once created, get world id
			.waitForExist("#content", 5000)
			.url(function(err, url){
				var tempArr = url.value.split('/');
				worldId = tempArr[tempArr.length-1];
				
				if(worldId) cb(null, worldId);
				else cb(true, worldId);
			})
	});	
	
	browser.addCommand("deleteWorld", function(worldId){
		var cb = arguments[arguments.length -1];
		
		browser.url("http://localhost:3000/adl/sandbox/remove?id=" + worldId)
			.waitForExist("input[value='Delete']", 5000)
			.click("input[value='Delete']")
			.pause(1000)
			
			//World should be deleted, attempt to navigate to deleted world page
			.url("http://localhost:3000/adl/sandbox/world/" + worldId)
			
			.pause(2000)
			.url(function(err, url){
				//if worldId is in the url, we were not redirected to homepage
				var err = url.value.indexOf(worldId) >= 0;
				cb(err);
			});	
	});	
	
	browser.addCommand("isNodeSelected", function(nodename) {
        var cb = arguments[arguments.length -1]
        browser.execute(function(a) {
            var id = vwf.find(vwf.application(), a)[0];
			if(!id) id = a;
        	return _Editor.isSelected("" + id);
        }, nodename,function(err, r)
        {
        	
        	cb(err, r.value)
        });
    });
	browser.addCommand("selectNodes", function(nodename) {
		
		var cb = arguments[arguments.length -1]
		browser.execute(function(a) {
			var isSelected = true;
			var ids = [];
			for(var i = 0; i < a.length; i++) {
				ids.push(vwf.find(vwf.application(), a[i])[0]);
				
			}
			_Editor.SelectObjectPublic(ids);
			for(i = 0; i < ids.length; i++) {
				
				isSelected = isSelected && _Editor.isSelected("" + ids[i]);
			}
			return isSelected;
		}, nodename,function(err, r)
		{
			
			cb(err, r ? r.value: null)
		});
	});
	browser.addCommand("selectNodesWithID", function(nodename) {
		
		var cb = arguments[arguments.length -1]
		browser.execute(function(a) {
			var isSelected = true;
			var ids = [];
			for(var i = 0; i < a.length; i++) {
				// ids.push(vwf.find(vwf.application(), a[i])[0]);
				ids.push(a[i])
			}
			
			_Editor.SelectObjectPublic(ids);
			for(i = 0; i < ids.length; i++) {
				
				isSelected = isSelected && _Editor.isSelected("" + ids[i]);
			}
			return isSelected;
		}, nodename,function(err, r)
		{
			
			cb(err, r ? r.value: null)
		});
	});
	browser.addCommand("getSelectedNodes", function(nodename) {
		
		var cb = arguments[arguments.length -1]
		browser.execute(function() {
			
			var nodes = [];
			for(var i = 0; true; i++) {
				var temp = _Editor.GetSelectedVWFNode(i);
				if (temp) {
					nodes.push(temp);
				} else {
					break;
				}
			}
			
			return nodes;
			

        }, nodename,function(err, r)
        {
        	
        	cb(null,r.value)
        });
    });
	
	browser.addCommand("getUUID", function(nodename) {
        var cb = arguments[arguments.length -1];
        browser.execute(function(a) {
            var id = vwf.find(vwf.application(), a)[0];
			if(!id) id = a;
			return _Editor.findviewnode(id).children[0].children[0].uuid;
        }, nodename,function(err, r)
        {
        	cb(err, r ? r.value : null);
        });
    });
}

module.exports.completeTest = function(finished) {
	return function(status, message, debug){
		browser.getConsoleLog(module.exports.SEVERE, function(err, logs){
			var regex = /4[0-9][0-9] \([a-zA-Z ]+\)/;
			for(var i = logs.length - 1; i >= 0; i--){
				if(regex.test(logs[i])){
					//this is very likely a status code... remove it and continue
					logs.splice(i, 1);
				}
			}
			
			//Dont' modify the message and status if in debug mode
			if(logs.length > 0 && !debug){
				message += "Severe error(s) found in browser log: " + JSON.stringify(logs);
				status = false;
			}
			
			finished(status, message);
		});
	}
}

module.exports.getConsoleLog = function(level, contains, cb){
	var regexStr = "";
	if((level & module.exports.INFO) > 0) regexStr = "INFO";
	if((level & module.exports.WARNING) > 0) regexStr = regexStr ? regexStr + "|WARNING" : "WARNING";
	if((level & module.exports.SEVERE) > 0) regexStr = regexStr ? regexStr + "|SEVERE" : "SEVERE";
	
	var regex = new RegExp(regexStr);
	browser.log("browser", function(err, logs){
		var outArr = [];
		for(var i = 0; i < logs.value.length; i++){
			if(regex.test(logs.value[i].level)) outArr.push(logs.value[i].message);
		}
		
		cb(null, outArr);
	});
}

module.exports.login = function(cb){
	browser
		.url('http://localhost:3000/adl/sandbox/')
		.waitForExist("#logina", 1500, function(err, value){
			console.log("This is the value: " + value);
			if(!err){
				browser.url('http://localhost:3000/adl/sandbox/login')
					.waitForExist('#txtusername')
					.click('#txtusername').keys(module.exports.USER)
					.click('#txtpassword').keys(module.exports.PASS).pause(1000)
					.click('input[type="submit"]').pause(1000)
					.url(function(err, url){
						if (url.value == 'http://localhost:3000/adl/sandbox/')
						{
							cb(false, module.exports.USER)
							return;
						}
						else
						{
							browser.getText(".help-block")
							.then(function(text)
							{
								console.log('Title was: ' + text);
								cb(true, text);
							})
						}
					});
			}
			else cb(false, module.exports.USER);
		});
};
module.exports.loadBlankScene = function(cb) {
	browser
		.url('http://localhost:3000/adl/sandbox/example_blank/?norender=true')
		//.url('http://localhost:3000/adl/sandbox/example_blank/')
		.waitForExist('#preloadGUIBack', 60000)
		.waitForVisible('#preloadGUIBack', 60000, true)
		.pause(3000).then(cb);


}
module.exports.nextGUID = function(GUID) {
	browser.execute(function(id) {
		window.GUID.nextGUID = id;
	}, GUID);
}
module.exports.waitForNode = function(name, timeout, done) {
	timeout = timeout || 500;
	var t0 = Date.now();
	var result
	
	function loop() {
		if (!result && Date.now() - t0 < timeout) {
			browser.execute(getNode, name, function(err, r) {
				result = r && r.value;
			});
			global.setTimeout(loop, 500);
		}
		else{
			done(result);
		}
	};

	global.setTimeout(loop, 500);
}

module.exports.getDistance = function(arr1, arr2){
	for(var i = 0; i < arr1.length; i++){
		arr1[i] = (arr1[i]-arr2[i])*(arr1[i]-arr2[i]);
	}

	return Math.sqrt(arr1.reduce(function(a, b){
		return a + b;
	}));
}

function getNode(name) {
	try {
		//adding "" is just to ensure that id is a String
		var id = vwf.find(vwf.application(), name)[0];
		return vwf.getNode("" + id,true);
	} catch (e) {
		return null;
	}
}

module.exports.assertNodeExists = function(name, assert) {
	this.waitForNode(name, 6500, function(node) {
		console.log(JSON.stringify(node))
		if (node) {
			assert(true, JSON.stringify(node.id));
		} else
			assert(false, "timeout waiting on node creation");
	});
}

module.exports.GUID = function(){
	
	var S4 = function() {
		return Math.floor(Math.random() * 0x10000 /* 65536 */ ).toString(16);
	};
	//can we generate nicer GUID? does it really have to be so long?
	return 'N'+S4()+S4();
	return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}
