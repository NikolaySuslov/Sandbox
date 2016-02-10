define(
{
	initialize: function(div)
	{
		this.popup = null;
		this.open = function()
		{
			if (!this.popup)
				this.popup = window.open(window.location + "/vwf/view/editorview/logger.html", "_blank", "height=500,width=500,location=no,menubar=no,status=no,titlebar=no,toolbar=no");
		}
		this.close = function()
		{
			if (this.popup)
				this.popup.close()
			this.popup = null;
		}
		this.checkWindow = function()
		{
			if (this.popup)
			{
				if (this.popup.closed)
				{
					this.popup = null;
					return false;
				}
				else if ( this.popup.location.toString() !="about:blank" && this.popup.location.toString() !== window.location + "/vwf/view/editorview/logger.html")
				{
					this.popup = null;
					return false;
				}
				else
				{
					return true;
				}
			}
			else
			{
				return false;
			}
		}
		this.setupLogLevels = function()
		{
			var logType = ["log", "info", "warn", "error", "debug"];
			for (var i in logType)
			{
				var self = this;
				(function()
				{
					var func = logType[i];
					self[func] = function(text)
					{

						if (self.checkWindow())
						{
							if(arguments.length ==1 )
								self.popup[func](text);
							else
							{
								var arr = [];
								for(var i in arguments)
									arr.push(arguments[i])
								self.popup[func](arr);
							}
						}
					}
				})()
			}
		}
		this.setupLogLevels();
		window.logger = this;
		$(window).unload(function()
		{
			if(window.logger.popup)
				window.logger.popup.close();
		});
	}
});