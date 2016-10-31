(function()
{
	function bend(childID, childSource, childName)
	{
		this.stretch = 0;
		this.effectaxis = 1;
		this.bulge = 0;
		this.active = true;
		this.outputType = "Primitive";
		this.inputType = "Primitive";
		this.updateSelf = function()
		{
			if (this.active)
			{
				this.dostretch(this.stretch, this.bulge,this.effectaxis);
			}
		}
		this.deletingNode = function()
		{
			this.active = false;
			this.dirtyStack();
		}
		this.settingProperty = function(prop, val)
		{
			if (prop == 'stretch')
			{
				this.stretch = val;
				this.dirtyStack();
			}
			if (prop == 'effectaxis')
			{
				this.effectaxis = val;
				this.dirtyStack();
			}
			if (prop == 'bulge')
			{
				this.bulge = val;
				this.dirtyStack();
			}
			if (prop == 'active')
			{
				this.active = val;
				this.dirtyStack();
			}
		}
		this.dostretch = function(stretch, bulge, axis)
		{
			var mesh = this.GetMesh();
			var m = mesh.geometry;
			var positions = [];
			for (var i = 0; i < m.vertices.length; i++)
			{
				positions.push([m.vertices[i].x, m.vertices[i].y, m.vertices[i].z]);
			}
			var bounds = m.boundingBox;
			if (!bounds)
				m.computeBoundingBox();
			bounds = m.boundingBox;
			var height = bounds.max.z - bounds.min.z;
			var length = bounds.max.x - bounds.min.x;
			var width = bounds.max.y - bounds.min.y;
			bounds = [length, width, height];
			for (var i = 0; i < positions.length; i += 1)
			{
				var factor = positions[i][axis] / bounds[axis];
				for (var j = 0; j < 3; j++)
				{
					if (j == axis)
						positions[i][j] += positions[i][j] * stretch;
					else
						positions[i][j] -= positions[i][j] * (.5 - Math.abs(factor * factor)) * stretch * bulge;
				}
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