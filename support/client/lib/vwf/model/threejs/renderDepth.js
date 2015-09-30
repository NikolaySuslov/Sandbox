//this functionality exists to make it possible for the VWF level manage the 
//threejs render order for transparent objects
(function() {
    function renderDepth(childID, childSource, childName) {
        this.renderDepth = 0;
        this.renderDepth_GetAllLeafMeshes = function(threeObject, list) {
            if (threeObject instanceof THREE.Mesh || threeObject instanceof THREE.PointCloud) {
                list.push(threeObject);
            }
            if (threeObject.children) {
                for (var i = 0; i < threeObject.children.length; i++) {
                    if (!threeObject.children[i].vwfID)
                        this.renderDepth_GetAllLeafMeshes(threeObject.children[i], list);
                }
            }
        }
        this.settingProperty = function(propname, propval) {
            if (propname == 'renderDepth') {
                this.renderDepth = propval;
                var list = [];
                this.renderDepth_GetAllLeafMeshes(this.getRoot(), list);
                for (var i = 0; i < list.length; i++) {
                    list[i].renderDepth = propval;
                }
            }
        }
        this.gettingProperty = function(propname, propval) {
            if (propname == 'renderDepth') {
                return this.renderDepth;
            }
        }
    }
    //default factory code
    return function(childID, childSource, childName) {
        //name of the node constructor
        return new renderDepth(childID, childSource, childName);
    }
})();

//@ sourceURL=threejs.subdriver.renderDepth