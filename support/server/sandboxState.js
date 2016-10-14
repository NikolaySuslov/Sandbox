var DAL = require('./DAL')
    .DAL;
var fs = require('fs');
var YAML = require('js-yaml');
var GUID = require('node-uuid').v4;
var URL = require('url');
var request = require('request');
var extend = require("extend");
var logger = require('./logger');
var now = require("performance-now");

function objectDiff(obj1, obj2, noRecurse, stringCompare)
            {
                var delta = {};
                if (obj1 != obj2 && typeof obj1 == typeof obj2 && typeof obj1 == "number")
                    return obj1
                if (typeof obj1 !== typeof obj2)
                    return obj1;
                if (obj2 == null && obj1)
                    return obj1
                if (obj1 == null && obj2)
                    return obj1;
                if (obj2 == null && obj1 == null)
                    return obj1;
                if (stringCompare)
                {
                    if (JSON.stringify(obj1) !== JSON.stringify(obj2))
                        return obj1;
                }
                if (obj1.constructor != obj2.constructor)
                    return obj1;
                if (obj1.constructor == String)
                {
                    if (obj1 == obj2)
                        return undefined;
                    else
                        return obj1;
                }
                if (obj1.constructor == Array)
                {
                    var diff = false;
                    var ret = obj1.slice(0);
                    if (obj1.length !== obj2.length)
                        return obj1;
                    for (var i in obj1)
                    {
                        var ret2 = undefined;
                        if (!noRecurse) //do the full walk
                            ret2 = objectDiff(obj1[i], obj2[i], false, false)
                        else
                        {
                            //do a simple compare
                            ret2 = objectDiff(obj1[i], obj2[i], true, true)
                        }
                        if (ret2)
                        {
                            diff = true;
                            ret[i] = ret2;
                        }
                    }
                    if (diff)
                        return ret;
                }
                for (var i in obj1)
                {
                    //don't deep compare properties - they are either changed or not, can't be patched
                    if (i == 'properties')
                    {
                        var ret = objectDiff(obj1[i], obj2[i], true, false)
                        if (ret)
                            delta[i] = ret;
                    }
                    else if (obj2.hasOwnProperty(i))
                    {
                        var ret = undefined;
                        if (!noRecurse) //do the full walk
                            ret = objectDiff(obj1[i], obj2[i], false, false)
                        else
                            ret = objectDiff(obj1[i], obj2[i], true, true)
                        if (ret)
                            delta[i] = ret;
                    }
                    else
                    {
                        delta[i] = obj1[i];
                    }
                }
                if (Object.keys(delta).length > 0)
                    return delta;
                return undefined;
            }

//change up the ID of the loaded scene so that they match what the client will have
var fixIDs = function(node)
    {
        if (node.children)
            var childnames = {};
        for (var i in node.children)
        {
            childnames[i] = null;
        }
        for (var i in childnames)
        {
            var childComponent = node.children[i];
            var childName = childComponent.name || i;
            var childID = childComponent.id || childComponent.uri || (childComponent["continues"] || childComponent["extends"]) + "." + childName.replace(/ /g, '-');
            childID = childID.replace(/[^0-9A-Za-z_]+/g, "-");
            childComponent.id = childID;
            node.children[childID] = childComponent;
            node.children[childID].parent = node;
            childComponent.name = childName;
            delete node.children[i];
            fixIDs(childComponent);
        }
    }
    //Check that a user has permission on a node

function checkOwner(node, name)
{
    var level = 0;
    if (!node.properties) node.properties = {};
    if (!node.properties.permission) node.properties.permission = {}
    var permission = node.properties['permission'];
    var owner = node.properties['owner'];
    if (owner == name)
    {
        level = Infinity;
        return level;
    }
    if (permission)
    {
        level = Math.max(level ? level : 0, permission[name] ? permission[name] : 0, permission['Everyone'] ? permission['Everyone'] : 0);
    }
    var parent = node.parent;
    if (parent)
        level = Math.max(level ? level : 0, checkOwner(parent, name));
    return level ? level : 0;
}

