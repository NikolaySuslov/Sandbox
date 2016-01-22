define([], function()
{
	return function(nodeid)
	{
		this.id = nodeid
		this.___findVWFID = function(o)
		{
			if (!o) return null;
			if (o.vwfID) return o.vwfID;
			return this.___findVWFID(o.parent);
		}
		this.___getJSNode = function(o)
		{
			return Engine.models.javascript.nodes[o];
		}
		this.___filterResults = function(results)
		{
			if (!results) return results
			results.node = this.___getJSNode(this.___findVWFID(results.object));
			return results;
		}
		this.___buildOptions = function(options)
		{
			if (!options)
			{
				options = {
					ignore: [],
					filter: null
				}
			}
			for (var i = 0; i < options.ignore.length; i++)
			{
				if (options.ignore[i].constructor == String)
					options.ignore[i] = _Editor.findviewnode(options.ignore[i]);
			}
			options.ignore.push(_Editor.GetMoveGizmo());
			options.ignore.push(_dSky);
			options.oldfilter = options.filter || function()
			{
				return true
			};
			var tself = this;
			options.filter = function(o)
			{
				var ret = true;
				if (options.oldfilter)
				{
					ret = options.oldfilter(tself.___getJSNode(tself.___findVWFID(o)))
				}
				if (o.passable) return false;
				return ret;
			}
			return options;
		}
		this.rayCast = function(origin, direction, options)
		{
			var ret = _SceneManager.CPUPick(origin, direction, this.___buildOptions(options))
			return this.___filterResults(ret);
		}
		this.sphereCast = function(origin, direction, options)
		{
			var ret = _SceneManager.sphereCast(origin, direction, options)
			return this.___filterResults(ret);
		}
		this.frustCast = function(origin, direction, options)
		{
			var ret = _SceneManager.frustCast(origin, direction, options)
			return this.___filterResults(ret);
		}
	}
})