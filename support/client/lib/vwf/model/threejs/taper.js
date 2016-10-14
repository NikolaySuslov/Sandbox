(function() {
    function taper(childID, childSource, childName) {
        this.amount = 0;
        this.active = true;
        this.outputType = "Primitive";
        this.inputType = "Primitive";
        this.updateSelf = function() {

         if(this.active == false) return;
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
         
         var amt = this.amount*2;
         for(var i=0;i<positions.length; i+=1)
         {
            var factor = positions[i][2]/height;
            positions[i][0] *= 1+(amt*factor) ;
            positions[i][1] *= 1+(amt*factor) ;
         }
         
         for(var i=0;i<positions.length; i+=1)
         {
            m.vertices[i].x = (positions[i][0]);
            m.vertices[i].y = (positions[i][1]);
            m.vertices[i].z = (positions[i][2]);
         }
         
         m.verticesNeedUpdate = true;
         m.dirtyMesh = true;
         mesh.sceneManagerUpdate();
       

        }
        this.deletingNode = function() {
           this.active = false;
            this.dirtyStack();
        }
        this.initializingNode = function() {
            try{
            this.updateSelf();
            this.dirtyStack();
            }catch(e)
            {
                console.error(e);
            }
        }
        this.deletingNode = function()
        {
            this.dirtyStack();
        }
        this.settingProperty = function(prop, val) {
            if (prop == 'amount') {
                this.amount = val;
                this.dirtyStack();
            }
        }
        this.gettingProperty = function(prop) {
            if (prop == 'amount') {
                return this.amount;
            }
        }
        this.inherits = ['vwf/model/threejs/modifier.js' ];
    }

    //default factory code
    return function(childID, childSource, childName) {
        //name of the node constructor
        return new taper(childID, childSource, childName);
    }
})();

//@ sourceURL=threejs.subdriver.taper