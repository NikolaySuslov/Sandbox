"use strict";
(function()    // this is the factory function that will return our new object type
{	
	
    //constrcutor for our new object
    function customSphere(childID, childSource, childName, childType, assetSource, asyncCallback)
    {
    	this.root = new THREE.Object3D(); // the root of our custom graphics
    	this.phi = 1.6;
    	this.id = childID;
    	this.getRoot = function() //boilerplate for giving our node to the system
    	{
    		return this.root;
    	}
    	
    	//
    	this.inherits = ['vwf/model/threejs/visible.js', 'vwf/model/threejs/transformable.js'];
    	this.initialize = function()
    	{
			this.sphere = new THREE.SphereGeometry(1,10,10,3,1.6,0,3.1);
			this.material = new THREE.MeshPhongMaterial("#FFFFFF");
			this.material.side = 2;
			this.mesh = new THREE.Mesh(this.sphere,this.material);	
			this.getRoot().add(this.mesh);
    	}

    	//respond to the property change messages from the engine
    	//vwf.setProperty(_Editor.GetSelectedVWFID(),'phi',.6);
    	//we can force the engine to send us the command even though we have not defined this property in the API 
    	//with the above line.
    	this.settingProperty = function(name,val)
    	{
    		if(name == 'phi')
    		{
    			this.phi = val;
    			this.root.remove(this.mesh)
    			this.sphere = new THREE.SphereGeometry(1,10,10,3,val,0,3.1);
				this.mesh = new THREE.Mesh(this.sphere,this.material);
				this.getRoot().add(this.mesh);
    		}
    	}
    	this.gettingProperty = function(name,val)
    	{
    		if(name == 'phi')
    		{
    			return this.phi;
    		}	
    	}
    	//inform the engine that the value might be changing over time
    	this.ticking = function()
    	{
    		this.settingProperty("phi",this.phi + .01);
    	}
    }
    //default factory code
    return function(childID, childSource, childName, childType, assetSource, asyncCallback)
    {
        //name of the node constructor
        var s = new customSphere(childID, childSource, childName, childType, assetSource, asyncCallback);
        return s;
    }
})();