var DAL = require('./DAL')
    .DAL;
var sio = require('socket.io');
var fs = require('fs');
var url = require("url");
var mime = require('mime');
var messageCompress = require('../client/lib/messageCompress')
    .messageCompress;
YAML = require('js-yaml');
var logger = require('./logger');
var xapi = require('./xapi');
var sandboxState = require('./sandboxState').sandboxState;
var _simulationManager = require('./simulationManager').simulationManager;
var GUID = require('node-uuid').v4;
var now = require("performance-now");

function QueuedMessage(a, b)
{
    this.message = a;
    this.client = b;
}
//***node, uses REGEX, escape properly!
function strEndsWith(str, suffix)
{
    return str.match(suffix + "$") == suffix;
}
//Is an event in the websocket stream a mouse event?
function isPointerEvent(message)
{
    if (!message) return false;
    if (!message.member) return false;
    return (message.member == 'pointerMove' ||
        message.member == 'pointerHover' ||
        message.member == 'pointerEnter' ||
        message.member == 'pointerLeave' ||
        message.member == 'pointerOver' ||
        message.member == 'pointerOut' ||
        message.member == 'pointerUp' ||
        message.member == 'pointerDown' ||
        message.member == 'pointerWheel'
    )
}

function SaveInstanceState(namespace, data, socket)
{
    if (!socket.loginData) return;
    var id = namespace;
    DAL.getInstance(id, function(state)
    {
        //state not found
        if (!state)
        {
            require('./examples.js')
                .getExampleMetadata(id, function(metadata)
                {
                    if (!metadata)
                    {
                        logger.info(id + "is not an example");
                        return;
                    }
                    else
                    {
                        if (socket.loginData.UID == global.adminUID)
                        {
                            require('./examples.js')
                                .saveExampleData(socket, id, data, function() {})
                        }
                        else
                        {
                            return;
                        }
                    }
                });
            return;
        }
        //not allowed to update a published world
        if (state.publishSettings.persistence == false)
        {
            return;
        }
        //not allowed to update a published world
        if (state.publishSettings.singlePlayer == true)
        {
            return;
        }
        //not currently checking who saves the state, so long as they are logged in
        DAL.saveInstanceState(id, data, function()
        {
            logger.info('saved');
            return;
        });
    });
}
var timeout = function(world)
{
    this.world = world;
    this.count = 0;
    this.time = function()
    {
        try
        {
            var loadClient = this.world.getLoadClient();
            if (loadClient)
            {
                this.count++;
                if (this.count < 5)
                {
                    logger.warn('did not get state, resending request', 2);
                    this.world.getStateTime = this.world.time();
                    //update 11/2/14
                    //if the last loadclient does not respond, pick a new client randomly
                    loadClient.emit('m', this.messageCompress.pack(
                    {
                        "action": "getState",
                        "respond": true,
                        "time": this.world.time()
                    }));
                    socket.emit('m', this.messageCompress.pack(
                    {
                        "action": "status",
                        "parameters": ["Did not get state, resending request."],
                        "time": this.world.time()
                    }));
                    this.handle = global.setTimeout(this.time.bind(this), 2000);
                }
                else
                {
                    logger.warn('sending default state', 2);
                    var state = this.world.state.getVWFDef();
                    //send cached state to all pending clients, drain their pending list, mark active
                    for (var i in this.world.clients)
                    {
                        var client = this.world.clients[i];
                        if (loadClient != client && client.pending === true)
                        {
                            logger.warn('sending default state 2', 2);
                            client.emit('m', this.messageCompress.pack(
                            {
                                "action": "status",
                                "parameters": ["State Not Received, Transmitting default"],
                                "time": this.namespace.getStateTime
                            }));
                            client.emit('m', this.messageCompress.pack(
                            {
                                "action": "setState",
                                "parameters":
                                {
                                    nodes: [state],
                                    kernel:
                                    {
                                        time: this.namespace.getStateTime
                                    },
                                    annotations:
                                    {
                                        "1": "application"
                                    }
                                },
                                "time": this.namespace.getStateTime
                            }));
                            client.pending = false;
                            for (var j = 0; j < client.pendingList.length; j++)
                            {
                                client.emit(client.pendingList[j].type, client.pendingList[j].message);
                            }
                            client.pendingList = [];
                        }
                    }
                }
            }
            else
            {
                logger.warn('need to load from db', 2);
            }
        }
        catch (e)
        {}
    }
    this.deleteMe = function()
    {
        global.clearTimeout(this.handle);
        this.world.requestTimer = null;
    }
    this.handle = global.setTimeout(this.time.bind(this), 6000);
}
var STATUS = {
    DEFAULT: 0,
    PENDING_STATE: 1,
    PENDING_LOAD: 2
}

