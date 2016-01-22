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
	if((X[len] - X[len - 1]) == 0)
	{
		return Y[len];
	}
	var slope = (Y[len] - Y[len - 1]) / (X[len] - X[len - 1]);
	var dist = x - X[len];
	return Y[len] + dist * slope;
}

function exponentialInterpolation(x, X, Y, sm1)
{
	var len = Y.length -1;
	var a = .1;
	if(Math.abs(Y[len] - Y[len-1]) > DISCONTINUITY_THRESHOLD)
		return Y[len];
	return a * (Y[len]) + (1 - a) * sm1[sm1.length - 1];
}
var DISCONTINUITY_THRESHOLD = 2;

function exponentialInterpolationLinearExtrapolation(x, X, Y, sm1)
{
	var len = Y.length -1;
	if(Math.abs(Y[len] - Y[len-1]) > DISCONTINUITY_THRESHOLD)
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

function interpolate(time, xArr, yArr, sm1,id)
{
	if(Engine.isSimulating(id))
	 	return exponentialInterpolationLinearExtrapolation(time, xArr, yArr, sm1);
	else
	 	return exponentialInterpolation(time, xArr, yArr, sm1); 
}

function interpolationQueue(length, default_val,id)
{
	this.length = length
	this.values = [];
	this.times = [];
	this.interpolatedValues = [];
	this.setCount = 0;
	this.id = id;
	for (var i = 0; i < this.length; i++)
	{
		this.values.push(default_val);
		this.times.push(0);
		this.interpolatedValues.push(default_val);
	}
}
interpolationQueue.prototype.push = function(val)
{
	this.values.shift();
	this.times.shift();
	this.values.push(val);
	this.times.push(performance.now());
	this.setCount++;
}
interpolationQueue.prototype.interpolate = function(time)
{
	if (this.setCount < 3)
		return this.values[0];
	var newVal = this._interpolate(time);
	this.interpolatedValues.shift();
	this.interpolatedValues.push(newVal);
	return newVal;
}

function floatQueue(length,id)
{
	interpolationQueue.call(this, length, 0,id);
}
floatQueue.prototype = new interpolationQueue();
floatQueue.prototype._interpolate = function(time)
{
	return interpolate(time, this.times, this.values, this.interpolatedValues,this.id);
}

function VectorQueue(length,id)
{
	interpolationQueue.call(this, length, [0, 0, 0],id)
	this.xQueue = new floatQueue(length,id);
	this.yQueue = new floatQueue(length,id);
	this.zQueue = new floatQueue(length,id);
}
VectorQueue.prototype = new interpolationQueue();
VectorQueue.prototype._interpolate = function(time)
{
	var x = this.xQueue.interpolate(time)
	var y = this.yQueue.interpolate(time)
	var z = this.zQueue.interpolate(time)
	return [x, y, z];
}
VectorQueue.prototype.push = function(val)
{
	this.xQueue.push(val[0]);
	this.yQueue.push(val[1]);
	this.zQueue.push(val[2]);
	this.setCount++;
}

function QuaternionQueue(length,id)
{
	interpolationQueue.call(this, length, [0, 0, 1, 0],id);
}
QuaternionQueue.prototype = new interpolationQueue();
QuaternionQueue.prototype._interpolate = function(time)
{
	var Y = this.values;
	var X = this.times;
	var x = time;
	var len = Y.length - 1;
	var slope = Quaternion.scale(Quaternion.add(Y[len], Quaternion.negate(Y[len - 1], []), []), 1 / (X[len] - X[len - 1]), []); //(Y[len] - Y[len-1])/(X[len] - X[len-1]);
	var dist = x - X[len];
	var extrapolated = Quaternion.add(Y[len], Quaternion.scale(slope, dist, []), []);
	var ret = Quaternion.slerp(this.interpolatedValues[len] || [0, 0, 0, 1], extrapolated, .9, []);
	return Quaternion.normalize(ret, []);
}

function viewInterpolationNode(id, childExtendsID, threejsNode)
{
	this.id = id;
	this.threejsNode = threejsNode;
	this.childExtendsID = childExtendsID;
	this.properties = {};
	this.positionQueue = new VectorQueue(5,id);
	this.scaleQueue = new VectorQueue(5,id);
	this.quaternionQueue = new QuaternionQueue(5,id);
	this.animationFrameQueue = new floatQueue(5,id);
	this.enabled = true;
	this.totalTime = 0;
	this.lastTime = 0;
}
viewInterpolationNode.prototype.tick = function()
{
	if (Engine.getPropertyFast(Engine.application(),'playMode') == 'play' && Engine.isSimulating(this.id))
	{
	var viewnode = this.threejsNode;
		if (!viewnode) return;
		if (viewnode.setTransformInternal)
	this.pushTransform(matCpy(this.getProperty('transform')));
		if (viewnode.setAnimationFrameInternal)
	this.animationFrameQueue.push(this.getProperty('animationFrame'));
	}
}
viewInterpolationNode.prototype.pushTransform = function(newTransform)
{
	var mat = new THREE.Matrix4();
	mat.elements.set(newTransform);
	var position = new THREE.Vector3();
	var scale = new THREE.Vector3();
	var rotation = new THREE.Quaternion();
	mat.decompose(position, rotation, scale);
	this.positionQueue.push([position.x, position.y, position.z]);
	this.scaleQueue.push([scale.x, scale.y, scale.z]);
	this.quaternionQueue.push([rotation.x, rotation.y, rotation.z, rotation.w]);
	//get quat
	//push quat
}
viewInterpolationNode.prototype.setProperty = function(propertyName, propertyValue)
{
	if (propertyName == 'playMode')
	{
		this.properties[propertyName] = propertyValue;
	}
	if (propertyName == 'transform')
	{
		this.properties[propertyName] = matCpy(propertyValue);
		if(!Engine.isSimulating(this.id))
		{
			this.pushTransform( matCpy(propertyValue));
		}
	}
	if (propertyName == 'animationFrame')
	{
		this.properties[propertyName] = propertyValue;
		if(!Engine.isSimulating(this.id))
		{
			this.animationFrameQueue.push(propertyValue)
		}
	}
}
viewInterpolationNode.prototype.getProperty = function(propertyName)
{
	return this.properties[propertyName];
}
viewInterpolationNode.prototype.interpolate = function()
{


	  //framerate independant smoothing
         var now = performance.now();
         this.totalTime += now - (this.lastTime ? this.lastTime : now);
         this.lastTime = now;
         while(this.totalTime > 0)
         {
            this.totalTime -= 16;
			if(!this.enabled) return;
			var viewnode = this.threejsNode;
			if (!viewnode) return;
			//	if(_Editor.isSelected(this.id))
			//		return;
			if (viewnode.setTransformInternal)
			{
				if (Engine.isSimulating(this.id) && (Engine.getPropertyFast(Engine.application(),'playMode') != 'play' && performance.now() - this.positionQueue.xQueue.times[4] > .05))
				{
					this.pushTransform(matCpy(this.getProperty('transform')))
				}
				var position = this.positionQueue.interpolate(performance.now());
				var rotation = this.quaternionQueue.interpolate(performance.now());
				var scale = this.scaleQueue.interpolate(performance.now());
				var mat = new THREE.Matrix4();
				mat.compose(new THREE.Vector3(position[0], position[1], position[2]), new THREE.Quaternion(rotation[0], rotation[1], rotation[2], rotation[3]), new THREE.Vector3(scale[0], scale[1], scale[2]))
				viewnode.setTransformInternal(mat.elements, false);
			}
			if(viewnode.setAnimationFrameInternal)
			{
				//so, given that we don't have to have determinism, do we really need to backup and restore?
				//viewnode.backupTransforms(this.getProperty('animationFrame'));
				if (Engine.isSimulating(this.id) && (Engine.getPropertyFast(Engine.application(),'playMode') != 'play' && performance.now() - this.positionQueue.xQueue.times[4] > .05))
				{
					this.animationFrameQueue.push(this.getProperty('animationFrame'));
				}
				viewnode.setAnimationFrameInternal(this.animationFrameQueue.interpolate(performance.now()),false);
			}
		}
}
viewInterpolationNode.prototype.restore = function()
{
	if(!this.enabled) return;
	var viewnode = this.threejsNode;
	if (!viewnode) return;
	if (viewnode.setTransformInternal)
	{
		var oldTransform = matCpy(this.getProperty('transform'));
		viewnode.setTransformInternal(oldTransform, false);
	}
	if(viewnode.setAnimationFrameInternal)
	{
		//so, given that we don't have to have determinism, do we really need to backup and restore?
		//viewnode.setAnimationFrameInternal(this.getProperty('animationFrame'),false);
	}
}
define([], function()
{
	return viewInterpolationNode;
})