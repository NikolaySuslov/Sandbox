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

// Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
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
"use strict";




define( [ "module", "vwf/model", "ohm/ohm.min"], function( module, model, ohm) {

     var self;
   
    // vwf/model/example/scene.js is a demonstration of a scene manager.

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- pipeline -----------------------------------------------------------------------------

        // pipeline: [ log ], // vwf <=> log <=> scene

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            
            self = this;

            this.objects = {}; // maps id => { property: value, ... }
            this.creatingNode( undefined, 0 ); 

            this.ohm = ohm;
            window._ohm = this.ohm;
            
        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */ ) {

           this.objects[childID] = {

                name: childName,

                id: childID,
                extends: childExtendsID,
                implements: childImplementsIDs,

                source: childSource,
                type: childType,

                uri: childURI

                

            };

                
            

        },

        // -- initializingNode ---------------------------------------------------------------------
         initializingNode: function(nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childIndex, childName) {
            
            var props = Engine.getProperties(childID);

            for (var propName in props) {
                if (propName.indexOf("ohm") > -1) {

                    var lngName = propName.slice(3,propName.length);
                    var gram = Engine.getProperty(childID, propName);

                    this.makeGrammar(childID, gram, lngName);
                    Engine.callMethod (childID, 'initGrammar'+lngName);
                   
                    
            }

        }

    

         },


        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {
             //delete this.objects[nodeID];
        },

        // -- addingChild --------------------------------------------------------------------------

        addingChild: function( nodeID, childID, childName ) {
        },

        // -- removingChild ------------------------------------------------------------------------

        removingChild: function( nodeID, childID ) {
        },

        // -- parenting ----------------------------------------------------------------------------

        parenting: function( nodeID ) {
        },

        // -- childrening --------------------------------------------------------------------------

        childrening: function( nodeID ) {
        },

        // -- naming -------------------------------------------------------------------------------

        naming: function( nodeID ) {
        },

         // -- settingProperties --------------------------------------------------------------------

       settingProperties: function( nodeID, properties ) {

        },

        gettingProperties: function( nodeID, properties ) {
           // return this.objects[nodeID].properties;
        },
        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.settingProperty( nodeID, propertyName, propertyValue );
        },

        // TODO: deletingProperty

         // -- settingProperties --------------------------------------------------------------------

        
        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
          
          if (propertyName.indexOf("ohm") > -1)
            {
           //debugger;

            var lngName = propertyName.slice(3,propertyName.length);
            this.makeGrammar(nodeID, propertyValue, lngName);
            Engine.setProperty(nodeID, propertyName, propertyValue);

            var methods = Engine.getMethods(nodeID);
            var methodN = 'initGrammar'+lngName;
            for (var methodName in methods) {

                 if (methodName == methodN) {
                    Engine.callMethod (nodeID, methodN);
                    return;
        } 
}
            var methodBody = '//console.log(\'Init grammar: '  + lngName + '\');';
            Engine.createMethod(nodeID, methodN, [], methodBody);

        }

        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
    
             var object = this.objects[nodeID];
             return object && object[propertyName];
        },

        // -- creatingMethod -----------------------------------------------------------------------

        creatingMethod: function( nodeID, methodName, methodParameters, methodBody ) {


        },

        // TODO: deletingMethod

        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters ) {
          

        },

        // -- creatingEvent ------------------------------------------------------------------------

        creatingEvent: function( nodeID, eventName, eventParameters ) {
        },

        // TODO: deletingEvent

        // -- firingEvent --------------------------------------------------------------------------

        firingEvent: function( nodeID, eventName, eventParameters ) {
        },

        // -- executing ----------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {
        },


        makeGrammar: function (nodeID, propertyValue, grammarName) {

             var semName = 'semantics'+grammarName;



         try  { 
                var gram = ohm.grammar(propertyValue);
                

                //console.log("Grammar OK!");
                Engine.setProperty(nodeID, grammarName, gram);

           
                //function semantics()  Engine.getProperty(nodeID, grammarName).semantics();


                Engine.setProperty(nodeID, semName, Engine.getProperty(nodeID, grammarName).semantics());

                } catch (e) {

                    console.log(e); 
                 Engine.setProperty(nodeID, grammarName, {});
                 Engine.setProperty(nodeID, semName, {});
            }

        }



    } );

} );
