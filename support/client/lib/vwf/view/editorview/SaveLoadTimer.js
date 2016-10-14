define({
	initialize:function()
	{
		
		
	
		//don't even start the timer for published worlds
		if(_DataManager.getInstanceData().publishSettings.persistence)
			window.setTimeout(function(){_DataManager.saveTimer();},60000);	

		if(_DataManager.getInstanceData().publishSettings.persistence)
		{
			window.onbeforeunload = function(e){
				//user must exist
				if(_UserManager.GetCurrentUserName() && _DataManager.getInstanceData().publishSettings.persistence)
				{
					_DataManager.saveToServer(true);
					var returnStr = "Are you sure you want to leave this Sandbox world?";
					return returnStr;
					e.returnValue = returnStr;
				}		
			};
		}
		$(window).unload(function ()
		{
			Engine.close();
		});
	}
});