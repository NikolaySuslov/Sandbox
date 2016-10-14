"use strict";
(function() {
    //enum to keep track of assets that fail to load
    function avatar(childID, childSource, childName, childType, assetSource, asyncCallback) {
        //asyncCallback(false);
        this.childID = childID;
        this.childSource = childSource;
        this.childName = childName;
        this.childType = childType;
        this.assetSource = assetSource;
        this.inheritFullBase = true; //actually construct the base classes
        this.inherits = ['vwf/model/threejs/asset.js']

        this.initialize = function() {
            
        }
        this.settingProperty = function(propertyName,propertyValue)
        {
            
          
           // for example, we can maniuplate a bone like this without createing a VWF node for the bone
           // instead the driver  does all the work.
           // if(propertyName == 'armScale')
           // {
           //     this.getRoot().children[0].children[0].children[0].scale.x = 3;
           // }
        }
    }
    //default factory code
    return function(childID, childSource, childName, childType, assetSource, asyncCallback) {
        //name of the node constructor
        var my_avatar = new avatar(childID, childSource, childName, childType, assetSource, asyncCallback);
        
        return my_avatar;
    }
})();
//@ sourceURL=threejs.subdriver.avatar