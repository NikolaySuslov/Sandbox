//when a function is called, a context is created to observe changes. When the funtion return, we post changes to Engine.
function executionContext(parentContext, id, type, member)
{
	this.touchedProperties = {};
	this.parent = parentContext;
	this.type = type;
	this.id = id;
	this.member = member;
}
executionContext.TYPE = {
	SET_PROPERTY: 0,
	CALL_METHOD: 1,
	FIRE_EVENT: 2,
	HANDLE_EVENT: 3,
	CREATE_CHILD: 4,
	DELETE_NODE: 5,
	TICK: 6
}
executionContext.prototype.setProperty = function(id, name, val)
{
	if (!this.touchedProperties[id + name])
		this.touchedProperties[id + name] = {
			id: id,
			name: name,
			val: null,
			originalVal: null
		}
	this.touchedProperties[id + name].val = val;
}
executionContext.prototype.getProperty = function(id, name)
{
	if (this.touchedProperties[id + name])
		return this.touchedProperties[id + name].val;
	else
	{
		if (this.parent && this.parent instanceof executionContext)
		{
			var val = this.parent.getProperty(id, name);
			if (val)
				return val;
		}
		if (inTick)
			var val = Engine.getPropertyFast(id, name);
		else
			val = Engine.getProperty(id, name);
		this.touchedProperties[id + name] = {
			id: id,
			name: name,
			val: val,
			originalVal: null
		}
		if (!(typeof(val) == "string" || typeof(val) == "number" || typeof(val) == "boolean" || val == null || val == undefined))
			this.touchedProperties[id + name].originalVal = JSON.parse(JSON.stringify(this.touchedProperties[id + name].val));
		else
			this.touchedProperties[id + name].originalVal = val;
		this.touchedProperties[id + name].val = val;
		return val;
	}
}
executionContext.prototype.postUpdates = function()
{
	//debugger;
	var parentRoot = !(this.parent instanceof executionContext)
	var keys = Object.keys(this.touchedProperties)
	for (var k = 0; k < keys.length; k++)
	{
		var i = keys[k];
		if (parentRoot)
		{
			if (!(Object.deepEquals(this.touchedProperties[i].val, this.touchedProperties[i].originalVal)))
				this.parent.setProperty(this.touchedProperties[i].id, this.touchedProperties[i].name, this.touchedProperties[i].val);
		}
		else
		{
			this.parent.touchedProperties[i] = this.touchedProperties[i];
		}
	}
}
executionContext.prototype.callMethod = function(id, methodname, params)
{
	return this.parent.callMethod(id, methodname, params);
}
executionContext.prototype.fireEvent = function(id, eventName, params)
{
	this.parent.fireEvent(id, eventName, params);
}
executionContext.prototype.createChild = function(id, childname, childdef, childuri, callback)
{
	this.parent.createChild(id, childname, childdef, childuri, callback);
}
executionContext.prototype.deleteNode = function(id)
{
	this.parent.deleteNode(id);
}
define([], function()
{
	return executionContext;
})