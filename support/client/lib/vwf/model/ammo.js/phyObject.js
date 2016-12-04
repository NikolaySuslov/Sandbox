function ScaleFromMatrix(mat)
{
    var x = [mat[0], mat[1], mat[2]];
    var y = [mat[4], mat[5], mat[6]];
    var z = [mat[8], mat[9], mat[10]];
    var scale = [MATH.lengthVec3(x), MATH.lengthVec3(y), MATH.lengthVec3(z)];
    scale[0] = Math.round(scale[0] * 10000000) / 10000000;
    scale[1] = Math.round(scale[1] * 10000000) / 10000000;
    scale[2] = Math.round(scale[2] * 10000000) / 10000000;
    return scale;
}

function collectChildCollisions(node, list)
{
    if (!list) list = [];
    var keys = Object.keys(node.children);
    for (var i = 0; i < keys.length; i++)
    {
        collectChildCollisions(node.children[keys[i]], list);
    }
    if (node.enabled === true && node instanceof phyObject)
    {
        var col = node.buildCollisionShape();
        if (col)
        {
            list.push(
            {
                matrix: Engine.getProperty(node.id, 'orthoWorldTransform'), //don't use normal world transform. In non uniform spaces, the rotations are senseless.
                collision: col,
                mass: node.mass,
                localScale: node.localScale,
                node: node
            });
            //careful to orthonormalize the worldmatrix. Previous divide by localscale would always orthonormilize properly
            //when world matrix !== localmatrix
            var xlen = MATH.lengthVec3([list[list.length - 1].matrix[0], list[list.length - 1].matrix[1], list[list.length - 1].matrix[2]]);
            var ylen = MATH.lengthVec3([list[list.length - 1].matrix[4], list[list.length - 1].matrix[5], list[list.length - 1].matrix[6]]);
            var zlen = MATH.lengthVec3([list[list.length - 1].matrix[8], list[list.length - 1].matrix[9], list[list.length - 1].matrix[10]]);
            list[list.length - 1].matrix[0] /= xlen;
            list[list.length - 1].matrix[1] /= xlen;
            list[list.length - 1].matrix[2] /= xlen;
            //list[list.length - 1].matrix[12] /= xlen;
            list[list.length - 1].matrix[4] /= ylen;
            list[list.length - 1].matrix[5] /= ylen;
            list[list.length - 1].matrix[6] /= ylen;
            //list[list.length - 1].matrix[13] /= ylen;
            list[list.length - 1].matrix[8] /= zlen;
            list[list.length - 1].matrix[9] /= zlen;
            list[list.length - 1].matrix[10] /= zlen;
            //list[list.length - 1].matrix[13] /= zlen;
        }
    }
    return list;
}
var tempvec1 = [0, 0, 0];
var tempvec2 = [0, 0, 0];
var tempvec3 = [0, 0, 0];
var tempquat1 = [0, 0, 0, 0];
var tempquat2 = [0, 0, 0, 0];
var tempquat3 = [0, 0, 0, 0];
var tempmat1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var tempmat2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var tempmat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function vecset(newv, old)
{
    for (var i = 0; i < old.length; i++) newv[i] = old[i];
    return newv;
}

function phyObject(id, world)
{
    phyObject.setupPhyObject(this, id, world);
}
phyObject.setupPhyObject = function(node, id, world)
{
    node.body = null;
    node.ready = false;
    node.mass = 1;
    node.collision = null;
    node.enabled = false;
    node.initialized = false;
    node.collisionDirty = false;
    node.id = id;
    node.restitution = .1;
    node.friction = .5;
    node.damping = .05;
    node.world = world;
    node.children = {};
    node.localOffset = null;
    node.collisionBodyOffsetPos = [0, 0, 0];
    node.collisionBodyOffsetRot = [1, 0, 0, 1];
    node.angularVelocity = [0, 0, 0];
    node.linearVelocity = [0, 0, 0];
    node.localScale = [1, 1, 1];
    node.activationState = 0;
    node.deactivationTime = 0;
    node.linearFactor = [1, 1, 1];
    node.angularFactor = [1, 1, 1];
    node.constantForce = null;
    node.constantTorque = null;
    node.transform = [];
    node.massBackup = 0;
    node.setMass(1);
    node.simulating = false;
}
phyObject.prototype.getWorldScale = function()
{
    var parent = this;
    var localScale = [1, 1, 1];
    while (parent)
    {
        localScale[0] *= parent.localScale[0];
        localScale[1] *= parent.localScale[1];
        localScale[2] *= parent.localScale[2];
        parent = parent.parent;
    }
    return localScale;
}
phyObject.prototype.addForce = function(vec, offset)
    {
        if (vec.length !== 3) return;
        if (this.initialized === true)
        {
            this.wake();
            var f = new Ammo.btVector3(vec[0], vec[1], vec[2]);
            if (offset)
            {
                var o = new Ammo.btVector3(offset[0], offset[1], offset[2]);
                this.body.applyForce(f, o);
                Ammo.destroy(o);
            }
            else
            {
                this.body.applyCentralForce(f);
            }
            Ammo.destroy(f);
        }
    }
    //this is a global space force that is applied at every tick. Sort of a motor. Could be
    //used to do custom per object gravity.
