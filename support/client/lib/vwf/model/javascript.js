"use strict";
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
var jsDriverSelf = this;
var inTick = false;

function defaultContext()
{
    this.setProperty = function(id, name, val)
    {
        if (inTick)
            Engine.setPropertyFast(id, name, val);
        else
            Engine.setProperty(id, name, val);
    }
    this.getProperty = function(id, name)
    {
        if (inTick)
            return Engine.getPropertyFast(id, name);
        else
            return Engine.getProperty(id, name);
    }
    this.postUpdates = function()
    {
        throw new Error('Should never get here!')
    }
    this.callMethod = function(id, methodname, params)
    {
        //note that this forces sync!
        return Engine.callMethod(id, methodname, params);
    }
    this.fireEvent = function(id, eventName, params)
        {
            vwf_view.kernel.fireEvent(id, eventName, params);
        }
        //this is also where we should be notifiying the refelector of new methods, events, properties and nodes
}
//when a function is called, a context is created to observe changes. When the funtion return, we post changes to Engine.
function executionContext(parentContext)
{
    this.touchedProperties = {};
    this.parent = parentContext;
}
executionContext.prototype.setProperty = function(id, name, val)
{
    if (!this.touchedProperties[id + name])
        this.touchedProperties[id + name] = {
            id: id,
            name: name,
            val: null,
            originalVal: null
        }
    this.touchedProperties[id + name].val = val;
}
executionContext.prototype.getProperty = function(id, name)
{
    if (this.touchedProperties[id + name])
        return this.touchedProperties[id + name].val;
    else
    {
        if (this.parent && this.parent instanceof executionContext)
        {
            var val = this.parent.getProperty(id, name);
            if (val)
                return val;
        }
        if (inTick)
            var val = Engine.getPropertyFast(id, name);
        else
            val = Engine.getProperty(id, name);
        this.touchedProperties[id + name] = {
            id: id,
            name: name,
            val: val,
            originalVal: null
        }
        if (!(typeof(val) == "string" ||  typeof(val) == "number" || typeof(val) == "boolean" || val == null || val == undefined))
            this.touchedProperties[id + name].originalVal = JSON.parse(JSON.stringify(this.touchedProperties[id + name].val));
        else
            this.touchedProperties[id + name].originalVal = val;
        this.touchedProperties[id + name].val = val;
        return val;
    }
}
executionContext.prototype.postUpdates = function()
{
    //debugger;
    var parentRoot = !(this.parent instanceof executionContext)
    for (var i in this.touchedProperties)
    {
        if (parentRoot)
        {
            if (!(Object.deepEquals(this.touchedProperties[i].val, this.touchedProperties[i].originalVal)))
                this.parent.setProperty(this.touchedProperties[i].id, this.touchedProperties[i].name, this.touchedProperties[i].val);
        }
        else
        {
            this.parent.touchedProperties[i] = this.touchedProperties[i];
        }
    }
}
executionContext.prototype.callMethod = function(id, methodname, params)
{
    return this.parent.callMethod(id, methodname, params);
}
executionContext.prototype.fireEvent = function(id, eventName, params)
{
    this.parent.fireEvent(id, eventName, params);
}
var APIModules = {
    clientAPI: function(id)
    {

        this.id = id;
        this.getClients = function()
        {
            return jsDriverSelf.getTopContext().getProperty(this.id, "clients");
        }
        this.getUserNameForConnectionID = function(id)
        {
            var clients = this.getClients();
            if (!clients || !clients[id]) return null;
            return clients[id].name;
        }
        this.getConnectionIDForUserName = function(name)
        {
            var clients = this.getClients();
            if (!clients) return null;
            for (var i in clients)
            {
                if (clients[i].name == name)
                    return i;
            }
            return null;
        }
        this.getAvatarForUserName = function(name)
        {
            return vwf.callMethod(vwf.application(), "findNodeByID", ['character-vwf-' + name]);
        }
        this.focus = function(cid, nodeID)
        {
            var clients = this.getClients();
            //did the user enter a whole node, not a node ID?
            if (nodeID && nodeID.id)
                nodeID = nodeID.id;
            if (clients[cid])
            {
                clients[cid].focusID = nodeID;
            }
        }
        this.getCameraIDForClient = function(id)
        {
            var clients = this.getClients();
            if (!clients || !clients[id]) return null;
            return clients[id].cameraID;
        }
        this.getCameraForClient = function(id)
        {
            var clients = this.getClients();
            if (!clients || !clients[id]) return null;
            return vwf.callMethod(vwf.application(), "findNodeByID", [clients[id].cameraID]);
        }
        this.getClientForCamera = function(id)
        {
            var clients = this.getClients();
            var ret = [];
            if (!clients) return null;
            for (var i in clients)
            {
                if (clients[i].cameraID == id)
                    ret.push( i );
            }
            return ret;
        }
    },
    physicsAPI: function(id)
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
            this.___physics_activation_state = 1;
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
    },
    traceAPI: function(nodeid)
    {
        this.id = nodeid
        this.___findVWFID = function(o)
        {
            if (!o) return null;
            if (o.vwfID) return o.vwfID;
            return this.___findVWFID(o.parent);
        }
        this.___getJSNode = function(o)
        {
            return Engine.models.javascript.nodes[o];
        }
        this.___filterResults = function(results)
        {
            if (!results) return results
            results.node = this.___getJSNode(this.___findVWFID(results.object));
            return results;
        }
        this.___buildOptions = function(options)
        {
            if (!options)
            {
                options = {
                    ignore: [],
                    filter: null
                }
            }
            for (var i = 0; i < options.ignore.length; i++)
            {
                if (options.ignore[i].constructor == String)
                    options.ignore[i] = _Editor.findviewnode(options.ignore[i]);
            }
            options.ignore.push(_Editor.GetMoveGizmo());
            options.ignore.push(_dSky);
            options.oldfilter = options.filter || function()
            {
                return true
            };
            var tself = this;
            options.filter = function(o)
            {
                var ret = true;
                if (options.oldfilter)
                {
                    ret = options.oldfilter(tself.___getJSNode(tself.___findVWFID(o)))
                }
                if (o.passable) return false;
                return ret;
            }
            return options;
        }
        this.rayCast = function(origin, direction, options)
        {
            var ret = _SceneManager.CPUPick(origin, direction, this.___buildOptions(options))
            return this.___filterResults(ret);
        }
        this.sphereCast = function(origin, direction, options)
        {
            var ret = _SceneManager.sphereCast(origin, direction, options)
            return this.___filterResults(ret);
        }
        this.frustCast = function(origin, direction, options)
        {
            var ret = _SceneManager.frustCast(origin, direction, options)
            return this.___filterResults(ret);
        }
    },
    audioAPI: function(id)
    {
        this.id = id;
        this.playSound=function(soundURL /* the url of the sound */, loop /* loop or not */, volume,restart /* restart at 0 if playing */)
        {
            vwf.callMethod(this.id,'playSound',[soundURL,loop,volume,restart])
            
        }
        this.stopSound=function(soundURL /* the url of the sound */)
        {
            vwf.callMethod(this.id,'stopSound',[soundURL])
           
        }
       this.pauseSound=function(soundURL /* the url of the sound */)
        {
            vwf.callMethod(this.id,'pauseSound',[soundURL])
           
        }
        this.deleteSound=function(soundURL /* the url of the sound */)
        {
            vwf.callMethod(this.id,'deleteSound',[soundURL])  
        }
    },
    transformAPI: function(id)
    {
        this.id = id;
        this.move = function(x, y, z, coordinateSystem /* x,y,z in meters, coordinateSystem either 'global' or 'local' */ )
        {
            if (x.length)
            {
                coordinateSystem = y;
                y = x[1];
                z = x[2];
                x = x[0];
            }
            if (!coordinateSystem)
                coordinateSystem = 'parent';
            if (coordinateSystem == 'parent')
            {
                var position = this.getPosition();
                position = Vec3.add(position, [x, y, z], []);
                this.setPosition(position);
            }
            if (coordinateSystem == 'local')
            {
                var position = this.getPosition();
                var offset = Mat4.multVec3NoTranslate(jsDriverSelf.getTopContext().getProperty(this.id, "transform"), [x, y, z], []);
                position = Vec3.add(position, offset, []);
                this.setPosition(position);
            }
        }
        this.getPosition = function()
        {
            var transform = jsDriverSelf.getTopContext().getProperty(this.id, "transform");
            return [transform[12], transform[13], transform[14]];
        }
        this.getWorldPosition = function()
        {
            var transform = jsDriverSelf.getTopContext().getProperty(this.id, "worldTransform");
            return [transform[12], transform[13], transform[14]];
        }
        this.localToGlobal = function(x, y, z)
        {
            if (x.length)
            {
                y = x[1];
                z = x[2];
                x = x[0];
            }
            var vec = [x, y, z];
            var targetTransform = jsDriverSelf.getTopContext().getProperty(this.id, "worldTransform");
            vec = Mat4.multVec3(targetTransform, vec, []);
            return vec;
        }
        this.localToGlobalRotation = function(x, y, z)
        {
            if (x.length)
            {
                y = x[1];
                z = x[2];
                x = x[0];
            }
            var vec = [x, y, z];
            var targetTransform = jsDriverSelf.getTopContext().getProperty(this.id, "worldTransform");
            vec = Mat4.multVec3NoTranslate(targetTransform, vec, []);
            return vec;
        }
        this.globalToLocal = function(x, y, z)
        {
            if (x.length)
            {
                y = x[1];
                z = x[2];
                x = x[0];
            }
            var vec = [x, y, z];
            var targetTransform = jsDriverSelf.getTopContext().getProperty(this.id, "worldTransform");
            var invTransform = Mat4.create();
            Mat4.invert(targetTransform, invTransform);
            vec = Mat4.multVec3(invTransform, vec, []);
            return vec;
        }
        this.globalToLocalRotation = function(x, y, z)
        {
            if (x.length)
            {
                y = x[1];
                z = x[2];
                x = x[0];
            }
            var vec = [x, y, z];
            var targetTransform = jsDriverSelf.getTopContext().getProperty(this.id, "worldTransform");
            var invTransform = Mat4.create();
            Mat4.invert(targetTransform, invTransform);
            vec = Mat4.multVec3NoTranslate(invTransform, vec, []);
            return vec;
        }
        this.globalRotationToLocalRotation = function(x, y, z)
        {
            if (x.length)
            {
                y = x[1];
                z = x[2];
                x = x[0];
            }
            var vec = [x, y, z];
            vec[0] /= 57.2957795;
            vec[1] /= 57.2957795;
            vec[2] /= 57.2957795;
            var targetTransform = jsDriverSelf.getTopContext().getProperty(this.id, "worldTransform");
            var mat = Mat4.makeEulerZXZ([], x, y, z);
            var invTransform = Mat4.create();
            Mat4.invert(targetTransform, invTransform);
            var mat = Mat4.multMat(mat, invTransform, []);
            Mat4.toEulerZXZ(mat, vec);
            vec[0] *= 57.2957795;
            vec[1] *= 57.2957795;
            vec[2] *= 57.2957795;
            return vec;
        }
        this.setPosition = function(x, y, z)
        {
            if (x.length)
            {
                y = x[1];
                z = x[2];
                x = x[0];
            }
            var transform = jsDriverSelf.getTopContext().getProperty(this.id, "transform");
            transform[12] = x;
            transform[13] = y;
            transform[14] = z;
            jsDriverSelf.getTopContext().setProperty(this.id, "transform", transform);
        }
        this.rotate = function(x, y, z, coordinateSystem)
        {
            if (x.length)
            {
                coordinateSystem = y;
                y = x[1];
                z = x[2];
                x = x[0];
            }
            this.rotateX(x, coordinateSystem);
            this.rotateY(y, coordinateSystem);
            this.rotateZ(z, coordinateSystem);
        }
        this.rotateX = function(angle, coordinateSystem)
        {
            this.rotateAroundAxis(angle, [1, 0, 0], coordinateSystem);
        }
        this.rotateY = function(angle, coordinateSystem)
        {
            this.rotateAroundAxis(angle, [0, 1, 0], coordinateSystem);
        }
        this.rotateZ = function(angle, coordinateSystem)
        {
            this.rotateAroundAxis(angle, [0, 0, 1], coordinateSystem);
        }
        this.COORDINATES = {
            LOCAL: 'local',
            GLOBAL: 'global',
            PARENT: 'parent'
        }
        this.rotateAroundAxis = function(angle, axis, coordinateSystem)
        {
            axis = Vec3.normalize(axis, []);
            var transform = jsDriverSelf.getTopContext().getProperty(this.id, "transform");
            if (!coordinateSystem)
                coordinateSystem = 'parent';
            if (coordinateSystem == 'local')
            {
                var axis = Mat4.multVec3NoTranslate(transform, axis, []);
            }
            angle /= 57.2957795;
            var rotmat = Mat4.makeRotate([], angle, axis[0], axis[1], axis[2]);
            var position = this.getPosition();
            var scale = this.getScale();
            transform[12] = 0;
            transform[13] = 0;
            transform[14] = 0;
            transform = Mat4.multMat(rotmat, transform, []);
            transform[12] = position[0];
            transform[13] = position[1];
            transform[14] = position[2];
            this.scaleMatrix(scale, transform);
            jsDriverSelf.getTopContext().setProperty(this.id, "transform", transform);
        }
        this.getRotation = function()
        {
            var m = jsDriverSelf.getTopContext().getProperty(this.id, "transform");
            var x = Math.atan2(m[9], m[10]);
            var y = Math.atan2(-m[8], Math.sqrt(m[9] * m[9] + m[10] * m[10]));
            var z = Math.atan2(m[4], m[0]);
            var euler = [x, y, z];
            euler[0] *= 57.2957795;
            euler[1] *= 57.2957795;
            euler[2] *= 57.2957795;
            return euler;
        }
        this.getWorldRotation = function()
        {
            var m = jsDriverSelf.getTopContext().getProperty(this.id, "worldTransform");
            var x = Math.atan2(m[9], m[10]);
            var y = Math.atan2(-m[8], Math.sqrt(m[9] * m[9] + m[10] * m[10]));
            var z = Math.atan2(m[4], m[0]);
            var euler = [x, y, z];
            euler[0] *= 57.2957795;
            euler[1] *= 57.2957795;
            euler[2] *= 57.2957795;
            return euler;
        }
        this.setRotation = function(x, y, z)
        {
            if (x.length)
            {
                y = x[1];
                z = x[2];
                x = x[0];
            }
            x /= 57.2957795;
            y /= 57.2957795;
            z /= 57.2957795;
            var xm = [
                1, 0, 0, 0,
                0, Math.cos(x), -Math.sin(x), 0,
                0, Math.sin(x), Math.cos(x), 0,
                0, 0, 0, 1
            ];
            var ym = [
                Math.cos(y), 0, Math.sin(y), 0,
                0, 1, 0, 0, -Math.sin(y), 0, Math.cos(y), 0,
                0, 0, 0, 1
            ];
            var zm = [
                Math.cos(z), -Math.sin(z), 0, 0,
                Math.sin(z), Math.cos(z), 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];
            var mat = goog.vec.Mat4.multMat(xm, goog.vec.Mat4.multMat(ym, zm, []), []);
            var pos = this.getPosition();
            var scale = this.getScale();
            mat[12] = pos[0];
            mat[13] = pos[1];
            mat[14] = pos[2];
            mat = this.scaleMatrix(scale, mat);
            jsDriverSelf.getTopContext().setProperty(this.id, "transform", mat);
        }
        this.getScale = function()
        {
            var mat = jsDriverSelf.getTopContext().getProperty(this.id, "transform");
            var x = Vec3.magnitude([mat[0], mat[1], mat[2]]);
            var y = Vec3.magnitude([mat[4], mat[5], mat[6]]);
            var z = Vec3.magnitude([mat[8], mat[9], mat[10]]);
            return [x, y, z];
        }
        this.setScale = function(x, y, z)
        {
            if (x.length)
            {
                y = x[1];
                z = x[2];
                x = x[0];
            }
            var mat = jsDriverSelf.getTopContext().getProperty(this.id, "transform");
            var xVec = Vec3.normalize([mat[0], mat[1], mat[2]], []);
            var yVec = Vec3.normalize([mat[4], mat[5], mat[6]], []);
            var zVec = Vec3.normalize([mat[8], mat[9], mat[10]], []);
            xVec = Vec3.scale(xVec, x, []);
            yVec = Vec3.scale(yVec, y, []);
            zVec = Vec3.scale(zVec, z, []);
            mat[0] = xVec[0];
            mat[1] = xVec[1];
            mat[2] = xVec[2];
            mat[4] = yVec[0];
            mat[5] = yVec[1];
            mat[6] = yVec[2];
            mat[8] = zVec[0];
            mat[9] = zVec[1];
            mat[10] = zVec[2];
            jsDriverSelf.getTopContext().setProperty(this.id, "transform", mat);
        }
        this.scaleMatrix = function(x, y, z, mat)
        {
            if (x.length)
            {
                mat = y;
                y = x[1];
                z = x[2];
                x = x[0];
            }
            var xVec = Vec3.normalize([mat[0], mat[1], mat[2]], []);
            var yVec = Vec3.normalize([mat[4], mat[5], mat[6]], []);
            var zVec = Vec3.normalize([mat[8], mat[9], mat[10]], []);
            xVec = Vec3.scale(xVec, x, []);
            yVec = Vec3.scale(yVec, y, []);
            zVec = Vec3.scale(zVec, z, []);
            mat[0] = xVec[0];
            mat[1] = xVec[1];
            mat[2] = xVec[2];
            mat[4] = yVec[0];
            mat[5] = yVec[1];
            mat[6] = yVec[2];
            mat[8] = zVec[0];
            mat[9] = zVec[1];
            mat[10] = zVec[2];
            return mat;
        }
        this.lookat = function(t, clamp, axis, up, fromOffset)
        {
            var target;
            target = t || t;
            if (!fromOffset) fromOffset = [0, 0, 0];
            if (!axis) axis = 'Y';
            if (up == 'X') up = [1, 0, 0];
            if (up == 'Y') up = [0, 1, 0];
            if (up == 'Z') up = [0, 0, 1];
            if (!up) up = [0, 0, 1];
            var scale = this.getScale();
            var pos = Vec3.add(this.getPosition(), fromOffset, []);
            var tovec = Vec3.subtract(pos, target, []);
            if (clamp == 'X')
                tovec[0] = 0;
            if (clamp == 'Y')
                tovec[1] = 0;
            if (clamp == 'Z')
                tovec[2] = 0;
            tovec = Vec3.normalize(tovec, []);
            var side = Vec3.cross(tovec, up, []);
            side = Vec3.normalize(side, []);
            up = Vec3.cross(side, tovec, []);
            var t = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            if (axis == 'Y')
            {
                t[0] = side[0];
                t[1] = side[1];
                t[2] = side[2];
                t[3] = 0;
                t[4] = tovec[0];
                t[5] = tovec[1];
                t[6] = tovec[2];
                t[7] = 0;
                t[8] = up[0];
                t[9] = up[1];
                t[10] = up[2];
                t[11] = 0;
                t[12] = pos[0];
                t[13] = pos[1];
                t[14] = pos[2];
                t[15] = 1;
                t = this.scaleMatrix(scale, t);
                jsDriverSelf.getTopContext().setProperty(this.id, "transform", t);
            }
            if (axis == '-Y')
            {
                t[0] = -side[0];
                t[1] = -side[1];
                t[2] = -side[2];
                t[3] = 0;
                t[4] = -tovec[0];
                t[5] = -tovec[1];
                t[6] = -tovec[2];
                t[7] = 0;
                t[8] = up[0];
                t[9] = up[1];
                t[10] = up[2];
                t[11] = 0;
                t[12] = pos[0];
                t[13] = pos[1];
                t[14] = pos[2];
                t[15] = 1;
                t = this.scaleMatrix(scale, t);
                jsDriverSelf.getTopContext().setProperty(this.id, "transform", t);
            }
            if (axis == 'X')
            {
                t[0] = -tovec[0];
                t[1] = -tovec[1];
                t[2] = -tovec[2];
                t[3] = 0;
                t[4] = side[0];
                t[5] = side[1];
                t[6] = side[2];
                t[7] = 0;
                t[8] = up[0];
                t[9] = up[1];
                t[10] = up[2];
                t[11] = 0;
                t[12] = pos[0];
                t[13] = pos[1];
                t[14] = pos[2];
                t[15] = 1;
                t = this.scaleMatrix(scale, t);
                jsDriverSelf.getTopContext().setProperty(this.id, "transform", t);
            }
            if (axis == 'Z')
            {
                t[0] = up[0];
                t[1] = up[1];
                t[2] = up[2];
                t[3] = 0;
                t[4] = side[0];
                t[5] = side[1];
                t[6] = side[2];
                t[7] = 0;
                t[8] = tovec[0];
                t[9] = tovec[1];
                t[10] = tovec[2];
                t[11] = 0;
                t[12] = pos[0];
                t[13] = pos[1];
                t[14] = pos[2];
                t[15] = 1;
                t = this.scaleMatrix(scale, t);
                jsDriverSelf.getTopContext().setProperty(this.id, "transform", t);
            }
        }
    }
}
define(["module", "vwf/model", "vwf/utility"], function(module, model, utility)
{
    // vwf/model/javascript.js is a placeholder for the JavaScript object interface to the
    // simulation.
    return model.load(module,
    {
        // This is a placeholder for providing a natural integration between simulation and the
        // browser's JavaScript environment.
        // 
        // Within the JavaScript environment, component instances appear as JavaScript objects.
        // 
        //   - Properties appear in the "properties" field. Each property contains a getter and
        //     setter callback to notify the object of property manipulation.
        //   - Methods appear in "methods".
        //   - Events appear in "events".
        //   - "parent" refers to the parent node and "children" is an array of the child nodes.
        // 
        //   - Node prototypes use the JavaScript prototype chain.
        //   - Properties, methods, events, and children may be referenced directly on the node or
        //     within their respective collections by name when there is no conflict with another
        //     attribute.
        //   - Properties support getters and setters that invoke a handler that may influence the
        //     property access.
        // == Module Definition ====================================================================
        // -- initialize ---------------------------------------------------------------------------
        initialize: function()
        {
            jsDriverSelf = this;
            this.nodes = {}; // maps id => new type()
            this.creatingNode(undefined, 0); // global root  // TODO: to allow Engine.children( 0 ), Engine.getNode( 0 ); is this the best way, or should the kernel createNode( global-root-id /* 0 */ )?
        },
        // == Model API ============================================================================
        // -- creatingNode -------------------------------------------------------------------------
        getTopContext: function()
        {
            return this.contextStack[0];
        },
        enterNewContext: function()
        {
            this.contextStack.unshift(new executionContext(this.contextStack[0]))
        },
        exitContext: function()
        {
            var topContext = this.contextStack.shift();
            topContext.postUpdates();
        },
        contextStack: [new defaultContext()],
        creatingNode: function(nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */ )
        {
            // Get the prototype node.
            var prototype = this.nodes[childExtendsID] || Object.prototype;
            // Get the behavior nodes.
            var behaviors = (childImplementsIDs || []).map(function(childImplementsID)
            {
                return jsDriverSelf.nodes[childImplementsID];
            });
            // For each behavior, create a proxy for this node to the behavior and attach it above
            // the prototype, or above the most recently-attached behavior.
            behaviors.forEach(function(behavior)
            {
                prototype = proxiedBehavior.call(jsDriverSelf, prototype, behavior);
            });
            // Create the node. It's prototype is the most recently-attached behavior, or the
            // specific prototype if no behaviors are attached.
            var node = this.nodes[childID] = Object.create(prototype);
            node.__children_by_name = {};
            node.childExtendsID = childExtendsID;
            node.parentId = nodeID;
            Object.defineProperty(node, "private",
            {
                value:
                {} // for bookkeeping, not visible to scripts on the node  // TODO: well, ideally not visible; hide this better ("_private", "vwf_private", ?)
            });
            node.id = childID; // TODO: move to vwf/model/object
            node.name = childName;
            node.parent = undefined;
            node.source = childSource;
            node.type = childType;
           
            node.properties = Object.create(prototype.properties || Object.prototype,
            {
                node:
                {
                    value: node
                } // for node.properties accessors (non-enumerable)  // TODO: hide this better
            });
            Object.defineProperty(node.properties, "create",
            {
                value: function(name, value, get, set)
                { // "this" is node.properties
                    return jsDriverSelf.kernel.createProperty(this.node.id, name, value, get, set);
                }
            });
            node.private.getters = Object.create(prototype.private ?
                prototype.private.getters : Object.prototype
            );
            node.private.setters = Object.create(prototype.private ?
                prototype.private.setters : Object.prototype
            );
            node.methods = Object.create(prototype.methods || Object.prototype,
            {
                node:
                {
                    value: node
                } // for node.methods accessors (non-enumerable)  // TODO: hide this better
            });
            Object.defineProperty(node.methods, "create",
            {
                value: function(name, parameters, body)
                { // "this" is node.methods  // TODO: also accept create( name, body )
                    return jsDriverSelf.kernel.createMethod(this.node.id, name, parameters, body);
                }
            });
            node.private.bodies = Object.create(prototype.private ?
                prototype.private.bodies : Object.prototype
            );
            node.private.methods = Object.create(prototype.private ?
                prototype.private.methods : Object.prototype
            );
            node.private.events = Object.create(prototype.private ?
                prototype.private.events : Object.prototype
            );
            node.events = Object.create(prototype.events || Object.prototype,
            {
                node:
                {
                    value: node
                }, // for node.events accessors (non-enumerable)  // TODO: hide this better
            });
            // TODO: these only need to be on the base node's events object
            Object.defineProperty(node.events, "create",
            {
                value: function(name, parameters)
                { // "this" is node.events
                    return jsDriverSelf.kernel.createEvent(this.node.id, name, parameters);
                }
            });
            // Provide helper functions to create the directives for adding, removing and flushing
            // event handlers.
            // Add: node.events.*eventName* = node.events.add( *handler* [, *phases* ] [, *context* ] )
            Object.defineProperty(node.events, "add",
            {
                value: function(handler, phases, context)
                {
                    if (arguments.length != 2 || typeof phases == "string" || phases instanceof String || phases instanceof Array)
                    {
                        return {
                            add: true,
                            handler: handler,
                            phases: phases,
                            context: context
                        };
                    }
                    else
                    { // interpret add( handler, context ) as add( handler, undefined, context )
                        return {
                            add: true,
                            handler: handler,
                            context: phases
                        };
                    }
                }
            });
            // Remove: node.events.*eventName* = node.events.remove( *handler* )
            Object.defineProperty(node.events, "remove",
            {
                value: function(handler)
                {
                    return {
                        remove: true,
                        handler: handler
                    };
                }
            });
            // Flush: node.events.*eventName* = node.events.flush( *context* )
            Object.defineProperty(node.events, "flush",
            {
                value: function(context)
                {
                    return {
                        flush: true,
                        context: context
                    };
                }
            });
            node.private.listeners = {}; // not delegated to the prototype as with getters, setters, and bodies; findListeners() filters recursion
            node.children = []; // TODO: connect children's prototype like properties, methods and events do? how, since it's an array? drop the ordered list support and just use an object?
            Object.defineProperty(node.children, "node",
            {
                value: node // for node.children accessors (non-enumerable)  // TODO: hide this better
            });
            Object.defineProperty(node.children, "create",
            {
                value: function(name, component, callback /* ( child ) */ )
                { // "this" is node.children
                    return jsDriverSelf.kernel.createChild(this.node.id, name, component /* , callback */ ); // TODO: support callback and map callback's childID parameter to the child node
                }
            });
            Object.defineProperty(node.children, "delete",
            {
                value: function(child)
                {
                    return jsDriverSelf.kernel.deleteNode(child.id);
                }
            });
            Object.defineProperty(node, "children_by_name",
            { // same as "in"  // TODO: only define on shared "node" prototype?
                get: function()
                {
                    return this.__children_by_name;
                },
                enumerable: true,
            });
            Object.defineProperty(node, "broadcast",
            { // same as "in"  // TODO: only define on shared "node" prototype?
                value: function(signal, data, range)
                {
                    var self = this;
                    var thisid = self.id;
                    var fromPos = jsDriverSelf.getTopContext().getProperty(thisid, 'worldPosition');
                    if(!jsDriverSelf.methodIndex[signal]) return;
                    for (var i =0; i < jsDriverSelf.methodIndex[signal].length; i++)
                    {
                        var targetNode = jsDriverSelf.nodes[jsDriverSelf.methodIndex[signal][i]];
                        {
                            var targetPos = jsDriverSelf.getTopContext().getProperty(targetNode.id, 'worldPosition');
                            if (range)
                            {
                                if (targetPos && fromPos && MATH.distanceVec3(fromPos, targetPos) < range)
                                {
                                    jsDriverSelf.callingMethod(targetNode.id, signal, [data], thisid);
                                }
                            }
                            else
                            {
                                jsDriverSelf.callingMethod(targetNode.id, signal, [data], thisid);
                            }
                        }
                    }
                },
                enumerable: false,
                configurable: false
            });
            Object.defineProperty(node.children, "broadcast",
            { // same as "in"  // TODO: only define on shared "node" prototype?
                value: function(signal, data, range)
                {
                    var self = this.node;
                    var thisid = self.id;
                    var fromPos = jsDriverSelf.getTopContext().getProperty(thisid, 'worldPosition');
                    var decendents = Engine.decendants(thisid);
                    for (var i in decendents)
                    {
                        var targetNode = jsDriverSelf.nodes[decendents[i]];
                        var targetPos = jsDriverSelf.getTopContext().getProperty(targetNode.id, 'worldPosition');
                        if (range)
                        {
                            if (targetPos && fromPos && MATH.distanceVec3(fromPos, targetPos) < range)
                            {
                                jsDriverSelf.callingMethod(targetNode.id, signal, [data], thisid);
                            }
                        }
                        else
                        {
                            jsDriverSelf.callingMethod(targetNode.id, signal, [data], thisid);
                        }
                    }
                },
                enumerable: false,
                configurable: false
            });
            Object.defineProperty(node, "signal",
            { // same as "in"  // TODO: only define on shared "node" prototype?
                value: function(id, signal, data)
                {
                    var self = this;
                    var thisid = self.id;
                    var targetNode = jsDriverSelf.nodes[id];
                    if (targetNode)
                    {
                        jsDriverSelf.callingMethod(targetNode.id, signal, [data], thisid);
                    }
                },
                enumerable: false,
                configurable: false
            });
            // Define the "time", "client", and "moniker" properties.
            Object.defineProperty(node, "time",
            { // TODO: only define on shared "node" prototype?
                get: function()
                {
                    return jsDriverSelf.kernel.time();
                },
                enumerable: true,
            });
            Object.defineProperty(node, "client",
            { // TODO: only define on shared "node" prototype?
                get: function()
                {
                    return jsDriverSelf.kernel.client();
                },
                enumerable: true,
            });
            Object.defineProperty(node, "moniker",
            { // TODO: only define on shared "node" prototype?
                get: function()
                {
                    return jsDriverSelf.kernel.moniker();
                },
                enumerable: true,
            });
            Object.defineProperty(node, "Scene",
            { // TODO: only define on shared "node" prototype?
                get: function()
                {
                    return jsDriverSelf.nodes['index-vwf'];
                },
                enumerable: true,
            });
            Object.defineProperty(node, "random",
            { // TODO: only define on shared "node" prototype?
                value: function()
                {
                    return Engine.random(this.id);
                },
                enumerable: true,
            });
            Object.defineProperty(node, 'bind',
            {
                value: function(eventName, value)
                {
                    var listeners = this.private.listeners[eventName] ||
                        (this.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if (typeof value == "function" || value instanceof Function)
                    {
                        listeners.push(
                        {
                            handler: value,
                            context: this
                        }); // for n
                    }
                    else
                    {
                        console.error('bound value must be a function');
                    }
                },
                enumerable: true,
                configurable: false
            });
            Object.defineProperty(node, 'unbind',
            {
                value: function(eventName, value)
                {
                    var listeners = this.private.listeners[eventName] ||
                        (this.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if (typeof value == "function" || value instanceof Function)
                    {
                        var found = -1;
                        for (var i = 0; i < listeners.length; i++)
                        {
                            if (listeners[i].handler == value)
                                found = i;
                        }
                        if (found != -1)
                        {
                            listeners.splice(found, 1);
                        }
                    }
                    else
                    {
                        //no need to report this, is commonly expected
                        //console.error('bound value must be a function');
                    }
                },
                enumerable: true,
                configurable: false
            });
            // Define a "future" proxy so that for any this.property, this.method, or this.event, we
            // can reference this.future( when, callback ).property/method/event and have the
            // expression evaluated at the future time.
       /*     Object.defineProperty(node, "in",
            { // TODO: only define on shared "node" prototype?
                value: function(when, callback)
                { // "this" is node
                    return refreshedFuture.call(jsDriverSelf, this, -when, callback); // relative time
                },
                enumerable: true,
            });
            Object.defineProperty(node, "at",
            { // TODO: only define on shared "node" prototype?
                value: function(when, callback)
                { // "this" is node
                    return refreshedFuture.call(jsDriverSelf, this, when, callback); // absolute time
                },
                enumerable: true,
            });
            Object.defineProperty(node, "future",
            { // same as "in"  // TODO: only define on shared "node" prototype?
                get: function()
                {
                    return this.in;
                },
                enumerable: true,
            });
            node.private.future = Object.create(prototype.private ?
                prototype.private.future : Object.prototype
            );

            Object.defineProperty(node.private.future, "private",
            {
                value:
                {
                    when: 0,
                    callback: undefined,
                    change: 0,
                }
            });
            */
            node.private.change = 1; // incremented whenever "future"-related changes occur
            if (nodeID)
                this.addingChild(nodeID, childID, childName);
        },
        //allow a behavior node to directly acess the properties of it's parent
        hookupBehaviorProperty: function(behaviorNode, parentid, propname)
        {
            if (behaviorNode[propname] !== undefined) return;
            if (Object.keys(behaviorNode).indexOf(propname) != -1)
                return;
            //jsDriverSelf = this;
            var node = this.nodes[parentid];
            Object.defineProperty(behaviorNode, propname,
            { // "this" is node in get/set
                get: function()
                {
                    return node[propname];
                },
                set: function(value)
                {
                    node[propname] = value
                },
                enumerable: true
            });
        },
        //Allow the behavior to call the parent's methods
        hookupBehaviorMethod: function(behaviorNode, parentid, propname)
        {
            if (propname == "initialize") return;
            if (behaviorNode[propname] !== undefined) return;
            if (Object.keys(behaviorNode).indexOf(propname) != -1)
                return;
            var node = this.nodes[parentid];
            Object.defineProperty(behaviorNode, propname,
            {
                value: node.methods[propname].bind(node),
                enumerable: true,
                configurable: true
            });
        },
        //hook the behavior as a sort of proxy to the parent property and methods
        hookupBehavior: function(behaviorNode, parentid)
        {
            var node = this.nodes[parentid];
            for (var i in node.properties)
            {
                this.hookupBehaviorProperty(behaviorNode, parentid, i);
            }
            for (var i in node.methods)
            {
                this.hookupBehaviorMethod(behaviorNode, parentid, i);
            }
        },
        //hook up the system API. They are defined in properties, and we dont' want to cause the context to think it needs to set them
        //so the user should not really call the APIs directly, but instead use these getters
        hookUpAPIs: function(node)
        {
            if ("___transformAPI" in node)
            {
                node.transformAPI = new APIModules.transformAPI(node.id);
            }
            if ("___audioAPI" in node)
            {

               node.audioAPI = new APIModules.audioAPI(node.id);
            }
            if ("___physicsAPI" in node)
            {
                node.physicsAPI = new APIModules.physicsAPI(node.id);
            }
            if (node.hasOwnProperty("___clientAPI"))
            {
                node.clientAPI = new APIModules.clientAPI(node.id);
            }
            if (node.hasOwnProperty("___commsAPI"))
            {
                Object.defineProperty(node, "commsAPI",
                { // TODO: only define on shared "node" prototype?
                    get: function()
                    {
                        return Engine.models.javascript.gettingProperty(this.id, "___commsAPI")
                    },
                    enumerable: true,
                });
            }
            if (node["___xAPI"])
            {
                Object.defineProperty(node, "xAPI",
                { // TODO: only define on shared "node" prototype?
                    get: function()
                    {
                        return Engine.models.javascript.gettingProperty(this.id, "___xAPI")
                    },
                    enumerable: true,
                });
            }
            if (node["___traceAPI"])
            {
                node.traceAPI = new APIModules.traceAPI(node.id);
            }
            if(node.id == Engine.application())
            {
                node.findNode = function(displayName,node)
                {
            
                  if(displayName) displayName = displayName;
                  if(!node)
                  node = this;
                  
                  if(node && node.properties && node.properties.DisplayName == displayName)
                    return node;
                  var ret = null;  
                  for(var i =0; i <  node.children.length; i++)
                  {
                      ret = this.findNode(displayName,node.children[i]);
                      if(ret) return ret;
                  }
                  return ret;
                }
                node.findNodeByID = function(id)
                {
                  if(!id) return null;
                  return jsDriverSelf.nodes[id];
                }
            }
        },
        methodIndex:{},
        indexMethods:function(child)
        {
            for(var i in child.methods)
            {
                if(!this.methodIndex[i])
                    this.methodIndex[i] = [];
                if(this.methodIndex[i].indexOf(child.id) == -1)
                    this.methodIndex[i].push(child.id);
            }
        },
        deindexMethods:function(child)
        {
            for(var i in child.methods)
            {
                if (this.methodIndex[i])
                {
                   var idx = this.methodIndex[i].indexOf(child.id);
                   if(idx !== -1)
                       this.methodIndex[i].splice(idx,1)
                }
            }
        },
        // -- initializingNode ---------------------------------------------------------------------
        // Invoke an initialize() function if one exists.
        initializingNode: function(nodeID, childID)
        {
            var child = this.nodes[childID];
            if (this.isBehavior(child))
            {
                this.hookupBehavior(child, nodeID);
            }
            this.hookUpAPIs(child);
            child.private.initialized = true;
            this.indexMethods(child);
            var scriptText = "this.initialize && this.initialize()";
            if(child.private.bodies["initialize"])
            {
                this.tryCallMethod(child,child.private.bodies["initialize"],"initialize",[])
            }
           
            return undefined;
        },
        // -- deletingNode -------------------------------------------------------------------------
        deletingNode: function(nodeID)
        {
            var child = this.nodes[nodeID];
            this.deindexMethods(child);
            //this.callMethodTraverse(this.nodes['index-vwf'],'deletingNode',[nodeID]);
            var node = child.parent;
            if (child.parent && child.parent.__children_by_name)
            {
                var oldname = Engine.getProperty(nodeID, 'DisplayName');
                delete child.parent.__children_by_name[oldname];
            }
            if (node)
            {
                if (child.children)
                    for (var i = 0; i < child.children.length; i++)
                    {
                        this.deletingNode(child.children[i].id);
                    }
                var index = node.children.indexOf(child);
                if (index >= 0)
                {
                    node.children.splice(index, 1);
                }
                delete node.children[child.name]; // TODO: conflict if childName is parseable as a number
                if (node[child.name] === child)
                {
                    delete node[child.name]; // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                }
                child.parent = undefined;
            }
            var scriptText = "this.deinitialize && this.deinitialize()";
            if(child.private.bodies["deinitialize"])
            {
                this.tryCallMethod(child,child.private.bodies["deinitialize"],"deinitialize",[])
            }
            delete this.nodes[nodeID];
        },
        // -- addingChild --------------------------------------------------------------------------
        addingChild: function(nodeID, childID, childName)
        {
            var node = this.nodes[nodeID];
            var child = this.nodes[childID];
            child.parent = node;
            if (node)
            {
                node.children.push(child);
                node.children[parseInt(childName) ? "node-" + childName : childName] = child;
                node.hasOwnProperty(childName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                    (node[childName] = child);
            }
            var scriptText = "this.attached && this.attached()";
            if(child.private.bodies["attached"])
            {
                this.tryCallMethod(child,child.private.bodies["attached"],"attached",[])
            }
            scriptText = "this.childAdded && this.childAdded('" + childID + "')";
            if(child.private.bodies["childAdded"])
            {
                this.tryCallMethod(child,child.private.bodies["childAdded"],"childAdded",[childID])
            }
        },
        // TODO: removingChild
        // -- parenting ----------------------------------------------------------------------------
        parenting: function(nodeID)
        { // TODO: move to vwf/model/object
            var node = this.nodes[nodeID];
            return node && node.parent && node.parent.id || 0;
        },
        // -- childrening --------------------------------------------------------------------------
        childrening: function(nodeID)
        { // TODO: move to vwf/model/object
            var node = this.nodes[nodeID];
            if (!node) return null;
            return jQuery.map(node.children, function(child)
            {
                return child.id;
            });
        },
        // -- naming -------------------------------------------------------------------------------
        naming: function(nodeID)
        { // TODO: move to vwf/model/object
            var node = this.nodes[nodeID];
            return node.name || "";
        },
        // -- settingProperties --------------------------------------------------------------------
        settingProperties: function(nodeID, properties)
        { // TODO: these are here as a hack to keep scripts from coloring the setNode()/getNode() property values; vwf/kernel/model's disable and set/getProperties need to handle this properly (problem: getters can still return a value even when reentry is blocked)
        },
        // -- gettingProperties --------------------------------------------------------------------
        gettingProperties: function(nodeID, properties)
        { // TODO: these are here as a hack to keep scripts from coloring the setNode()/getNode() property values; vwf/kernel/model's disable and set/getProperties need to handle this properly (problem: getters can still return a value even when reentry is blocked)
        },
        // -- creatingProperty ---------------------------------------------------------------------
        creatingProperty: function(nodeID, propertyName, propertyValue, propertyGet, propertySet)
        {
            var node = this.nodes[nodeID];
            if (propertyGet)
            { // TODO: assuming javascript here; how to specify script type?
                //  try {
                node.private.getters[propertyName] = eval(getterScript(propertyGet));
                //  } catch ( e ) {
                //      this.logger.warn( "creatingProperty", nodeID, propertyName, propertyValue,
                //          "exception evaluating getter:", utility.exceptionMessage( e ) );
                //  }
            }
            else
            {
                node.private.getters[propertyName] = true; // set a guard value so that we don't call prototype getters on value properties
            }
            if (propertySet)
            { // TODO: assuming javascript here; how to specify script type?
                // try {
                node.private.setters[propertyName] = eval(setterScript(propertySet));
                // } catch ( e ) {
                //     this.logger.warn( "creatingProperty", nodeID, propertyName, propertyValue,
                //         "exception evaluating setter:", utility.exceptionMessage( e ) );
                // }
            }
            else
            {
                node.private.setters[propertyName] = true; // set a guard value so that we don't call prototype setters on value properties
            }
            //add the new property to the API for the children nodes
            for (var i = 0; i < node.children.length; i++)
            {
                if (this.isBehavior(node.children[i]))
                {
                    this.hookupBehaviorProperty(node.children[i], nodeID, propertyName);
                }
            }
            return this.initializingProperty(nodeID, propertyName, propertyValue);
        },
        initializingProperty: function(nodeID, propertyName, propertyValue)
        {
            var node = this.nodes[nodeID];
            Object.defineProperty(node.properties, propertyName,
            { // "this" is node.properties in get/set
                get: function()
                {
                    return Engine.getProperty(this.node.id, propertyName)
                },
                set: function(value)
                {
                    return Engine.setProperty(this.node.id, propertyName, value)
                },
                enumerable: true
            });
            var APIs = ["transformAPI", "traceAPI", "commsAPI", "clientAPI", "physicsAPI", "audioAPI", "xAPI"];
            if (!node.hasOwnProperty(propertyName) && APIs.indexOf(propertyName) == -1) // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
            {
                Object.defineProperty(node, propertyName,
                { // "this" is node in get/set
                    get: function()
                    {
                        return jsDriverSelf.getTopContext().getProperty(this.id, propertyName)
                    },
                    set: function(value)
                    {
                        return jsDriverSelf.getTopContext().setProperty(this.id, propertyName, value)
                    },
                    enumerable: true
                });
            }
            node.private.change++; // invalidate the "future" cache
            return propertyValue !== undefined ?
                this.settingProperty(nodeID, propertyName, propertyValue) : undefined;
        },
        // TODO: deletingProperty
        // -- settingProperty ----------------------------------------------------------------------
        callSetter: function(setter, node, propertyValue, propertyName)
        {
            //    this.enterNewContext()
            try
            {
                return setter.call(node, propertyValue);
            }
            catch (e)
            {
                console.error("settingProperty", node.ID, propertyName, propertyValue,
                    "exception in setter:", utility.exceptionMessage(e));
            }
            //    this.exitContext();
        },
        settingProperty: function(nodeID, propertyName, propertyValue)
        {
            //notify all nodes of property changes
            //this.callMethodTraverse(this.nodes['index-vwf'],'satProperty',[nodeID, propertyName, propertyValue]);
            var node = this.nodes[nodeID];
            if (!node) return; // TODO: patch until full-graph sync is working; drivers should be able to assume that nodeIDs refer to valid objects
            if (propertyName == 'DisplayName' && this.nodes[node.parentId])
            {
                var oldname = Engine.getProperty(nodeID, 'DisplayName');
                delete this.nodes[node.parentId].__children_by_name[oldname];
                this.nodes[node.parentId].__children_by_name[propertyValue] = node;
            }
            var setter = node.private.setters && node.private.setters[propertyName];
            if (setter && setter !== true)
            { // is there is a setter (and not just a guard value)
                this.callSetter(setter, node, propertyValue, propertyName);
            }
            return undefined;
        },
        // -- gettingProperty ----------------------------------------------------------------------
        tryGetter: function(node, getter)
        {
            // this.enterNewContext()
            try
            {
                var ret = getter.call(node);
                return ret;
            }
            catch (e)
            {
                console.error("gettingProperty", node.id,
                    "exception in getter:", utility.exceptionMessage(e));
                return undefined;
            }
            // this.exitContext();
        },
        gettingProperty: function(nodeID, propertyName, propertyValue)
        {
            if (this.disabled) return;
            var node = this.nodes[nodeID];
            if (!node) return undefined;
            var getter = node.private.getters && node.private.getters[propertyName];
            if (getter && getter !== true)
            { // is there is a getter (and not just a guard value)
                return this.tryGetter(node, getter);
            }
            else
                return undefined;
        },
        gettingMethod: function(nodeID, methodName)
        {
            var node = this.nodes[nodeID];
            var method;
            var func = node.private.methods && node.private.methods[methodName];
            if (func)
            {
                var str = func.body;
                method = str;
            }
            return method;
        },
        gettingMethods: function(nodeID)
        {
            var node = this.nodes[nodeID];
            var methods = {};
            if (!node) return methods;
            for (var i in node.methods)
            {
                if (node.methods.hasOwnProperty(i))
                {
                    var methodName = i;
                    var func = node.private.methods && node.private.methods[methodName];
                    if (func)
                    {
                        var str = func.body;
                        var params = func.parameters;
                        methods[methodName] = {
                            body: str,
                            parameters: params
                        };
                    }
                }
            }
            node = Object.getPrototypeOf(node);
            return methods;
        },
        gettingEvents: function(nodeID)
        {
            var node = this.nodes[nodeID];
            var events = {};
            if (!node) return events;
            if (node.events)
                for (var i in node.events)
                {
                    var eventName = i;
                    if (node.events.hasOwnProperty(i))
                    {
                        //TODO: deal with multiple handlers. Requires refactor of childcomponent create code.
                        for (var j = 0; j < node.private.events[eventName].length; j++)
                        {
                            var func = node.private.events && node.private.events[eventName] && node.private.events[eventName][j];
                            if (func)
                            {
                                events[eventName] = {
                                    parameters: func.parameters,
                                    body: func.body
                                };
                            }
                        }
                    }
                }
            node = Object.getPrototypeOf(node);
            return events;
        },
        // -- creatingMethod -----------------------------------------------------------------------
        creatingMethod: function(nodeID, methodName, methodParameters, methodBody)
        {
            var node = this.nodes[nodeID];
            //this.callMethodTraverse(this.nodes['index-vwf'],'creatingMethod',[methodName, methodParameters, methodBody]);
            Object.defineProperty(node.methods, methodName,
            { // "this" is node.methods in get/set
                get: function()
                {
                    return function( /* parameter1, parameter2, ... */ )
                    { // "this" is node.methods
                        return jsDriverSelf.kernel.callMethod(this.node.id, methodName, arguments);
                    };
                },
                set: function(value)
                {
                    this.node.methods.hasOwnProperty(methodName) ||
                        jsDriverSelf.kernel.createMethod(this.node.id, methodName);
                    this.node.private.bodies[methodName] = value;
                },
                enumerable: true,
                configurable: true
            });
            node.hasOwnProperty(methodName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                Object.defineProperty(node, methodName,
                { // "this" is node in get/set
                    get: function()
                    {
                        return function( /* parameter1, parameter2, ... */ )
                        { // "this" is node
                            if (this.private.methods[methodName] && this.private.methods[methodName].body) //if the script is implemented in the script engine, not some other part of the vwf
                            {
                                return jsDriverSelf.callingMethod(this.id, methodName, arguments);
                            }
                            else
                                return jsDriverSelf.kernel.callMethod(this.id, methodName, arguments);
                        };
                    },
                    set: function(value)
                    {
                        this.methods.hasOwnProperty(methodName) ||
                            jsDriverSelf.kernel.createMethod(this.id, methodName);
                        this.private.bodies[methodName] = value;
                    },
                    enumerable: true,
                    configurable: true
                });
            node.private.methods[methodName] = {
                body: methodBody,
                parameters: methodParameters,
                name: methodName
            };
            try
            {
                node.private.bodies[methodName] = this.evalBody(methodParameters || [], methodBody || "",methodName,node.id);
            }
            catch (e)
            {
                console.error("creatingMethod", nodeID, methodName, methodParameters,
                    "exception evaluating body:", utility.exceptionMessage(e));
            }
            for (var i = 0; i < node.children.length; i++)
            {
                if (this.isBehavior(node.children[i]))
                {
                    this.hookupBehaviorMethod(node.children[i], nodeID, methodName);
                }
            }
            node.private.change++; // invalidate the "future" cache
            if(node.private.initialized)
            {
                if(!this.methodIndex[methodName])
                     this.methodIndex[methodName] = [];
                if(this.methodIndex[methodName].indexOf(node.id) == -1)
                     this.methodIndex[methodName].push(node.id)
            }
        },
        evalBody:function (methodParameters , methodBody ,methodName,nodeID)
        {
            var body = new Function(methodParameters,methodBody);
            return body;

        },
        deletingMethod: function(nodeID, methodName)
        {
            var node = this.nodes[nodeID];
            //this.callMethodTraverse(this.nodes['index-vwf'],'deletingMethod',[nodeID,methodName]);
            if (!node) return undefined;
            var body = node.private.bodies && node.private.bodies[methodName];
            if (body)
            {
                try
                {
                    delete node.private.bodies[methodName];
                    if (node.hasOwnProperty(methodName))
                        delete node[methodName];
                    delete node.methods[methodName];
                    delete node.private.methods[methodName];
                }
                catch (e)
                {
                    console.error("deletingMethod", nodeID, methodName, methodParameters, // TODO: limit methodParameters for log
                        "exception:", utility.exceptionMessage(e));
                }
            }
            for (var i = 0; i < node.children.length; i++)
            {
                if (this.isBehavior(node.children[i]))
                {
                    this.dehookupBehaviorMethod(node.children[i], nodeID, methodName);
                }
            }
            if (node.private.initialized)
            {
                if (this.methodIndex[methodName])
                {
                   var idx = this.methodIndex[methodName].indexOf(nodeID);
                   if(idx !== -1)
                       this.methodIndex[methodName].splice(idx,1)
                }
            }
        
            return undefined;
        },
        // -- callingMethod ------------------------------------------------------------------------
        dehookupBehaviorMethod: function(obj, id, methodName)
        {
            if (obj[methodName])
            {
                delete obj[methodName];
            }
        },
        tryCallMethod: function(node, body, methodName, methodParameters)
        {
            try
            {
                var ret = body.apply(node, methodParameters);
                return ret;
            }
            catch (e)
            {
                console.error(e.toString() + " Node:'" + (node.properties.DisplayName || node.id) + "' during: '" + methodName + "' with '" + JSON.stringify(methodParameters) + "'");
                //            this.logger.warn( "callingMethod", nodeID, methodName, methodParameters, // TODO: limit methodParameters for log
                //              "exception:", utility.exceptionMessage( e ) );
                return;
            }
        },
        JavascriptEvalKeys: function(node, methodName, methodParameters)
        {
            var ret = (function()
            {
                try
                {
                    return eval(
                        '(function(){' +
                        'var keys = [];' +
                        'for (var i in ' + methodParameters[0] + '){keys.push(i)}' +
                        'var ret = [];' +
                        'for( var i = 0; i < keys.length; i++) {' +
                        'ret.push([keys[i],' + methodParameters[0] + '[keys[i]] ?' + methodParameters[0] + '[keys[i]].constructor:null])' +
                        '};' +
                        'return ret;' +
                        '}.bind(this))()');
                }
                catch (e)
                {
                    return null;
                }
            }).apply(node);
            return ret;
        },
        JavascriptEvalFunction: function(node, methodName, methodParameters)
        {
            var ret = (function()
            {
                try
                {
                    return eval(
                        '(function(){' +
                        //'debugger;'+
                        'return ' + methodParameters[0] + '.toString();' +
                        '}.bind(this))()');
                }
                catch (e)
                {
                    return null;
                }
            }).apply(node);
            if (ret && ret.indexOf("function ( /* parameter1, parameter2, ... */ )") == 0)
            {
                var nodereference = methodParameters[0].substr(0, methodParameters[0].lastIndexOf('.'));
                var funcid = methodParameters[0].substr(methodParameters[0].lastIndexOf('.') + 1);
                var refid = (function()
                {
                    try
                    {
                        return eval(
                            '(function(){' +
                            //'debugger;'+
                            'return ' + nodereference + '.id' +
                            '}.bind(this))()');
                    }
                    catch (e)
                    {
                        return null;
                    }
                }).apply(node);
                ret = (this.nodes[refid].private.bodies[funcid] || "").toString();
            }
            if (ret)
            {
                ret = ret.match(/\(.*\)/);
                if (ret && ret[0])
                    return ret[0];
                return null;
            }
            else
                return null;
        },
        callingMethod: function(nodeID, methodName, methodParameters)
        {
            //this.callMethodTraverse(this.nodes['index-vwf'],'calledMethod',[nodeID, methodName, methodParameters]);
            var node = this.nodes[nodeID];
            if (!node) return undefined;
            //used for the autocomplete - eval in the context of the node, and get the keys
            if (methodName == 'JavascriptEvalKeys')
            {
                return this.JavascriptEvalKeys(node, methodName, methodParameters)
            }
            //used by the autocomplete - eval in the context of the node and get the function params
            if (methodName == 'JavascriptEvalFunction')
            {
                return this.JavascriptEvalFunction(node, methodName, methodParameters)
            }
            var body = node.private.bodies && node.private.bodies[methodName];
            if (body)
            {
                var inContext = this.contextStack.length > 1;
                if (!inContext)
                    this.enterNewContext();
                var ret = this.tryExec(node, body, methodParameters); //body.apply(node, methodParameters);
                if (!inContext)
                    this.exitContext();
                return ret;
                if (!inContext)
                    this.exitContext();
            }
            //call the method on the child behaviors
            for (var i = 0; i < node.children.length; i++)
            {
                if (node.children[i] && this.isBehavior(node.children[i]))
                {
                    this.callingMethod(node.children[i].id, methodName, methodParameters)
                }
            }
            return undefined;
        },
        // -- creatingEvent ------------------------------------------------------------------------
        creatingEvent: function(nodeID, eventName, eventParameters, eventBody)
        {
            var node = this.nodes[nodeID];
            Object.defineProperty(node.events, eventName,
            { // "this" is node.events in get/set
                get: function()
                {
                    return function( /* parameter1, parameter2, ... */ )
                    { // "this" is node.events
                        return jsDriverSelf.kernel.fireEvent(this.node.id, eventName, arguments);
                    };
                },
                set: function(value)
                {
                    var listeners = this.node.private.listeners[eventName] ||
                        (this.node.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if (typeof value == "function" || value instanceof Function)
                    {
                        listeners.push(
                        {
                            handler: value,
                            context: this.node
                        }); // for node.events.*event* = function() { ... }, context is the target node
                    }
                    else if (value.add)
                    {
                        if (!value.phases || value.phases instanceof Array)
                        {
                            listeners.push(
                            {
                                handler: value.handler,
                                context: value.context,
                                phases: value.phases
                            });
                        }
                        else
                        {
                            listeners.push(
                            {
                                handler: value.handler,
                                context: value.context,
                                phases: [value.phases]
                            });
                        }
                    }
                    else if (value.remove)
                    {
                        this.node.private.listeners[eventName] = listeners.filter(function(listener)
                        {
                            return listener.handler !== value.handler;
                        });
                    }
                    else if (value.flush)
                    {
                        this.node.private.listeners[eventName] = listeners.filter(function(listener)
                        {
                            return listener.context !== value.context;
                        });
                    }
                },
                enumerable: true,
                configurable: true
            });
            node.hasOwnProperty(eventName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                Object.defineProperty(node, eventName,
                { // "this" is node in get/set
                    get: function()
                    {
                        return function( /* parameter1, parameter2, ... */ )
                        { // "this" is node
                            return jsDriverSelf.kernel.fireEvent(this.id, eventName, arguments);
                        };
                    },
                    set: function(value)
                    {
                        var listeners = this.private.listeners[eventName] ||
                            (this.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                        if (typeof value == "function" || value instanceof Function)
                        {
                            listeners.push(
                            {
                                handler: value,
                                context: this
                            }); // for node.*event* = function() { ... }, context is the target node
                        }
                        else if (value.add)
                        {
                            if (!value.phases || value.phases instanceof Array)
                            {
                                listeners.push(
                                {
                                    handler: value.handler,
                                    context: value.context,
                                    phases: value.phases
                                });
                            }
                            else
                            {
                                listeners.push(
                                {
                                    handler: value.handler,
                                    context: value.context,
                                    phases: [value.phases]
                                });
                            }
                        }
                        else if (value.remove)
                        {
                            this.private.listeners[eventName] = listeners.filter(function(listener)
                            {
                                return listener.handler !== value.handler;
                            });
                        }
                        else if (value.flush)
                        {
                            this.private.listeners[eventName] = listeners.filter(function(listener)
                            {
                                return listener.context !== value.context;
                            });
                        }
                    },
                    enumerable: true,
                    configurable: true
                });
            node.private.listeners[eventName] = [];
            node.private.events[eventName] = [];
            if (eventBody)
            {
                try
                {
                    var handler = {
                        handler: null,
                        context: node
                    }
                    handler.handler = this.evalBody(eventParameters || [], eventBody || "",eventName,node.id);
                    node.private.listeners[eventName].push(handler);
                    node.private.events[eventName].push(
                    {
                        name: eventName,
                        body: eventBody,
                        parameters: eventParameters
                    });
                }
                catch (e)
                {
                    console.error("creatingEvent", nodeID, eventName, eventParameters, // TODO: limit methodParameters for log
                        "exception:", utility.exceptionMessage(e));
                }
            }
            node.private.change++; // invalidate the "future" cache
        },
        deletingEvent: function(nodeID, eventName)
        {
            var node = this.nodes[nodeID];
            if (!node) return undefined;
            if (node)
            {
                try
                {
                    if (node.private.events && node.private.events[eventName])
                        delete node.private.events[eventName];
                    if (node.private.listeners && node.private.listeners[eventName])
                        delete node.private.listeners[eventName];
                    if (node.hasOwnProperty(eventName))
                        delete node[eventName];
                    if (node.events.hasOwnProperty(eventName))
                        delete node.events[eventName];
                }
                catch (e)
                {
                    console.error("deletingEvent", nodeID, eventName, eventParameters, // TODO: limit methodParameters for log
                        "exception:", utility.exceptionMessage(e));
                }
            }
        },
        tryExec: function(node, body, args)
        {
            if (node && body)
            {
                try
                {
                    return body.apply(node, args);
                }
                catch (e)
                {
                    console.error("Error executing " + node.id, body, args, e)
                    return undefined;
                }
            }
        },
        callMethodTraverse: function(node, method, args)
        {
            if (!node) return;
            var body = node.private.bodies && node.private.bodies[method];
            var inContext = this.contextStack.length > 1;
            if (!inContext)
                this.enterNewContext();
            if (body)
            {
                this.tryExec(node, body, args);
            }
            if (node.children)
                for (var i = 0; i < node.children.length; i++)
                {
                    this.callMethodTraverse(node.children[i], method, args);
                }
            if (!inContext)
                this.exitContext();
        },
        ticking: function()
        {
            inTick = true;
            var now = performance.now();
            this.enterNewContext();
            this.callMethodTraverse(this.nodes['index-vwf'], 'tick', []);
            this.exitContext();
            //console.log("Tick View: " + (performance.now() - now))
            inTick = false;
        },
        isBehavior: function(node)
        {
            if (!node)
                return false;
            if (node.childExtendsID == 'http-vwf-example-com-behavior-vwf')
            {
                return true;
            }
            return this.isBehavior(node.__proto__);
        },
        // -- firingEvent --------------------------------------------------------------------------
        firingEvent: function(nodeID, eventName, eventParameters)
        {

            var phase = eventParameters && eventParameters.phase; // the phase is smuggled across on the parameters array  // TODO: add "phase" as a fireEvent() parameter? it isn't currently needed in the kernel public API (not queueable, not called by the drivers), so avoid if possible
            var node = this.nodes[nodeID];
            if (!node) return;
            var listeners = findListeners(node, eventName);
            // Call the handlers registered for the event, and calculate the logical OR of each
            // result. Normally, callers to fireEvent() ignore the handler result, but dispatched
            // events use the return value to determine when an event has been handled as it bubbles
            // up from its target.
            var handled = listeners && listeners.reduce(function(handled, listener)
            {
                // Call the handler. If a phase is provided, only call handlers tagged for that
                // phase.
                if (!phase || listener.phases && listener.phases.indexOf(phase) >= 0)
                {
                    jsDriverSelf.enterNewContext();
                    //var result = listener.handler.apply(listener.context || jsDriverSelf.nodes[0], eventParameters); // default context is the global root  // TODO: this presumes this.creatingNode( undefined, 0 ) is retained above
                    var result = jsDriverSelf.tryExec(listener.context || jsDriverSelf.nodes[0], listener.handler, eventParameters)
                    jsDriverSelf.exitContext();
                    return handled || result === true || result === undefined; // interpret no return as "return true"
                }
                return handled;
            }, false);
            if (handled) return handled;
            //if not handled, iterate over all children.
            /*
            handled = handled || phase != 'bubble' && node.children && node.children.reduce( function( handled, child ) {
                        
                        //don't distribute to child behaviors.
                        //behavior listeners are picked up in findListeners
                        if(child.childExtendsID == 'http-vwf-example-com-behavior-vwf')
                            return false;

                        var result = handled || jsDriverSelf.firingEvent(child.id,eventName, eventParameters); // default context is the global root  // TODO: this presumes this.creatingNode( undefined, 0 ) is retained above
                        return handled || result===true || result===undefined; // interpret no return as "return true"
            }, handled );*/
            return handled;
        },
        // -- executing ----------------------------------------------------------------------------
        executing: function(nodeID, scriptText, scriptType)
        {
            var node = this.nodes[nodeID];
            if (scriptType == "application/javascript")
            {
                // try {
                return (function(scriptText)
                {
                    return eval(scriptText)
                }).call(node, scriptText);
                // } catch ( e ) {
                //     this.logger.warn( "executing", nodeID,
                //         ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ), scriptType, "exception:", utility.exceptionMessage( e ) );
                // }
            }
            return undefined;
        },
    });
    // == Private functions ========================================================================
    // -- proxiedBehavior --------------------------------------------------------------------------
    function proxiedBehavior(prototype, behavior)
    { // invoke with the model as "this"  // TODO: this is a lot like createProperty()/createMethod()/createEvent(), and refreshedFuture(). Find a way to merge.
        var proxy = Object.create(prototype);
        Object.defineProperty(proxy, "private",
        {
            value: Object.create(behavior.private || Object.prototype)
        });
        proxy.private.origin = behavior; // the node we're the proxy for
        proxy.id = behavior.id; // TODO: move to vwf/model/object
        proxy.name = behavior.name;
        proxy.parent = behavior.parent;
        proxy.source = behavior.source;
        proxy.type = behavior.type;
        proxy.properties = Object.create(prototype.properties || Object.prototype,
        {
            node:
            {
                value: proxy
            } // for proxy.properties accessors (non-enumerable)  // TODO: hide this better
        });
        for (var propertyName in behavior.properties)
        {
            if (behavior.properties.hasOwnProperty(propertyName))
            {
                (function(propertyName)
                {
                    Object.defineProperty(proxy.properties, propertyName,
                    { // "this" is proxy.properties in get/set
                        get: function()
                        {
                            return jsDriverSelf.kernel.getProperty(this.node.id, propertyName)
                        },
                        set: function(value)
                        {
                            jsDriverSelf.kernel.setProperty(this.node.id, propertyName, value)
                        },
                        enumerable: true
                    });
                    proxy.hasOwnProperty(propertyName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                        Object.defineProperty(proxy, propertyName,
                        { // "this" is proxy in get/set
                            get: function()
                            {
                                return jsDriverSelf.kernel.getProperty(this.id, propertyName)
                            },
                            set: function(value)
                            {
                                jsDriverSelf.kernel.setProperty(this.id, propertyName, value)
                            },
                            enumerable: true
                        });
                })(propertyName);
            }
        }
        proxy.methods = Object.create(prototype.methods || Object.prototype,
        {
            node:
            {
                value: proxy
            } // for proxy.methods accessors (non-enumerable)  // TODO: hide this better
        });
        for (var methodName in behavior.methods)
        {
            if (behavior.methods.hasOwnProperty(methodName))
            {
                (function(methodName)
                {
                    Object.defineProperty(proxy.methods, methodName,
                    { // "this" is proxy.methods in get/set
                        get: function()
                        {
                            return function( /* parameter1, parameter2, ... */ )
                            { // "this" is proxy.methods
                                if (jsDriverSelf.nodes[this.node.id])
                                    return jsDriverSelf.kernel.callMethod(this.node.id, methodName, arguments);
                            };
                        },
                        set: function(value)
                        {
                            this.node.methods.hasOwnProperty(methodName) ||
                                jsDriverSelf.kernel.createMethod(this.node.id, methodName);
                            this.node.private.bodies[methodName] = value;
                        },
                        enumerable: true,
                    });
                    proxy.hasOwnProperty(methodName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                        Object.defineProperty(proxy, methodName,
                        { // "this" is proxy in get/set
                            get: function()
                            {
                                return function( /* parameter1, parameter2, ... */ )
                                { // "this" is proxy
                                    return jsDriverSelf.kernel.callMethod(this.id, methodName, arguments);
                                };
                            },
                            set: function(value)
                            {
                                this.methods.hasOwnProperty(methodName) ||
                                    jsDriverSelf.kernel.createMethod(this.id, methodName);
                                this.private.bodies[methodName] = value;
                            },
                            enumerable: true,
                        });
                })(methodName);
            }
        }
        proxy.events = Object.create(prototype.events || Object.prototype,
        {
            node:
            {
                value: proxy
            } // for proxy.events accessors (non-enumerable)  // TODO: hide this better
        });
        for (var eventName in behavior.events)
        {
            if (behavior.events.hasOwnProperty(eventName))
            {
                (function(eventName)
                {
                    Object.defineProperty(proxy.events, eventName,
                    { // "this" is proxy.events in get/set
                        get: function()
                        {
                            return function( /* parameter1, parameter2, ... */ )
                            { // "this" is proxy.events
                                return jsDriverSelf.kernel.fireEvent(this.node.id, eventName, arguments);
                            };
                        },
                        set: function(value)
                        {
                            var listeners = this.node.private.listeners[eventName] ||
                                (this.node.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                            if (typeof value == "function" || value instanceof Function)
                            {
                                listeners.push(
                                {
                                    handler: value,
                                    context: this.node
                                }); // for node.events.*event* = function() { ... }, context is the target node
                            }
                            else if (value.add)
                            {
                                if (!value.phases || value.phases instanceof Array)
                                {
                                    listeners.push(
                                    {
                                        handler: value.handler,
                                        context: value.context,
                                        phases: value.phases
                                    });
                                }
                                else
                                {
                                    listeners.push(
                                    {
                                        handler: value.handler,
                                        context: value.context,
                                        phases: [value.phases]
                                    });
                                }
                            }
                            else if (value.remove)
                            {
                                this.node.private.listeners[eventName] = listeners.filter(function(listener)
                                {
                                    return listener.handler !== value.handler;
                                });
                            }
                            else if (value.flush)
                            {
                                this.node.private.listeners[eventName] = listeners.filter(function(listener)
                                {
                                    return listener.context !== value.context;
                                });
                            }
                        },
                        enumerable: true,
                    });
                    proxy.hasOwnProperty(eventName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                        Object.defineProperty(proxy, eventName,
                        { // "this" is proxy in get/set
                            get: function()
                            {
                                return function( /* parameter1, parameter2, ... */ )
                                { // "this" is proxy
                                    return jsDriverSelf.kernel.fireEvent(this.id, eventName, arguments);
                                };
                            },
                            set: function(value)
                            {
                                var listeners = this.private.listeners[eventName] ||
                                    (this.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                                if (typeof value == "function" || value instanceof Function)
                                {
                                    listeners.push(
                                    {
                                        handler: value,
                                        context: this
                                    }); // for node.*event* = function() { ... }, context is the target node
                                }
                                else if (value.add)
                                {
                                    if (!value.phases || value.phases instanceof Array)
                                    {
                                        listeners.push(
                                        {
                                            handler: value.handler,
                                            context: value.context,
                                            phases: value.phases
                                        });
                                    }
                                    else
                                    {
                                        listeners.push(
                                        {
                                            handler: value.handler,
                                            context: value.context,
                                            phases: [value.phases]
                                        });
                                    }
                                }
                                else if (value.remove)
                                {
                                    this.private.listeners[eventName] = listeners.filter(function(listener)
                                    {
                                        return listener.handler !== value.handler;
                                    });
                                }
                                else if (value.flush)
                                {
                                    this.private.listeners[eventName] = listeners.filter(function(listener)
                                    {
                                        return listener.context !== value.context;
                                    });
                                }
                            },
                            enumerable: true,
                        });
                })(eventName);
            }
        }
        return proxy;
    }
    // -- refreshedFuture --------------------------------------------------------------------------
    function refreshedFuture(node, when, callback)
    { // invoke with the model as "this"
        if (Object.getPrototypeOf(node).private)
        {
            refreshedFuture.call(this, Object.getPrototypeOf(node));
        }
        var future = node.private.future;
        future.private.when = when;
        future.private.callback = callback; // TODO: would like to be able to remove this reference after the future call has completed
        if (future.private.change < node.private.change)
        { // only if out of date
            future.id = node.id;
            future.properties = Object.create(Object.getPrototypeOf(future).properties || Object.prototype,
            {
                future:
                {
                    value: future
                } // for future.properties accessors (non-enumerable)  // TODO: hide this better
            });
            for (var propertyName in node.properties)
            {
                if (node.properties.hasOwnProperty(propertyName))
                {
                    (function(propertyName)
                    {
                        Object.defineProperty(future.properties, propertyName,
                        { // "this" is future.properties in get/set
                            get: function()
                            {
                                return jsDriverSelf.kernel.getProperty(this.future.id,
                                    propertyName, this.future.private.when, this.future.private.callback
                                )
                            },
                            set: function(value)
                            {
                                jsDriverSelf.kernel.setProperty(this.future.id,
                                    propertyName, value, this.future.private.when, this.future.private.callback
                                )
                            },
                            enumerable: true
                        });
                        future.hasOwnProperty(propertyName) || // TODO: calculate so that properties take precedence over methods over events, for example
                            Object.defineProperty(future, propertyName,
                            { // "this" is future in get/set
                                get: function()
                                {
                                    return jsDriverSelf.kernel.getProperty(this.id,
                                        propertyName, this.private.when, this.private.callback
                                    )
                                },
                                set: function(value)
                                {
                                    jsDriverSelf.kernel.setProperty(this.id,
                                        propertyName, value, this.private.when, this.private.callback
                                    )
                                },
                                enumerable: true
                            });
                    })(propertyName);
                }
            }
            future.methods = Object.create(Object.getPrototypeOf(future).methods || Object.prototype,
            {
                future:
                {
                    value: future
                } // for future.methods accessors (non-enumerable)  // TODO: hide this better
            });
            for (var methodName in node.methods)
            {
                if (node.methods.hasOwnProperty(methodName))
                {
                    (function(methodName)
                    {
                        Object.defineProperty(future.methods, methodName,
                        { // "this" is future.methods in get/set
                            get: function()
                            {
                                return function( /* parameter1, parameter2, ... */ )
                                { // "this" is future.methods
                                    return jsDriverSelf.kernel.callMethod(this.future.id,
                                        methodName, arguments, this.future.private.when, this.future.private.callback
                                    );
                                }
                            },
                            enumerable: true
                        });
                        future.hasOwnProperty(methodName) || // TODO: calculate so that properties take precedence over methods over events, for example
                            Object.defineProperty(future, methodName,
                            { // "this" is future in get/set
                                get: function()
                                {
                                    return function( /* parameter1, parameter2, ... */ )
                                    { // "this" is future
                                        return jsDriverSelf.kernel.callMethod(this.id,
                                            methodName, arguments, this.private.when, this.private.callback
                                        );
                                    }
                                },
                                enumerable: true
                            });
                    })(methodName);
                }
            }
            future.events = Object.create(Object.getPrototypeOf(future).events || Object.prototype,
            {
                future:
                {
                    value: future
                } // for future.events accessors (non-enumerable)  // TODO: hide this better
            });
            for (var eventName in node.events)
            {
                if (node.events.hasOwnProperty(eventName))
                {
                    (function(eventName)
                    {
                        Object.defineProperty(future.events, eventName,
                        { // "this" is future.events in get/set
                            get: function()
                            {
                                return function( /* parameter1, parameter2, ... */ )
                                { // "this" is future.events
                                    return jsDriverSelf.kernel.fireEvent(this.future.id,
                                        eventName, arguments, this.future.private.when, this.future.private.callback
                                    );
                                };
                            },
                            enumerable: true,
                        });
                        future.hasOwnProperty(eventName) || // TODO: calculate so that properties take precedence over methods over events, for example
                            Object.defineProperty(future, eventName,
                            { // "this" is future in get/set
                                get: function()
                                {
                                    return function( /* parameter1, parameter2, ... */ )
                                    { // "this" is future
                                        return jsDriverSelf.kernel.fireEvent(this.id,
                                            eventName, arguments, this.private.when, this.private.callback
                                        );
                                    };
                                },
                                enumerable: true,
                            });
                    })(eventName);
                }
            }
            future.private.change = node.private.change;
        }
        return future;
    }
    // -- getterScript -----------------------------------------------------------------------------
    function getterScript(body)
    {
        return accessorScript("( function() {", body, "} )");
    }
    // -- setterScript -----------------------------------------------------------------------------
    function setterScript(body)
    {
        return accessorScript("( function( value ) {", body, "} )");
    }
    // -- bodyScript -------------------------------------------------------------------------------
    function bodyScript(parameters, body,name,id)
    {
        var parameterString = (parameters.length ? " " + parameters.join(", ") + " " : "");
        return accessorScript("( function(" + parameterString + ") {\n'use strict';\n ", body, "\n} )" );
        // return accessorScript( "( function(" + ( parameters.length ? " " + parameters.join( ", " ) + " " : ""  ) + ") {", body, "} )" );
    }
    // -- accessorScript ---------------------------------------------------------------------------
    function accessorScript(prefix, body, suffix)
    { // TODO: sanitize script, limit access
        if (body.length && body.charAt(body.length - 1) == "\n")
        {
            var bodyString = body.replace(/^./gm, "  $&");
            return prefix + "\n" + bodyString + suffix + "\n";
        }
        else
        {
            var bodyString = body.length ? " " + body + " " : "";
            return prefix + bodyString + suffix;
        }
    }
    // -- findListeners ----------------------------------------------------------------------------
    // TODO: this walks the full prototype chain and is probably horribly inefficient.
    function nodeInstanceOf(node, type)
    {
        while (node)
        {
            if (node.childExtendsID == type)
                return true;
            if (Engine.prototype(node.id))
                node = jsDriverSelf.nodes[Engine.prototype(node.id)];
            else
                node = null;
        }
        return false;
    }

    function findListeners(node, eventName, targetOnly)
    {
        var prototypeListeners = Object.getPrototypeOf(node).private ? // get any jsDriverSelf-targeted listeners from the prototypes
            findListeners(Object.getPrototypeOf(node), eventName, true) : [];
        var nodeListeners = node.private.listeners && node.private.listeners[eventName] || [];
        if (targetOnly)
        {
            return prototypeListeners.concat(nodeListeners.filter(function(listener)
            {
                return listener.context == node || listener.context == node.private.origin; // in the prototypes, select jsDriverSelf-targeted listeners only
            }));
        }
        else
        {
            //run find listeners in the child behavior nodes
            var childBehaviorListeners = [];
            for (var i = 0; i < node.children.length; i++)
            {
                if (nodeInstanceOf(node.children[i], 'http-vwf-example-com-behavior-vwf'))
                    childBehaviorListeners = childBehaviorListeners.concat(findListeners(node.children[i], eventName));
            }
            return prototypeListeners.map(function(listener)
            { // remap the prototype listeners to target the node
                return {
                    handler: listener.handler,
                    context: node,
                    phases: listener.phases
                };
            }).concat(childBehaviorListeners).concat(nodeListeners);
        }
    }
});
