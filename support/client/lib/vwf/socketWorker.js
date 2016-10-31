var EVENT = 0;
var SEND = 1;
var DISCONNECT = 2;
var CONNECT = 3;
var PING = 4;
var PONG = 5;
var CONSOLE = 6;
var ID = 7;
var host = null;
var options = null;
importScripts("/socket.io/socket.io.js")
var socket;
importScripts("../messageCompress.js")
var socketBytesSentLast = 0;
var socketBytesSent = 0;
var socketBytesReceivedLast = 0;
var socketBytesReceived = 0;
var totalMessagesDecoded = 0;
var totalMessagesEncoded = 0;
var totalEncodeTime = 0;
var totalDecodeTime = 0;
if(!self.performance)
{
	var performance = {
		now:function(){
			return Date.now();
		}
	}
}

//generate the ticks locally, but not on the main thread - which will suspend the timer if the window minimizes
var EngineProxy = {
	time : 0,
	generateTick : function()
    {
    	//this.time += .05;
        var fields = {
            time: this.time,
            action: "tick",
            parameters:[],
            origin:"reflector"
            // callback: callback,  // TODO: provisionally add fields to queue (or a holding queue) then execute callback when received back from reflector
        };
        onEvent("message",fields);
    }	
}

function getUTF8Length(string)
{
	var utf8length = 0;
	for (var n = 0; n < string.length; n++)
	{
		var c = string.charCodeAt(n);
		if (c < 128)
		{
			utf8length++;
		}
		else if ((c > 127) && (c < 2048))
		{
			utf8length = utf8length + 2;
		}
		else
		{
			utf8length = utf8length + 3;
		}
	}
	return utf8length;
}

function log(s)
{
	this.postMessage(
	{
		type: CONSOLE,
		message: s
	});
}

function socketMonitorInterval()
{
	socketBytesSentLast = socketBytesSent;
	socketBytesSent = 0;
	socketBytesReceivedLast = socketBytesReceived;
	socketBytesReceived = 0;
	//log(socketBytesSentLast / 10000 + 'KBps up' + socketBytesReceivedLast / 10000 + 'KBps down');
	//log("Encode Average Time: " + (totalEncodeTime / totalMessagesEncoded));
	//log("Decode Average Time: " + (totalDecodeTime / totalMessagesDecoded));
	//log("Message Compression Load: " + ((totalDecodeTime + totalEncodeTime)/10000).toFixed(4) + "%");

	(totalEncodeTime / totalMessagesEncoded)
	if (totalMessagesDecoded + totalMessagesEncoded > 100)
	{
		totalMessagesDecoded = 0;
		totalMessagesEncoded = 0;
		totalEncodeTime = 0;
		totalDecodeTime = 0;
	}
}

function onEvent(event, param)
{
	this.postMessage(
	{
		type: EVENT,
		event:
		{
			name: event,
			param: param
		}
	});
}
onmessage = function(e)
{
	
	var message = e.data;
	if(message.constructor == String)
		message = JSON.parse(message);
	if (message.type == PING)
		postMessage(
		{
			type: PONG
		})
	if (message.type == CONNECT)
	{
		host = message.host;
		options = message.options;
		socket = io(host, options);
		socket.on('compress',function(e)
		{
			messageCompress.applyLearnedMappings(e)
			//log(e)
		})
		socket.on("m", function(e)
		{
			var message = e;
			socketBytesReceived += 28 + getUTF8Length(message);
			if (message.constructor == String)
			{
				var now = performance.now();
				message = messageCompress.unpack(message);
				totalDecodeTime += performance.now() - now;
				totalMessagesDecoded++
			}
			if(message)
				onEvent("message", message);
		})
		socket.on("t", function(e)
		{
			socketBytesReceived += 16;
            EngineProxy.time = parseFloat(e);
            //onEvent("message", tickmessage);

		});
		socket.on("connect", function(e)
		{
			setInterval(socketMonitorInterval, 10000);
			setInterval(EngineProxy.generateTick.bind(EngineProxy),50);
			postMessage(
			{
				type: ID,
				id: this.id
			})
			onEvent("connect", e);
		})
		socket.on("disconnect", function(e)
		{
			onEvent("disconnect", e);
		})
		socket.on("error", function(e)
		{
			onEvent("error", e);
		})
		socket.connect();
	}
	if (message.type == SEND)
	{
		// Send the message.
		var compressedMessage;
		if (message.message.constructor !== String)
		{
			var now = performance.now();
			compressedMessage = messageCompress.pack(message.message);
			totalEncodeTime += performance.now() - now;
			totalMessagesEncoded++
		}
		socketBytesSent += 34 + getUTF8Length(compressedMessage);
		socket.emit('m',compressedMessage)
		//LOOPBACK for client side prediction, moved out of main thread for performance reasons

		onEvent("message", message.message);
	}
	if (message.type == EVENT)
	{
		socket.emit(message.event.name,message.event.params);
	}
}