phyObject.prototype.setConstantForce = function(vec)
    {
        if (this.constantForce) Ammo.destroy(this.constantForce);
        if (vec) this.constantForce = new Ammo.btVector3(vec[0], vec[1], vec[2]);
        else this.constantForce = null;
    }
    //a constant torque applied at every tick
phyObject.prototype.setConstantTorque = function(vec)
{
    if (this.constantTorque) Ammo.destroy(this.constantTorque);
    if (vec) this.constantTorque = new Ammo.btVector3(vec[0], vec[1], vec[2]);
    else this.constantTorque = null;
}
phyObject.prototype.addTorque = function(vec)
{
    if (vec.length !== 3) return;
    if (this.initialized === true)
    {
        this.wake();
        var f = new Ammo.btVector3(vec[0], vec[1], vec[2]);
        this.body.applyTorque(f);
        Ammo.destroy(f);
    }
}
phyObject.prototype.addForceImpulse = function(vec)
{
    if (vec.length !== 3) return;
    if (this.initialized === true)
    {
        this.wake();
        var f = new Ammo.btVector3(vec[0], vec[1], vec[2]);
        this.body.applyImpulse(f);
        Ammo.destroy(f);
    }
}
phyObject.prototype.addTorqueImpulse = function(vec)
    {
        if (vec.length !== 3) return;
        if (this.initialized === true)
        {
            this.wake();
            var f = new Ammo.btVector3(vec[0], vec[1], vec[2])
            this.body.applyTorqueImpulse(f);
            Ammo.destroy(f);
        }
    }
    /*phyObject.prototype.addForceOffset = function(vec, pos) {
        if (vec.length !== 3) return;
        if (pos.length !== 3) return;
        if (this.initialized === true) {
            var f = new Ammo.btVector3(vec[0], vec[1], vec[2]);
            var g = new Ammo.btVector3(pos[0], pos[1], pos[2]);
            this.body.applyForce(f, g);
            Ammo.destroy(f);
            Ammo.destroy(g);
        }
    }*/
