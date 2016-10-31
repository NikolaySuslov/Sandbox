// Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.
/// vwf/model/object.js is a backstop property store.
///
/// @module vwf/model/object
/// @requires vwf/model
/// @requires vwf/configuration
var SCENE = 0;
var SPHERE = 1;
var BOX = 2;
var CYLINDER = 3;
var CONE = 4;
var PLANE = 5;
var MESH = 6;
var NONE = 7;
var ASSET = 8;


require.config(
{
    shim:
    {
        "vwf/model/ammo.js/ammo":
        {}
    }
})
define(["module", "vwf/model", "vwf/configuration","vwf/utility/eventSource", "vwf/model/ammo.js/ammo",
    "vwf/model/ammo.js/phyAsset",
    "vwf/model/ammo.js/phyBox",
    "vwf/model/ammo.js/phyCone",
    "vwf/model/ammo.js/phyCylinder",
    "vwf/model/ammo.js/phyObject",
    "vwf/model/ammo.js/phyPlane",
    "vwf/model/ammo.js/phySphere",
    "vwf/model/ammo.js/phyJoint",
    "vwf/model/ammo.js/phyPointToPointJoint",
    "vwf/model/ammo.js/phyHingeJoint",
    "vwf/model/ammo.js/phySliderJoint",
    "vwf/model/ammo.js/phyFixedJoint"
], function(module, model, configuration,eventSource, ammo,phyAsset, phyBox, phyCone, phyCylinder, phyObject, phyPlane, phySphere,phyJoint,phyPointToPointJoint,phyHingeJoint,phySliderJoint,phyFixedJoint)
{

    return model.load(module,
    {
        // == Module Definition ====================================================================
        // -- initialize ---------------------------------------------------------------------------
        reEntry: false,
        initialize: function()
        {
            eventSource.call(this,"Physics");
            this.nodes = {};
            this.allNodes = {};
            this.bodiesToID = {};
            this.jointBodyMap = {};
            var self = this;
            window.findphysicsnode = function(id)
            {
                return self.allNodes[id];
            };
            window._PhysicsDriver = this;
            //patch ammo.js to include a get for activation state
            Ammo.btCompoundShape.prototype.addChildShapeInner = Ammo.btCompoundShape.prototype.addChildShape;
            Ammo.btCompoundShape.prototype.addChildShape = function(transform, shape)
            {
                if (!this.childShapes)
                {
                    this.childShapes = [];
                    this.childTransforms = [];
                }
                this.childShapes.push(shape);
                this.childTransforms.push(transform);
                this.addChildShapeInner(transform, shape);
            }
            Ammo.btCompoundShape.prototype.getChildShape = function(i)
            {
                if (!this.childShapes)
                {
                    this.childShapes = [];
                    this.childTransforms = [];
                }
                return this.childShapes[i];
            }
            Ammo.btCompoundShape.prototype.getChildTransforms = function(i)
            {
                if (!this.childShapes)
                {
                    this.childShapes = [];
                    this.childTransforms = [];
                }
                return this.childTransforms[i];
            }
            Ammo.btCompoundShape.prototype.getChildShapeCount = function()
            {
                if (!this.childShapes)
                {
                    this.childShapes = [];
                    this.childTransforms = [];
                }
                return this.childTransforms.length;
            }
        },
        testConstraint: function(id, id1, id2)
        {
            this.allNodes[id] = new phyPointToPointJoint(id, this.allNodes[Engine.application()].world, this);
            this.allNodes[id].setBodyAID(id1);
            this.allNodes[id].setBodyBID(id2);
        },
        // == Model API ============================================================================
        // -- creatingNode -------------------------------------------------------------------------
        dirtyAssociatedJoints: function(nodeID)
        {
            for (var i in this.jointBodyMap)
                for (var j in this.jointBodyMap[i])
                    if (this.jointBodyMap[i][j] == nodeID) this.allNodes[i].setDirty();
        },
        isJoined: function(nodeID)
        {
            for (var i in this.jointBodyMap)
                for (var j in this.jointBodyMap[i])
                    if (this.jointBodyMap[i][j] == nodeID)
                        return true;
            return false;
        },
        creatingNode: function(nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childIndex, childName, callback /* ( ready ) */ )
        {
            if (childID === Engine.application())
            {
                this.nodes[Engine.application()] = {
                    world: null,
                    type: SCENE,
                    initialized: false,
                    children:
                    {},
                    id: childID,
                    simulationSteps: 10,
                    active: true,
                    ground: null,
                    localScale: [1, 1, 1]
                }
                this.allNodes[Engine.application()] = this.nodes[Engine.application()];
                this.resetWorld();
            }
            //node ID
            //the parent does not exist, so.....
            if (!this.allNodes[nodeID]) return;
            if (nodeID && hasPrototype(childID, 'sphere2-vwf'))
            {
                this.allNodes[nodeID].children[childID] = new phySphere(childID, this.allNodes[Engine.application()].world);
            }
            if (nodeID && hasPrototype(childID, 'box2-vwf'))
            {
                this.allNodes[nodeID].children[childID] = new phyBox(childID, this.allNodes[Engine.application()].world);
            }
            if (nodeID && hasPrototype(childID, 'cylinder2-vwf'))
            {
                this.allNodes[nodeID].children[childID] = new phyCylinder(childID, this.allNodes[Engine.application()].world);
            }
            if (nodeID && hasPrototype(childID, 'cone2-vwf'))
            {
                this.allNodes[nodeID].children[childID] = new phyCone(childID, this.allNodes[Engine.application()].world);
            }
            if (nodeID && hasPrototype(childID, 'plane2-vwf'))
            {
                this.allNodes[nodeID].children[childID] = new phyPlane(childID, this.allNodes[Engine.application()].world);
            }
            if (nodeID && hasPrototype(childID, 'pointConstraint-vwf'))
            {
                this.allNodes[nodeID].children[childID] = new phyPointToPointJoint(childID, this.allNodes[Engine.application()].world, this);
            }
            if (nodeID && hasPrototype(childID, 'hingeConstraint-vwf'))
            {
                this.allNodes[nodeID].children[childID] = new phyHingeJoint(childID, this.allNodes[Engine.application()].world, this);
            }
            if (nodeID && hasPrototype(childID, 'sliderConstraint-vwf'))
            {
                this.allNodes[nodeID].children[childID] = new phySliderJoint(childID, this.allNodes[Engine.application()].world, this);
            }
            if (nodeID && hasPrototype(childID, 'fixedConstraint-vwf'))
            {
                this.allNodes[nodeID].children[childID] = new phyFixedJoint(childID, this.allNodes[Engine.application()].world, this);
            }
            if (nodeID && (hasPrototype(childID, 'asset-vwf') || hasPrototype(childID, 'sandboxGroup-vwf')))
            {
                this.allNodes[nodeID].children[childID] = new phyAsset(childID, this.allNodes[Engine.application()].world);
            }
            //child was created
            if (this.allNodes[nodeID] && this.allNodes[nodeID].children[childID])
            {
                this.allNodes[childID] = this.allNodes[nodeID].children[childID];
                this.allNodes[childID].parent = this.allNodes[nodeID];
                //mark some initial properties
                if (this.allNodes[nodeID].children[childID] instanceof phyObject)
                {
                    Engine.setProperty(childID, '___physics_activation_state', 1);
                    Engine.setProperty(childID, '___physics_deactivation_time', 0);
                    Engine.setProperty(childID, '___physics_velocity_linear', [0, 0, 0]);
                    Engine.setProperty(childID, '___physics_velocity_angular', [0, 0, 0]);
                }
            }
        },
        oldCollisions:
        {},
        triggerCollisions: function()
        {
            var i, offset,
                dp = this.nodes[Engine.application()].world.getDispatcher(),
                num = dp.getNumManifolds(),
                manifold, num_contacts, j, pt,
                _collided = false;
            var newCollisions = {}
            for (i = 0; i < num; i++)
            {
                manifold = dp.getManifoldByIndexInternal(i);
                num_contacts = manifold.getNumContacts();
                if (num_contacts === 0)
                {
                    continue;
                }
                for (j = 0; j < num_contacts; j++)
                {
                    pt = manifold.getContactPoint(j);
                    //if ( pt.getDistance() < 0 ) {
                    var body0 = manifold.getBody0();
                    var body1 = manifold.getBody1();
                    var vwfIDA = this.bodiesToID[body0.ptr];
                    var vwfIDB = this.bodiesToID[body1.ptr];
                    var _vector0 = pt.get_m_normalWorldOnB();
                    var pt2a = pt.getPositionWorldOnA();
                    var pt2b = pt.getPositionWorldOnB();
                    var collisionPointA = [pt2a.x(), pt2a.y(), pt2a.y()];
                    var collisionPointB = [pt2b.x(), pt2b.z(), pt2b.z()];
                    var collisionNormal = [_vector0.x(), _vector0.y(), _vector0.z()]
                    var collision = {
                        collisionPointA: collisionPointA,
                        collisionPointB: collisionPointB,
                        collisionNormal: collisionNormal
                    };
                    if (!this.oldCollisions[vwfIDA] || this.oldCollisions[vwfIDA].indexOf(vwfIDB) === -1)
                        if (vwf.isSimulating(vwfIDA))
                            vwf.callMethod(vwfIDA, 'collision', [vwfIDB, collision]);
                    if (!this.oldCollisions[vwfIDB] || this.oldCollisions[vwfIDB].indexOf(vwfIDA) === -1)
                        if (vwf.isSimulating(vwfIDB))
                            vwf.callMethod(vwfIDB, 'collision', [vwfIDA, collision]);
                    if (!newCollisions[vwfIDA]) newCollisions[vwfIDA] = [];
                    if (!newCollisions[vwfIDB]) newCollisions[vwfIDB] = [];
                    newCollisions[vwfIDA].push(vwfIDB);
                    newCollisions[vwfIDB].push(vwfIDA);
                    break;
                }
            }
            this.oldCollisions = newCollisions;
        },
        ticking: function()
        {
            this.trigger('tickStart');
            delete this.pendingReset;
            if (this.nodes[Engine.application()] && this.nodes[Engine.application()].active === true)
            {
                var nodekeys = Object.keys(this.allNodes);
                for (var g = 0; g < nodekeys.length; g++)
                {
                    var node = this.allNodes[nodekeys[g]];
                    if (node && node.update)
                    {
                        node.update();
                        var propkeys = Object.keys(node.delayedProperties ||
                        {});
                        for (var i = 0; i < propkeys.length; i++)
                        {
                            this.settingProperty(node.id, propkeys[i], node.delayedProperties[propkeys[i]]);
                        }
                        delete node.delayedProperties;
                        if (node.body) this.bodiesToID[node.body.ptr] = node.id;
                    }
                }
                //step 50ms per tick.
                //this is dictated by the input from the reflector
                this.nodes[Engine.application()].world.stepSimulation(1 / 20, 0, 1 / 20);
                this.reEntry = true;
                var tempmat = [];
                var nodekeys2 = Object.keys(this.allNodes);
                for (var i = 0; i < nodekeys2.length; i++)
                {
                    var node = this.allNodes[nodekeys2[i]];
                    if (node)
                    {
                        if (node.ticked)
                            node.ticked();
                        if (node.body && node.initialized === true && node.mass > 0 && Engine.isSimulating(node.id))
                        {
                            Engine.setProperty(node.id, 'transform', node.getTransform(tempmat));
                            //so, we were setting these here in order to inform the kernel that the property changed. Can we not do this, and 
                            //rely on the getter? that would be great....
                            Engine.setPropertyFast(node.id, '___physics_activation_state', node.getActivationState());
                            Engine.setPropertyFast(node.id, '___physics_velocity_angular', node.getAngularVelocity());
                            Engine.setPropertyFast(node.id, '___physics_velocity_linear', node.getLinearVelocity());
                            Engine.setPropertyFast(node.id, '___physics_deactivation_time', node.getDeactivationTime());
                        }
                        if (node.joint)
                        {
                            Engine.setProperty(node.id, 'transform', node.getTransform(tempmat));
                        }
                    }
                }
                this.triggerCollisions();
                this.reEntry = false;
            }
            this.trigger('tickEnd');
        },
        // -- initializingNode ---------------------------------------------------------------------
        initializingNode: function(nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childIndex, childName)
        {
            if (!this.allNodes[nodeID]) return;
            var node = this.allNodes[nodeID].children[childID];
            if (node) node.ready = true;
            if (node && node.initialized === false)
            {
                node.initialize(this.nodes[Engine.application()].world);
                for (var i in node.delayedProperties)
                {
                    this.settingProperty(node.id, i, node.delayedProperties[i]);
                }
                delete node.delayedProperties;
                if (node.body) this.bodiesToID[node.body.ptr] = childID;
            }
        },
        // -- deletingNode -------------------------------------------------------------------------
        deletingNode: function(nodeID)
        {
            var node = this.allNodes[nodeID];
            if (node)
            {
                if (node instanceof phyObject) this.dirtyAssociatedJoints(nodeID);
                if (node instanceof phyJoint) delete this.jointBodyMap[nodeID]
                delete node.parent.children[nodeID];
                node.parent = null;
                node.deinitialize();
                node = null;
            }
            delete this.allNodes[nodeID];
        },
        startSimulatingNode: function(nodeID)
        {
            var node = this.allNodes[nodeID];
            if (node && node.startSimulating)
                node.startSimulating();
        },
        stopSimulatingNode: function(nodeID)
        {
            var node = this.allNodes[nodeID];
            if (node && node.stopSimulating)
                node.stopSimulating();
        },
        // -- creatingProperty ---------------------------------------------------------------------
        creatingProperty: function(nodeID, propertyName, propertyValue)
        {
            return this.initializingProperty(nodeID, propertyName, propertyValue);
        },
        // -- initializingProperty -----------------------------------------------------------------
        initializingProperty: function(nodeID, propertyName, propertyValue)
        {
            return this.settingProperty(nodeID, propertyName, propertyValue);
        },
        resetWorld: function()
        {
            this.pendingReset = true;
            //here, we must reset the world whenever a new client joins. This is because the new client must be aligned. They will be
            //initializing the world in a given state. There is stateful information internal to the physics engine that can only be reset on the other clients
            //by rebuilding the whole sim on each.
            var world = this.allNodes[Engine.application()].world;
            var IDs_to_enable = [];
            if (world)
            {
                var nodekeys = Object.keys(this.allNodes);
                for (var i in nodekeys)
                {
                    var node = this.allNodes[nodekeys[i]];
                    if (Engine.getProperty(nodekeys[i], "___physics_enabled"))
                    {
                        //call the getters, because they will cache the values to survive the reset
                        //var backupTrans = node.getTransform();
                        //node.backupTrans = backupTrans;
                        this.settingProperty(nodekeys[i], "___physics_enabled", false);
                        IDs_to_enable.push(nodekeys[i]);
                    }
                }
                world.removeRigidBody(this.allNodes[Engine.application()].ground);
                for (var i in nodekeys)
                {
                    var node = this.allNodes[nodekeys[i]];
                    if (node.deinitialize) node.deinitialize();
                    node.world = null;
                }
                delete this.allNodes[Engine.application()].world;
                Ammo.destroy(world);
            }
            var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(); // every single |new| currently leaks...
            var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
            var overlappingPairCache = new Ammo.btDbvtBroadphase();
            var solver = new Ammo.btSequentialImpulseConstraintSolver();
            var dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
            dynamicsWorld.setGravity(new Ammo.btVector3(0, 0, -9.8));
            this.allNodes[Engine.application()].world = dynamicsWorld;
            world = dynamicsWorld;
            var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(500, 500, .1));
            var groundTransform = new Ammo.btTransform();
            groundTransform.setIdentity();
            groundTransform.setOrigin(new Ammo.btVector3(0, 0, 0));
            var mass = 0;
            var isDynamic = mass !== 0;
            var localInertia = new Ammo.btVector3(0, 0, 0);
            var myMotionState = new Ammo.btDefaultMotionState(groundTransform);
            var rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia);
            var body = new Ammo.btRigidBody(rbInfo);
            body.setDamping(1, 1);
            body.setFriction(.7);
            body.setRestitution(.4);
            this.allNodes[Engine.application()].ground = body;
            world.addRigidBody(this.allNodes[Engine.application()].ground);
            //we need to see if adding the node back to the world is enough, or if we really have to kill and rebuild
            //research seems to indicate that you could just recreate the world but not all the bodies
            //but that did not work here, it needs to delay to next tick.
            for (var j = 0; j < IDs_to_enable.length; j++)
            {
                var i = IDs_to_enable[j];
                var node = this.allNodes[i];
                node.world = world;
                if (node.world && i != Engine.application())
                {
                    node.world = world;
                    node.initialized = false;
                    node.ready = true;
                    Engine.setProperty(i, "___physics_enabled", true);
                }
            }
            //this.reinit();
        },
        firingEvent: function(nodeID, eventName, params)
        {
            if (nodeID == Engine.application() && eventName == 'clientConnected')
            {}
        },
        // TODO: deletingProperty
        callingMethod: function(nodeID, methodName, args)
        {
            if (methodName == "startSimulatingNode")
                this.startSimulatingNode(args);
            if (methodName == "stopSimulatingNode")
                this.stopSimulatingNode(args);
            //dont try to set the parent
            if (!this.allNodes[nodeID]) return;
            //don't allow reentry since this driver can both get and set transform
            if (this.reEntry === true) return;
            var node = this.allNodes[nodeID];
            if (methodName === '___physics_addForce')
            {
                node.addForce(args[0]);
            }
            if (methodName === '___physics_addForceOffset')
            {
                node.addForce(args[0], args[1]);
            }
            if (methodName === '___physics_addTorque')
            {
                node.addTorque(args[0]);
            }
            //we cannot resync on the transform property of joined bodies or joints
            //this is because the relative transforms between the transforms of hte bodies are important
            //if you're going to sync one, need to do all
            if (methodName == "filterResyncData")
            {
                if (this.isJoined(nodeID) || this.allNodes[nodeID] instanceof phyJoint)
                {
                    return [];
                }
                return args;
            }
            if (methodName == '___physics_world_reset')
            {
                //if a client joins (who is not myself), I need to reset.
                //note that the timing of this call has been carefully examined. There can be no model changes (especially in the physics)
                //between the GetState being sent to the load client, and this event occuring.
                // if(Engine.moniker() != args[0])
                {
                    console.log('reset world to sync late joining client at', Engine.getProperty(Engine.application(), 'simTime'));
                    if (!this.pendingReset) this.resetWorld();
                }
            }
        },
        settingProperty: function(nodeID, propertyName, propertyValue)
        {
            //dont try to set the parent
            if (!this.allNodes[nodeID]) return;
            //don't allow reentry since this driver can both get and set transform
            if (this.reEntry === true) return;
            var node = this.allNodes[nodeID];
            if (node.ready === false)
            {
                if (!node.delayedProperties) node.delayedProperties = {};
                node.delayedProperties[propertyName] = propertyValue;
            }
            else
            {
                if (node.body) delete this.bodiesToID[node.body.ptr];
                if (propertyName === '___physics_gravity' && node.id === Engine.application())
                {
                    var g = new Ammo.btVector3(propertyValue[0], propertyValue[1], propertyValue[2]);
                    node.world.setGravity(g);
                    Ammo.destroy(g);
                }
                if (propertyName === '___physics_active' && node.id === Engine.application())
                {
                    node.active = propertyValue;
                }
                if (propertyName === '___physics_accuracy' && node.id === Engine.application())
                {
                    node.simulationSteps = propertyValue;
                }
                if (propertyName == "transform")
                {
                    node.setTransform(propertyValue);
                    if (node instanceof phyObject) this.dirtyAssociatedJoints(nodeID);
                    else if (node instanceof phyJoint) node.setDirty();
                }
                if (propertyName == 'radius' && node.type == SPHERE)
                {
                    node.setRadius(propertyValue);
                }
                if (propertyName == 'radius' && node.type == CYLINDER)
                {
                    node.setRadius(propertyValue);
                }
                if (propertyName == 'height' && node.type == CYLINDER)
                {
                    node.setHeight(propertyValue);
                }
                if (propertyName == 'radius' && node.type == CONE)
                {
                    node.setRadius(propertyValue);
                }
                if (propertyName == 'height' && node.type == CONE)
                {
                    node.setHeight(propertyValue);
                }
                if (propertyName == '_length' && node.type == BOX)
                {
                    node.setLength(propertyValue);
                }
                if (propertyName == 'width' && node.type == BOX)
                {
                    node.setWidth(propertyValue);
                }
                if (propertyName == 'height' && node.type == BOX)
                {
                    node.setHeight(propertyValue);
                }
                if (propertyName == '_length' && node.type == PLANE)
                {
                    node.setLength(propertyValue);
                }
                if (propertyName == 'width' && node.type == PLANE)
                {
                    node.setWidth(propertyValue);
                }
                if (propertyName === '___physics_enabled')
                {
                    if (propertyValue === true) node.enable();
                    if (propertyValue === false) node.disable();
                }
                if (propertyName === '___physics_mass')
                {
                    node.setMass(parseFloat(propertyValue), false);
                }
                if (propertyName === '___physics_restitution')
                {
                    node.setRestitution(parseFloat(propertyValue));
                }
                if (propertyName === '___physics_friction')
                {
                    node.setFriction(parseFloat(propertyValue));
                }
                if (propertyName === '___physics_damping')
                {
                    node.setDamping(parseFloat(propertyValue));
                }
                if (propertyName === '___physics_velocity_angular')
                {
                    node.setAngularVelocity(propertyValue);
                }
                if (propertyName === '___physics_velocity_linear')
                {
                    node.setLinearVelocity(propertyValue);
                }
                if (propertyName === '___physics_force_angular')
                {
                    node.setTorque(propertyValue);
                }
                if (propertyName === '___physics_force_linear')
                {
                    node.setForce(propertyValue);
                }
                if (propertyName === '___physics_activation_state')
                {
                    node.setActivationState(propertyValue);
                }
                if (propertyName === '___physics_deactivation_time')
                {
                    node.setDeactivationTime(propertyValue);
                }
                if (propertyName === '___physics_collision_width' && node.type == ASSET)
                {
                    node.setWidth(propertyValue);
                }
                if (propertyName === '___physics_collision_height' && node.type == ASSET)
                {
                    node.setHeight(propertyValue);
                }
                if (propertyName === '___physics_collision_length' && node.type == ASSET)
                {
                    node.setLength(propertyValue);
                }
                if (propertyName === '___physics_collision_radius' && node.type == ASSET)
                {
                    node.setRadius(propertyValue);
                }
                if (propertyName === '___physics_collision_type' && node.type == ASSET)
                {
                    node.setType(propertyValue);
                }
                if (propertyName === '___physics_collision_offset' && node.type == ASSET)
                {
                    node.setCollisionOffset(propertyValue);
                }
                if (propertyName === '___physics_factor_angular')
                {
                    node.setAngularFactor(propertyValue);
                }
                if (propertyName === '___physics_factor_linear')
                {
                    node.setLinearFactor(propertyValue);
                }
                if (propertyName === '___physics_constant_force')
                {
                    node.setConstantForce(propertyValue);
                }
                if (propertyName === '___physics_constant_torque')
                {
                    node.setConstantTorque(propertyValue);
                }
                if (propertyName === '___physics_joint_body_A')
                {
                    node.setBodyAID(propertyValue);
                }
                if (propertyName === '___physics_joint_body_B')
                {
                    node.setBodyBID(propertyValue);
                }
                if (propertyName === '___physics_joint_slider_lower_lin_limit')
                {
                    node.setLowerLinLimit(propertyValue);
                }
                if (propertyName === '___physics_joint_slider_upper_lin_limit')
                {
                    node.setUpperLinLimit(propertyValue);
                }
                if (propertyName === '___physics_joint_hinge_lower_ang_limit')
                {
                    node.setLowerAngLimit(propertyValue);
                }
                if (propertyName === '___physics_joint_hinge_upper_ang_limit')
                {
                    node.setUpperAngLimit(propertyValue);
                }
                //this is a hack
                //find a better way. Maybe delete the old key from the map above
                if (node.body) this.bodiesToID[node.body.ptr] = nodeID;
            }
        },
        // -- gettingProperty ----------------------------------------------------------------------
        gettingProperty: function(nodeID, propertyName, propertyValue)
        {
            //dont try to set the parent
            if (!this.allNodes[nodeID]) return;
            //don't allow reentry since this driver can both get and set transform
            if (this.reEntry === true) return;
            var node = this.allNodes[nodeID];
            if (node.ready === false) return;
            if (node instanceof phyObject)
            {
                if (propertyName === '___physics_activation_state')
                {
                    return node.getActivationState();
                }
                if (propertyName === '___physics_deactivation_time')
                {
                    return node.getDeactivationTime();
                }
                if (propertyName === '___physics_velocity_linear')
                {
                    return node.getLinearVelocity();
                }
                if (propertyName === '___physics_velocity_angular')
                {
                    return node.getAngularVelocity();
                }
            }
            if (node instanceof phyJoint)
            {}
        },
    });

    function hasPrototype(nodeID, prototype)
    {
        if (!nodeID) return false;
        if (nodeID == prototype) return true;
        else return hasPrototype(Engine.prototype(nodeID), prototype);
    }
});