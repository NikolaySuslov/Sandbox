define(["vwf/model/ammo.js/phyJoint"], function(phyJoint)
{
	function phySliderJoint(id, world, driver)
	{
		this.pointA = null;
		this.pointB = null;
		this.lowerLinLimit = 0;
		this.upperLinLimit = 0;
		phyJoint.call(this, id, world, driver);
	}
	phySliderJoint.prototype = new phyJoint();
	phySliderJoint.prototype.setLowerLinLimit = function(limit)
	{
		this.lowerLinLimit = limit;
		if (this.joint)
		{
			this.joint.setLowerLinLimit(this.lowerLinLimit);
		}
	}
	phySliderJoint.prototype.setUpperLinLimit = function(limit)
	{
		this.upperLinLimit = limit;
		if (this.joint)
		{
			this.joint.setUpperLinLimit(this.upperLinLimit);
		}
	}
	phySliderJoint.prototype.getLowerLinLimit = function()
	{
		return this.lowerLinLimit;
	}
	phySliderJoint.prototype.getUpperLinLimit = function()
	{
		return this.upperLinLimit;
	}
	phySliderJoint.prototype.buildJoint = function()
	{
		var worldTx = Engine.getProperty(this.id, 'worldtransform');
		this.pointA = this.getMatrixRelBody(this.aID, worldTx);
		this.pointB = this.getMatrixRelBody(this.bID, worldTx);
		var pa = phyJoint.btTransformFromMat(this.pointA);
		var pb = phyJoint.btTransformFromMat(this.pointB);
		var joint = new Ammo.btSliderConstraint(this.bodyA, this.bodyB, pa, pb, true);
		joint.setLowerLinLimit(this.lowerLinLimit);
		joint.setUpperLinLimit(this.upperLinLimit);
		return joint;
	}
	return phySliderJoint;
})