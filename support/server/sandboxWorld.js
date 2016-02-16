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
var GUID = require('node-uuid').v4;
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
                    this.world.getStateTime = this.world.time;
                    //update 11/2/14
                    //if the last loadclient does not respond, pick a new client randomly
                    loadClient.emit('message', messageCompress.pack(JSON.stringify(
                    {
                        "action": "getState",
                        "respond": true,
                        "time": this.world.time
                    })));
                    socket.emit('message', messageCompress.pack(JSON.stringify(
                    {
                        "action": "status",
                        "parameters": ["Did not get state, resending request."],
                        "time": this.world.time
                    })));
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
                            client.emit('message', messageCompress.pack(JSON.stringify(
                            {
                                "action": "status",
                                "parameters": ["State Not Received, Transmitting default"],
                                "time": this.namespace.getStateTime
                            })));
                            client.emit('message', messageCompress.pack(JSON.stringify(
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
                            })));
                            client.pending = false;
                            for (var j = 0; j < client.pendingList.length; j++)
                            {
                                client.emit('message', client.pendingList[j]);
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
    this.time = 0.0;
    this.state = {};
    this.metadata = metadata;
    this.allowAnonymous = false;
    this.status = STATUS.DEFAULT;
    if (this.metadata.publishSettings && this.metadata.publishSettings.allowAnonymous)
        this.allowAnonymous = true;
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
        logger.warn('Shutting down ' + this.id)
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
    this.messageClient = function(client, message, ignorePending, resolvePending)
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
                        __client.emit('message', __message);
                    }, global.latencySim)
                })(client, message);
            }
            else
            {
                client.emit('message', message);
            }
        }
        else
        {
            client.pendingList.push(message)
        }
        if (resolvePending)
        {
            if (client.pending)
            {
                for (var j = 0; j < client.pendingList.length; j++)
                {
                    client.emit('message', client.pendingList[j]);
                }
                client.pendingList = [];
                client.pending = false;
            }
        }
    }
    this.messageClients = function(message, ignorePending, resolvePending)
    {
        try
        {
            if (message.constructor != String)
            {
                message.instance = this.id;
                if (!message.time)
                    message.time = this.time;
                message = JSON.stringify(message);
            }
            //message to each user the join of the new client. Queue it up for the new guy, since he should not send it until after getstate
            var packedMessage = messageCompress.pack(message);
            for (var i in this.clients)
            {
                this.messageClient(this.clients[i], packedMessage, ignorePending, resolvePending);
            }
        }
        catch (e)
        {
            console.log(e)
        }
    }
    this.messageConnection = function(id, name, UID)
    {
        var joinMessage = {
            "action": "fireEvent",
            "parameters": ["clientConnected", [id, name, UID]],
            node: "index-vwf",
            "time": this.time
        };
        this.messageClients(joinMessage);
    }
    this.messageDisconnection = function(id, name, UID)
    {
        var joinMessage = {
            "action": "fireEvent",
            "parameters": ["clientDisconnected", [id, name, UID]],
            node: "index-vwf",
            "time": this.time
        };
        this.messageClients(joinMessage);
    }
    this.GetNextAnonName = function(socket)
    {
        return "Anonymous_" + socket.id
    }
    this.resyncCounter = 0;
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
                self.time += .05;
                self.ticknum++;
                var tickmessage = {
                    "action": "tick",
                    "parameters": [],
                    "time": self.time,
                    "origin": "reflector",
                };
                self.messageClients(tickmessage);
                self.resyncCounter++;
                if (self.resyncCounter == 10)
                {
                    self.resyncCounter = 0;
                    var syncClient = self.getLoadClient();
                    var syncmessage = messageCompress.pack(JSON.stringify(
                    {
                        "action": "activeResync",
                        "parameters": [],
                        "time": self.time, //mark so the client will process before any ticks
                        "respond": true,
                        "origin": "reflector",
                    }));
                    if (syncClient)
                        syncClient.emit('message', syncmessage)
                }
            }
            self.lasttime = now;
        }.bind(self);
        self.timerID = setInterval(timer, 5);
        console.warn("timer is " + self.timerID)
    }
    this.firstConnection = function(socket, cb)
    {
        logger.info('load from db', 2);
        socket.emit('message', messageCompress.pack(JSON.stringify(
        {
            "action": "status",
            "parameters": ["Loading state from database"],
            "time": this.time
        })));
        var instance = this.id;
        //Get the state and load it.
        //Now the server has a rough idea of what the simulation is
        var self = this;
        this.state = new sandboxState(this.id, this.metadata, this);
        this.status = STATUS.PENDING_LOAD;
        this.state.on('loaded', function()
        {
            self.status = STATUS.DEFAULT;
            var scene = self.state.getVWFDef();


            self.messageClients(
            {
                "action": "status",
                "parameters": ["State loaded, sending..."],
                "time": self.time
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
                "time": self.time
            }, true, true);


            self.messageClients(
            {
                "action": "fireEvent",
                "parameters": ["loaded", []],
                node: "index-vwf",
                "time": self.time
            }, false, false);

            self.startTimer();
            cb();
        })
    }
    this.messagePeerConnected = function()
    {
        for (var i in this.clients)
        {
            this.clients[i].emit('message', messageCompress.pack(JSON.stringify(
            {
                "action": "status",
                "parameters": ["Peer Connected"],
                "time": this.time
            })));
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
        if (this.clientCount() == 1)
        {
            var self = this;
            this.firstConnection(client, function()
            {
                //this must come after the client is added. Here, there is only one client
                self.messageConnection(client.id, client.loginData ? client.loginData.Username : "", client.loginData ? client.loginData.UID : "");

                var needAvatar = self.state.metadata.publishSettings.createAvatar;
                if (!self.state.metadata.publishSettings.allowAnonymous && client.loginData.anonymous)
                    needAvatar = false;
                if (needAvatar && !self.state.getAvatarForClient(client.loginData.UID))
                    self.state.createAvatar(client.loginData.UID, client.id);
            });
        }
        //this client is not the first, we need to get the state and mark it pending
        else
        {
            //if we're loading the files, or waiting for state, then this new client must be at least the 2nd,
            //possilby the 3rd. Eitherway, state will come from either the load or the getState, so just
            //place this client on the list
            if (this.status == STATUS.DEFAULT)
            {
                this.requestState();
                //loadClient.pending = true;
                client.emit('message', messageCompress.pack(JSON.stringify(
                {
                    "action": "status",
                    "parameters": ["Requesting state from clients"],
                    "time": this.getStateTime
                })));
            }
            //the below message should now queue for the pending socket, fire off for others
            this.messageConnection(client.id, client.loginData ? client.loginData.Username : "", client.loginData ? client.loginData.UID : "");


            var needAvatar = this.state.metadata.publishSettings.createAvatar;
            if (!this.state.metadata.publishSettings.allowAnonymous && client.loginData.anonymous)
                needAvatar = false;

            if (needAvatar)
            {
                if (!this.state.getAvatarForClient(client.loginData.UID))
                    this.state.createAvatar(client.loginData.UID, client.id);
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
    }
    this.requestState = function()
    {
        var loadClient = this.getLoadClient();
        logger.info('load from client', 2);
        //  socket.pending = true;
        this.getStateTime = this.time;
        loadClient.emit('message', messageCompress.pack(JSON.stringify(
        {
            "action": "status",
            "parameters": ["Server requested state. Sending..."],
            "time": this.getStateTime
        })));
        //here, we must reset all the physics worlds, right before who ever firstclient is responds to getState. 
        //important that nothing is between
        loadClient.emit('message', messageCompress.pack(JSON.stringify(
        {
            "action": "getState",
            "respond": true,
            "time": this.time,
            "origin": "reflector"
        })));
        this.Log('GetState from Client', 2);
        if (!this.requestTimer)
            this.requestTimer = new timeout(this);

        this.status = STATUS.PENDING_STATE;
    }
    this.message = function(msg, sendingclient)
    {
        try
        {
            //need to add the client identifier to all outgoing messages
            try
            {
                var message = JSON.parse(messageCompress.unpack(msg));
                message.time = this.time;
            }
            catch (e)
            {
                return;
            }
            //logger.info(message);
            message.client = sendingclient.id;
            if (message.action == "saveStateResponse")
            {
                SaveInstanceState(this.id, message.data, sendingclient);
                return;
            }

            //do not accept messages from clients that have not been claimed by a user
            //currently, allow getstate from anonymous clients
            if (!this.state.metadata.publishSettings.allowAnonymous && sendingclient.loginData.anonymous && message.action != "getState" && message.member != "latencyTest")
            {
                return;
            }

            //route callmessage to the state to it can respond to manip the server side copy
            if (message.action == 'callMethod')
                this.state.calledMethod(message.node, message.member, message.parameters);

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
                    this.clients[textmessage.receiver].emit('message', messageCompress.pack(JSON.stringify(message)));
                if (textmessage.sender)
                    this.clients[textmessage.sender].emit('message', messageCompress.pack(JSON.stringify(message)));
                return;
            }
            // only allow users to hang up their own RTC calls
            var rtcMessages = ['rtcCall', 'rtcVideoCall', 'rtcData', 'rtcDisconnect'];
            if (message.action == 'callMethod' && message.node == 'index-vwf' && rtcMessages.indexOf(message.member) != -1)
            {
                var params = message.parameters[0];
                // allow no transmitting of the 'rtc*Call' messages; purely client-side
                if (rtcMessages.slice(0, 2)
                    .indexOf(message.member) != -1)
                    return;
                // route messages by the 'target' param, verifying 'sender' param
                if (rtcMessages.slice(2)
                    .indexOf(message.member) != -1 &&
                    params.sender == sendingclient.id
                )
                {
                    var client = this.clients[params.target];
                    if (client)
                        client.emit('message', messageCompress.pack(JSON.stringify(message)));
                }
                return;
            }
            //We'll only accept a setProperty if the user has ownership of the object
            if (message.action == "deleteNode" || message.action == "createMethod" || message.action == "createProperty" || message.action == "createEvent" ||
                message.action == "deleteMethod" || message.action == "deleteProperty" || message.action == "deleteEvent" || message.action == "setProperty")
            {
                if (!this.state.validate(message.action, message.node, sendingclient))
                {
                    return;
                }

            }
            if (message.action == "setProperty")
                this.state.satProperty(message.node, message.member, message.parameters[0]);
            //We'll only accept a deleteNode if the user has ownership of the object
            if (message.action == "deleteNode")
            {
                var displayname = this.state.getProperty(message.node, 'DisplayName');
                this.state.deletedNode(message.node)
                xapi.sendStatement(sendingclient.loginData.UID, xapi.verbs.derezzed, message.node, displayname || message.node, null, this.id);
            }
            //We'll only accept a createChild if the user has ownership of the object
            //Note that you now must share a scene with a user!!!!
            if (message.action == "createChild")
            {
                var childComponent = JSON.parse(JSON.stringify(message.parameters[0]));
                if (!this.state.validateCreate(message.node, message.member, childComponent, sendingclient))
                {
                    return;
                }
                var childID = this.state.createdChild(message.node, message.member, childComponent)
                xapi.sendStatement(sendingclient.loginData.UID, xapi.verbs.rezzed, childID, childComponent.properties.DisplayName, null, this.id);


            }
            message.instance = this.id;
            var compressedMessage = messageCompress.pack(JSON.stringify(message))
                //distribute message to all clients on given instance
            for (var i in this.clients)
            {
                var client = this.clients[i];
                //if the message was get state, then fire all the pending messages after firing the setState
                if (message.action == "getState" && client.pending == true)
                {
                    this.Log('Got State', 2);
                    if (this.requestTimer)
                        this.requestTimer.deleteMe();
                    var state = message.result;

                    this.status = STATUS.DEFAULT;

                    this.state.setVWFDef(JSON.parse(JSON.stringify(state)));

                    this.messageClient(client,
                    {
                        "action": "status",
                        "parameters": ["State Received, Transmitting"],
                        "time": this.getStateTime
                    }, false, false)

                    this.messageClient(client,
                    {
                        "action": "setState",
                        "parameters": [state],
                        "time": this.getStateTime
                    }, true, true)
                }
                else if (message.action == "activeResync")
                {
                    //here we deal with continual resycn messages
                    if (!message.result)
                        return;
                    var node = message.result.node;

                    if (false && !global.configuration.disableResync && node)
                    {
                        if (message.time >= this.time)
                        {
                            delete node.children; //remove children or we could end up getting large trees
                            this.messageClients(
                            {
                                "action": "resyncNode",
                                "parameters": [node.id, node],
                                "time": this.time, //process before any ticks
                                "origin": "reflector"
                            });
                        }
                        else
                        {
                            logger.info('rejecting resync data from the past');
                            logger.info(message.time, this.time);
                        }
                    }
                }
                else
                {
                    this.messageClient(client, compressedMessage, false, false);
                }
            }
        }
        catch (e)
        {
            //safe to catch and continue here
            logger.error('Error in reflector: onMessage');
            logger.error(e);
            logger.error(e.stack);
        }
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
                var avatarDef = this.state.getNodeDefinition(avatar.id);
                client.updateAvatar(avatarDef);
            }
        }

        if (this.clientCount() == 0)
        {
            this.shutdown();
        }
        else
        {
            try
            {
                var loginData = client.loginData;
                logger.debug(client.id, loginData, 2)
                //thisInstance.clients[socket.id] = null;
                //if it's the last client, delete the data and the timer
                //message to each user the join of the new client. Queue it up for the new guy, since he should not send it until after getstate
                this.messageDisconnection(client.id, client.loginData ? client.loginData.Username : null);
                if (loginData && loginData.clients)
                {
                    console.log("Disconnect. Deleting node for user avatar " + loginData.UID);

                    //only delete the avatar if this is the last client owned by the user
                    if (this.clientCountForUser(loginData.UID) == 0)
                    {
                        var avatarID = 'character-vwf-' + loginData.UID;
                        this.state.deletedNode(avatarID);
                        this.messageClients(
                        {
                            "action": "deleteNode",
                            "node": avatarID,
                            "time": this.time
                        });
                    }
                    this.messageClients(
                    {
                        "action": "callMethod",
                        "node": 'index-vwf',
                        member: 'cameraBroadcastEnd',
                        "time": this.time,
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
                        "time": this.time,
                        client: client.id
                    });
                    this.state.deletedNode(avatarID);
                }
                this.messageClients(
                {
                    "action": "status",
                    "parameters": ["Peer disconnected: " + (loginData ? loginData.UID : "Unknown")],
                    "time": this.getStateTime
                });
                console.log('clientcount is ' + this.clientCount());
                console.log(this.getClientList());
            }
            catch (e)
            {
                logger.error('error in reflector disconnect')
                logger.error(e.message);
            }
        }
    }
}
exports.sandboxWorld = sandboxWorld;