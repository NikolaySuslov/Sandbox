function nevillesIteratedInterpolation(x, order, X, Y)
{
	var Q = [Y]
	for (var i = 1; i < order; i++)
	{
		Q.push([])
		for (var j = 1; j <= i; j++)
		{
			Q[j][i] = ((x - X[i - j]) * Q[j - 1][i] - (x - X[i]) * Q[j - 1][i - 1]) / (X[i] - X[i - j])
		}
	}
	return Q[j - 1][i - 1] || 0;
}

function stepWiseInterpolation(x, X, Y, sm1)
{
	return Y[Y.length - 1];
}

function runningAverageInterpolation(x, X, Y, sm1)
{
	var ret = 0;
	for (var i = 0; i < Y.length; i++)
	{
		ret += Y[i];
	}
	return ret / Y.length;
}

function linearExtrapolation(x, X, Y, arr)
{
	var len = Y.length - 1;
	if ((X[len] - X[len - 1]) == 0)
	{
		return Y[len];
	}
	var slope = (Y[len] - Y[len - 1]) / (X[len] - X[len - 1]);
	var dist = x - X[len];
	return Y[len] + dist * slope;
}

function exponentialInterpolation(x, X, Y, sm1)
{
	var len = Y.length - 1;
	var a = .25;
	if (Math.abs(Y[len] - Y[len - 1]) > DISCONTINUITY_THRESHOLD)
		return Y[len];
	return a * (Y[len]) + (1 - a) * sm1[sm1.length - 1];
}
var DISCONTINUITY_THRESHOLD = 2;

function exponentialInterpolationLinearExtrapolation(x, X, Y, sm1)
{
	var len = Y.length - 1;
	if (Math.abs(Y[len] - Y[len - 1]) > DISCONTINUITY_THRESHOLD)
		return Y[len];
	var a = .5;
	return a * (linearExtrapolation(x, X, Y, sm1)) + (1 - a) * sm1[sm1.length - 1];
}

function linearInterpolation(x, X, Y, sm1)
{
	return nevillesIteratedInterpolation(x, 2, X, Y);
}

function quadInterpolation(x, X, Y, sm1)
{
	return nevillesIteratedInterpolation(x, 3, X, Y);
}
var INTERP_TYPE = exponentialInterpolationLinearExtrapolation;

function interpolationQueue(length, default_val, id)
{
	this.length = length
	this.values = [];
	this.times = [];
	this.interpolatedValues = [];
	this.setCount = 0;
	this.id = id;
	for (var i = 0; i < this.length; i++)
	{
		var df = JSON.parse(JSON.stringify(default_val));
		this.values.push(df);
		this.times.push(0);
		this.interpolatedValues.push(df);
	}
}
interpolationQueue.prototype.push = function(val)
{
	if(this.setCount === 0)
	{
		
		for(var i = 0; i < this.length; i++)
		{
			this.values[i] = (val);
			this.interpolatedValues[i] = val;
			this.times[i] = (performance.now());
		}
		this.setCount ++;	
		return val;
	}
	if(this.values[this.values.length-1] == val)
	{
		this.times[this.times.length-1] = performance.now();
		this.setCount++;
		return val;
	}
	var oldval = this.values.shift();
	this.times.shift();
	this.values.push(val);
	this.times.push(performance.now());
	this.setCount++;
	return oldval;
}
interpolationQueue.prototype.interpolate = function(time, sim)
{
	if (this.setCount < 3)
		return this.values[0];
	var newVal = this._interpolate(time, sim);
	this.interpolatedValues.shift();
	this.interpolatedValues.push(newVal);
	return newVal;
}

function floatQueue(length, id)
{
	interpolationQueue.call(this, length, 0, id);
}
floatQueue.prototype = new interpolationQueue();
floatQueue.prototype._interpolate = function(time, sim)
{
	if (sim)
		return exponentialInterpolation(time, this.times, this.values, this.interpolatedValues);
	else
		return exponentialInterpolation(time, this.times, this.values, this.interpolatedValues);
}

function VectorQueue(length, id)
{
	interpolationQueue.call(this, length, [0, 0, 0], id)
	this.xQueue = new floatQueue(length, id);
	this.yQueue = new floatQueue(length, id);
	this.zQueue = new floatQueue(length, id);
}
VectorQueue.prototype = new interpolationQueue();
VectorQueue.prototype._interpolate = function(time, sim)
{
	var x = this.xQueue.interpolate(time, sim)
	var y = this.yQueue.interpolate(time, sim)
	var z = this.zQueue.interpolate(time, sim)
	return [x, y, z];
}
VectorQueue.prototype.push = function(val)
{
	var oldval = this.values.shift();
	this.times.shift();
	this.values.push(val);
	this.times.push(performance.now());
	this.xQueue.push(val[0]);
	this.yQueue.push(val[1]);
	this.zQueue.push(val[2]);
	this.setCount++;
	return [];
}

