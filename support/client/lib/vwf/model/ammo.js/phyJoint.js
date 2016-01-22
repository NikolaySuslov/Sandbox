function phyJoint(id, world, driver)
{
	this.id = id;
	this.world = world;
	this.bID = null;
	this.aID = null;
	this.bodyA = null;
	this.bodyB = null;
	this.initialized = false;
	this.ready = true;
	this.driver = driver;
	this.localScale = [1, 1, 1];
	this.transform = [];
	this.enabled = true;
	if (this.driver) this.driver.jointBodyMap[id] = [];
}
phyJoint.btTransformFromMat = function(mat)
{
	var tx = new Ammo.btTransform();
	tx.getOrigin().setX(mat[12]);
	tx.getOrigin().setY(mat[13]);
	tx.getOrigin().setZ(mat[14]);
	var quat = [];
	Quaternion.fromRotationMatrix4(mat, quat);
	quat = Quaternion.normalize(quat, []);
	var q = new Ammo.btQuaternion(quat[0], quat[1], quat[2], quat[3]);
	tx.setRotation(q);
	return tx;
}
phyJoint.prototype.getWorldScale = function()
{
	return Mat4.createIdentity();
}
phyJoint.prototype.enable = function()
{
	this.enabled = true;
}
phyJoint.prototype.disable = function()
{
	this.enabled = false;
}
phyJoint.prototype.destroy = function()
{
	if (this.initialized)
	{
		this.world.removeConstraint(this.joint)
		if (this.joint) Ammo.destroy(this.joint);
		this.joint = null;
		this.initialized = false;
		this.bodyA = null;
		this.bodyB = null;
	}
}
phyJoint.prototype.deinitialize = function()
{
	this.destroy();
}
phyJoint.prototype.getTransform = function(temp)
{
	//this is important and tricky!!!
	//since the joint orientation is relative to the bodies, and the bodies are moving,
	//recreating the joint without updating it's position will result in very different results
	//it's probably  good pratice to make the joint object a  child of the bodyA, so that the
	//joint location never changes relative to body a. However, we can also make this work by
	//updating the stored location of each joint to be relative to the body A position after each tick
	//NOTE:: the this.transform value should be storing the location RELATIVE to BODYA in the reference frame of the joint parent!!!
	//NOTE:: updates from the physics tick should not actually change and rebind these joints, this information is useful only to
	//late joiners and DB saves
	if (this.bodyA)
	{
		if (!temp) temp = [];
		if (!this.transRelBodyA) throw new Error('Body not initialized before tick');
		var bodyWorldTx = Engine.getProperty(this.aID, 'worldtransform');
		var bodyRelMat = Mat4.multMat(bodyWorldTx, this.transRelBodyA, temp);
		return bodyRelMat;
	}
	else
		return this.transform;
}
phyJoint.prototype.setTransform = function(propertyValue)
{
	this.transform = vecset(this.transform, propertyValue);
	if (this.aID)
	{
		this.transRelBodyA = this.getMatrixRelBody(this.aID, this.transform);
	}
	//this.destroy();
}
phyJoint.prototype.setDirty = function()
{
	this.destroy();
}
phyJoint.prototype.setBodyAID = function(nodeID)
{
	var idx = this.driver.jointBodyMap[this.id].indexOf(this.aID)
	if (idx > -1) var idx = this.driver.jointBodyMap[this.id].splice(idx, 1);
	this.aID = nodeID;
	this.destroy();
	this.driver.jointBodyMap[this.id].push(this.aID);
	this.transRelBodyA = this.getMatrixRelBody(this.aID, this.transform);
}
phyJoint.prototype.setBodyBID = function(nodeID)
{
	var idx = this.driver.jointBodyMap[this.id].indexOf(this.bID)
	if (idx > -1) var idx = this.driver.jointBodyMap[this.id].splice(idx, 1);
	this.bID = nodeID;
	this.destroy();
	this.driver.jointBodyMap[this.id].push(this.bID);
}
phyJoint.prototype.setBodyA = function(body)
{
	this.bodyA = body;
	var bodyWorldTx = Engine.getProperty(this.aID, 'worldtransform');
	this.transRelBodyA = this.getMatrixRelBody(this.aID, this.transform);
}
phyJoint.prototype.setBodyB = function(body)
{
	this.bodyB = body;
}
phyJoint.prototype.update = function()
{
	if (!this.initialized)
	{
		this.initialize();
	}
}
phyJoint.prototype.initialize = function()
{
	if (this.driver)
	{
		//find your body in the driver
		if (this.aID)
		{
			if (this.driver.allNodes[this.aID] && this.driver.allNodes[this.aID].body)
			{
				this.setBodyA(this.driver.allNodes[this.aID].body);
			}
		}
		//find your body in the driver
		if (this.bID)
		{
			if (this.driver.allNodes[this.bID] && this.driver.allNodes[this.bID].body)
			{
				this.setBodyB(this.driver.allNodes[this.bID].body);
			}
		}
		if (this.bodyA && this.bodyB)
		{
			this.joint = this.buildJoint();
			this.world.addConstraint(this.joint);
			this.initialized = true;
		}
	}
}
phyJoint.prototype.getPointRelBody = function(bodyID, worldpoint)
{
	var bodyWorldTx = Engine.getProperty(bodyID, 'worldtransform');
	var bodyWorldTxI = [];
	Mat4.invert(bodyWorldTx, bodyWorldTxI);
	var bodyRelPos = Mat4.multVec3(bodyWorldTxI, worldpoint, []);
	return bodyRelPos;
}
phyJoint.prototype.getAxisRelBody = function(bodyID, worldAxis)
{
	var bodyWorldTx = Engine.getProperty(bodyID, 'worldtransform');
	var bodyWorldTxI = [];
	Mat4.invert(bodyWorldTx, bodyWorldTxI);
	var bodyRelAxis = Mat4.multVec3NoTranslate(bodyWorldTxI, worldAxis, []);
	return bodyRelAxis;
}
phyJoint.prototype.getMatrixRelBody = function(bodyID, worldMatrix)
{
	var bodyWorldTx = Engine.getProperty(bodyID, 'worldtransform');
	if (!bodyWorldTx) return null;
	var bodyWorldTxI = [];
	Mat4.invert(bodyWorldTx, bodyWorldTxI);
	var bodyRelMat = Mat4.multMat(bodyWorldTxI, worldMatrix, []);
	return bodyRelMat;
}
define([], function()
{
	return phyJoint;
})