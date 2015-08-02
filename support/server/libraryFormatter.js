var request = require('request'),

	logger = require('./logger.js');

// get all of a user's assets and format them as a content library
function entitiesToLibrary(user, type, res)
{
	var baseUrl, clientBaseUrl;
	if(global.configuration.hostAssets || !global.configuration.remoteAssetServerURL){
		baseUrl = 'http://localhost:'+global.configuration.port+global.configuration.assetAppPath;
		clientBaseUrl = global.configuration.assetAppPath;
	}
	else {
		baseUrl = global.configuration.remoteAssetServerURL;
		clientBaseUrl = global.configuration.remoteAssetServerURL;
	}

	// set up type aliases
	var mimetype = type;
	switch(type){
		case 'entity':
			mimetype = 'application/vnd.vws-entity+json';
			type = 'asset';
			break;
		case 'material':
			mimetype = 'application/vnd.vws-material+json';
			break;
		case 'behavior':
			mimetype = 'application/vnd.vws-behavior+json';
			type = 'child';
			break;
		case 'texture':
			mimetype = 'image/%';
			break;
		case 'model':
			mimetype = 'model/%';
			break;
	}

	var qs = {
		'permissions!hasPerms': '004',
		'type!like': mimetype
	};
	if( type === 'texture' )
		qs.isTexture = 'true';
	if( !user ){
		res.json([]);
	}
	else
	{
		qs.user_name = user;

		request({
			uri: baseUrl+'/assets/by-meta/all-of',
			qs: qs,
			json: true
		}, handleIndex);

		function handleIndex(err, xhr, indexData)
		{
			if(err){
				console.error(err);
				res.json([]);
			}
			else if( !indexData.matches ){
				console.error('How did we even get here? Cannot populate library');
				res.json([]);
			}
			else
			{	
				var metaToGet = Object.keys(indexData.matches || {}).length;
				var lib = [];

				if(!metaToGet){
					res.json(lib);
				}

				for(var i in indexData.matches)
				{
					fetchMeta(i);

					function fetchMeta(id)
					{
						request({
							uri: baseUrl+'/assets/'+id+'/meta/name+thumbnail',
							json: true
						}, populateLib);
						
						function populateLib(err,xhr,data)
						{
							if(err){
								console.error('Failed to query asset', id, 'metadata:', err);
							}
							else
							{
								data.type = indexData.matches[id].type;

								var libitem = {
									name: data.name || id,
									url: clientBaseUrl+'/assets/'+id,
									preview: data.thumbnail ?
										clientBaseUrl+'/assets/'+id+'/meta/thumbnail'
										: "./img/VWS_Logo.png",
									type: type,
									sourceAssetId: id
								};

								var modelType = /^model\/(.+)$/.exec(data.type);
								if( modelType ){
									libitem.modelType = 'subDriver/threejs/asset/'+modelType[1];
									libitem.dropPreview = {
										'url': libitem.url,
										'type': libitem.modelType,
										'transform': [
											1,0,0,0,
											0,1,0,0,
											0,0,1,0,
											0,0,0,1
										]
									};
								}

								lib.push(libitem);
							}

							metaToGet--;
							if(!metaToGet){
								res.json(lib);
							}
						}
					}
				}
			}
		}
	}
}

exports.entitiesToLibrary = entitiesToLibrary;
