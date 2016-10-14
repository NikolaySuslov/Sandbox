(function()
{
	var Matrix = function()
		{
			var mat = [];
			for (var i = 0; i < 16; i++)
			{
				mat.push(0);
			}
			return mat;
		}
		//quick function to initialize a blank vector array
	var Vec3 = function()
	{
		var vec = [];
		for (var i = 0; i < 3; i++)
		{
			vec.push(0);
		}
		return vec;
	}
	var Quat = function()
	{
		var quat = [];
		for (var i = 0; i < 4; i++)
		{
			quat.push(0);
		}
		return quat;
	};
	var RotateVecAroundAxis = function(Vector, Axis, Radians)
	{
		//Get a quaternion for the input matrix
		var RotationQuat = goog.vec.Quaternion.fromAngleAxis(Radians, Axis, Quat());
		var NewMatrix = goog.vec.Quaternion.toRotationMatrix4(RotationQuat, Matrix());
		return MATH.mulMat4Vec3(NewMatrix, Vector);
	};

		function bend(childID, childSource, childName)
		{
			this.amount = 0;
		this.majoraxis = 0
		this.minoraxis = 1;
		this.active = true;
			this.outputType = "Primitive";
        	this.inputType = "Primitive";
			this.updateSelf = function()
			{
			if (this.active)
			{
				
				this.bend(this.majoraxis, this.minoraxis);
			}
		}
		this.deletingNode = function()
		{
			this.active = false;
			this.dirtyStack();
			}
			this.settingProperty = function(prop,val)
			{
				if(prop == 'amount')
				{
					this.amount = val;
					this.dirtyStack();
				}
			if (prop == 'majoraxis')
			{
				this.majoraxis = val;
				this.dirtyStack();
			}
			if (prop == 'minoraxis')
			{
				this.minoraxis = val;
				this.dirtyStack();
			}
			if (prop == 'active')
			{
				this.active = val;
				this.dirtyStack();
			}
		}
		this.bend = function(majoraxis, minoraxis)
		{
			if (this.amount == undefined) return;
			var mesh = this.GetMesh();
			var m = mesh.geometry;
			var positions = [];
			for (var i = 0; i < m.vertices.length; i++)
			{
				positions.push([m.vertices[i].x, m.vertices[i].y, m.vertices[i].z]);
			}
			var normals = [];
			for (var i = 0; i < m.faces.length; i++)
			{
				normals.push([m.faces[i].normal.x, m.faces[i].normal.y, m.faces[i].normal.z]);
			}
			var bounds = m.boundingBox;
			if (!bounds)
				m.computeBoundingBox();
			bounds = m.boundingBox;
			var height = bounds.max.z - bounds.min.z;
			var length = bounds.max.x - bounds.min.x;
			var width = bounds.max.y - bounds.min.y;
			var amt = this.amount * 6.28318530718;
			var X = 0;
			var Y = 1;
			var Z = 2;
			var affectaxis = -1;
			for (var i = 0; i < positions.length; i += 1)
			{
				if (amt == 0) amt = .01;
				if ((minoraxis == Y || minoraxis == X) && (majoraxis == X || majoraxis == Y))
					affectaxis = Z;
				if ((minoraxis == Y || minoraxis == Z) && (majoraxis == Z || majoraxis == Y))
					affectaxis = X;
				if ((minoraxis == X || minoraxis == Z) && (majoraxis == Z || majoraxis == X))
					affectaxis = Y;
				var h;
				h = positions[i][affectaxis];
				var r = 1.0 / (Math.min(amt, 100));
				var offset = [positions[i][0], positions[i][1], positions[i][2]];
				offset[affectaxis] = 0;
				var radoffset = [0, 0, 0];
				radoffset[minoraxis] = -r;
				var axis = [0, 0, 0];
				axis[majoraxis] = 1;
				var theta = 3.14159 - (h / r);
				var newpos = RotateVecAroundAxis(MATH.subVec3(offset, radoffset), axis, -theta);
				newpos = MATH.addVec3(newpos, [-radoffset[X], -radoffset[Y], -radoffset[Z]]);
				if ((majoraxis == X && minoraxis == Y))
					newpos[Y] *= -1;
				if (majoraxis == Y && minoraxis == Z)
					newpos[X] *= -1;
				if (majoraxis == X && minoraxis == Z)
				{
					newpos[Z] *= -1;
					newpos[Y] *= -1;
				}
				if (majoraxis == Z && minoraxis == X)
					newpos[X] *= -1;
				if (majoraxis == Z && minoraxis == Y)
				{
					newpos[X] *= -1;
					newpos[Y] *= -1;
				}
				if (majoraxis == Y)
				{
					newpos[Z] *= -1;
					newpos[X] *= -1;
				}
				if (i < normals.length)
				{
					var newnorm = RotateVecAroundAxis(normals[i], axis, theta);
					newnorm[affectaxis] *= -1;
					newnorm[minoraxis] *= -1;
					normals[i][0] = newnorm[0];
					normals[i][1] = newnorm[1];
					normals[i][2] = newnorm[2];
				}
				positions[i][0] = newpos[0];
				positions[i][1] = newpos[1];
				positions[i][2] = newpos[2];
			}
			for (var i = 0; i < positions.length; i += 1)
			{
				m.vertices[i].x = (positions[i][0]);
				m.vertices[i].y = (positions[i][1]);
				m.vertices[i].z = (positions[i][2]);
			}
			m.verticesNeedUpdate = true;
			m.dirtyMesh = true;
			mesh.sceneManagerUpdate();
			for (var i = 0; i < normals.length; i += 1)
			{
				m.faces[i].normal.x = (normals[i][0]);
				m.faces[i].normal.y = (normals[i][1]);
				m.faces[i].normal.z = (normals[i][2]);
				for (var j = 0; j < m.faces[i].vertexNormals.length; j++)
				{
					m.faces[i].vertexNormals[j].x = (normals[i][0]);
					m.faces[i].vertexNormals[j].y = (normals[i][1]);
					m.faces[i].vertexNormals[j].z = (normals[i][2]);
				}
			}
			m.computeFaceNormals();
			m.computeVertexNormals();
			m.normalsNeedUpdate = true;
			}
			this.gettingProperty = function(prop)
			{
				if(prop == 'amount')
				{
					return this.amount;
				}
				if(prop == 'type')
				{
					return 'modifier';
				}
			
				}
		this.deletingNode = function()
		{
			this.active = false;
			this.dirtyStack();
			}
			this.inherits = ['vwf/model/threejs/modifier.js'];
		}
		//default factory code
	return function(childID, childSource, childName)
	{
			//name of the node constructor
            return new bend(childID, childSource, childName);
        }
})();
//@ sourceURL=threejs.subdriver.bend