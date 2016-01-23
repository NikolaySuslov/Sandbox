var EVENT = 0;
var SEND = 1;
var DISCONNECT = 2;
var CONNECT = 3;
var PING = 4;
var PONG = 5;
var CONSOLE = 6;
var ID = 7;

var totalMessages = 0;
var lastTime = 0;
function socketThreadProxy(host, options)
{
    this.host = host;
    this.options = options;
    this.worker = new Worker("vwf/socketWorker.js");
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
    this.connect = function()
    {
        this.postMessage(
        {
            type: CONNECT,
            host: this.host,
            options: this.options
        });
    }
    this.disconnect = function()
    {
        this.postMessage(
        {
            type: DISCONNECT,
            message: null
        });
    }
    this.send = function(message)
    {
        this.postMessage(
        {
            type: SEND,
            message: message
        });
        totalMessages ++;
        var now = performance.now();
        if ( now - lastTime  > 1000)
        {
            //console.log("Messages per second: " + totalMessages)
            totalMessages = 0;
            lastTime = now;
        }
    }
    this.EVENTS = {
        READY:"clientReady"
    }
    this.event = function(message,param)
    {
        this.postMessage(
        {
            type: EVENT,
            event:{name:message,param:param}
        });
    }
    this.ping = function(message)
    {
        this.postMessage(
        {
            type: PING
        });
    }
    this.pong = function(message)
    {
        console.log('pong');
    }
    this.onMessage = function(e)
    {
        var message = e.data;
       
        if (message.type == EVENT)
        {
            this.trigger(message.event.name, message.event.param);
        }
        if (message.type == ID)
        {
            this.id = message.id;
        }
        if (message.type == PONG)
        {
            this.pong();
        }
        if (message.type == CONSOLE)
        {
            console.log(message.message);
        }
    }
    this.postMessage = function(message)
    {
        try
        {
            this.worker.postMessage(message);
        }
        catch (e)
        {
            this.worker.postMessage(JSON.stringify(message));
        }


    }
    this.worker.onmessage = this.onMessage.bind(this);
    this.ping();
}

define([], function()
{

    return function(url, options)
    {

        return new socketThreadProxy(url, options)
    }
})
