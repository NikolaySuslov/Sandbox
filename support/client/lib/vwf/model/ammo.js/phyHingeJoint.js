define(["vwf/model/ammo.js/phyJoint"], function(phyJoint)
{
	function phyHingeJoint(id, world, driver)
	{
		this.pointA = null;
		this.pointB = null;
		this.lowerAngLimit = 0; //defaults are upper lower than lower, so no limit
		this.upperAngLimit = -.01;
		phyJoint.call(this, id, world, driver);
	}
	phyHingeJoint.prototype = new phyJoint();
	phyHingeJoint.prototype.buildJoint = function()
		{
			var worldTx = Engine.getProperty(this.id, 'worldtransform');
			var worldTrans = [worldTx[12], worldTx[13], worldTx[14]];
			this.pointA = this.getPointRelBody(this.aID, worldTrans);
			this.pointB = this.getPointRelBody(this.bID, worldTrans);
			var worldX = [worldTx[0], worldTx[1], worldTx[2]];
			var BodyAX = this.getAxisRelBody(this.aID, worldX);
			var BodyBX = this.getAxisRelBody(this.bID, worldX);
			var pa = new Ammo.btVector3(this.pointA[0], this.pointA[1], this.pointA[2]);
			var pb = new Ammo.btVector3(this.pointB[0], this.pointB[1], this.pointB[2]);
			var axisInA = new Ammo.btVector3(BodyAX[0], BodyAX[1], BodyAX[2]);
			var axisInB = new Ammo.btVector3(BodyBX[0], BodyBX[1], BodyBX[2]);
			var joint = new Ammo.btHingeConstraint(this.bodyA, this.bodyB, pa, pb, axisInA, axisInB, true);
			joint.setLimit(this.lowerAngLimit * 0.0174532925, this.upperAngLimit * 0.0174532925, .9, .3, 1.0);
			return joint;
		}
		//NOTE: todo: limits need to be transformed from joint space to bodyA space
		//makes more sense GUI side to display in joint space, but bullet used bodyA reference frame
		//I think - make y axis vec. rotate around joint space x by limit. move this vec into bodya space. use arctan2 to find new rotation around joint x
	phyHingeJoint.prototype.setLowerAngLimit = function(limit)
	{
		this.lowerAngLimit = limit;
		if (this.joint)
		{
			//the constants .9, .3,1.0 come from the bullet source. These are the default values,but the params are not marked optional in the IDL
			this.joint.setLimit(this.lowerAngLimit * 0.0174532925, this.upperAngLimit * 0.0174532925, .9, .3, 1.0);
		}
	}
	phyHingeJoint.prototype.setUpperAngLimit = function(limit)
	{
		this.upperAngLimit = limit;
		if (this.joint)
		{
			//the constants .9, .3,1.0 come from the bullet source. These are the default values,but the params are not marked optional in the IDL
			this.joint.setLimit(this.lowerAngLimit * 0.0174532925, this.upperAngLimit * 0.0174532925, .9, .3, 1.0);
		}
	}
	return phyHingeJoint;
})