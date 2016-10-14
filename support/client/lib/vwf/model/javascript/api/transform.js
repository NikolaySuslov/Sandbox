define([], function()
{
	return function(id)
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
})