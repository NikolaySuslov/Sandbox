
var sessions = require('./sessions');
DAL = require('./DAL').DAL;

function serveAdminHome(req,res,next)
{
	
}

function stateData(req,res,next)
{
	var world = global.instances.get(req.params.world);
	if(!world)
	{
		res.json(null); return;
	}
	else
	{
		var state = world.state.getClientNodeDefinition("index-vwf");
		res.json(state); return;
	}
}

function continuesDefs(req,res,next)
{
	var world = global.instances.get(req.params.world);
	if(!world)
	{
		res.json(null); return;
	}
	else
	{
		var state = world.state.continuesDefs;
		res.json(state); return;
	}
}

function clients(req,res,next)
{
	
	var world = global.instances.get(req.params.world);
	if(!world)
	{
		res.json(null); return;
	}
	else
	{
		var clients = Object.keys(world.clients);
		res.json(clients); return;
	}
}

function clientData(req,res,next)
{
	
	var world = global.instances.get(req.params.world);
	
	if(!world)
	{
		res.json(null); return;
	}
	else
	{
		var clients =world.clients;
		res.json(clients[req.params.cid].loginData); return;
	}
}

function validate(req,cb)
{
	sessions.GetSessionData(req, function(__session)
	{
		if(!__session)
		{
			cb(false);
		}
		else
		{
		
			DAL.getUser(__session.UID,function(user)
			{
				
				if(!user)
				{
					cb(false);
				}else
				{
					if(user.id ==  global.adminUID || user.isAdmin == true)
					{
						cb(true);
					}else
					{
						cb(false);
					}
				}
			});
		}
	});
}

//wrapper that forces the user to be logged in as admin for all wrapped routes
function requireValidate(then)
{
	return (function(req,res,next)
	{
		validate(req,function(ok){
			if(ok)
			{
				then(req,res,next)
			}else
			{
				res.status(401).send('not authorized');
			}
		});
	})	
}

exports.hookupRoutes = function(app)
{
	app.get("/admin",requireValidate(serveAdminHome));
	app.get("/admin/:world/state",requireValidate(stateData));
	app.get("/admin/:world/clients",requireValidate(clients));
	app.get("/admin/:world/client/:cid",requireValidate(clientData));
	app.get("/admin/:world/continuesDefs",requireValidate(continuesDefs));

	
}