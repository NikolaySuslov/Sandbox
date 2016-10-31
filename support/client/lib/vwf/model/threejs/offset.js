(function()
{
	function offset(childID, childSource, childName)
	{
		this.xamount = 0;
		this.yamount = 0;
		this.zamount = 0;
		this.active = true;
		this.outputType = "Primitive";
		this.inputType = "Primitive";
		this.updateSelf = function()
		{
			if (this.active)
			{
				this.offset();
			}
		}
		this.deletingNode = function()
		{
			this.active = false;
			this.dirtyStack();
		}
		this.settingProperty = function(prop, val)
		{
			if (prop == 'xamount')
			{
				this.xamount = val;
				this.dirtyStack();
			}
			if (prop == 'yamount')
			{
				this.yamount = val;
				this.dirtyStack();
			}
			if (prop == 'zamount')
			{
				this.zamount = val;
				this.dirtyStack();
			}
			if (prop == 'active')
			{
				this.active = val;
				this.dirtyStack();
			}
		}
		this.offset = function(majoraxis, minoraxis)
		{
			var mesh = this.GetMesh();
			var m = mesh.geometry;
			var positions = [];
			for (var i = 0; i < m.vertices.length; i++)
			{
				positions.push([m.vertices[i].x, m.vertices[i].y, m.vertices[i].z]);
			}
			for (var i = 0; i < positions.length; i += 1)
			{
				positions[i][0] += this.xamount;
				positions[i][1] += this.yamount;
				positions[i][2] += this.zamount;
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
		this.gettingProperty = function(prop)
		{
			if (prop == 'amount')
			{
				return this.amount;
			}
			if (prop == 'type')
			{
				return 'modifier';
			}
		}
		this.inherits = ['vwf/model/threejs/modifier.js'];
	}
	//default factory code
	return function(childID, childSource, childName)
	{
		//name of the node constructor
		return new offset(childID, childSource, childName);
	}
})();
//@ sourceURL=threejs.subdriver.bend