phyObject.prototype.setLinearFactor = function(vec)
{
    if (vec.length !== 3) return;
    this.linearFactor = vec;
    if (this.initialized === true)
    {
        var f = new Ammo.btVector3(vec[0], vec[1], vec[2])
        this.body.setLinearFactor(f);
        Ammo.destroy(f);
    }
}
phyObject.prototype.getLinearFactor = function(vec)
{
    return this.linearFactor;
}
phyObject.prototype.getAngularFactor = function(vec)
{
    return this.angularFactor;
}
phyObject.prototype.setAngularFactor = function(vec)
{
    if (vec.length !== 3) return;
    this.angularFactor = vec;
    if (this.initialized === true)
    {
        var localInertia = new Ammo.btVector3(vec[0], vec[1], vec[2]);
        this.body.setAngularFactor(localInertia);
    }
}
phyObject.prototype.startSimulating = function()
{
    if (this.simulating == true) return;
    //this.wake();
    this.simulating = true;
    this.setMass(this.mass, true);
    this.markRootBodyCollisionDirty();
}
phyObject.prototype.stopSimulating = function()
{
    if (this.simulating == false) return;
    this.simulating = false;
    this.massBackup = this.mass;
    this.setMass(this.mass, true);
}
phyObject.prototype.setMass = function(mass, force)
{
    if (this.mass == mass && !force) return;
    this.mass = mass;
    if (this.initialized === true)
    {
        var localInertia = new Ammo.btVector3();
        this.collision.calculateLocalInertia(this.mass, localInertia);
        if (this.simulating)
            this.body.setMassProps(this.mass, localInertia);
        else
            this.body.setMassProps(0, localInertia);
        this.body.updateInertiaTensor();
        Ammo.destroy(localInertia);
        //todo: need to inform parents that mass has changed, might require recompute of center of mass for compound body
    }
}
phyObject.prototype.initialize = function()
{
    this.ready = true;
    //currently, only objects which are children of the world can be bodies
    if (this.enabled && this.parent.id == Engine.application() && this.initialized === false)
    {
        var mat = Engine.getProperty(this.id, 'transform');
        if (mat) this.setTransform(mat);
        this.initialized = true;
        console.log('init', this.id);
        var childCollisions = collectChildCollisions(this);
        this.localOffset = null;
        //this object has no child physics objects, so just use it's normal collision shape
        //  if(childCollisions.length == 1)
        //      this.collision = this.buildCollisionShape();
        //  else
        {
            //so, since we have child collision objects, we need to create a compound collision
            this.collision = new Ammo.btCompoundShape();
            this.collision.vwfID = this.id;
            var x = 0;
            var y = 0;
            var z = 0;
            for (var i = 0; i < childCollisions.length; i++)
            {
                //note!! at this point, this object must be a child of the scene, so transform === worldtransform
                var thisworldmatrix = vecset([], this.transform);
                var wmi = [];
                Mat4.invert(thisworldmatrix, wmi);
                var aslocal = Mat4.multMat(wmi, childCollisions[i].matrix, []);
                childCollisions[i].local = aslocal;
                //take into account that the collision body may be offset from the object center.
                //this is true with assets, but not with prims
                //crazy as it may seem, there is no need to take into account here the local scale
                //this is because we find the worldspace matrix between the child and this, thus flattening
                //any complex hierarchy of transforms under this node in the graph. This flattening starts with the
                //worldspace values, which already account for the scale.
                //aslocal[12] *= childCollisions[i].localScale[0];
                //aslocal[13] *= childCollisions[i].localScale[1];
                //aslocal[14] *= childCollisions[i].localScale[2];
                x += aslocal[12] + this.collisionBodyOffsetPos[0];
                y += aslocal[13] + this.collisionBodyOffsetPos[1];
                z += aslocal[14] + this.collisionBodyOffsetPos[2];
            }
            x /= childCollisions.length;
            y /= childCollisions.length;
            z /= childCollisions.length;
            //todo = using geometric center of collision body - should use weighted average considering mass of child
            for (var i = 0; i < childCollisions.length; i++)
            {
                var aslocal = childCollisions[i].local;
                var startTransform = new Ammo.btTransform();
                startTransform.getOrigin().setX(aslocal[12] - x);
                startTransform.getOrigin().setY(aslocal[13] - y);
                startTransform.getOrigin().setZ(aslocal[14] - z);
                var quat = [];
                Quaternion.fromRotationMatrix4(aslocal, quat);
                quat = Quaternion.normalize(quat, []);
                var q = new Ammo.btQuaternion(quat[0], quat[1], quat[2], quat[3]);
                startTransform.setRotation(q);
                //careful not to set the childcollision scale when the child is actually this - otherwise we'd be setting it twice, once on the
                //collision body and once on the compound body
                //if(childCollisions[i].node !== this)
                //    childCollisions[i].collision.setLocalScaling(new Ammo.btVector3(childCollisions[i].localScale[0], childCollisions[i].localScale[1], childCollisions[i].localScale[2]));
                this.collision.addChildShape(startTransform, childCollisions[i].collision);
            }
            //NANs can result from divide by zero. Be sure to use 0 instead of nan
            this.localOffset = [x || 0, y || 0, z || 0];
        }
        this.startTransform = new Ammo.btTransform();
        this.startTransform.setIdentity();
        var realMass = this.mass;
        if (!this.simulating)
            realMass = 0
        var isDynamic = (realMass != 0);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        if (isDynamic) this.collision.calculateLocalInertia(realMass, localInertia);
        // Ammo.destroy(localInertia);
        //localoffset is used to offset the center of mass from the pivot point of the parent object
        if (this.localOffset)
        {
            var f = new Ammo.btVector3(this.localOffset[0] * this.localScale[0], this.localOffset[1] * this.localScale[1], this.localOffset[2] * this.localScale[2]);
            this.startTransform.setOrigin(f);
            // Ammo.destroy(f);
        }
        else
        {
            var f = new Ammo.btVector3(0, 0, 0);
            this.startTransform.setOrigin(f);
            // Ammo.destroy(f);
        }
        var myMotionState = new Ammo.btDefaultMotionState(this.startTransform);
        var rbInfo = new Ammo.btRigidBodyConstructionInfo(realMass, myMotionState, this.collision, localInertia);
        this.body = new Ammo.btRigidBody(rbInfo);
        var damp = this.damping;
        this.body.setDamping(damp, damp);
        var fric = this.friction;
        this.body.setFriction(fric);
        var rest = this.restitution;
        this.body.setRestitution(rest);
        this.body.getLinearVelocity().setValue(this.linearVelocity[0], this.linearVelocity[1], this.linearVelocity[2]);
        this.body.getAngularVelocity().setValue(this.angularVelocity[0], this.angularVelocity[1], this.angularVelocity[2]);
        var f = new Ammo.btVector3(this.linearFactor[0], this.linearFactor[1], this.linearFactor[2])
        this.body.setLinearFactor(f);
        Ammo.destroy(f);
        f = new Ammo.btVector3(this.angularFactor[0], this.angularFactor[1], this.angularFactor[2])
        this.body.setAngularFactor(f);
        Ammo.destroy(f);
        this.body.forceActivationState(this.activationState);
        this.body.setActivationState(this.activationState);
        this.body.setDeactivationTime(this.deactivationTime);
        var mat = Engine.getProperty(this.id, 'transform');
        if (mat) this.setTransform(mat);
        //we must return through the kernel here so it knows that this is revelant to all instances of this node
        //not just the proto
        _PhysicsDriver.dirtyAssociatedJoints(this.id);
        this.world.addRigidBody(this.body);
        //so....... is this not handled by the cache and then set of properties that come in before initialize?
        var av = this.activationState;
        this.activationState = -1;
        Engine.setProperty(this.id, '___physics_activation_state', av);
        var dvt = this.deactivationTime;
        this.deactivationTime = -1;
        Engine.setProperty(this.id, '___physics_deactivation_time', dvt);
        var lin = this.linearVelocity;
        this.linearVelocity = null;
        Engine.setProperty(this.id, '___physics_linear_velocity', lin);
        this.linearVelocity = lin;
        var ang = this.angularVelocity;
        this.angularVelocity = null;
        Engine.setProperty(this.id, '___physics_angular_velocity', ang);
        this.angularVelocity = ang;
    }
}
phyObject.prototype.deinitialize = function()
{
    if (this.initialized === true)
    {
        this.initialized = false;
        this.world.removeRigidBody(this.body);
        Ammo.destroy(this.body);
        Ammo.destroy(this.collision);
        Ammo.destroy(this.startTransform);
        this.body = null;
        this.collision = null;
        this.startTransform = null;
    }
}
phyObject.prototype.getLinearVelocity = function()
{
    if (this.initialized === true)
    {
        var vec = this.body.getLinearVelocity()
        this.linearVelocity = [vec.x(), vec.y(), vec.z()];
        return [vec.x(), vec.y(), vec.z()];
    }
    else return this.linearVelocity;
}
phyObject.prototype.setLinearVelocity = function(vel)
{
    this.linearVelocity = vel;
    if (this.initialized === true)
    {
        this.body.getLinearVelocity().setValue(vel[0], vel[1], vel[2]);
    }
}
phyObject.prototype.setAngularVelocity = function(vel)
    {
        this.angularVelocity = vel;
        if (this.initialized === true)
        {
            this.body.getAngularVelocity().setValue(vel[0], vel[1], vel[2]);
        }
    }
    //note - we don't store up forces when the body is not initialized, so AddTorque called before init does nothing
    //maybe we should? Not sure that forces are stateful
