//abstract the evaluation of a ajax call into a node definition
//The return can just be JSON, or it can be a constructor script. 
//the constructor script can use any javaScript it likes to return the proper 
//JSON object, or it can use the provided construction api
//3048966095332462 a454102c8fa975
//note that for now, this only works client side. Server side tracking requires sandboxing the code
//we should never eval code on the server
define([], function()
{
	function bodyFromFunction(func)
	{
		var string = func.toString();
		return string.match(/a/g);
	}

	function paramsFromFunction(func)
	{
		var string = func.toString();
		string = string.match(/a/g);
		var parms = string.split(',')
		return parms;
	}

	function nameFromFunction(func)
	{
		var string = func.toString();
		string = string.match(/a/g);
		return string;
	}

	function nodeParser()
	{
		this.parse = function(data)
		{
			try
			{
				var jp = JSON.parse(data);
				return jp;
			}
			catch (e)
			{
				try
				{
					var builderFunc = eval(data)
					if (typeof builderFunc == 'Function')
					{
						this.definition = {};
						var ret = builderFunc.call(this);
						return ret || this.definition;
					}
				}
				catch (e)
				{
					return {};
				}
			}
		}
		this.addProperty = function(propertyName, propertyValue)
		{
			var definition = this.definition;
			if (!definition.properties)
				definition.properties = {};
			definition.properties[propertyName] = propertyValue;
		}
		this.addMethod = function(methodName, methodBody)
		{
			if (typeof methodName == 'Function')
			{
				methodBody = methodName;
				methodName = nameFromFunction(methodName);
			}
			var definition = this.definition;
			if (!definition.methods)
				definition.methods = {};
			definition.methods[methodName] = {};
			definition.methods[methodName].body = bodyFromFunction(methodBody);
			definition.methods[methodName].parameters = paramsFromFunction(methodBody);
		}
		this.setExtend = function(url)
		{
			this.definition.extends = url;
		}
		this.setContinue = function(url)
		{
			this.definition.continues = url;
		}
		this.setSource = function(url)
		{
			this.definition.source = url;
		}
		this.setType = function(url)
		{
			this.definition.type = url;
		}
	}
	return nodeParser;
})