function DBstateToVWFDef(state, instanceData, cb)
{
    var state2 = JSON.parse(JSON.stringify(state));
    fs.readFile("./public" + "/adl/sandbox" + "/index.vwf.yaml", 'utf8', function(err, blankscene)
    {
        var err = null;
        try
        {
            blankscene = YAML.load(blankscene);
            blankscene.id = 'index-vwf';
            blankscene.patches = "index.vwf";
            if (!blankscene.children)
                blankscene.children = {};
            //only really doing this to keep track of the ownership
            for (var i = 0; i < state.length - 1; i++)
            {
                var childComponent = state[i];
                var childName = (state[i].name || state[i].properties.DisplayName) || i;
                var childID = childComponent.id || childComponent.uri || (childComponent["continues"] || childComponent["extends"]) + "." + childName.replace(/ /g, '-');
                childID = childID.replace(/[^0-9A-Za-z_]+/g, "-");
                //state[i].id = childID;
                //state2[i].id = childID;
                blankscene.children[childName] = state2[i];
                state[i].id = childID;
                fixIDs(state[i]);
            }
            var props = state[state.length - 1];
            if (props)
            {
                if (!blankscene.properties)
                    blankscene.properties = {};
                for (var i in props)
                {
                    blankscene.properties[i] = props[i];
                }
                for (var i in blankscene.properties)
                {
                    if (blankscene.properties[i] && blankscene.properties[i].value)
                        blankscene.properties[i] = blankscene.properties[i].value;
                    else if (blankscene.properties[i] && (blankscene.properties[i].get || blankscene.properties[i].set))
                        delete blankscene.properties[i];
                }
                //don't allow the clients to persist between a save/load cycle
                blankscene.properties['clients'] = null;
                if (instanceData && instanceData.publishSettings && instanceData.publishSettings.startPaused == false)
                {
                    blankscene.properties['playMode'] = 'play';
                }
                else
                    blankscene.properties['playMode'] = 'stop';
            }
        }
        catch (e)
        {
            err = e;
        }
        if (err)
            cb(null);
        else
            cb(blankscene);
    });
}
var sandboxState = function(id, metadata, world)
{
    this.events = {};
    this.id = id;
    this.metadata = metadata;
    this.world = world;
    this.nodes = {};
    if (!this.metadata.publishSettings)
    {
        this.metadata.publishSettings = {
            allowAnonymous: false,
            createAvatar: false,
            singlePlayer: false,
            persistence: true,
            camera: null
        }
    }
    this.on = function(name, callback)
    {
        if (!this.events[name])
            this.events[name] = [];
        this.events[name].push(callback)
    }
    this.removeListener = function(name, callback)
    {
        if (!this.events[name]) return;
        var index = this.events[name].indexOf(callback)
        if (index != -1)
            this.events[name].splice(index, 1);
    }
    this.trigger = function(name, e)
    {
        if (!this.events[name]) return;
        for (var i = 0; i < this.events[name].length; i++)
            this.events[name][i].apply(this, [e]);
    }
    
    this.setup = function(state)
    {
        this.nodes['index-vwf'] = {
            id: "index-vwf",
            properties: state[state.length - 1],
            children:
            {}
        };
        //only really doing this to keep track of the ownership
        for (var i = 0; i < state.length - 1; i++)
        {
            var childID = state[i].id;
            this.nodes['index-vwf'].children[childID] = state[i];
            this.nodes['index-vwf'].children[childID].parent = this.nodes['index-vwf'];
        }
    }
    this.continuesDefs = {};
    this.cleanChildNames = function(node, childID)
    {
        if (node.children)
            for (var i in node.children)
                this.cleanChildNames(node.children[i], childID)
        if (node.children)
        {
            var keys = Object.keys(node.children)
            for (var i = 0; i < keys.length; i++)
            {
                var oldName = keys[i];
                var child = node.children[oldName];
                delete node.children[oldName];
                node.children[childID + oldName] = child
            }
        }
    }
    this.extendWithContinuesBase = function(node, name, cb)
    {
        var base = this.continuesDefs[node.continues];
        base = JSON.parse(JSON.stringify(base));
        this.cleanChildNames(base, this.getID(name, node));
        this.continuesDefs[node.continues + this.getID(name, node)] = JSON.parse(JSON.stringify(base));
        extend(true, base, node);
        node = base;
        cb(node);
    }
    this.resolveContinues = function(node, name, cb)
    {
        var self = this;
        var childID = this.getID(name, node);
        async.series([

            function resolveThisNode(cb2)
            {
                if (node.continues)
                {
                    var url = URL.parse(node.continues);
                    if (!url.protocol) // the url is relative
                    {
                        url = URL.resolve("http://localhost:" + global.configuration.port + "/" +
                            self.id + "/" + global.appPath, url);
                        //logger.warn("continues base url is " + url);
                    }
                    else
                        url = node.continues;
                    if (!self.continuesDefs[node.continues])
                    {
                        request.get(url, function(err, response, body)
                        {
                            try
                            {
                                //logger.warn(body);
                                var continuesbase = JSON.parse(body);
                                self.continuesDefs[node.continues] = continuesbase;
                                //logger.warn(node.continues, continuesbase);
                            }
                            catch (e)
                            {
                                //logger.error(e + " during fetch of continues base url")
                                cb2();
                                return;
                            }
                            self.extendWithContinuesBase(node, name, function(newNode)
                            {
                                node = newNode;
                                cb2();
                            })
                        }).on('error', function(e)
                        {
                            cb2();
                        });
                    }
                    else
                    {
                        self.extendWithContinuesBase(node, name, function(newNode)
                        {
                            node = newNode;
                            cb2();
                        })
                    }
                }
                else
                {
                    cb2();
                }
            },
            function resolveAllChildren(cb2)
            {
                async.eachSeries(Object.keys(node.children ||
                {}), function eachChild(child, cb3)
                {
                    self.resolveContinues(node.children[child], child, function(newNode)
                    {
                        node.children[child] = newNode;
                        cb3();
                    });
                }, function doneAllChildren(err)
                {
                    cb2();
                })
            }
        ], function thisNodeResolved(err)
        {
            cb(node);
        })
    }
    this.deResolveContinues = function(node) {}
    this.Log = function(log) {}
    this.Error = function(error)
    {
        logger.error(error)
    }
    this.getVWFDef = function()
    {
        return this.VWFDef;
    }
    this.setVWFDef = function(newDef)
    {
        this.VWFDef = newDef;
    }
    this.parent = function(nodeID)
    {
        var root = this.findNode(nodeID);
        if (!root) return null;
        return root.parent ? root.parent.id : 0;
    }
    this.ancestors = function(nodeID, list)
    {
        if (!list) list = [];
        var root = this.findNode(nodeID);
        if (!root) return [];
        if (root.parent)
        {
            list.unshift(root.parent.id);
            return this.ancestors(root.parent.id, list)
        }
        else return list;
    }
    this.children = function(nodeid)
    {
        var root = this.findNode(nodeid);
        var list = [];
        if (!root || !root.children) return list;
        for (var i in root.children)
        {
            list.push(root.children[i].id);
        }
        return list;
    }
    this.decendants = function(nodeid)
    {
        var root = this.findNode(nodeid);
        var list = [];

        function walk(node)
        {
            for (var i in node.children)
            {
                list.push(node.children[i].id)
                walk(node.children[i]);
            }
        }
        walk(root);
        return list;
    }
    this.findNode = function(id, parent)
    {
        var ret = null;
        if (!parent) parent = this.nodes['index-vwf'];
        if (!parent) return null;
        if (parent.id == id)
            ret = parent;
        else if (parent.children)
        {
            for (var i in parent.children)
            {
                ret = this.findNode(id, parent.children[i]);
                if (ret) return ret;
            }
        }
        return ret;
    }
    this.deletedNode = function(id, parent)
    {
        logger.warn("deleting " + id);

        var node = this.findNode(id);
        if (!node) return;
        if (!parent) parent = node.parent;

        if (!parent) return;
        
        if (parent.children)
        {
            for (var i in parent.children)
            {
                if (i == id)
                {
                    delete parent.children[i];
                    logger.warn("deleted " + id);
                    return
                }
            }
        }
    }
    this.reattachParents = function(node)
    {
        if (node && node.children)
        {
            for (var i in node.children)
            {
                node.children[i].parent = node;
                this.reattachParents(node.children[i]);
            }
        }
    }
    this.getProperty = function(nodeID, prop)
    {
        var node = this.findNode(nodeID);
        if (!node)
            return;
        var val = node.properties[prop];
        return val;
    }
    this.satProperty = function(nodeid, prop, val)
    {
        //We need to keep track internally of the properties
        //mostly just to check that the user has not messed with the ownership manually
        var node = this.findNode(nodeid);
        if (!node) return;
        if (!node.properties)
            node.properties = {};
        node.properties[prop] = val;

    }
    this.setProperty = function(nodeid, prop, val)
    {
        this.satProperty(nodeid, prop, val)
        var message = {
            action: "setProperty",
            node: nodeid,
            member: prop,
            parameters: [val]
        };
        this.world.messageClients(message, false, false);
    }
    this.validate = function(type, nodeID, client)
    {
        var node = this.findNode(nodeID);
        if (!node)
        {
            //console.log('server has no record of ' + nodeID + ' ' + type, 1);
            return true;
        }
        if (this.metadata.publishSettings.allowAnonymous || checkOwner(node, client.loginData.UID))
        {
            return true;
        }
        else
        {
            //console.log('permission denied for modifying ' + node.id, 1);
            return;
        }
    }
    this.validateCreate = function(nodeid, childName, childComponent, client)
    {
        var node = this.findNode(nodeid);
        if (!node)
        {
            this.Error('server has no record of ' + nodeid, 1);
            return;
        }
        var childID = this.getID(childName, childComponent)
        var childNode = this.findNode(childID);
        if (childNode)
        {
            this.Error("Node already exists");
            return;
        }
        if (this.metadata.publishSettings.allowAnonymous || checkOwner(node, client.loginData.UID) || childComponent.extends == 'character.vwf')
        {
            return true;
        }
        else
        {
            this.Error('permission denied for creating child ' + node.id, 1);
            return;
        }
    }
    this.getClientNodeDefinition = function(nodeID)
    {
        var self = this;

        var walk = function(node)
        {
            delete node.parent;
           
            var childNames = {};
            for (var i in node.children)
            {
                childNames[node.children[i].name] = node.children[i];
            }
            node.children = childNames;
            var nodeID = node.id;
            delete node.id;

            for (var i in node.children)
            {
                node.children[i] = walk(node.children[i],i)
            }

            if(node.continues)
            {
                console.log("diff on " + node.continues+nodeID)
                node = objectDiff(node,self.continuesDefs[node.continues+nodeID],false,false);
            }
            return node;
        }
        var node = this.duplicateNode(this.findNode(nodeID));
        node = walk(node,nodeID);
        if(nodeID == 'index-vwf')
        {
            node.patches = 'index.vwf';
        }
        return node;
    }
    this.duplicateNode = function(node)
    {
        //get around the issue with stringifying a circular structure due to the parents property
        node = JSON.parse(JSON.stringify(node,function(k,v){
            if(k == "parent")
                return undefined;
            else
                return v;
        }));
         return node;
    }
    this.getAvatarForClient = function(userID)
    {
        return this.findNode('character-vwf-' + userID);
    }
    this.getAvatarDef = function(userID, client, cb)
    {
        var self = this;
        DAL.getUser(userID, function(user)
        {
            var avatar = null;
            if (!user || !user.avatarDef)
            {
                avatar = require("./sandboxAvatar").getDefaultAvatarDef()
            }
            else
            {
                avatar = user.avatarDef;
            }
            avatar.properties.ownerClientID = [client];
            avatar.properties.PlayerNumber = userID;
            var placemarks = self.getProperty("index-vwf", "placemarks");
            if (placemarks && placemarks.Origin)
            {
                avatar.properties.transform[12] = placemarks.Origin[0];
                avatar.properties.transform[13] = placemarks.Origin[1];
                avatar.properties.transform[14] = placemarks.Origin[2];
            }
            cb(avatar)
        })
    }
    this.createAvatar = function(userID, client, cb)
    {
        var self = this;
        this.getAvatarDef(userID, client, function(avatar)
        {
            var message = {
                    action: "createChild",
                    node: "index-vwf",
                    member: userID,
                    parameters: [avatar, null]
                } // last null is very important. Without, the ready callback will be added to the wrong place in the function arg list
            self.world.messageClients(message, false, false);
            self.createdChild(message.node, message.member, avatar, function()
            {
                if (cb)
                    cb('character-vwf-' + userID)
            });
        })
    }
    this.createMethod = function(nodeID,methodName,params,body)
    {
         var node = this.findNode(nodeID);
         if(!node) return;
         if(!node.methods)
            node.methods = {};
         node.methods[methodName] = {parameters:params,body:body}
    }
    this.deleteMethod = function(nodeID,methodName)
    {
         var node = this.findNode(nodeID);
         if(!node) return;
         if(!node.methods)
            node.methods = {};
         delete node.methods[methodName];
    }
    this.createEvent = function(nodeID,eventName,params,body)
    {
         var node = this.findNode(nodeID);
         if(!node) return;
         if(!node.events)
            node.events = {};
         node.events[eventName] = {parameters:params,body:body}
    }
    this.deleteEvent = function(nodeID,eventName)
    {
         var node = this.findNode(nodeID);
         if(!node) return;
         if(!node.events)
            node.events = {};
         delete node.events[eventName];
    }
    this.getID = function(name, childComponent)
    {
        var childName = name;
        if (!childName) return;
        var childID = childComponent.id || childComponent.uri || (childComponent["continues"] || childComponent["extends"]) + "." + childName.replace(/ /g, '-');
        childID = childID.replace(/[^0-9A-Za-z_]+/g, "-");
        return childID;
    }
    this.createdChild = function(nodeid, name, childComponent, cb)
    {
        var self = this;
        //Keep a record of the new node
        //remove allow for user to create new node on index-vwf. Must have permission!
        var lastTime = now();
        this.resolveContinues(childComponent, name, function(newNode)
        {
            console.log("Created child in " + (now() - lastTime));
            childComponent = newNode;
            var node = self.findNode(nodeid);
            if (!childComponent) return;
            if (!node.children) node.children = {};
            var childID = self.getID(name, childComponent);
            //console.log(childID);
            childComponent.id = childID;
            node.children[childID] = childComponent;
            node.children[childID].parent = node;
            if (!childComponent.properties)
                childComponent.properties = {};
            childComponent.name = name;
            fixIDs(node.children[childID]);
            self.Log("created " + childID, 2);
            cb();
        })
    }
    // so, the player has hit pause after hitting play. They are going to reset the entire state with the state backup. 
    //The statebackup travels over the wire (though technically I guess we should have a copy of that data in our state already)
    //when it does, we can receive it here. Because the server is doing some tracking of state, we need to restore the server
    //side state.
    this.calledMethod = function(id, name, args,internals)
    {
        if (id == 'index-vwf' && name == 'restoreState')
        {
            //args[0][0] should be a vwf root node definition
            if (args[0][0])
            {
                
                //note we have to JSON parse and stringify here to avoid creating a circular structure that cannot be reserialized 
                this.nodes['index-vwf'] = JSON.parse(JSON.stringify(args[0][0]));
                //here, we need to hook back up the .parent property, so we can walk the graph for other operations.
                this.reattachParents(this.nodes['index-vwf']);
                var self = this;
                internals.then = function(){
                    self.world.simulationManager.distributeAll();
                    self.world.markAllPropsCurrent();
                }
                

            }
        }
        if(id == 'index-vwf' && name == "setClientCamera")
        {
            var clients = this.getProperty(id,"clients");
            if(clients && clients[args[0][0]])
                clients[args[0][0]].cameraID = args[0][1];
            console.log(clients,args);
        }
    }
    this.simulationStateUpdate = function(updates)
    {
        var nodeCount = 0;
        var propCount = 0;
        var lastTime = now();
        for (var i in updates)
        {
            nodeCount++;
            for (var j in updates[i])
            {
                propCount++;
                this.satProperty(i, j, updates[i][j])
            }
        }
        var time = now() - lastTime;
        //console.log("update " + nodeCount + " nodes with "+ propCount + " props in " + time + "ms");
    }
    var self = this;
    SandboxAPI.getState(this.id, function(state)
    {
        //create the basic structure if the DAL layer returns null
        if (!state)
        {
            state = [
            {
                owner: self.metadata.owner
            }];
        }
        //turn DB state into VWF root node def
        DBstateToVWFDef(state, self.metadata, function(scene)
        {
            var serverScene = JSON.parse(JSON.stringify(scene));
            self.resolveContinues(serverScene, "index-vwf", function(newScene)
            {

                fixIDs(newScene);
                var resovledState = [];
                for (var i in newScene.children)
                    resovledState.push(newScene.children[i]);
                resovledState.push(newScene.properties);
                self.setup(resovledState);
                self.setVWFDef(scene);
                self.trigger('loaded');
            });
        });
    });
}
exports.sandboxState = sandboxState;
exports.DBstateToVWFDef = DBstateToVWFDef;