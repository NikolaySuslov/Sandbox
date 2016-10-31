define([], function()
{
	return function(id)
	{
		this.id = id;
		var AMMOJS_MODEL = Engine.models[1];
		this.addForceAtCenter = function(x, y, z, coords)
		{
			if (!coords)
				coords = 0;
			if (x.length)
			{
				y = x[1];
				z = x[2];
				x = x[0];
			}
			var force = [x, y, z];
			return AMMOJS_MODEL.callingMethod(this.id, "___physics_addForce", [force]);
		}
		this.wake = function()
		{
			return jsDriverSelf.getTopContext().setProperty(this.id, "___physics_activation_state", 1);
		}
		this.addTorque = function(x, y, z, coords)
		{
			if (!coords)
				coords = 0;
			if (x.length)
			{
				y = x[1];
				z = x[2];
				x = x[0];
			}
			var force = [x, y, z];
			return AMMOJS_MODEL.callingMethod(this.id, "___physics_addTorque", [force]);
		}
		this.addForceImpulse = function(x, y, z, coords)
		{
			if (!coords)
				coords = 0;
			if (x.length)
			{
				y = x[1];
				z = x[2];
				x = x[0];
			}
			var force = [x, y, z];
			return AMMOJS_MODEL.callingMethod(this.id, "___physics_addForceImpulse", [force]);
		}
		this.addTorqueImpulse = function(x, y, z, coords)
		{
			if (!coords)
				coords = 0;
			if (x.length)
			{
				y = x[1];
				z = x[2];
				x = x[0];
			}
			var force = [x, y, z];
			return AMMOJS_MODEL.callingMethod(this.id, "___physics_addTorqueImpulse", [force]);
		}
		this.addForceOffset = function(x, y, z, x1, y1, z1, coords)
		{
			if (!coords)
				coords = 0;
			if (x.length && y.length)
			{
				y1 = y[1];
				z1 = y[2];
				x1 = y[0];
				y = x[1];
				z = x[2];
				x = x[0];
			}
			var force = [x, y, z];
			var pos = [x1, y1, z1];
			return AMMOJS_MODEL.callingMethod(this.id, "___physics_addForceOffset", [force, pos]);
		}
		this.setLinearVelocity = function(x, y, z, coords)
		{
			if (!coords)
				coords = 0;
			if (x.length)
			{
				y = x[1];
				z = x[2];
				x = x[0];
			}
			var force = [x, y, z];
			return jsDriverSelf.getTopContext().setProperty(this.id, "___physics_velocity_linear", force);
		}
		this.setAngularVelocity = function(x, y, z, coords)
		{
			if (!coords)
				coords = 0;
			if (x.length)
			{
				y = x[1];
				z = x[2];
				x = x[0];
			}
			var force = [x, y, z];
			return jsDriverSelf.getTopContext().setProperty(this.id, "___physics_velocity_angular", force);
		}
		this.getLinearVelocity = function()
		{
			return jsDriverSelf.getTopContext().getProperty(this.id, "___physics_velocity_linear");
		}
		this.getAngularVelocity = function()
		{
			return jsDriverSelf.getTopContext().getProperty(this.id, "___physics_velocity_angular");
		}
		this.getMass = function()
		{
			return jsDriverSelf.getTopContext().getProperty(this.id, "___physics_mass");
		}
	}
})