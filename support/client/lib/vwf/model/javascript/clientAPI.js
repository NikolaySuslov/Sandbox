define(["vwf/model/javascript/api/client",
	"vwf/model/javascript/api/trace",
	"vwf/model/javascript/api/physics",
	"vwf/model/javascript/api/audio",
	"vwf/model/javascript/api/transform"], function(client,trace,physics,audio,transform)
{
	
	var APIModules = {
		clientAPI: client,
		physicsAPI: physics,
		traceAPI: trace,
		audioAPI: audio,
		transformAPI: transform 
	}
	return APIModules;
})