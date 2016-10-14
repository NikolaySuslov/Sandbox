//Get the instance ID from the handshake headers for a socket
var DAL = require('./DAL')
    .DAL;
var sio = require('socket.io');
var fs = require('fs');
var url = require("url");
var mime = require('mime');
var sessions = require('./sessions.js');
var messageCompress = require('../client/lib/messageCompress')
    .messageCompress();   //note! We're calling the construtor here, so this file has just one instance
var connect = require('connect'),
    parseSignedCookie = connect.utils.parseSignedCookie,
    cookie = require('express/node_modules/cookie');
YAML = require('js-yaml');
var logger = require('./logger');
var xapi = require('./xapi');

var sandboxWorld = require('./sandboxWorld').sandboxWorld;
var sandboxClient = require('./sandboxClient').sandboxClient;
var DBstateToVWFDef = require('./sandboxState').DBstateToVWFDef;

function startup(listen)
{
    //create socket server
    logger.info('startup reflector', 0);
    sio = sio(listen,
    {
        log: false,
        //VWF requries websocket. We will not allow socket.io to fallback on flash or long polling
        'transports': ['websocket'],
        //Somehow, we still need to get the timeouts lower. This does tot seem to do it.
        'heartbeat interval': 20,
        'heartbeat timeout': 30
    });
    //assoicate the session information from the handshake with the socket.
    //this is a touch tricky, because we need to manually do the session decrypt from the cookie     
    sio.use(function(socket, next)
    {
        var handshake = socket.request;
        socket.handshake = handshake;
        if (handshake.headers.cookie)
        {
            // save parsedSessionId to handshakeData
            try
            {
                handshake.cookieData = parseSignedCookie(cookie.parse(handshake.headers.cookie)['session'],
                    global.configuration.sessionSecret ? global.configuration.sessionSecret : 'unsecure cookie secret');
            }
            catch (e)
            {
                //this is important! We're seeing a few crashes from here.
                console.error(e);
                next();
                return;
            }
        }
        next();
    })
    //When there is a new connection, goto WebSocketConnection.
    sio.on('connect', WebSocketConnection);
}

function setDAL(dal)
{
    DAL = dal;
}
//find in the handshake of the socket the information about what instance to connect to
function getNamespace(socket)
{
    try
    {
        var referer = require('url')
            .parse(socket.handshake.url)
            .query;
        referer = require('querystring')
            .parse(referer)
            .pathname;
        var namespace = referer;
        if(!namespace) return null;
        if (namespace[namespace.length - 1] != "/")
            namespace += "/";
        //account for customizable client url
        namespace = namespace.replace(global.appPath, '/adl/sandbox');
        namespace = namespace.substr(namespace.indexOf("/adl/"));
        namespace = namespace.replace(/[\\\/]/g, '_');
        logger.warn(namespace);
        return namespace;
    }
    catch (e)
    {
        return null;
    }
}

function ServeSinglePlayer(socket, namespace, instancedata)
{
    logger.info('single player', 2);
    var instance = namespace;
    var state = SandboxAPI.getState(instance, function(state)
    {
        if (!state)
        {
            logger.warn('creating new blank world!')
            state = [
            {
                owner: undefined
            }];
        }
        DBstateToVWFDef(state, instancedata, function(scene)
        {
            socket.emit('m',
            {
                "action": "setState",
                "parameters":  {nodes:[scene],kernel:{time:0},annotations:{"1":"application"}},
                "time": 0
            });
            var joinMessage = messageCompress.pack(
            {
                "action": "fireEvent",
                "parameters": ["clientConnected", [socket.id, socket.loginData.Username, socket.loginData.UID]],
                node: "index-vwf",
                "time": 0
            });

            var clients = {};
            clients[socket.id] = {cid:socket.id,name:socket.loginData.Username,UID:socket.loginData.UID,cameraID:null,focusID:'index-vwf'};
            
            var setMessage = {
                "action": "setProperty",
                "member": "clients",
                "parameters":[clients],
                node: "index-vwf",
                "time": .1
            };
            socket.emit('m', setMessage);
            socket.emit('m', joinMessage);
			socket.emit('m', messageCompress.pack(
            {
                "action": "startSimulating",
                "parameters": ["index-vwf"],
                "time": 0
            }));
            var tempState = (new(require('./sandboxState').sandboxState)("",
            {}));


            if (instancedata.publishSettings && instancedata.publishSettings.createAvatar)
            {
               
                tempState.getAvatarDef(socket.loginData.UID, socket.id, function(avatar)
                {
                    var createAvatarMessage = {
                        action: "createChild",
                        node: "index-vwf",
                        member: socket.loginData.UID,
                        parameters: [avatar, null],
                        time: 0
                    };
                    socket.emit('m', createAvatarMessage);
                    socket.emit('m',
                    {
                        "action": "goOffline",
                        "parameters": [scene],
                        "time": 0
                    });
                    socket.pending = false;
                });
            }
            else
            {
                socket.emit('m',
                {
                    "action": "goOffline",
                    "parameters": [scene],
                    "time": 0
                });
                socket.pending = false;
            }


        });
    });
}

