(function(){
		function sphere(childID, childSource, childName)
		{
			this.radius = 1;
			this.rsegs = 10;
			this.ssegs = 10;
		
			this.outputType = "Primitive";
        	this.inputType = null;
			
			this.inherits = ['vwf/model/threejs/prim.js'];
			//the node constructor
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'radius')
				{
					this.radius = propertyValue;
					this.dirtyStack(true);
				}
				if(propertyName == 'rsegs')
				{
					this.rsegs = propertyValue;
					this.dirtyStack(true);
				}
				if(propertyName == 'ssegs')
				{
					this.ssegs = propertyValue;
					this.dirtyStack(true);
				}
				
			}
			this.initializingNode = function()
			{
				this.dirtyStack(true);
			}
			this.gettingProperty = function(propertyName)
			{
				if(propertyName == 'radius')
				{
					return this.radius;
				}
				if(propertyName == 'rsegs')
				{
					return this.rsegs;
				}
				if(propertyName == 'ssegs')
				{
					return this.ssegs;
				}
				if(propertyName == 'EditorData')
				{	
					return this.EditorData;
				}
				
			}
			this.BuildMesh = function(mat)
			{
				var mesh=  new THREE.Mesh(new THREE.SphereGeometry(this.radius, this.rsegs*2, this.ssegs), mat);
				mesh.rotation.x = Math.PI/2;
				return mesh;
			}
			
			//must be defined by the object
			this.getRoot = function()
			{
				return this.rootnode;
			}
			this.rootnode = new THREE.Object3D();
			//this.Build();
		}
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new sphere(childID, childSource, childName);
        }
})();

//@ sourceURL=threejs.subdriver.sphere