phyObject.prototype.getForce = function()
    {
        if (this.initialized === true)
        {
            var force = this.body.getTotalForce();
            return [force.x(), force.y(), force.z()];
        }
    }
    //this is probably not what you're looking for. Force is an instantanious value, it
    //only has meaning within a tick cycle. This is only for replication. Use either addForce, addForceLocal
    //or setConstantForce
phyObject.prototype.setForce = function(force)
{
    if (this.initialized === true)
    {
        this.body.getTotalForce().setValue(force[0], force[1], force[2]);
    }
}
phyObject.prototype.getTorque = function()
    {
        if (this.initialized === true)
        {
            var torque = this.body.getTotalTorque();
            return [torque.x(), torque.y(), torque.z()];
        }
    }
    //this is probably not what you're looking for. Torque is an instantanious value, it
    //only has meaning within a tick cycle. This is only for replication. Use either addTorque
    //or setConstantTorque
phyObject.prototype.setTorque = function(torque)
{
    if (this.initialized === true)
    {
        this.body.getTotalTorque().setValue(torque[0], torque[1], torque[2]);
    }
}
phyObject.prototype.getAngularVelocity = function()
{
    //waiting for an ammo build that includes body.getAngularVelocity
    if (this.initialized === true)
    {
        var vec = this.body.getAngularVelocity()
        this.angularVelocity = [vec.x(), vec.y(), vec.z()];
        return [vec.x(), vec.y(), vec.z()];
    }
    else return this.angularVelocity;
}
phyObject.prototype.setRestitution = function(bounce)
{
    this.restitution = bounce;
    if (this.initialized === true)
    {
        this.body.setRestitution(this.restitution);
    }
}
phyObject.prototype.setDamping = function(damping)
{
    this.damping = damping;
    if (this.initialized === true)
    {
        this.body.setDamping(this.damping, this.damping);
    }
}
phyObject.prototype.setFriction = function(friction)
{
    this.friction = friction;
    if (this.initialized === true)
    {
        this.body.setFriction(this.friction);
    }
}
phyObject.prototype.enable = function()
    {
        if (this.enabled == true) return;
        this.enabled = true;
        if (this.parent.id !== Engine.application())
        {
            this.markRootBodyCollisionDirty();
        }
        //must do this on next tick. Does that mean initialized is stateful and needs to be in a VWF property?
        if (this.initialized === false)
        {
            // this.initialize();
        }
    }
    //must be very careful with data the the physics engine changes during the sim
    //can't return cached values if body is enabled because we'll refelct the data
    //from the JS engine and not the changed state of the physics
