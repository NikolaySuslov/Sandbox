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



define( [ "module", "vwf/model", "ometa-js/ometa-script-tag"], function( module, model, ometa) {

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
            this.ometaLng = {};
            
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
            
            var node = this.objects[nodeID];

            if (propertyName.indexOf("ometaGrammar") > -1)
            {
                var lngName = propertyName.slice(12,propertyName.length);
                var methodName = 'ometaLng'+lngName;
                vwf.createMethod(nodeID, methodName, null, "");
                 
            }

            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.settingProperty( nodeID, propertyName, propertyValue );
        },

        // TODO: deletingProperty

         // -- settingProperties --------------------------------------------------------------------

        
        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
          
            

            if (propertyName.indexOf("ometaGrammar") > -1)
            {

                var node = this.objects[nodeID];

                 if (propertyValue == null) {

                 node[propertyName] = propertyValue;
                 return;
                }

                var lngName = propertyName.slice(12,propertyName.length);
                var methodName = 'ometaLng'+lngName;
                node[propertyName] = propertyValue;

                var code = translateCode(propertyValue);
               if (code ==  null) { code = lngName + "= 'error'";}

                var methodBody = ("'use strict'; var " + code + ";return " + lngName);

                vwf.deleteMethod(nodeID, methodName);
                vwf.createMethod(nodeID, methodName, [], methodBody);

                //vwf.setProperty(nodeID,'ometaLng'+lngName,null);
            }
/*
            if (propertyName.indexOf("ometaLng") > -1)
                {
                debugger;
                var lngName = propertyName.slice(8,propertyName.length);
                //var lngGrammar = vwf.getProperty(nodeID, 'ometaGrammar'+lngName).replace(/[\n\r\t]/g, "");
                var lngGrammar = node['ometaGrammar'+lngName];
                var lngEval = ("'use strict'; var " + translateCode(node['ometaGrammar'+lngName]) + ";return" + lngName);
                node[propertyName] = lngEval;
                //this.ometaLng[propertyName] = eval(lngEval);
                }
*/
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
           
            var object = this.objects[nodeID];
            return object && object[propertyName];
           
           /* if (propertyName.indexOf("ometaGrammar") > -1)
            {                 
                return object && object[propertyName];
            }

            if (propertyName.indexOf("ometaLng") > -1)
            {
               return this.ometaLng[propertyName];

            }
           */
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

    } );

} );
