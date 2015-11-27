// Copyright 2014 Nikolai Suslov, Krestianstvo.org project
// 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

(function(){
		function turtle(childID, childSource, childName)
		{


			this.radius = 1;
			this.rsegs = 10;
			this.ssegs = 10;
			this.iteration = 3;
			this.rule = 'F++F++F';
			this.axioms = {"F":"F-F++F-F", "G":""};
			this.angle = 60;
			this.stepLength = 1;
			this.lsys = this.rule;

			this.ohmLSys ='Fib { \n\
    Gen<x, y> \n\
        = ReadRule+ \n\
    ReadRule \n\
        = letters | symbols \n\
    letters \n\
        = \"F\" | \"G\" \n\
    symbols \n\
        = \"-\" | \"+\" \n\
   }';




			this.EditorData = {};
			this.EditorData.radius = {displayname:'Turtle radius',property:'radius',type:'slider',min:0,max:10,step:.01};
			//this.EditorData.rsegs = {displayname:'R Segments',property:'rsegs',type:'slider',min:3,max:16};
			//this.EditorData.ssegs = {displayname:'S Segments',property:'ssegs',type:'slider',min:3,max:16};

			this.EditorData.iteration = {displayname:'Iterations',property:'iteration',type:'slider',min:1,max:4,step:1};
			this.EditorData.angle = {displayname:'Angle',property:'angle',type:'slider',min:1,max:360,step:1};
			this.EditorData.stepLength = {displayname:'Step length',property:'stepLength',type:'slider',min:.1,max:10,step:.01};
			this.EditorData.rule = {displayname:'Rule',property:'rule',type:'text'};
			this.EditorData.axioms = {displayname:'Axioms', property:'axioms',type:'text'};

			this.EditorData.generate = {label:'Generate',method:'generateLSys',type:'button'};
			


			this.inherits = ['vwf/model/threejs/prim.js'];

			//vwf_view.kernel.createChild(parent, name, proto, uri, callback);

			//the node constructor
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'radius' || propertyName == 'rsegs' || propertyName == 'ssegs'
					|| propertyName == 'ohmLSys' || propertyName == 'angle' || propertyName == 'stepLength'
					)
				{
					this[propertyName] = propertyValue;
					this.dirtyStack(true);
				}

				if(propertyName == 'iteration' || propertyName == 'rule' || propertyName == 'axioms'){
					this[propertyName] = propertyValue;
					//this.lsys = this.iteration.toString() + ";" + this.axiomF + ";" + this.axiomG + ";" + this.rule;
					
					//vwf.setProperty(this.ID,'lsys',this.lsys);
					this.dirtyStack(true);

				}	

				if(propertyName == 'lsys') {
					this[propertyName] = propertyValue;
					this.dirtyStack(true);
				}

				

			}
			
			this.gettingProperty = function(propertyName)
			{

				if(propertyName == 'radius' || propertyName == 'rsegs' || propertyName == 'ssegs'
					|| propertyName == 'ohmLSys' || propertyName == 'iteration' ||  propertyName == 'rule' || propertyName == 'axioms' || propertyName == 'angle' || propertyName == 'stepLength' || propertyName == 'lsys' 
					 || propertyName == 'EditorData')
				{
					return this[propertyName];
				}
			
				
			}
			
			this.initializingNode = function()
			{
				
				vwf.setProperty(this.ID,'ohmLSys',this.ohmLSys);
				this.dirtyStack(true);
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
            return new turtle(childID, childSource, childName);
        }
})();