phyObject.prototype.getActivationState = function()
{
    if (this.initialized === true)
    {
        this.activationState = this.body.getActivationState();
        return this.body.getActivationState();
    }
    else return this.activationState;
}
phyObject.prototype.setActivationState = function(state)
{
    if (state == 0) state = 1; //much confusion about the #defines for 1 and 0. Seems like 0 is not a enumerated activation value, yet the bullet code uses 0 in some places and 1 in others for activation enabled
    // if (this.activationState == Number(state)) return;
    state = Number(state);
    if (this.initialized === true)
    {
        this.body.setActivationState(state);
        this.body.forceActivationState(state);
        this.activationState = state
    }
    else this.activationState = state;
}
phyObject.prototype.wake = function()
{
    if (this.initialized === true)
    {
        this.body.setDeactivationTime(0);
        this.body.setActivationState(1);
    }
}
phyObject.prototype.getDeactivationTime = function()
{
    if (this.initialized === true)
    {
        this.deactivationTime = this.body.getDeactivationTime();
        return this.body.getDeactivationTime();
    }
    else return this.deactivationTime;
}
phyObject.prototype.setDeactivationTime = function(time)
{
    if (this.initialized === true)
    {
        this.body.setDeactivationTime(time);
        this.deactivationTime = time;
    }
    else this.deactivationTime = time;
}
phyObject.prototype.disable = function()
{
    if (this.enabled == false) return;
    this.enabled = false;
    if (this.parent.id !== Engine.application())
    {
        this.markRootBodyCollisionDirty();
    }
    //can't do this! causes the kernel to sense ___physics_enabled as a delegated property
    //Engine.setProperty(this.id, 'transform', this.getTransform());
    if (this.initialized === true)
    {
        this.deinitialize();
    }
}
phyObject.prototype.getTransform = function(outmat)
{
    if (!outmat) outmat = [];
    if (!this.body)
    {
        outmat = vecset(outmat, this.transform);
        return outmat;
    }
    var transform = this.body.getWorldTransform();
    var o = transform.getOrigin();
    var rot = transform.getRotation();
    var pos = tempvec1;
    pos[0] = o.x();
    pos[1] = o.y();
    pos[2] = o.z();
    var quat = tempquat1;
    quat[0] = rot.x();
    quat[1] = rot.y();
    quat[2] = rot.z();
    quat[3] = rot.w();
    quat = Quaternion.normalize(quat, tempquat2);
    var mat = goog.vec.Quaternion.toRotationMatrix4(quat, tempmat1);
    mat[0] *= this.localScale[0];
    mat[1] *= this.localScale[0];
    mat[2] *= this.localScale[0];
    mat[4] *= this.localScale[1];
    mat[5] *= this.localScale[1];
    mat[6] *= this.localScale[1];
    mat[8] *= this.localScale[2];
    mat[9] *= this.localScale[2];
    mat[10] *= this.localScale[2];
    var worldoffset = goog.vec.Mat4.multVec3(mat, this.localOffset, tempmat2)
    mat[12] = pos[0] - worldoffset[0] / this.localScale[0];
    mat[13] = pos[1] - worldoffset[1] / this.localScale[1];
    mat[14] = pos[2] - worldoffset[2] / this.localScale[2];
    //since the value is orthonormal, scaling is easy.
    if (this.parent.id == Engine.application()) this.transform = vecset(this.transform, mat);
    outmat = vecset(outmat, mat);
    return outmat;
}
phyObject.prototype.setTransform = function(matrix)
{
    matrix = Mat4.clone(matrix);
    var oldScale = vecset([], this.localScale);
    this.localScale = ScaleFromMatrix(matrix);
    matrix[0] /= this.localScale[0];
    matrix[1] /= this.localScale[0];
    matrix[2] /= this.localScale[0];
    matrix[4] /= this.localScale[1];
    matrix[5] /= this.localScale[1];
    matrix[6] /= this.localScale[1];
    matrix[8] /= this.localScale[2];
    matrix[9] /= this.localScale[2];
    matrix[10] /= this.localScale[2];
    //if(this.initialized === true && matComp(matrix,this.transform || [])) return;
    //todo: the compound collision of the parent does not need to be rebuild, just transforms updated
    //need new flag for this instead of full rebuild
    if (this.parent.id !== Engine.application() && this.enabled === true && !matComp(this.transform, matrix)) //if I'm part of a compound collsion
        this.markRootBodyCollisionDirty();
    else if (this.enabled === true && MATH.distanceVec3(this.localScale, oldScale) > .0001) //if I'm not part of a compound collision but my scale has changedd
    {
        this.markRootBodyCollisionDirty();
    }
    else if (this.initialized === true)
    { //if I'm not part of a compound collision but I've moved but not scaled
        this.transform = vecset(this.transform, matrix);
        if (this.parent.id !== Engine.application()) this.markRootBodyCollisionDirty();
        this.lastTickRotation = null;
        this.thisTickRotation = null;
        var startTransform = new Ammo.btTransform();
        startTransform.getOrigin().setX(matrix[12]);
        startTransform.getOrigin().setY(matrix[13]);
        startTransform.getOrigin().setZ(matrix[14]);
        var quat = [];
        Quaternion.fromRotationMatrix4(matrix, quat);
        quat = Quaternion.normalize(quat, []);
        if (this.localOffset)
        {
            var worldoff = Mat4.multVec3(Quaternion.toRotationMatrix4(quat, []), this.localOffset, []);
            startTransform.getOrigin().setX(matrix[12] + worldoff[0]);
            startTransform.getOrigin().setY(matrix[13] + worldoff[1]);
            startTransform.getOrigin().setZ(matrix[14] + worldoff[2]);
        }
        var q = new Ammo.btQuaternion(quat[0], quat[1], quat[2], quat[3]);
        startTransform.setRotation(q);
        Ammo.destroy(q);
        this.body.setCenterOfMassTransform(startTransform);
        Ammo.destroy(startTransform)
        if (this.collision)
        {
            //update the localscaling
        }
        if (this.mass == 0)
        {}
    }
    this.transform = vecset(this.transform, matrix);;
}
phyObject.prototype.delete = function(world)
{
    this.deinitialize();
}
phyObject.prototype.markRootBodyCollisionDirty = function()
{
    var parent = this;
    while (parent && parent.parent instanceof phyObject)
    {
        parent = parent.parent;
    }
    if (parent && parent instanceof phyObject)
    {
        parent.collisionDirty = true;
    }
}
phyObject.prototype.update = function()
{
    if (this.enabled === true && this.initialized === false)
    {
        //ahhhhhhhh almost missed this. we were loosing some state in the cached properties! They were never re-set after a re-initialize
        this.initialize();
    }
    if (this.initialized === true)
    {
        //these are applied in global space. You can cancel gravity for a specify object with a contant force of negative gravity
        if (this.constantForce)
        {
            this.body.activate();
            this.body.applyForce(this.constantForce);
        }
        if (this.constantTorque)
        {
            this.body.activate();
            this.body.applyTorque(this.constantTorque);
        }
    }
    if (this.collisionDirty && this.initialized === true)
    {
        var backupTrans = this.getTransform();
        this.deinitialize();
        this.initialize();
        //this.setLocalScaling(backupTrans);
        this.collisionDirty = false;
    }
}
define([], function()
{
    return phyObject;
})