function WebSocketConnection(socket, _namespace)
{
    //get the session information for the socket
    sessions.GetSessionData(socket.handshake, function(loginData)
    {
        //fill out some defaults if we did not get credentials
        //note that the client list for an anonymous connection may only contain that once connection
        console.log(loginData);
        socket.loginData = loginData ||
        {
            Username: "Anonymous",
            UID: "Anonymous",
            clients: [socket.id],
            anonymous: true
        };
        if (!socket.loginData.UID && socket.loginData.Username)
            socket.loginData.UID = socket.loginData.Username;
        var namespace = _namespace || getNamespace(socket);
        //let the data viewer tool connect, but wait for it to tell us what namespace to join 
        if (namespace && namespace.indexOf('_adl_dataview_') == 0)
        {
            socket.on('setNamespace', function(msg)
            {
                logger.info(msg.space, 2);
                WebSocketConnection(socket, msg.space.replace(/[\\\/]/g, '_'));
                socket.emit('namespaceSet',
                {});
            });
            return;
        }
        socket.on('connectionTest', function(msg)
        {
            socket.emit('connectionTest', msg);
        })
        if(namespace)
        DAL.getInstance(namespace, function(instancedata)
        {
            if (!instancedata)
            {
                require('./examples.js')
                    .getExampleMetadata(namespace, function(instancedata)
                    {
                        if (instancedata)
                        {
                            xapi.sendStatement(socket.loginData.UID, xapi.verbs.joined, namespace, instancedata.title, instancedata.description, namespace);
                            //if this is a single player published world, there is no need for the server to get involved. Server the world state and tell the client to disconnect
                            if (instancedata && instancedata.publishSettings && instancedata.publishSettings.singlePlayer)
                            {
                                ServeSinglePlayer(socket, namespace, instancedata)
                                return;
                            }
                            else
                            {
                                ClientConnected(socket, namespace, instancedata);
                                return;
                            }
                        }
                        else
                        {
                            socket.disconnect();
                            return;
                        }
                    });
                return;
            }
            if (instancedata)
            {
                xapi.sendStatement(socket.loginData.UID, xapi.verbs.joined, namespace, instancedata.title, instancedata.description, namespace);
            }
            //if this is a single player published world, there is no need for the server to get involved. Server the world state and tell the client to disconnect
            if (instancedata && instancedata.publishSettings && instancedata.publishSettings.singlePlayer)
            {
                ServeSinglePlayer(socket, namespace, instancedata)
            }
            else
                ClientConnected(socket, namespace, instancedata);
        });
    });
};

function runningInstanceList()
{
    this.instances = {};
    this.add = function(world)
    {
        //send a signal to the parent process that we are hosting this instance
        if (global.configuration.cluster)
        {
            var message = {};
            message.type = 'state';
            message.action = 'add';
            message.args = [world.id];
            process.send(message);
        }
        this.instances[world.id] = world;
    }
    this.remove = function(id)
    {
        //send a signal to the parent process that we are hosting this instance
        if(global.configuration.cluster && this.instances[id])
        {
            var message = {};
            message.type = 'state';
            message.action = 'remove';
            message.args = [id];
            process.send(message);
        }
        delete this.instances[id];
    }
    this.get = function(id)
    {
        return this.instances[id];
    }
    this.has = function(id)
    {
        return this.instances[id] ? true : false;
    }
}
var RunningInstances = new runningInstanceList();
global.instances = RunningInstances;

function ClientConnected(socket, namespace, instancedata)
{
    console.log('ClientConnected');
    //if it's a new instance, setup record 
    if (!RunningInstances.has(namespace))
    {
        logger.warn('adding new instance' + namespace)
        var world = new sandboxWorld(namespace, instancedata);
        RunningInstances.add(world);
        world.on('shutdown', function()
        {
            RunningInstances.remove(this.id);
        })
    }
    var thisInstance = RunningInstances.get(namespace);
    var client = new sandboxClient(socket);
    thisInstance.clientConnected(client);
} // end WebSocketConnection

exports.WebSocketConnection = WebSocketConnection;
exports.setDAL = setDAL;
exports.startup = startup;
exports.closeInstance = function(id)
{
    var instance = RunningInstances.get(id);
    if (instance)
    {
        instance.shutdown();
        RunningInstances.remove(instance);
    }
    
}
