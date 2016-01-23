define([], function()
{
	return function(id)
	{
		this.id = id;
		this.getClients = function()
		{
			return jsDriverSelf.getTopContext().getProperty(this.id, "clients");
		}
		this.getUserNameForConnectionID = function(id)
		{
			var clients = this.getClients();
			if (!clients || !clients[id]) return null;
			return clients[id].name;
		}
		this.getConnectionIDForUserName = function(name)
		{
			var clients = this.getClients();
			if (!clients) return null;
			for (var i in clients)
			{
				if (clients[i].name == name)
					return i;
			}
			return null;
		}
		this.getAvatarForUserName = function(name)
		{
			return vwf.callMethod(vwf.application(), "findNodeByID", ['character-vwf-' + name]);
		}
		this.focus = function(cid, nodeID)
		{
			var clients = this.getClients();
			//did the user enter a whole node, not a node ID?
			if (nodeID && nodeID.id)
				nodeID = nodeID.id;
			if (clients[cid])
			{
				clients[cid].focusID = nodeID;
			}
			return val;
		}
		this.getCameraIDForClient = function(id)
		{
			var clients = this.getClients();
			if (!clients || !clients[id]) return null;
			return clients[id].cameraID;
		}
		this.getCameraForClient = function(id)
		{
			var clients = this.getClients();
			if (!clients || !clients[id]) return null;
			return vwf.callMethod(vwf.application(), "findNodeByID", [clients[id].cameraID]);
		}
		this.getClientForCamera = function(id)
		{
			var clients = this.getClients();
			var ret = [];
			if (!clients) return ret;
			for (var i in clients)
			{
				if (clients[i].cameraID == id)
					ret.push(i);
			}
			return ret;
		}
	}
})