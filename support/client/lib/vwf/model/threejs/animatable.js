"use strict";
(function() {



    function getSkin(node, root, list  ) {

        //be sure not to recurse into VWF children
        if(node.vwfID && node != root)
            return;
        if (!list) list = [];
        if (node instanceof THREE.SkinnedMesh) {
            list.push(node);
        }
        for (var i = 0; i < node.children.length; i++)
            getSkin(node.children[i],root,list);
        return list;
    }

    function getAllDrawables(threeObject, list) {

        if (!threeObject) return;
        if (!list) list = [];
        if (threeObject instanceof THREE.Mesh || threeObject instanceof THREE.Line)
            list.push(threeObject);
        if (threeObject.children) {
            for (var i = 0; i < threeObject.children.length; i++) {
                findAllMeshes(threeObject.children[i], list);
            }
        }
        return list;


    }

    function animatable(childID, childSource, childName) {
        this.animationFrame = 0;
        this.animationSpeed = 1;
        this.animationFPS = 30;
        //this my be called by the view driver during interpolation
        //in which case, there is no point in dirtying the scenemanager, as you may not 
        //reason over the interpolated values anyway
        
        this.backupTransforms =function(time)
        {
            this.backupTime = time;
            var skins = this.getSkin(this.getRoot(),this.getRoot());
            for (var i = 0; i < skins.length; i++) {
                if(skins[i].animationHandle)
                {
                    if(!skins[i].animationHandle.cache)
                        skins[i].animationHandle.cache = [];
                    for(var j in skins[i].animationHandle.hierarchy)
                    {
                        var o  = skins[i].animationHandle.hierarchy[j];
                       
                        if(!skins[i].animationHandle.cache[j])
                        {
                            skins[i].animationHandle.cache[j] = {};
                            skins[i].animationHandle.cache[j].matrixWorld = new THREE.Matrix4();
                            skins[i].animationHandle.cache[j].pos = new THREE.Vector3();
                            skins[i].animationHandle.cache[j].rot = new THREE.Quaternion();
                            skins[i].animationHandle.cache[j].scl = new THREE.Vector3();
                        }
                        var record = skins[i].animationHandle.cache[j];
                        record.object = o;
                        record.matrixWorld.copy(o.matrixWorld);
                        record.pos.copy(o.position)
                        record.rot.copy(o.quaternion);
                        record.scl.copy(o.scale);
                        
                    }

                }
            }
        }
       
        this.getSkin = function (node, root, list  )
        {
            if(this.skinCache)
                return this.skinCache;
            else
                this.skinCache= getSkin(node, root, list  );
            return this.skinCache;
        }
        this.restoreTransforms = function()
        {
            var skins = this.getSkin(this.getRoot(),this.getRoot());
            for (var i = 0; i < skins.length; i++) {
                if(skins[i].animationHandle)
                {
                    for(var j in skins[i].animationHandle.cache)
                    {
                        var record  = skins[i].animationHandle.cache[j];
                       
                        //record.object.position.copy(record.pos);
                        //record.object.quaternion.copy(record.rot);
                        //record.object.scale.copy(record.scl);
                        record.object.matrixWorld.copy(record.matrixWorld);
                      
                    }
                    //skins[i].updateMatrixWorld(true);
                }
            }
        }
        this.childAdded = function()
        {
            this.skinCache = null;
            if(this.parent && this.parent.skinCache)
                this.parent.skinCache = null;
        }   
        this.childRemoved = function()
        {
            this.skinCache = null;
            if(this.parent && this.parent.skinCache)
                this.parent.skinCache = null;
        }
        this.setAnimationFrameInternal = function(propertyValue, updateSceneManager) {

            if (this.animationFrame === propertyValue) return;
            this.animationFrame = propertyValue;

            if(this.backupTime == propertyValue)
            {
                this.restoreTransforms();
                return;
            }
            
            var skins = this.getSkin(this.getRoot(),this.getRoot());
            for (var i = 0; i < skins.length; i++) {

                var frame = parseInt(propertyValue);
                var mod = propertyValue - frame;
                if (frame < 0) return;

                if (frame === null) return;

                /* let's stop treating morphs as animation. That is an artifact of three.js limitations from 2 years ago
                if (skins[i].morphTargetInfluences) {
                    for (var j = 0; j < skins[i].morphTargetInfluences.length; j++) {

                        skins[i].morphTargetInfluences[j] = 0;


                    }

                    if (frame == this.animationEnd)
                        mod = 0;

                    skins[i].morphTargetInfluences[frame] = 1.0 - mod;
                    if (frame < (this.animationEnd || this.gettingProperty('animationLength')) - 1)
                        skins[i].morphTargetInfluences[frame + 1] = mod;

                }*/
                if (skins[i].animationHandle) {
                   
                  //  skins[i].matrixWorld.multiplyMatrices(skins[i].parent.matrixWorld,skins[i].matrix);
                  //  var boneroot = skins[i].animationHandle.root;
                  //  boneroot.matrixWorld.multiplyMatrices(boneroot.parent.matrixWorld,boneroot.matrix);
                    skins[i].animationHandle.setKey(this.animationFrame,this.animationFPS);
                 /*   for(var j =0; j < skins[i].animationHandle.hierarchy.length; j++ )
                    {
                        var bone = skins[i].animationHandle.hierarchy[j];
                        bone.matrixWorld.multiplyMatrices(bone.parent.matrixWorld,bone.matrix);
                        for(var k = 0; k < bone.children.length; k++)
                        {
                            if(!(bone.children[k] instanceof THREE.Bone))
                            bone.children[k].updateMatrixWorld();
                        }
                    }*/
                    skins[i].updateMatrixWorld();
                  
                    
                    
                    //odd, does not seem to update matrix on first child bone. 
                    //how does the bone relate to the skeleton?

                    //this is no longer necessary in threejs r68
                    for (var j = 0; j < skins[i].children.length; j++) {
                      skins[i].children[j].updateMatrixWorld(true);
                    }
                   
                    if (updateSceneManager) {
                        var allMeshes = getAllDrawables(skins[i]);
                        for (var k = 0; k < allMeshes.length; k++)
                            _SceneManager.setDirty(allMeshes[k]);
                    }
                }
            }
        }
        this.settingProperty = function(propertyName, propertyValue) {
            if (propertyName == 'animationFrame') {
                return this.setAnimationFrameInternal(propertyValue, true);
            }
            if (propertyName == 'animationState') {
                this.animationState = parseInt(propertyValue);
            }
            if (propertyName == 'animationStart') {
                this.animationStart = parseInt(propertyValue);
            }
            if (propertyName == 'animationEnd') {
                this.animationEnd = parseInt(propertyValue);
            }
            if (propertyName == 'animationSpeed') {
                this.animationSpeed = propertyValue;
            }
            if (propertyName == 'animationFPS') {
                this.animationFPS = propertyValue;
            }
            if (propertyName == 'morphTargetInfluences') {
               
                var skins = this.getSkin(this.getRoot(),this.getRoot());
                for (var i = 0; i < skins.length; i++) {
                    if (skins[i].geometry.morphTargets && skins[i].geometry.morphTargets.length > 0) {
                        //reset to target 0
                        for (var j = 0; j < skins[i].geometry.vertices.length; j++) {
                            skins[i].geometry.vertices[j].copy(skins[i].geometry.morphTargets[0].vertices[j]);
                        }
                        for (var j = 1; j < skins[i].geometry.morphTargets.length; j++) {
                            if (propertyValue[j - 1]) {
                                for (var k = 0; k < skins[i].geometry.vertices.length; k++) {
                                    skins[i].geometry.vertices[k].add(skins[i].geometry.morphTargets[0].vertices[k].clone().sub(skins[i].geometry.morphTargets[j].vertices[k].clone()).multiplyScalar(propertyValue[j - 1] || 0));
                                }
                            }
                        }
                        skins[i].geometry.verticesNeedUpdate = true;
                    }
                }
            }
        }
        this.gettingProperty = function(propertyName) {
            if (propertyName == 'animationFrame') {
                return this.animationFrame;
            }
            if (propertyName == 'animationStart') {
                return this.animationStart || 0;
            }
            if (propertyName == 'animationEnd') {
                
                return this.animationEnd || this.gettingProperty('animationLength');
            }
            if (propertyName == 'animationLength') {

                var skins = this.getSkin(this.getRoot(),this.getRoot());
                //if (skins[0] && skins[0].morphTargetInfluences) return skins[0].morphTargetInfluences.length;
                if (skins[0] && skins[0].animationHandle)
                    return skins[0].animationHandle.data.length * skins[0].animationHandle.data.fps;
                return 0;
            }
            if (propertyName == 'animationState') {
                return this.animationState;
            }
            if (propertyName == 'animationSpeed') {
                return this.animationSpeed;
            }
            if (propertyName == 'animationFPS') {
                return this.animationFPS;
            }
        }
        this.ticking = function() {

            if (this.animationState == 1) {

                //use 1.5 to map the 20fps tick to a default 30fps animation
                var speedAdjust = this.animationFPS / 20;
                var nextframe = this.animationFrame + (this.animationSpeed*speedAdjust);
                if (nextframe > this.gettingProperty('animationEnd') - 1) {
                    nextframe = this.animationStart || 0;

                }

                vwf.setProperty(this.ID, 'animationFrame', nextframe);
            }

        }
        
    }
    //default factory code
    return function(childID, childSource, childName) {
        //name of the node constructor
        return new animatable(childID, childSource, childName);
    }

})();

//@ sourceURL=threejs.subdriver.animatable