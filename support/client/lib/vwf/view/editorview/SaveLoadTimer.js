define({
	initialize:function()
	{
		
		
		
		//don't even start the timer for published worlds
		if(_DataManager.getInstanceData().publishSettings.persistence)
			window.setTimeout(function(){_DataManager.saveTimer();},60000);	

		if(_DataManager.getInstanceData().publishSettings.persistence)
		{
		 window.onbeforeunload = function(){
			//user must exist
			if(_UserManager.GetCurrentUserName() && _DataManager.getInstanceData().publishSettings.persistence)
			{
				_DataManager.saveToServer(true);
				return "Are you sure you want to leave this Sandbox world?";
			}		
		};
		}
		$(window).unload(function ()
		{
			Engine.close();
		});
	}
});