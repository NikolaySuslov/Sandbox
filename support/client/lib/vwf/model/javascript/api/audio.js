define([], function()
{
	return function(id)
	{
		this.id = id;
		this.playSound = function(soundURL /* the url of the sound */ , loop /* loop or not */ , volume, restart /* restart at 0 if playing */ )
		{
			Engine.emit.callMethod(Engine.application(), 'playSound', [this.id, soundURL, loop, volume, restart])
		}
		this.stopSound = function(soundURL /* the url of the sound */ )
		{
			Engine.emit.callMethod(Engine.application(), 'stopSound', [this.id, soundURL])
		}
		this.pauseSound = function(soundURL /* the url of the sound */ )
		{
			Engine.emit.callMethod(Engine.application(), 'pauseSound', [this.id, soundURL])
		}
		this.deleteSound = function(soundURL /* the url of the sound */ )
		{
			Engine.emit.callMethod(Engine.application(), 'deleteSound', [this.id, soundURL])
		}
	}
})