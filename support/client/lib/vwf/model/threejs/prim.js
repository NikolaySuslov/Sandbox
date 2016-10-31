var defaultPrimMaterial = new THREE.MeshPhongMaterial();
(function() {
    function prim(childID, childSource, childName) {
        this.___ready = false;
        this.callingMethod = function(methodName, args) {
            args = args || [];
            if (methodName == 'GetMesh') {
                return this.GetMesh();
            }
            if (methodName == 'ready') {
                this.___ready = true;
                this.dirtyStack(true,false);
            }
            if (methodName == 'dirtyStack') {
                return this.dirtyStack(args[0],args[1],args[2]);
            }
            if (methodName == 'updateStack') {
                return this.updateStack(args[0],args[1],args[2]);
            }
            if (methodName == 'updateSelf') {
                return this.updateSelf(args[0],args[1],args[2]);
            }
        }
        this.PrimGetAllLeafMeshes = function(threeObject, list) {
            if (!list) list = [];
            if (threeObject instanceof THREE.Mesh || threeObject instanceof THREE.Line) {
                list.push(threeObject);
            }
            if (threeObject.children) {
                for (var i = 0; i < threeObject.children.length; i++) {
                    this.PrimGetAllLeafMeshes(threeObject.children[i], list);
                }
            }
            return list;
        }
        this.initializingNode = function() {
            this.dirtyStack();
        }
        this.GetMesh = function() {
            return this.rootnode.children[0];
        }
        this.GetBounds = function() {
            return this.GetMesh().getBoundingBox(true);
        }
        this.updateSelf = function(rebuild, cache) {
      //      if (rebuild) {
                this.Build(cache);
          //      this.backupMesh();
          //  } else {
         //       this.restoreMesh();
        //    }
            if (this.GetMesh())
                this.GetMesh().geometry.dirtyMesh = true;

        }
        //note this is only possible since we no longer require determinism.
        this.dirtyStack = debounce(function(rebuild, cache) {
            
            if(!this.___ready) return;

            //the the parent knows how to update the stack, let the parent deal with is. otherwise, start the update cascade here
            var parentHandled = Engine.callMethod(Engine.parent(this.ID), 'dirtyStack',[rebuild, cache]);
            if(!parentHandled)
                this.updateStack(rebuild, cache);
            return true;
        },200)
        this.gettingProperty = function(propertyName) {
            if (propertyName == 'type') {
                return 'Primitive';
            }
        }
        this.hasModifiers = function() {
            var has = false;
            var children = Engine.children(this.ID);
            if (children)
                for (var i = 0; i < children.length; i++) {
                    if (Engine.getProperty(children[i], 'type') == 'modifier')
                        has = true;

                }
            return has;
        }
        this.updateStack = function(rebuild, cache) {

            

            this.updateSelf(rebuild, cache && !this.hasModifiers());

            var children = Engine.children(this.ID);


            for (var i in children) {
                Engine.callMethod(children[i], 'updateStack',[rebuild, cache]);
            }
            Engine.callMethod(this.ID, 'modifierStackUpdated');
        }
        this.backupMesh = function() {

            if (!this.GetMesh())
                return;
            var geometry = this.GetMesh().geometry;
            if (geometry.vertices)
                geometry.originalPositions = this.copyArray([], geometry.vertices);
            if (geometry.faces)
                geometry.originalFaces = this.copyArray([], geometry.faces);
            if (geometry.normals)
                geometry.originalNormals = this.copyArray([], geometry.normals);
            if (geometry.faceVertexUvs[0]) {

                geometry.originalfaceVertexUvs = [];
                for (var i = 0; i < geometry.faceVertexUvs[0].length; i++) {
                    var arr = [];
                    for (var j = 0; j < geometry.faceVertexUvs[0][i].length; j++)
                        arr.push(geometry.faceVertexUvs[0][i][j].clone());
                    geometry.originalfaceVertexUvs.push(arr);
                }
            }

        }
        this.copyArray = function(arrNew, arrOld) {
            if (!arrNew)
                arrNew = [];
            arrNew.length = 0;
            for (var i = 0; i < arrOld.length; i++)
                arrNew.push(arrOld[i].clone());
            return arrNew;
        }
        this.restoreMesh = function() {
           
            if (!this.GetMesh())
                return;
            var geometry = this.GetMesh().geometry;
            if (!geometry)
                return;
            if (geometry.originalPositions)
                this.copyArray(geometry.vertices, geometry.originalPositions);
            if (geometry.originalNormals)
                this.copyArray(geometry.normals, geometry.originalNormals);
            if (geometry.originalFaces)
                this.copyArray(geometry.faces, geometry.originalFaces);
            if (geometry.originalfaceVertexUvs) {

                geometry.faceVertexUvs[0] = [];
                for (var i = 0; i < geometry.originalfaceVertexUvs.length; i++) {
                    var arr = [];
                    for (var j = 0; j < geometry.originalfaceVertexUvs[i].length; j++)
                        arr.push(geometry.originalfaceVertexUvs[i][j].clone());
                    geometry.faceVertexUvs[0].push(arr);
                }
            }

            geometry.verticesNeedUpdate = true;
            geometry.normalsNeedUpdate = true;
            geometry.facesNeedUpdate = true;
            geometry.uvsNeedUpdate = true;
            this.GetMesh().position.x = 0;
            this.GetMesh().position.y = 0;
            this.GetMesh().position.z = 0;
            this.GetMesh().updateMatrixWorld(true);
        }
        this.childRemoved = function()
        {
            this.dirtyStack();
        }
        this.Build = function(cache) {
            var mat;
            if (this.rootnode.children[0])
                mat = this.rootnode.children[0].material;
            else{
                
                mat = _MaterialCache.getMaterialbyDef(null,Engine.getProperty(this.ID,"materialDef")) || defaultPrimMaterial;
            }

            if (this.mesh) {
                this.rootnode.remove(this.mesh);
                //here, we need to deallocate the geometry
               
                if(this.mesh && this.mesh.geometry)
                    this.mesh.geometry.dispose();
               
            }

            var mesh = this.BuildMesh(mat, cache);
            this.mesh = mesh;
          

            this.rootnode.add(mesh);

            this.mesh.updateMatrixWorld();
            if(mat instanceof THREE.MeshFaceMaterial)
                this.mesh.geometry.groupsNeedUpdate = true;
            var cast = this.gettingProperty('castShadows');
            var rec = this.gettingProperty('receiveShadows');

            var pass = this.gettingProperty('passable');
            var sel = this.gettingProperty('isSelectable');
            var sta = this.gettingProperty('isStatic');
            var dny = this.gettingProperty('isDynamic');
            var renderDepth = this.gettingProperty('renderDepth');
            // reset the shadows flags for the new mesh
            this.settingProperty('castShadows', cast);
            this.settingProperty('visible', this.gettingProperty('visible'));
            this.settingProperty('receiveShadows', rec);
            this.settingProperty('passable', pass);
            this.settingProperty('isSelectable', sel);
            this.settingProperty('isStatic', sta);
            this.settingProperty('renderDepth', renderDepth);
            //  this.settingProperty('isDynamic', dny);

        }
        this.inherits = ['vwf/model/threejs/renderDepth.js','vwf/model/threejs/materialDef.js', 'vwf/model/threejs/shadowcaster.js', 'vwf/model/threejs/transformable.js', 'vwf/model/threejs/passable.js', 'vwf/model/threejs/visible.js', 'vwf/model/threejs/static.js', 'vwf/model/threejs/selectable.js'];
    }
    //default factory code
    return function(childID, childSource, childName) {
        //name of the node constructor
        return new prim(childID, childSource, childName);
    }
})();

//@ sourceURL=threejs.subdriver.prim