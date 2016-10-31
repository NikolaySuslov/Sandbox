function eventSource(symbol)
{
	this.__events = [];
	eventSource.sources[symbol] = this;
	this.on = function(name, callback)
	{
		if (!this.__events[name])
			this.__events[name] = [];
		this.__events[name].push(callback)
	}
	this.removeListener = function(name, callback)
	{
		if (!this.__events[name]) return;
		var index = this.__events[name].indexOf(callback)
		if (index != -1)
			this.__events[name].splice(index, 1);
	}
	this.trigger = function(name, e)
	{
		if (!this.__events[name]) return;
		for (var i = 0; i < this.__events[name].length; i++)
		{
			try{
				this.__events[name][i].apply(this, [e]);
			}catch(e)
			{
				console.error(e);
			}
		}
	}
	this.bind = this.on;
	this.unbind = this.removeListener;
	eventSource.trigger('sourceRegistered', symbol);
}
eventSource.sources = {};
eventSource.call(eventSource);
eventSource.__queued = {};
eventSource.live = function(symbol, eventName, cb)
{
	if (!eventSource.sources[symbol])
	{
		if (!eventSource.__queued[symbol])
			eventSource.__queued[symbol] = {};
		if (!eventSource.__queued[symbol][eventName])
			eventSource.__queued[symbol][eventName] = [];
		eventSource.__queued[symbol][eventName].push(cb);
	}
	else
	{
		eventSource.sources[symbol].on(eventName, cb);
	}
}
eventSource.on('sourceRegistered', function(symbol)
{
	if (eventSource.__queued[symbol])
	{
		for (var eventName in eventSource.__queued[symbol])
		{
			for (var i in eventSource.__queued[symbol][eventName])
			{
				eventSource.sources[symbol].on(eventName, eventSource.__queued[symbol][eventName][i])
			}
		}
	}
	delete eventSource.__queued[symbol];
});
define([], function()
{
	return eventSource;
})