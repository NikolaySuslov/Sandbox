"use strict";
(function() {
    //enum to keep track of assets that fail to load
    function phantomAsset(childID, childSource, childName, childType, assetSource, asyncCallback) {
        //asyncCallback(false);
        this.childID = childID;
        this.childSource = childSource;
        this.childName = childName;
        this.childType = childType;
        this.assetSource = assetSource;


        this.getRoot = function() {
            return this.rootnode;
        }
        this.rootnode = new THREE.Object3D();

        this.loaded = function(asset, rawAnimationChannels) {

            if (!asset) {
                this.loadFailed();
                return;
            }
            $(document).trigger('EndParse', ['Loading...', assetSource]);
            //you may be wondering why we are cloning again - this is so that the object in the scene is 
            //never the same object as in the cache
            var self = this;
            if (childType !== 'subDriver/threejs/asset/vnd.gltf+json') {
                var clone = asset.clone();
                clone.morphTarget = asset.morphTarget; //sort of hacky way to keep a reference to morphtarget
                this.getRoot().add(clone);
            } else {
                glTFCloner.clone(asset, rawAnimationChannels, function(clone) {
                    self.getRoot().add(clone);
                    self.getRoot().GetBoundingBox();
                });
            }
            this.cleanTHREEJSnodes(this.getRoot());
            //set some defaults now that the mesh is loaded
            //the VWF should set some defaults as well

            //since the phantom does not pause the queue, this should reset the materialDef on the object
            var md = this.materialDef;
            this.materialDef = null
            vwf.setProperty(childID, 'materialDef', md);
            this.settingProperty('animationFrame', 0);
            //if any callbacks were waiting on the asset, call those callbacks
            this.getRoot().GetBoundingBox();
           
            this.setTransformInternal(vwf.getProperty(this.ID, 'transform'), true);
            this.getRoot().updateMatrixWorld(true);
            
            this.initializingNode();

            var list = [];
            this.selectable_GetAllLeafMeshes(this.getRoot(), list);
            for (var i = 0; i < list.length; i++) {
                    list[i].InvisibleToCPUPick = true;
            }

        }.bind(this);
        this.loadFailed = function(id) {

        }.bind(this);
        //if there is no asset source, perhaps because this linked to an existing node from a parent asset, just continue with loading
        if (!assetSource) {
            return;
        }
        this.inherits = ['vwf/model/threejs/asset.js']
        this.initialize = function() {
            var self = this;
            assetRegistry.get(childType, assetSource, self.loaded, this.loadFailed);
            asyncCallback(true);

            //here, we overwrite the gettingProperty function, so that this driver never reveals any information about itself
           // this.gettingProperty = function(prop) {
               // return undefined;
           // }
            this.settingProperty_originial = this.settingProperty;
            this.settingProperty = function(property, value) {
            //    if (property == 'isSelectable') return;
                this.settingProperty_originial(property, value);
            }
        }
    }
    //default factory code
    return function(childID, childSource, childName, childType, assetSource, asyncCallback) {
        //name of the node constructor
        return new phantomAsset(childID, childSource, childName, childType, assetSource, asyncCallback);
    }
})();
//@ sourceURL=threejs.subdriver.phantomAsset