function QuaternionQueue(length, id)
{
	interpolationQueue.call(this, length, [0, 0, 1, 0], id);
}
QuaternionQueue.prototype = new interpolationQueue();
QuaternionQueue.prototype._interpolate = function(time, sim)
{
	var Y = this.values;
	var X = this.times;
	var x = time;
	var len = Y.length - 1;
	var slope = Quaternion.scale(Quaternion.add(Y[len], Quaternion.negate(Y[len - 1], []), []), 1 / (X[len] - X[len - 1]), []); //(Y[len] - Y[len-1])/(X[len] - X[len-1]);
	var dist = x - X[len];
	var extrapolated = Quaternion.add(Y[len], Quaternion.scale(slope, dist, []), []);
	var ret = Quaternion.slerp(this.interpolatedValues[len] || [0, 0, 0, 1], Y[len], .25, []);
	return Quaternion.normalize(ret, []);
}

function viewInterpolationNode(id, childExtendsID, threejsNode, sim)
{
	this.id = id;
	this._ready = true;
	this.threejsNode = threejsNode;
	this.childExtendsID = childExtendsID;
	this.extends = childExtendsID;
	this.properties = {};
	this.positionQueue = new VectorQueue(5, id);
	this.scaleQueue = new VectorQueue(5, id);
	this.quaternionQueue = new QuaternionQueue(5, id);
	this.animationFrameQueue = new floatQueue(5, id);
	this.enabled = true;
	this.lastUpdate = performance.now();
	this.totalTime = 0;
	this.lastTime = 0;
	this.simulating = sim;
	this.tempmat = new THREE.Matrix4();
	this.oldPos = [0, 0, 0];
	this.oldScale = [0, 0, 0];
	this.oldQuat = [0, 0, 0, 0];
}
viewInterpolationNode.prototype.reset_interp = function()
{
	this._ready = true;
	var t = this.getProperty('transform') || Engine.getPropertyFast(this.id, 'transform');
	var a = this.getProperty('animationFrame') || Engine.getPropertyFast(this.id, 'animationFrame');
	this.positionQueue.xQueue.setCount = 0;
	this.positionQueue.yQueue.setCount = 0;
	this.positionQueue.zQueue.setCount = 0;

	this.scaleQueue.xQueue.setCount = 0;
	this.scaleQueue.yQueue.setCount = 0;
	this.scaleQueue.zQueue.setCount = 0;

	this.scaleQueue.setCount = 0;
	this.positionQueue.setCount = 0;
	this.quaternionQueue.setCount = 0;

	this.quaternionQueue.setCount = 0;
	

	this.animationFrameQueue.setCount = 0;
	for(var i =0; i < 5; i++)
	{
		this.pushTransform(t)
		this.animationFrameQueue.push(a);
	}

}
viewInterpolationNode.prototype.setSim = function(v)
{
	this.simulating = v;
}
viewInterpolationNode.prototype.tick = function()
{
	if (this.enabled == false)
		return;
	if (Engine.getPropertyFast(Engine.application(), 'playMode') == 'play' && this.isSimulating())
	{
		this.lastUpdate = performance.now();
		var viewnode = this.threejsNode;
		if (!viewnode) return;
		if (viewnode.setTransformInternal)
		{
			var oldTransform = this.getProperty('transform');
			if (oldTransform)
			{
				oldTransform = matCpy(oldTransform);
				this.pushTransform(oldTransform);
			}
		}
		if (viewnode.setAnimationFrameInternal)
			this.animationFrameQueue.push(this.getProperty('animationFrame'));
	}
}
viewInterpolationNode.prototype.pushTransform = function(newTransform)
{
	if(!newTransform) return;
	var mat = viewInterpolationNode.tempmat;
	mat.elements.set(newTransform);
	var tempvec1 = viewInterpolationNode.tempvec1;
	var tempvec2 = viewInterpolationNode.tempvec2;
	var tempquat = viewInterpolationNode.tempquat;
	mat.decompose(tempvec1, tempquat, tempvec2);
	this.oldPos[0] = tempvec1.x;
	this.oldPos[1] = tempvec1.y;
	this.oldPos[2] = tempvec1.z;
	this.oldScale[0] = tempvec2.x;
	this.oldScale[1] = tempvec2.y;
	this.oldScale[2] = tempvec2.z;
	this.oldQuat[0] = tempquat.x;
	this.oldQuat[1] = tempquat.y;
	this.oldQuat[2] = tempquat.z;
	this.oldQuat[3] = tempquat.w;
	var oldPos = this.positionQueue.push(this.oldPos);
	var oldScale = this.scaleQueue.push(this.oldScale);
	var oldQuat = this.quaternionQueue.push(this.oldQuat);
	this.oldPos = oldPos;
	this.oldScale = oldScale;
	this.oldQuat = oldQuat;
}
viewInterpolationNode.prototype.setProperty = function(propertyName, propertyValue)
{
	if (propertyName == 'playMode')
	{
		this.properties[propertyName] = propertyValue;
	}
	if (propertyName == 'transform' && propertyValue)
	{
		this.properties[propertyName] = matCpy(propertyValue);
		this.enabled = true;
		this.lastUpdate = performance.now();
		//if (!this.isSimulating())
		{
			this.pushTransform(matCpy(propertyValue));
		}
	}
	if (propertyName == 'animationFrame')
	{
		this.enabled = true;
		this.lastUpdate = performance.now();
		this.properties[propertyName] = propertyValue;
		//if (!this.isSimulating())
		{
			this.animationFrameQueue.push(propertyValue)
		}
	}
}
viewInterpolationNode.prototype.isSimulating = function()
{
	return this.simulating;
}
viewInterpolationNode.prototype.getProperty = function(propertyName)
{
	return this.properties[propertyName];
}
viewInterpolationNode.prototype.interpolate = function(now, playmode)
{
	//framerate independant smoothing
	if (performance.now() - this.lastUpdate > 1500)
		this.enabled = false;
	this.totalTime += now - (this.lastTime ? this.lastTime : now);
	this.lastTime = now;
	if (!this.enabled || this._ready === false)
	{
		this.totalTime = 0;
		return;
	}
	var viewnode = this.threejsNode;
	if(!viewnode)
		return;
	if(!this.threejsNode.getRoot) return;
	var thispos = this.threejsNode.getRoot().matrixWorld.elements;
	var _thispos = [thispos[12], thispos[13], thispos[14]];
	var campos = _dView.getCamera().matrixWorld.elements;
	var _campos = [campos[12], campos[13], campos[14]];
	var dist = MATH.distanceVec3(_campos, _thispos);
	var ANIMATION_SMOOTH_DIST = 10;
	var TRANSFORM_SMOOTH_DIST = 20;
	if (!viewnode) return;
	var simulating = this.isSimulating();
	var queuetime = this.positionQueue.xQueue.times[4];
	var sti = viewnode.setTransformInternal;
	var qt = simulating && (playmode != 'play' && now - queuetime > 50);
	//	while (this.totalTime > 0)
	{
		this.totalTime -= 16;
		//	if(_Editor.isSelected(this.id))
		//		return;
		if (sti )
		{
			if (qt)
			{
				var oldTransform = this.getProperty('transform');
				if (oldTransform)
				{
					oldTransform = matCpy(oldTransform);
							this.pushTransform(oldTransform);
				}
			}
			var position = this.positionQueue.interpolate(now, simulating);
			var rotation = this.quaternionQueue.interpolate(now, simulating);
			var scale = this.scaleQueue.interpolate(now, simulating);
			if(TRANSFORM_SMOOTH_DIST > dist)
			{
			this.tempmat.compose(viewInterpolationNode.tempvec1.set(position[0], position[1], position[2]), viewInterpolationNode.tempquat.set(rotation[0], rotation[1], rotation[2], rotation[3]), viewInterpolationNode.tempvec2.set(scale[0], scale[1], scale[2]))			
			viewnode.setTransformInternal(this.tempmat.elements, false);
			
			}
		}
		if (viewnode.setAnimationFrameInternal)
		{
			//so, given that we don't have to have determinism, do we really need to backup and restore?
			//viewnode.backupTransforms(this.getProperty('animationFrame'));
			if (qt)
			{
					this.animationFrameQueue.push(this.getProperty('animationFrame'));
			}
			var newFrame = this.animationFrameQueue.interpolate(now, simulating);
			if (ANIMATION_SMOOTH_DIST > dist)
			{
				viewnode.setAnimationFrameInternal(newFrame, false);
			}
		}
	}
}
viewInterpolationNode.tempvec1 = new THREE.Vector3();
viewInterpolationNode.tempvec2 = new THREE.Vector3();
viewInterpolationNode.tempquat = new THREE.Quaternion();
viewInterpolationNode.tempmat = new THREE.Matrix4();
viewInterpolationNode.prototype.restore = function()
{
	if (!this.enabled) return;
	var viewnode = this.threejsNode;
	if (!viewnode) return;
	if (viewnode.setTransformInternal)
	{
		var oldTransform = this.getProperty('transform');
		if (oldTransform)
		{
			oldTransform = matCpy(oldTransform);
			viewnode.setTransformInternal(oldTransform, false);
			
		}
	}
	if (viewnode.setAnimationFrameInternal)
	{
		//so, given that we don't have to have determinism, do we really need to backup and restore?
		//viewnode.setAnimationFrameInternal(this.getProperty('animationFrame'),false);
	}
}
define([], function()
{
	return viewInterpolationNode;
})