var request = require('request'),
	XAPIStatement = require('./xapistatement'),
	liburl = require('url'),
	DAL = require('./DAL').DAL;
var logger = require('./logger');
/*
 * build a log statement and submit it
 */
function sendStatement(userId, verb, worldId, worldName, worldDescription, otherContext)
	{
		if (!global.configuration.lrsEndpoint)
			return;
		try
		{
			var creds = new Buffer(global.configuration.lrsUsername + ':' + global.configuration.lrsPassword);
			var auth = 'Basic ' + creds.toString('base64');
			// build statement
			var stmt = new XAPIStatement(new AccountAgent(userId), verb);
			if (worldId)
			{
				if (verb.id == exports.verbs.published_item.id)
				{
					stmt.object = new Item(worldId, worldName);
				}
				else if (verb.id == exports.verbs.rezzed.id || verb.id == exports.verbs.derezzed.id)
				{
					stmt.object = new Entity(worldId, worldName);
				}
				else
				{
					if (worldName === undefined || worldDescription === undefined)
					{
						var dalId = worldId.replace(/\//g, '_');
						//how are we getting here? This seems to be crashing occasionally
						require('./DAL').DAL.getInstance(dalId, function(state)
						{
							if(!state)
							{
								state = {};
								state.title = worldId;
								state.description = '';

							}
							sendStatement(userId, verb, worldId, state.title, state.description);
						});
						return;
					}
					else
						stmt.object = new World(worldId, worldName, worldDescription);
				}
			}
			else
				stmt.object = new XAPIStatement.Activity('http://vwf.adlnet.gov/xapi/virtual_world_sandbox', 'Virtual World Sandbox');
			stmt.addParentActivity('http://vwf.adlnet.gov/xapi/virtual_world_sandbox');
			require('./DAL').DAL.getInstance(otherContext, function(otherContextdata)
			{
				if(!otherContextdata)
				{
					otherContextdata = {};
					otherContextdata.title = otherContext;
					otherContextdata.description = '';

				}
				if (otherContext,otherContextdata)
				{
					stmt.addOtherContextActivity(new World(otherContext,otherContextdata.title,otherContextdata.description));
					stmt.addGroupingActivity(
					{
						"id": "http://vwf.adlnet.gov/xapi/profile",
						"objectType": "Activity"
					});
				}
				stmt.context.platform = 'virtual world';
				request.post(
					{
						'url': liburl.resolve(global.configuration.lrsEndpoint, 'statements'),
						'headers':
						{
							'X-Experience-API-Version': '1.0.1',
							'Authorization': auth
						},
						'json': stmt
					},
					function(err, res, body)
					{
						if (err)
						{
							logger.error(err);
						}
						else if (res.statusCode === 200)
						{
							logger.warn('Action posted:', stmt.toString());
						}
						else
						{
							logger.warn('Statement problem:', body);
						}
					});
			})
		}
		catch (e)
		{
			console.error(e)
		}
	}
	/*
	 * Agent subclass that truncates account info
	 */
function AccountAgent(username)
{
	XAPIStatement.Agent.call(this,
	{
		'homePage': 'http://vwf.adlnet.gov',
		'name': username
	}, username);
}
AccountAgent.prototype = new XAPIStatement.Agent;
/*
 * Activity subclass that self-populates from a world id
 */
function World(id, name, description)
{
	logger.debug('WORLD');
	var match = /[_\/]adl[_\/]sandbox[_\/]([A-Za-z0-9]{16})[_\/]/.exec(id);
	if(match)
		id = match[1];
	var worldActivityId = 'http://vwf.adlnet.gov/xapi/' + id;
	XAPIStatement.Activity.call(this, worldActivityId, name, description);
	this.definition = {};
	if (this.definition)
	{
		this.definition.type = 'http://vwf.adlnet.gov/xapi/world';
		this.definition.name = {
			"en-US": name
		};
		this.definition.description = {
			"en-US": description
		};
		this.definition.moreInfo = 'http://sandbox.adlnet.gov' + global.appPath + '/world/' + id;
	}
}
World.prototype = new XAPIStatement.Activity;
/*
 * Activity subclass that describes an inventory item
 */
function Item(id, name)
{
	var xapiId = 'http://vwf.adlnet.gov/xapi/items/' + id;
	XAPIStatement.Activity.call(this, xapiId, name);
	if (this.definition)
	{
		this.definition.type = 'http://vwf.adlnet.gov/xapi/item';
	}
}
Item.prototype = new XAPIStatement.Activity;
/*
 * Activity subclass that describes an object in a world
 */
function Entity(id, name)
{
	var xapiId = 'http://vwf.adlnet.gov/xapi/entity/' + id;
	XAPIStatement.Activity.call(this, xapiId, name);
	if (this.definition)
	{
		this.definition.type = 'http://vwf.adlnet.gov/xapi/entity';
	}
}
Entity.prototype = new XAPIStatement.Activity;
/*
 * Export everything
 */
exports.sendStatement = sendStatement;
exports.verbs = {
	'logged_in':
	{
		'id': 'http://vwf.adlnet.gov/xapi/verbs/logged_in',
		'display':
		{
			'en-US': 'logged into'
		}
	},
	'logged_out':
	{
		'id': 'http://vwf.adlnet.gov/xapi/verbs/logged_out',
		'display':
		{
			'en-US': 'logged out of'
		}
	},
	'created':
	{
		'id': 'http://vwf.adlnet.gov/xapi/verbs/created',
		'display':
		{
			'en-US': 'created'
		}
	},
	'joined':
	{
		'id': 'http://vwf.adlnet.gov/xapi/verbs/joined',
		'display':
		{
			'en-US': 'joined world'
		}
	},
	'left':
	{
		'id': 'http://vwf.adlnet.gov/xapi/verbs/left',
		'display':
		{
			'en-US': 'left world'
		}
	},
	'rezzed':
	{
		'id': 'http://vwf.adlnet.gov/xapi/verbs/rezzed',
		'display':
		{
			'en-US': 'rezzed entity'
		}
	},
	'derezzed':
	{
		'id': 'http://vwf.adlnet.gov/xapi/verbs/derezzed',
		'display':
		{
			'en-US': 'derezzed entity'
		}
	},
	'destroyed':
	{
		'id': 'http://vwf.adlnet.gov/xapi/verbs/destroyed',
		'display':
		{
			'en-US': 'destroyed'
		}
	},
	'published':
	{
		'id': 'http://vwf.adlnet.gov/xapi/verbs/published',
		'display':
		{
			'en-US': 'published'
		}
	},
	'unpublished':
	{
		'id': 'http://vwf.adlnet.gov/xapi/verbs/unpublished',
		'display':
		{
			'en-US': 'unpublished'
		}
	},
	'published_item':
	{
		'id': 'http://vwf.adlnet.gov/xapi/verbs/published_(item)',
		'display':
		{
			'en-US': 'published to global inventory'
		}
	},
	'registered':
	{
		'id': 'http://adlnet.gov/expapi/verbs/registered',
		'display':
		{
			'en-US': 'registered with'
		}
	},
	'modified':
	{
		'id': 'http://adlnet.gov/expapi/verbs/modified',
		'display':
		{
			'en-US': 'changed settings for'
		}
	},
	'unsuccessful_registered_attempt':
	{
		'id': 'http://adlnet.gov/expapi/verbs/unsuccessful_registered_attempt',
		'display':
		{
			'en-US': 'attempted unsuccessfully to registered with'
		}
	}
};