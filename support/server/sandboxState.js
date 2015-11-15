var DAL = require('./DAL')
    .DAL;
var fs = require('fs');
var YAML = require('js-yaml');
var GUID = require('node-uuid').v4;

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
                if (instanceData && instanceData.publishSettings && instanceData.publishSettings.allowTools == false)
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

var sandboxState = function(id, metadata,world)
{
    this.events = {};
    this.id = id;
    this.metadata = metadata;
    
    this.world = world;
    if(!this.metadata.publishSettings)
    {
        this.metadata.publishSettings = {
            allowAnonymous:false,
            createAvatar:true,
            SinglePlayer:false,
            persistence:true,
            camera:null
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
    this.nodes = {};
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
    this.Log = function(log)
    {

    }
    this.Error = function(error)
    {

    }
    this.getVWFDef = function()
    {
        return this.VWFDef;
    }
    this.setVWFDef = function(newDef)
    {
        this.VWFDef = newDef;
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
        var node = this.findNode(id);
        if(!node) return;

        if (!parent) parent = node.parent;
        if (parent.children)
        {
            for (var i in parent.children)
            {
                if (i == id)
                {
                    delete parent.children[i];
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
    this.getProperty = function(nodeID,prop)
    {
        var node = this.findNode(nodeID);
        if(!node)
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
    this.setProperty = function(nodeid,prop,val)
    {
        this.satProperty(nodeid,prop,val)
        var message = {action:"setProperty",
                            node:nodeid,
                            member:prop,
                            parameters:[val]};
        this.world.messageClients(message,false,false); 

    }
    this.validate = function(type, nodeID, client)
    {
        var node = this.findNode(nodeID);
        if (!node)
        {
            console.log('server has no record of ' + nodeID, 1);
            return true;
        }
        if (this.metadata.publishSettings.allowAnonymous || checkOwner(node, client.loginData.UID))
        {
            return true;
        }
        else
        {
            console.log('permission denied for modifying ' + node.id, 1);
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
        var childID = this.getID(childName,childComponent)
        var childNode = this.findNode(childID);
        if(childNode)
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
    this.getNodeDefinition = function(nodeID)
    {
        var walk = function(node)
        {
            delete node.parent;
            for(var i in node.children)
            {
                walk(node.children[i])
            }
            var childNames = {};
            for(var i in node.children)
            {
                childNames[node.children[i].name] = node.children[i];
            }
            node.children = childNames;
            delete node.id;
        }

        var node = this.findNode(nodeID);
        walk(node);
        node = JSON.parse(JSON.stringify(node))
        this.reattachParents(nodeID);
        return node;
    }
    this.getAvatarForClient = function(userID)
    {
        return this.findNode('character-vwf-' + userID);
    }
    this.getAvatarDef = function(userID,client,cb)
    {
        var self = this;
        DAL.getUser(userID,function(user)
        {
            var avatar = null;
            if(!user || !user.avatarDef)
            {
                avatar = require("./sandboxAvatar").getDefaultAvatarDef()
                
            }else{
                avatar = user.avatarDef;
            }
            
            avatar.properties.ownerClientID = [client];
            avatar.properties.PlayerNumber = userID;
           

            var placemarks = self.getProperty("index-vwf","placemarks");
            if(placemarks && placemarks.Origin)
            {
                avatar.properties.transform[12] = placemarks.Origin[0];
                avatar.properties.transform[13] = placemarks.Origin[1];
                avatar.properties.transform[14] = placemarks.Origin[2];
            }


            cb(avatar)       
        })
    }
    this.createAvatar = function(userID,client)
    {   
        var self = this;
        this.getAvatarDef(userID,client,function(avatar)
        {
            var message = {action:"createChild",
                            node:"index-vwf",
                            member:userID,
                            parameters:[avatar,null]} // last null is very important. Without, the ready callback will be added to the wrong place in the function arg list
            self.world.messageClients(message,false,false);
            self.createdChild(message.node,message.member,avatar);         
        })
    }
    this.getID = function(name,childComponent)
    {
        var childName = name;
        if (!childName) return;
        var childID = childComponent.id || childComponent.uri || (childComponent["continues"]  || childComponent["extends"]) + "." + childName.replace(/ /g, '-');
        childID = childID.replace(/[^0-9A-Za-z_]+/g, "-");
        return childID;
    }
    this.createdChild = function(nodeid, name, childComponent)
    {
        //Keep a record of the new node
        //remove allow for user to create new node on index-vwf. Must have permission!
        var node = this.findNode(nodeid);

        if (!childComponent) return;
        if (!node.children) node.children = {};
        var childID = this.getID(name,childComponent);
        console.log(childID);
        childComponent.id = childID;
        node.children[childID] = childComponent;
        node.children[childID].parent = node;
        if (!childComponent.properties)
            childComponent.properties = {};
        childComponent.name = name;
        fixIDs(node.children[childID]);
        this.Log("created " + childID, 2);
        return childID;
    }
    // so, the player has hit pause after hitting play. They are going to reset the entire state with the state backup. 
    //The statebackup travels over the wire (though technically I guess we should have a copy of that data in our state already)
    //when it does, we can receive it here. Because the server is doing some tracking of state, we need to restore the server
    //side state.
    this.calledMethod = function(id, name, args)
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
            }
        }
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
            self.setup(state);
            self.setVWFDef(scene);
            self.trigger('loaded');
        });
    });
}

exports.sandboxState = sandboxState;
exports.DBstateToVWFDef = DBstateToVWFDef;