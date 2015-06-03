(function(){
		function bend(childID, childSource, childName)
		{
			this.amount = 0;
			this.outputType = "Primitive";
        	this.inputType = "Primitive";
			this.updateSelf = function()
			{
				
				
				
			}
			this.settingProperty = function(prop,val)
			{
				if(prop == 'amount')
				{
					this.amount = val;
					this.dirtyStack();
				}
				
			}
			this.gettingProperty = function(prop)
			{
				if(prop == 'amount')
				{
					return this.amount;
				}
				if(prop == 'type')
				{
					return 'modifier';
				}
				if(prop == 'EditorData')
				{
					return {
						_active:{displayname : 'Active',property:'active',type:'check',min:-10,max:10,step:.01},
						amount:{
								displayname : 'Amount',
								property:'amount',
								type:'slider',
								min:-1,
								max:1,
								step:.01
						}
					}
				}
			}
			this.inherits = ['vwf/model/threejs/modifier.js'];
		}
		
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new bend(childID, childSource, childName);
        }
})();

//@ sourceURL=threejs.subdriver.push