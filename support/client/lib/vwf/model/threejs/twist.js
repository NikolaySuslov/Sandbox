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

	function twist(childID, childSource, childName)
	{
		this.amount = 0;
		this.active = true;
		this.outputType = "Primitive";
		this.inputType = "Primitive";
		this.updateSelf = function()
		{
			if (this.active)
			{
				this.twist();
			}
		}
		this.settingProperty = function(prop, val)
		{
			if (prop == 'amount')
			{
				this.amount = val;
				this.dirtyStack();
			}
			if (prop == 'active')
			{
				this.active = val;
				this.dirtyStack();
			}
		}
		this.twist = function(majoraxis, minoraxis)
		{
		
			  if(this.amount == undefined) return;

         var mesh = this.GetMesh();
         var m = mesh.geometry;
         var positions = [];
         
         for(var i=0;i<m.vertices.length; i++)
         {
            positions.push([m.vertices[i].x,m.vertices[i].y,m.vertices[i].z]);
         }
         
         var bounds = m.boundingBox;
         if(!bounds)
            m.computeBoundingBox();
         bounds = m.boundingBox;
         
         var height = bounds.max.z - bounds.min.z;
         var length = bounds.max.x - bounds.min.x;
         var width = bounds.max.y - bounds.min.y;
         var amt = this.amount*6.28318530718;
         for(var i=0;i<positions.length; i+=1)
         {
            var factor = positions[i][2]/height;
            var newpos = RotateVecAroundAxis(positions[i],[0,0,1],amt*factor);
            positions[i][0] = newpos[0];
            positions[i][1] = newpos[1];
            positions[i][2] = newpos[2];
         }
         
         for(var i=0;i<positions.length; i+=1)
         {
            m.vertices[i].x = (positions[i][0]);
            m.vertices[i].y = (positions[i][1]);
            m.vertices[i].z = (positions[i][2]);
         }
         
         m.verticesNeedUpdate = true;
         
         var normals = [];
         for(var i=0;i<m.faces.length; i++)
         {
            normals.push([m.faces[i].normal.x,m.faces[i].normal.y,m.faces[i].normal.z]);
         }
         
        
         for(var i=0;i<normals.length; i+=1)
         {
            var factor =  m.vertices[m.faces[i].c].z/height;
            var newpos = RotateVecAroundAxis(normals[i],[0,0,1],amt*factor);
            normals[i][0] = newpos[0];
            normals[i][1] = newpos[1];
            normals[i][2] = newpos[2];
         }
         for(var i=0;i<normals.length; i+=1)
         {
            m.faces[i].normal.x = (normals[i][0]);
            m.faces[i].normal.y = (normals[i][1]);
            m.faces[i].normal.z = (normals[i][2]);
            for(var j = 0; j < m.faces[i].vertexNormals.length; j++)
            {
                m.faces[i].vertexNormals[j].x = (normals[i][0]);
                m.faces[i].vertexNormals[j].y = (normals[i][1]);
                m.faces[i].vertexNormals[j].z = (normals[i][2]);
         }
         }
         m.computeFaceNormals();
         m.computeVertexNormals();
         m.normalsNeedUpdate = true;
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
		return new twist(childID, childSource, childName);
	}
})();
//@ sourceURL=threejs.subdriver.twist