function sandboxWorld(id, metadata)
{
   
    this.id = id;
    this.clients = {};
    this._time = 0.0;
    this.state = {};
    this.metadata = metadata;
    this.allowAnonymous = false;
    this.simulationManager = new _simulationManager(this);
    this.status = STATUS.DEFAULT;
    this.messageCompress = messageCompress();
    this.messageCompress.setServer(this);
    if (this.metadata.publishSettings && this.metadata.publishSettings.allowAnonymous)
        this.allowAnonymous = true;
    this.simulationStateUpdates = {};
    this.propertySetTimes = {};
    var log = null;
    try
    {
        var log = require('./logger').getWorldLogger(id);
    }
    catch (e)
    {
        logger.error(e.message + ' when opening ' + SandboxAPI.getDataPath() + '//Logs/' + id.replace(/[\\\/]/g, '_'));
    }
    this.events = {};
    this.propertySetTime = function(id,prop)
    {
        return this.propertySetTimes[id+prop] || -1;
    }
    this.setPropertyTime = function(id,prop,val)
    {
        this.propertySetTimes[id+prop] = val;
    }
    this.markAllPropsCurrent = function()
    {
        var t = this.realTime();
        for(var i in  this.propertySetTimes)
             this.propertySetTimes[i] = t;
        this.simulationStateUpdates = {}; 
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
    this.addClient = function(socket)
    {
        var self = this;
        this.clients[socket.id] = socket;
        socket.on("avatarUpdated", function()
        {
            self.avatarUpdated(socket);
        });
    }
    this.removeClient = function(socket)
    {
        delete this.clients[socket.id];
    }
    this.shutdown = function()
    {
        for (var i in this.clients)
            this.clients[i].disconnect();
        clearInterval(this.timerID);
        logger.warn('Shutting down ' + this.id);
        this.simulationManager.shutdown();
        this.trigger('shutdown');
    }
    this.Log = function(message, level)
    {
        if (logger.logLevel >= level)
        {
            if (log)
                log.info(message);
            logger.info(message + '\n', level);
        }
    }
    this.getClientList = function()
    {
        var list = [];
        for (var k in this.clients)
            list.push(k);
        return list;
    }
    this.clientCount = function()
    {
        var i = 0;
        for (var k in this.clients)
            i++;
        return i;
    }
    this.getLoadClient = function()
    {
        var loadClient = null;
        var nonPendingClients = [];
        for (var i in this.clients)
        {
            var testClient = this.clients[i];
            if (!testClient.pending)
            { //&& testClient.loginData remove check - better to get untrusted data than a sync error
                nonPendingClients.push(testClient);
            }
        }
        //pick randomly, so if there are several and you need to try again, you don't keep hitting the same one
        loadClient = nonPendingClients[Math.floor(Math.random() * nonPendingClients.length - .001)];
        return loadClient;
    }
    this.Error = function(message, level)
    {
        if (logger.logLevel >= level)
        {
            if (log)
                log.error(message + '\n');
            logger.error(message);
        }
    }
    this.messageClient = function(client, message, ignorePending, resolvePending, overrideType)
    {
        if (!client.pending || ignorePending)
        {
            //simulate latency
            if (global.latencySim > 0)
            {
                (function(__client, __message)
                {
                    global.setTimeout(function()
                    {
                        __client.emit(overrideType || 'm', __message);
                    }, global.latencySim)
                })(client, message);
            }
            else
            {
                client.emit(overrideType || 'm', message);
            }
        }
        else
        {
            client.pendingList.push(
            {
                message: message,
                type: (overrideType || 'm')
            })
        }
        if (resolvePending)
        {
            if (client.pending)
            {
                for (var j = 0; j < client.pendingList.length; j++)
                {
                    client.emit(client.pendingList[j].type, client.pendingList[j].message);
                }
                client.pendingList = [];
                client.pending = false;
            }
        }
    }
    this.messageClients = function(message, ignorePending, resolvePending, overrideType, noCompress)
    {
        try
        {
            if (message.constructor != String)
            {
                //message.instance = this.id;
                if (!message.time)
                    message.time = this.time();
            }
            //message to each user the join of the new client. Queue it up for the new guy, since he should not send it until after getstate
            var packedMessage = (!noCompress) ? this.messageCompress.pack(message) : message;
            for (var i in this.clients)
            {
                this.messageClient(this.clients[i], packedMessage, ignorePending, resolvePending, overrideType);
            }
        }
        catch (e)
        {
            //console.log(e)
        }
    }
    this.messageConnection = function(id, name, UID)
    {
        //update the state to reflect the server side tracking of client data

        var clients = this.state.getProperty('index-vwf',"clients");
        if(!clients) clients = {};
        clients[id] = {cid:id,name:name,UID:UID,cameraID:null,focusID:'index-vwf'};
        this.state.satProperty('index-vwf','clients',clients);

        var setMessage = {
            "action": "setProperty",
            "member": "clients",
            "parameters":[clients],
            node: "index-vwf",
            "time": this.time() + .1
        };

        var joinMessage = {
            "action": "fireEvent",
            "parameters": ["clientConnected", [id, name, UID]],
            node: "index-vwf",
            "time": this.time()
        };
        this.messageClients(setMessage);
        console.log(setMessage);
        this.messageClients(joinMessage);
    }
    this.messageDisconnection = function(id, name, UID)
    {
        var clients = this.state.getProperty('index-vwf',"clients");
        if(!clients) clients = {};
        delete clients[id];
        this.state.satProperty('index-vwf','clients',clients);

        var setMessage = {
            "action": "setProperty",
            "member": "clients",
            "parameters":[clients],
            node: "index-vwf",
            "time": this.time() + .1
        };

        var joinMessage = {
            "action": "fireEvent",
            "parameters": ["clientDisconnected", [id, name, UID]],
            node: "index-vwf",
            "time": this.time()
        };
        this.messageClients(setMessage);
        this.messageClients(joinMessage);
    }
    this.GetNextAnonName = function(socket)
    {
        return "Anonymous_" + socket.id
    }
    this.totalerr = 0;
    //instead of starting the timer when the object is initialzied, let's start the timer after the state has been served to the first client
    this.startTimer = function()
    {
        //keep track of the timer for this instance
        var self = this;
        if (self.timerID) return; //already started
        self.accum = 0;
        var timer = function()
        {
            var now = process.hrtime();
            now = now[0] * 1e9 + now[1];
            now = now / 1e9;
            if (!self.lasttime) self.lasttime = now;
            var timedelta = (now - self.lasttime) || 0;
            self.accum += timedelta;
            while (self.accum > .05)
            {
                self.accum -= .05;
                self._time += .05;
                self.ticknum++;
                var tickmessage = {
                    "action": "tick",
                    "time": self.time(),
                };
                
                self.messageClients(self.time().toFixed(3), false, false, 't', true);
                if(Object.keys(self.simulationStateUpdates).length > 0)
                {
                    var simMessage = {
                        node: "index-vwf",
                        action: "simulationStateUpdate",
                        member: "null",
                        parameters: self.simulationStateUpdates,
                        time:self.time()
                }
                    self.messageClients(simMessage, true, false, 'm', false);
            }
                self.simulationStateUpdates = {};
               
            }
            self.lasttime = now;
        }.bind(self);
        var monitor = function()
        {

             if(self.messageTotalProcessTime > 0)
                        console.log(self.totalMessages + " Messages ,Average Time: " + (self.messageTotalProcessTime / self.totalMessages));
                this.totalMessages = 1;
                this.messageTotalProcessTime = 0;

        }.bind(self)
        self.timerID = setInterval(timer, 5);
        self.monitortimerID = setInterval(monitor, 1000);
        console.warn("timer is " + self.timerID)
    }
    this.time = function() {
        return this._time;
    }
    this.realTime = function()
    {
         var now = process.hrtime();
         now = now[0] * 1e9 + now[1];
         now = now / 1e9;
         return this.time() + (now - this.lasttime)/1000;

    }
    this.firstConnection = function(socket, cb)
    {
        logger.info('load from db', 2);
        socket.emit('m', this.messageCompress.pack(
        {
            "action": "status",
            "parameters": ["Loading state from database"],
            "time": this.time()
        }));
        var instance = this.id;
        //Get the state and load it.
        //Now the server has a rough idea of what the simulation is
        var self = this;
        this.state = new sandboxState(this.id, this.metadata, this);
        this.status = STATUS.PENDING_LOAD;
        this.simulationManager.addClient(socket);
        this.state.on('loaded', function()
        {
            //console.log('loaded');
            self.status = STATUS.DEFAULT;
            var scene = self.state.getVWFDef();
            self.messageClients(
            {
                "action": "status",
                "parameters": ["State loaded, sending..."],
                "time": self.time()
            }, true, false);
            //note: don't have to worry about pending status here, client is first
            self.messageClients(
            {
                "action": "setState",
                "parameters":
                {
                    nodes: [scene],
                    kernel:
                    {
                        time: 0
                    },
                    annotations:
                    {
                        "1": "application"
                    }
                },
                "time": self.time()
            }, true, true);
            self.messageClients(
            {
                "action": "fireEvent",
                "parameters": ["loaded", []],
                node: "index-vwf",
                "time": self.time()
            }, false, false);
            self.startTimer();
            cb();
        })
    }
    this.messagePeerConnected = function()
    {
        for (var i in this.clients)
        {
            this.clients[i].emit('m', this.messageCompress.pack(
            {
                "action": "status",
                "parameters": ["Peer Connected"],
                "time": this.time()
            }));
        }
    }
    this.avatarUpdated = function(client)
    {
        var avatar = this.state.getAvatarForClient(client.loginData.UID);
        if (!avatar) return; // this world does not contain the avatar, so we don't have to do anything;
        var avatarID = 'character-vwf-' + client.loginData.UID;
        this.state.deletedNode(avatarID); //delete from server record
        this.messageClients(
        {
            "action": "deleteNode",
            "node": avatarID,
            "time": this.time
        });
        this.state.createAvatar(client.loginData.UID, client.id); //recreate the avatar
    }
    this.clientConnected = function(client)
    {
        client.setWorld(this);
        this.messagePeerConnected();
        //add the new client to the instance data
        this.addClient(client);
        this.messageCompress.sendFullLearnedTable(client);
        //count anonymous users, try to align with the value used for hte displayname of the avatar
        if (client.loginData.UID == "Anonymous")
        {
            var anonName = this.GetNextAnonName(client);
            client.loginData.UID = anonName;
            client.loginData.Username = anonName;
        }
        client.pending = true;
        client.pendingList = [];
        //The client is the first, is can just load the index.vwf, and mark it not pending
        //if this is a new client, and there is no logged in peer to fetch state from, then load the state
        //if this new peer is not anonymous, then tell the peer to start the simulation. 
        var havePeer = false;
        for (var i in this.clients)
            if ((!this.clients[i].isAnonymous() || this.allowAnonymous) && this.clients[i] !== client)
                havePeer = true;
        if (!havePeer)
        {
            var self = this;
            this.firstConnection(client, function()
            {
                //this must come after the client is added. Here, there is only one client
                self.messageConnection(client.id, client.loginData ? client.loginData.Username : "", client.loginData ? client.loginData.UID : "");
                var needAvatar = self.state.metadata.publishSettings.createAvatar;
                if (!client.isAnonymous())
                    self.simulationManager.startScene();
                if (!self.state.metadata.publishSettings.allowAnonymous && client.loginData.anonymous)
                    needAvatar = false;
                if (needAvatar && !self.state.getAvatarForClient(client.loginData.UID))
                {
                    self.state.createAvatar(client.loginData.UID, client.id, function(avatarID)
                    {
                        self.simulationManager.nodeCreated(avatarID, client);
            });
        }
            });
        }
        //this client is not the first, we need to get the state and mark it pending
        else
        {
            //if we're loading the files, or waiting for state, then this new client must be at least the 2nd,
            //possilby the 3rd. Eitherway, state will come from either the load or the getState, so just
            //place this client on the list
            //the below message should now queue for the pending socket, fire off for others
            this.messageConnection(client.id, client.loginData ? client.loginData.Username : "", client.loginData ? client.loginData.UID : "");

            function setupAvatar()
            {
            var needAvatar = this.state.metadata.publishSettings.createAvatar;
            if (!this.state.metadata.publishSettings.allowAnonymous && client.loginData.anonymous)
                needAvatar = false;
            if (needAvatar)
            {
                if (!this.state.getAvatarForClient(client.loginData.UID))
                    {
                        var self = this;
                        this.state.createAvatar(client.loginData.UID, client.id, function(avatarID)
                        {
                            self.simulationManager.nodeCreated(avatarID, client);
                        });
                    }
                else
                {
                    //note that we only do this for the second client, because it's impossible to have 2 clients 
                    //control one avatar if there is only one client
                    var avatar = this.state.getAvatarForClient(client.loginData.UID);
                    var controller = avatar.properties.ownerClientID;
                    controller.push(client.id);

                    this.state.setProperty(avatar.id, 'ownerClientID', controller);
                }
            }
        }
            if (this.status == STATUS.DEFAULT)
            {
                //this.requestState();
                var self = this;
                var distributeSim = function()
                {
                    self.simulationManager.addClient(client);
                    //this.removeListener('stateSent', distributeSim);
                    setupAvatar.apply(self);
    }
                //this.on('stateSent', distributeSim)
                    //loadClient.pending = true;
                client.emit('m', this.messageCompress.pack(JSON.stringify(
                {
                    "action": "status",
                    "parameters": ["Requesting state from clients"],
                    "time": this.getStateTime
                })));
                console.log('sending state');
                this.messageClient(client,
                {
                    "action": "setState",
                    "parameters":
                    {
                        nodes: [this.state.getClientNodeDefinition("index-vwf")],
                        kernel:
                        {
                            time: this.time()
                        },
                        annotations:
                        {
                            "1": "application"
                        }
                    },
                    "time": self.time()
                }, true, true);
                distributeSim();
            }
            else
            {
                this.simulationManager.addClient(client);
                setupAvatar.apply(this); //this should then mark pending
            }
        }
    }
    this.requestState = function()
    {
        //get the state from the in-memory representation, trigger state receive
        var state = this.world.getClientNodeDefinition("index-vwf");

        // the below code is used to prompt the existing clients for state. this is deprecated
        /*
        var loadClient = this.getLoadClient();
        logger.info('load from client', 2);
        //  socket.pending = true;
        this.getStateTime = this.time();
        loadClient.emit('m', this.messageCompress.pack(
        {
            "action": "status",
            "parameters": ["Server requested state. Sending..."],
            "time": this.getStateTime
        }));
        //here, we must reset all the physics worlds, right before who ever firstclient is responds to getState. 
        //important that nothing is between
        loadClient.emit('m', this.messageCompress.pack(
        {
            "action": "getState",
            "respond": true,
            "time": this.time(),
            "origin": "reflector"
        }));
        this.Log('GetState from Client', 2);
        if (!this.requestTimer)
            this.requestTimer = new timeout(this);
        this.status = STATUS.PENDING_STATE;
        */
    }
    this.queue = [];
    this.ready = 0;
    this.totalMessages = 0;
    this.messageTotalProcessTime = 0;
    this.message = function(msg, sendingclient)
    {
        this.totalMessages++;
        var message = this.messageCompress.unpack(msg);
        //     message.time() = this.time();
        if (this.queue.length > 0 || message.action == 'createChild')
        {
            this.queue.push(new QueuedMessage(message, sendingclient));
            this.dispatch();
        }
        else
            {
            var lasttime = now();
            this.process_message_sync(message, sendingclient);
            this.messageTotalProcessTime += (now() - lasttime);
            }
    }
    this.dispatch = function()
            {
        if (this.queue.length > 0 && this.ready === 0)
        {
            var lasttime = now();
            var message = this.queue.shift();
            this.ready++;
            var self = this;
            this.process_message_async(message.message, message.client, function()
            {
                //setImmediate(function()
                //{
                this.messageTotalProcessTime += now() - lasttime;
                self.ready--;
                self.dispatch();
                //})
            });
            }
    }
    this.process_message_sync = function(message, sendingclient)
    {
        var self = this;
        var internals = this.process_message_internal(self, message, sendingclient, function() {});
        this.reflect_message(self, message, sendingclient, internals, function() {});
    }
    this.process_message_async = function(message, sendingclient, cb)
    {
        var internals = {};
        
        var self = this;
        this.process_message_internal(self, message, sendingclient, function(internals)
        {
            self.reflect_message(self, message, sendingclient, internals, cb);
        });
    }
    this.process_message_internal = function(self, message, sendingclient, cb2)
    {
        var internals = {};
        internals.doReflect = true;
        
        //need to add the client identifier to all outgoing messages
        try
        {
            var lasttime = now();
            //logger.info(message);
            message.client = sendingclient.id;
            
            if (message.action == "saveStateResponse")
            {
                SaveInstanceState(self.id, message.data, sendingclient);
                internals.doReflect = false;
                cb2(internals);
                return internals;
            }
            if (message.action == "requestControlOfNode")
            {
                this.simulationManager.clientRequestControlOfNode(message.node, sendingclient);
                internals.doReflect = false;
                cb2(internals);
                return internals;
            }
            //do not accept messages from clients that have not been claimed by a user
            //currently, allow getstate from anonymous clients
            if (!self.state.metadata.publishSettings.allowAnonymous && sendingclient.loginData.anonymous && message.action != "getState" && message.member != "latencyTest")
            {
                internals.doReflect = false;
                cb2(internals);
                return internals;
            }
            if(message.member == "latencyTest")
            {
               // console.log(message);
                cb2(internals);
                return internals;   
            }
            //route callmessage to the state to it can respond to manip the server side copy
            if (message.action == 'callMethod')
                self.state.calledMethod(message.node, message.member, message.parameters,internals);
            if (message.action == 'callMethod' && message.node == 'index-vwf' && message.member == 'PM')
            {
                var textmessage = JSON.parse(message.parameters[0]);
                if (textmessage.receiver == '*System*')
                {
                    var red, blue, reset;
                    red = '\u001b[31m';
                    blue = '\u001b[33m';
                    reset = '\u001b[0m';
                    logger.warn(blue + textmessage.sender + ": " + textmessage.text + reset, 0);
                }
                //send the message to the sender and to the receiver
                if (textmessage.receiver)
                    self.clients[textmessage.receiver].emit('m', self.messageCompress.pack(message));
              //this is no longer necessary, because the client predicts its own response
              //  if (textmessage.sender)
                //    self.clients[textmessage.sender].emit('m', self.messageCompress.pack(message));
                internals.doReflect = false;
                cb2(internals);
                return internals;
            }
            // only allow users to hang up their own RTC calls
            var rtcMessages = ['rtcCall', 'rtcVideoCall', 'rtcData', 'rtcDisconnect'];
            if (message.action == 'callMethod' && message.node == 'index-vwf' && rtcMessages.indexOf(message.member) != -1)
            {
                var params = message.parameters[0];
                // allow no transmitting of the 'rtc*Call' messages; purely client-side
                if (rtcMessages.slice(0, 2)
                    .indexOf(message.member) != -1)
                    internals.doReflect = false;
                cb2(internals);
                return internals;
                // route messages by the 'target' param, verifying 'sender' param
                if (rtcMessages.slice(2)
                    .indexOf(message.member) != -1 &&
                    params.sender == sendingclient.id
                )
                {
                    var client = self.clients[params.target];
                    if (client)
                        client.emit('m', self.messageCompress.pack(message));
                }
                internals.doReflect = false;
                cb2(internals);
                return internals;
            }
            //We'll only accept a setProperty if the user has ownership of the object
            if (message.action == "deleteNode" || message.action == "createMethod" || message.action == "createProperty" || message.action == "createEvent" ||
                message.action == "deleteMethod" || message.action == "deleteProperty" || message.action == "deleteEvent" || message.action == "setProperty")
            {
                if (!self.state.validate(message.action, message.node, sendingclient))
                {
                    internals.doReflect = false;
                    cb2(internals);
                    return internals;
                }
            }
            if (message.action == "setProperty")
            {
                if(message.time >= this.propertySetTime(message.node,message.member))
                {
                    this.setPropertyTime(message.node,message.member,message.time);
                   // if(this.simulationStateUpdates[message.node])
                   //     delete this.simulationStateUpdates[message.node][message.member];
                this.state.satProperty(message.node, message.member, message.parameters[0]);
                }else
                {
                    internals.doReflect = false;
                    cb2(internals);
                    return internals;
                }
            }
            if(message.action == "createMethod")
            {
                console.log(message);
                this.state.createMethod(message.node,message.member,message.parameters[0][0],message.parameters[0][1]);
            }
            if(message.action == "deleteMethod")
            {
                console.log(message);
                this.state.deleteMethod(message.node,message.member);
            }
            if(message.action == "createEvent")
            {
                console.log(message);
                this.state.createEvent(message.node,message.member,message.parameters[0],message.parameters[1]);
            }
            if(message.action == "deleteEvent")
            {
                console.log(message);
                this.state.deleteEvent(message.node,message.member);
            }
            if (message.action == "setProperty" || message.action == "callMethod" || message.action == "fireEvent" ||message.action == "dispatchEvent")
            {
                //let the simulation manage know that the client is trying up update the object, possibly reassign control
                self.simulationManager.updateClientControlTable(message.node,sendingclient);
            }
            //We'll only accept a deleteNode if the user has ownership of the object
            if (message.action == "deleteNode")
            {
                var displayname = self.state.getProperty(message.node, 'DisplayName');
                self.simulationManager.nodeDeleted(message.node);
                self.state.deletedNode(message.node)
                xapi.sendStatement(sendingclient.loginData.UID, xapi.verbs.derezzed, message.node, displayname || message.node, null, self.id);
            }
            //We'll only accept a createChild if the user has ownership of the object
            //Note that you now must share a scene with a user!!!!
            if (message.action == "createChild")
            {
                



                var childComponent = JSON.parse(JSON.stringify(message.parameters[0]));
                if (!self.state.validateCreate(message.node, message.member, childComponent, sendingclient))
                {
                    internals.doReflect = false;
                    cb2(internals);
                    return internals;
                }
                var childID = self.state.getID(message.member, childComponent);
                internals.childID = childID;

                internals.then = function()
                {
                    self.simulationManager.nodeCreated(internals.childID, sendingclient);
                }

                xapi.sendStatement(sendingclient.loginData.UID, xapi.verbs.rezzed, childID, childComponent.properties ? childComponent.properties.DisplayName : "", null, self.id);
                self.state.createdChild(message.node, message.member, childComponent, function()
                {
                    //console.log('returned from createChild');
                    //console.log(internals);
                    cb2(internals);
                });
                return internals; // must return here because cb2 is called by the state
            }
            if (message.action == 'simulationStateUpdate')
            {
                //self.state.simulationStateUpdate(message.parameters);
                //record all updates - we'll post on tick
                for (var i in message.parameters)
                {
                    if(!self.simulationStateUpdates[i])
                        self.simulationStateUpdates[i] = {};

                    var values = message.parameters[i];
                    for(var j in values)
                    {
                        if(message.time >= this.propertySetTime(i,j))
                        {
                            self.setPropertyTime(i,j,message.time);
                            self.state.satProperty(i,j, values[j]);
                            self.simulationStateUpdates[i][j] = values[j];
                        }else
                        {
                            logger.info("Rejecting old data for " + i + " " + j);
                            console.log(message.time , this.propertySetTime(i,j));
                        }
                    }
                }
                internals.doReflect = false;
                cb2(internals);
                return internals;
            }
            ////console.log(now() - lasttime + " inner loop ms");
            cb2(internals);
            return internals;
        }
        catch (e)
        {
            //safe to catch and continue here
            logger.error('Error in reflector: onMessage');
            logger.error(e);
            logger.error(e.stack);
            cb2(internals);
            return internals;
        }
    }
    this.reflect_message = function(self, message, sendingclient, internals, cb2)
    {
        var doReflect = internals.doReflect;
        if (!doReflect)
        {
            cb2();
            return;
        }

        var lasttime = now();
        var compressedMessage = self.messageCompress.pack(message);
                //distribute message to all clients on given instance
        //for now, we need better filtering of messages. 
        //var concernedClients = self.simulationManager.getClientsForMessage(message, sendingclient)
        for (var i in self.clients)
            {
            var client = self.clients[i];
                //if the message was get state, then fire all the pending messages after firing the setState
                if (message.action == "getState" && client.pending == true)
                {
                self.Log('Got State', 2);
                if (self.requestTimer)
                    self.requestTimer.deleteMe();
                    var state = message.result;
                self.status = STATUS.DEFAULT;
                self.state.setVWFDef(JSON.parse(JSON.stringify(state)));
                self.messageClient(client,
                    {
                        "action": "status",
                        "parameters": ["State Received, Transmitting"],
                    "time": self.getStateTime
                    }, false, false)
                self.messageClient(client,
                    {
                        "action": "setState",
                        "parameters": [state],
                    "time": self.getStateTime
                    }, true, true)
                client.pending = false;
                self.trigger('stateSent');
                }
            else
                {
                if(message.member == "latencyTest" && client == sendingclient)
                    {
                    self.messageClient(client, compressedMessage, false, false);   
                        }
                else if (client == sendingclient && ( message.action == "createChild" || message.action == "deleteNode" ||  message.action == "setProperty" || message.action == "dispatchEvent" || message.action == "callMethod" || message.action == "fireEvent"))
                        {
                //    client has already processed own inputs - dont' send back to sender;
                        }
                else
                {
                    self.messageClient(client, compressedMessage, false, false);
                }
            }
        }
        
        if(internals.then)
        {
            internals.then();
        }
        ////console.log(now() - lasttime + " reflect ms");
        cb2();
    }
    this.clientCountForUser = function(userID)
    {
        var count = 0;
        for (var i in this.clients)
        {
            if (this.clients[i] && this.clients[i].loginData && this.clients[i].loginData.UID == userID)
            {
                count++;
            }
        }
        return count;
    }
    this.disconnect = function(client)
    {
        logger.info(client.id);
        logger.info(Object.keys(this.clients));
        this.removeClient(client);
        logger.info(this.clientCount());
        xapi.sendStatement(client.loginData.UID, xapi.verbs.left, this.id, this.metadata.title, this.metadata.description, this.id);
        if (!client.anonymous)
        {
            var avatar = this.state.getAvatarForClient(client.loginData.UID);
            if (avatar)
            {
                var avatarDef = this.state.getClientNodeDefinition(avatar.id);
                client.updateAvatar(avatarDef);
            }
        }
        if (this.clientCount() == 0)
        {
            this.shutdown();
        }
        else
        {
                var loginData = client.loginData;
                logger.debug(client.id, loginData, 2)
                //thisInstance.clients[socket.id] = null;
                //if it's the last client, delete the data and the timer
                //message to each user the join of the new client. Queue it up for the new guy, since he should not send it until after getstate
                this.messageDisconnection(client.id, client.loginData ? client.loginData.Username : null);
            this.simulationManager.removeClient(client)
                if (loginData && loginData.clients)
                {
                //console.log("Disconnect. Deleting node for user avatar " + loginData.UID);
                    //only delete the avatar if this is the last client owned by the user
                    if (this.clientCountForUser(loginData.UID) == 0)
                    {
                        var avatarID = 'character-vwf-' + loginData.UID;
                        this.state.deletedNode(avatarID);
                    this.simulationManager.nodeDeleted(avatarID);
                        this.messageClients(
                        {
                            "action": "deleteNode",
                            "node": avatarID,
                        "time": this.time()
                        });
                    }
                    this.messageClients(
                    {
                        "action": "callMethod",
                        "node": 'index-vwf',
                        member: 'cameraBroadcastEnd',
                    "time": this.time(),
                        client: client.id
                    });
                    this.messageClients(
                    {
                        "action": "callMethod",
                        "node": 'index-vwf',
                        member: 'PeerSelection',
                        parameters: [
                            [[]]
                        ],
                    "time": this.time(),
                        client: client.id
                    });
                    this.state.deletedNode(avatarID);
                this.simulationManager.nodeDeleted(avatarID);
                }
                this.messageClients(
                {
                    "action": "status",
                    "parameters": ["Peer disconnected: " + (loginData ? loginData.UID : "Unknown")],
                    "time": this.getStateTime
                });
            //console.log('clientcount is ' + this.clientCount());
            //console.log(this.getClientList());
            }
            }
        }
exports.sandboxWorld = sandboxWorld;