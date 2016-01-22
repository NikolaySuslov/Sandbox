define(["vwf/model/ammo.js/phyJoint"], function(phyJoint)
{
	function phyPointToPointJoint(id, world, driver)
	{
		this.pointA = null;
		this.pointB = null;
		phyJoint.call(this, id, world, driver);
	}
	phyPointToPointJoint.prototype = new phyJoint();
	phyPointToPointJoint.prototype.buildJoint = function()
	{
		var worldTx = Engine.getProperty(this.id, 'worldtransform');
		var worldTrans = [worldTx[12], worldTx[13], worldTx[14]];
		this.pointA = this.getPointRelBody(this.aID, worldTrans);
		this.pointB = this.getPointRelBody(this.bID, worldTrans);
		var pa = new Ammo.btVector3(this.pointA[0], this.pointA[1], this.pointA[2]);
		var pb = new Ammo.btVector3(this.pointB[0], this.pointB[1], this.pointB[2]);
		return new Ammo.btPoint2PointConstraint(this.bodyA, this.bodyB, pa, pb);
	}
	return phyPointToPointJoint;
})