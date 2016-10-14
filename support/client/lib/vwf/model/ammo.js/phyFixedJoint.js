define(["vwf/model/ammo.js/phyJoint"], function(phyJoint)
{
	function phyFixedJoint(id, world, driver)
	{
		this.pointA = null;
		this.pointB = null;
		phyJoint.call(this, id, world, driver);
	}
	phyFixedJoint.prototype = new phyJoint();
	phyFixedJoint.prototype.buildJoint = function()
	{
		var worldTx = Engine.getProperty(this.id, 'worldtransform');
		this.pointA = this.getMatrixRelBody(this.aID, worldTx);
		this.pointB = this.getMatrixRelBody(this.bID, worldTx);
		var pa = phyJoint.btTransformFromMat(this.pointA);
		var pb = phyJoint.btTransformFromMat(this.pointB);
		var joint = new Ammo.btGeneric6DofConstraint(this.bodyA, this.bodyB, pa, pb, true);
		joint.setLinearLowerLimit(new Ammo.btVector3(0, 0, 0));
		joint.setLinearUpperLimit(new Ammo.btVector3(0, 0, 0));
		joint.setAngularLowerLimit(new Ammo.btVector3(0, 0, 0));
		joint.setAngularUpperLimit(new Ammo.btVector3(0, 0, 0));
		return joint;
	}
	return phyFixedJoint;
})