var SandboxAPI = require('./sandboxAPI');
var logger = require('./logger');
//we're going to allow the client to request a list of assets the system will need for this scene
//this allows the client to load and parse some stuff before connecting to the server, so it does not build up a load
//of events to process while parsing assets

//note that the state could change between the time that the client gets the list of assets, and the time that the client requests the  state
// this is not really an issue, as the client will just have to load the new assets normally.
function ServeJSON(jsonobject,response,URL)
{
	response.writeHead(200, {
		"Content-Type": "text/json"
	});
	if(jsonobject)
	{
		if (jsonobject.constructor != String)
			response.write(JSON.stringify(jsonobject), "utf8");
		else
			response.write(jsonobject, "utf8");
	}
	response.end();
}

// Walk the whole data structure and pick out the url references
function walk(object, list)
{
	if(object && object.terrainType == "heightmapTerrainAlgorithm")
	{
		// So, we must be in the properties for a terrain object
		//todo - deal with img or bt switch
		var terraindata;
		if(object.terrainParams)
			terraindata = {name:"Terrain",type:"terrain",url:object.terrainParams.url};
		else if(object.url)
		{
			terraindata = {name:"Terrain",type:"terrain",url:object.url};
		}
		if(terraindata)
		{
			list.push(terraindata);
			return;
		}
	}

	for(var i in object)
	{
		if(i == 'parent') {
			continue;
		}
		else if(i == 'source') {
			if(object['type'] && object['type'] != 'link_existing/threejs') {
				list.push({type:object['type'],url:object[i]});
				if(object.properties && object.properties.DisplayName) {
					list[list.length - 1].name = object.properties.DisplayName;
				}
			}
			if(!object['type']) {
				list.push({type: "unknown", url: object[i]});
			}
		}
		else if(i == 'src') {
			if(object['alpha'] !== undefined) {
				list.push({type: 'texture', url: object[i]});
			}
			else {
				list.push({type: "unknown", url: object[i]});
			}
		}
		else if(i == 'url' || i == 'uri') {
			list.push({type:"unknown",url:object[i]});
		}
		else if( i === 'continues' ) {
			// Preload the continues node
			list.push({type:"unknown", url:object[i]});

			// Search for assets in continues node to pre-load them
			var children = object['children'];
			for(var child in children)
			{
				// Criteria to determine if it is an asset, -sas-assets-hhhhhhhh
				var objectNameParts = child.split('-');
				if(objectNameParts.length >= 3) {
					if(objectNameParts[1] === 'sas' && objectNameParts[2] === 'assets') {
						var assetUrl = objectNameParts[3];
						list.push({type:"unknown", url:assetUrl});
					}
				}
			}
		}
		else if(typeof object[i] != 'string') {
			walk(object[i], list);
		}
	}
}

//get all assets from the state data and make unique
function parseStateForAssets(state,cb)
{
	var list = [];
	walk(state,list);

	// Load Additional Assets selected by the User.  We have three ways to do this function;
	// 1) The State file is manually edited to append the assets that are to be preloaded.  The following line shows the
	// 	text that needs to be appended at the end of the State file to load the 7e6084c4 asset.
	//
	// 	"___additionalAssets":["/sas/assets/7e6084c4"]	Note: The variable name starts with three underscore characters
	//
	// 2) The User enter a Url in the properties section of the scene editor.
	//
	// 3) The User selects one or more assets from the list of assets in the properties section of the scene editor
	//
	if(state != null) {
		// Load assets added manually to the state file
		var additionalAssets = state[state.length - 1]? state[state.length - 1]['___additionalAssets'] : [];
		if (additionalAssets !== undefined) {
			for (var idx = 0; idx < additionalAssets.length; idx++) {
				list.push({type: "unknown", url: additionalAssets[idx]});
			}
		}

		// Load assets enter/selected by the User in the properties section of the scene editor
		for(var idx=0; idx < state.length; idx++) {
			// Check for input asset.
			var additionalUrlAsset = state[idx]['additionalUrlAsset'];
			if( (additionalUrlAsset !== null) && (additionalUrlAsset !== undefined))
			{
				list.push({type: "unknown", url: additionalUrlAsset})
			}

			// Check for selected assets.
			var additionalUrlAssetsList = state[idx]['additionalUrlAssetsList'];
			if( (additionalUrlAssetsList !== null) && (additionalUrlAssetsList !== undefined) )
			{
				for(var idy=0; idy < additionalUrlAssetsList.length; idy++)
				{
					list.push({type: "unknown", url: additionalUrlAssetsList[idy]})
				}
			}
		}
	}

	var unique = [];
	for(var i =0; i < list.length; i++)
	{
		var found = false;
		for(var j =0; j < unique.length; j++)
		{
			if(unique[j].url == list[i].url)
			{
				found = true;
				break;
			}
		}
		if(!found)
		{
			unique.push(list[i]);
		}
	}
	cb(unique);
}

//get either the last cached copy of the state, or load it from disk
function getState(id,cb)
{

	if(global.instances && global.instances.get(id) && global.instances.get(id).state)
	{
		var state = global.instances.get(id).state;
		logger.info('getting assets to preload from cached state');
		parseStateForAssets(state,cb);
	}else
	{
		logger.info('getting assets to preload from database state: WARNING - this will not preload avatars!');
		SandboxAPI.getState(id.replace(/\//g,"_"),function(state)
			{
				parseStateForAssets(state,cb);
			});

	}
}
function getAssets(request,response,URL)
{
	var id = URL.query.SID;


	getState(id,function(assets)
	{
		ServeJSON(assets,response,URL);
	});
}

exports.getAssets = getAssets;
exports.setSandboxAPI = function(d)
{
	SandboxAPI = d;
}
