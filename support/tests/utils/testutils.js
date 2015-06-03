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
	browser.addCommand("hasViewNode", function(nodeName, treatAsId) {
		var cb = arguments[arguments.length -1];
        browser.execute(function(a, b) {
			try{
				a = b ? a : vwf.find(vwf.application(), a)[0];
				return findviewnode(a).children[0].children[0] ? true : false;
			} 
			catch(e){
				return false;
			}
        }, nodeName, treatAsId, function(err, viewNode)
        {
        	cb(err, viewNode.value);
        });
	});		
	browser.addCommand("getChildren", function(nodeName) {
		var cb = arguments[arguments.length -1];
		browser.execute(function(name){
			var id = vwf.find(vwf.application(), name)[0];
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
		browser.getConsoleLog(module.exports.SEVERE, function(err, logs){
			
			finished(status, message);
		});
	});	
	
	
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
        //.url('http://localhost:3000/adl/sandbox/example_blank/?norender=true')
        .url('http://localhost:3000/adl/sandbox/example_blank/')
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