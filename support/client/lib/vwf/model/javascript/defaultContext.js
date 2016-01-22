function defaultContext()
{
    this.setProperty = function(id, name, val)
    {
        var now = performance.now();
        //here's the magic. If we are not the client simulating the node, send over the reflector
        if (Engine.isSimulating(id))
        {
            if (inTick)
                Engine.setPropertyFast(id, name, val);
            else
                Engine.setProperty(id, name, val);
        }
        else
            Engine.emit.setProperty(id, name, val);
        if (!propertiesSet[name])
            propertiesSet[name] = 0;
        propertiesSet[name] += (performance.now() - now);
    }
    this.getProperty = function(id, name)
    {
        if (inTick)
            return Engine.getPropertyFast(id, name);
        else
            return Engine.getProperty(id, name);
    }
    this.postUpdates = function()
    {
        throw new Error('Should never get here!')
    }
    this.callMethod = function(id, methodname, params)
    {
        if (jsDriverSelf.isPendingDelete(id)) return;
        //node that this forces sync!
        if (Engine.isSimulating(id))
            return Engine.callMethod(id, methodname, params);
        else
            return Engine.emit.callMethod(id, methodname, params);
    }
    this.fireEvent = function(id, eventName, params)
    {
        if (Engine.isSimulating(id))
            Engine.fireEvent(id, eventName, params);
        else
            Engine.emit.fireEvent(id, methodname, params);
    }
    this.createChild = function(id, childname, childdef, childuri, callback)
    {
        if (Engine.isSimulating(id))
            Engine.createChild(id, childname, childdef, childuri, callback);
        else
            Engine.emit.createChild(id, childname, childdef, childuri, callback);
    }
    this.deleteNode = function(id)
        {
            if (Engine.isSimulating(id))
                Engine.deleteNode(id);
            else
                Engine.emit.deleteNode(id);
        }
        //this is also where we should be notifiying the refelector of new methods, events, properties and nodes
}
define([], function()
{
    return defaultContext;
})