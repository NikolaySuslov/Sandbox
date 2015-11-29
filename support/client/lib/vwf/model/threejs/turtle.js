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
			this.axiomF = "F-F++F-F";
			this.axiomG = "";
			this.angle = 60;
			this.stepLength = 1;


			this.EditorData = {};
			this.EditorData.a_radius = {displayname:'Turtle radius',property:'radius',type:'slider',min:0,max:10,step:.01};
			//this.EditorData.rsegs = {displayname:'R Segments',property:'rsegs',type:'slider',min:3,max:16};
			//this.EditorData.ssegs = {displayname:'S Segments',property:'ssegs',type:'slider',min:3,max:16};

			this.EditorData.fa_iteration = {displayname:'Iterations',property:'iteration',type:'slider',min:1,max:6,step:1};
			this.EditorData.f_angle = {displayname:'Angle',property:'angle',type:'slider',min:1,max:360,step:1};
			this.EditorData.g_stepLength = {displayname:'Step length',property:'stepLength',type:'slider',min:.1,max:10,step:.01};
			
			this.EditorData.b_rule = {displayname:'Rule',property:'rule',type:'text'};
			this.EditorData.c_axiomF = {displayname:'Axiom F', property:'axiomF',type:'text'};
			this.EditorData.d_axiomG = {displayname:'Axiom G', property:'axiomG',type:'text'};

			this.EditorData.x_generate = {label:'Generate',method:'generateLSys',type:'button'};
			


			this.inherits = ['vwf/model/threejs/prim.js'];

			//vwf_view.kernel.createChild(parent, name, proto, uri, callback);

			//the node constructor
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'radius' || propertyName == 'rsegs' || propertyName == 'ssegs'
					|| propertyName == 'ohmLSys' || propertyName == 'ohmTurtle' )
				{
					this[propertyName] = propertyValue;
					this.dirtyStack(true);
				}

				if(propertyName == 'iteration' || propertyName == 'rule' ||propertyName == 'angle' || propertyName == 'stepLength' || propertyName == 'axiomF' || propertyName == 'axiomG'){

					this[propertyName] = propertyValue;
					Engine.callMethod(this.ID, 'generateLSys');
					this.dirtyStack(true);
				}	
				
				


			}
			
			this.gettingProperty = function(propertyName)
			{

				if(propertyName == 'radius' || propertyName == 'rsegs' || propertyName == 'ssegs'
					|| propertyName == 'ohmLSys' || propertyName == 'ohmTurtle' || propertyName == 'iteration' ||  propertyName == 'rule' || propertyName == 'axiomF' || propertyName == 'axiomG' || propertyName == 'angle' || propertyName == 'stepLength' 
					|| propertyName == 'EditorData' )
				{
					return this[propertyName];
				}
			
				

			}
			
			this.initializingNode = function()
			{

				// console.log(Engine.getMethods(Engine.prototype(this.id))['initGrammarLSys'].body);
				//Engine.createMethod(this.ID, 'initGrammarLSys', [], Engine.getMethods(Engine.prototype(this.ID))['initGrammarLSys'].body);

			var methods = Engine.getMethods(this.ID);
			var nodeMethods = ['initGrammarLSys', 'genLSys', 'initLSysSemantics', 'generateLSys', 'initGrammarTurtle', 'makeLSys', 'initTurtleSemantics'];

			for (var i in nodeMethods) {
				
				if (methods[nodeMethods[i]] == undefined) {
					var methodName = nodeMethods[i];
					var prot = Engine.getMethods(Engine.prototype(this.ID))[methodName];
					Engine.createMethod(this.ID, methodName, [], prot.body);

				}

			}

			var nodeMethodsWithParams = ['turn', 'goForward', 'makeTurtle'];

			for (var i in nodeMethodsWithParams) {
			
				if (methods[nodeMethodsWithParams[i]] == undefined) {
					var methodName = nodeMethodsWithParams[i];
					var prot = Engine.getMethods(Engine.prototype(this.ID))[methodName];
					Engine.createMethod(this.ID, methodName, prot.parameters, prot.body);

				}

			}

			this.ohmLSys = Engine.getProperties(Engine.prototype(this.ID))['ohmLSys'];
			this.ohmTurtle = Engine.getProperties(Engine.prototype(this.ID))['ohmTurtle'];

				Engine.setProperty(this.ID,'ohmLSys',this.ohmLSys);
				Engine.setProperty(this.ID,'ohmTurtle',this.ohmTurtle);
				
				Engine.callMethod(this.ID, 'generateLSys');

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