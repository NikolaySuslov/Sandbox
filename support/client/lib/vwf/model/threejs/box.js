(function(){


		

		function box(childID, childSource, childName)
		{
			this._length = 1;
			this.width = 1;
			this.height = 1;
			this.outputType = "Primitive";
        	this.inputType = null;
			this.lsegs = 1;
			this.wsegs = 1;
			this.hsegs = 1;
			
			
			
			this.inherits = ['vwf/model/threejs/prim.js'];
			
			
			
			//the node constructor
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == '_length' || propertyName == 'width' || propertyName == 'height'||
				propertyName == 'lsegs'||propertyName == 'wsegs'||propertyName == 'hsegs')
				{
					this[propertyName] = propertyValue;
					this.dirtyStack(true,true);
				}
			}
			this.initializingNode = function()
			{
				this.dirtyStack(true,true);
			}
			this.gettingProperty = function(propertyName)
			{
				if(propertyName == '_length' || propertyName == 'width' || propertyName == 'height'||
				propertyName == 'lsegs'||propertyName == 'wsegs'||propertyName == 'hsegs' )
				return this[propertyName];
			}
			this.BuildMesh = function(mat,cache)
			{
	
				var mesh=  new THREE.Mesh(new THREE.BoxGeometry(this._length, this.width, this.height,this.lsegs,this.wsegs,this.hsegs), mat);
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
            return new box(childID, childSource, childName);
        }
})();

//@ sourceURL=threejs.subdriver.box