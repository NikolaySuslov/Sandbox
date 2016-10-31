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

    function OhmLang()
    {
        this.grammarSrc = null;
        this.grammar = null;
        this.semantics = null;
    }

    OhmLang.prototype.makeLng = function(src) {

        this.grammarSrc = src;

        try { 
            this.grammar = ohm.grammar(src);
            this.semantics = this.grammar.semantics()
        } 
            catch (e) {
                this.grammar = 'err';
                this.semantics = '';
                console.log(e); 
        }
        
    }
    // vwf/model/example/scene.js is a demonstration of a scene manager.

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- pipeline -----------------------------------------------------------------------------

        // pipeline: [ log ], // vwf <=> log <=> scene

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            
            self = this;
            this.ohmLangs = {};
            this.ohm = ohm;
            window._ohm = this.ohm;
            window._LangManager = this;
            
        },

        // == Model API ============================================================================

// -- creatingNode -------------------------------------------------------------------------

         creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */ ) {
        },

        // -- initializingNode ---------------------------------------------------------------------
         initializingNode: function(nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childIndex, childName) {

            var props = Engine.getProperties(childID);

            for (var propName in props) {

                if (propName.indexOf("ohm") > -1) {
                    var lngName = propName.slice(3,propName.length);
                    var gram = Engine.getProperty(childID, propName);
               
                    this.makeGrammar(childID, gram, lngName);
                    this.initGrammar(childID, lngName);
                 
            }
        }
    },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            delete this.ohmLangs[nodeID];
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
            //return this.settingProperty( nodeID, propertyName, propertyValue );
        },

        // TODO: deletingProperty

         // -- settingProperties --------------------------------------------------------------------

        
        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
        
          if (propertyName.indexOf("ohm") > -1)
            {

                var lngName = propertyName.slice(3,propertyName.length);
                this.makeGrammar(nodeID, propertyValue, lngName);
                this.initGrammar(nodeID, lngName);
            }

        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
            
            if (propertyName == 'mylangs'){
                var object = this.ohmLangs[nodeID];
                return object;
            }
             
        },

        // -- creatingMethod -----------------------------------------------------------------------

        creatingMethod: function( nodeID, methodName, methodParameters, methodBody ) {

            if (methodName.indexOf("initSemantics") > -1)
            {
                
                var lngName = methodName.slice(13,methodName.length);

                 if(this.ohmLangs.hasOwnProperty(nodeID)){
                    if(this.ohmLangs[nodeID].hasOwnProperty(lngName)){
                        this.ohmLangs[nodeID][lngName]["semantics"] = this.ohmLangs[nodeID][lngName]["grammar"].semantics();
                    }

                 } 
                
            }

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

        makeGrammar:function(nodeID, propertyValue, propertyName) {
            
            var lng = new OhmLang();
            lng.makeLng(propertyValue);

            if(this.ohmLangs.hasOwnProperty(nodeID)){
                this.ohmLangs[nodeID][propertyName] = lng;

             } else {
                this.ohmLangs[nodeID] = {};
                this.ohmLangs[nodeID][propertyName] = lng;
            }

        },

        initGrammar:function(nodeID, lngName) {

            var methodN = 'initGrammar'+lngName;
            var methods = Engine.getMethods(nodeID);

            if(methods.hasOwnProperty(methodN) !== true){ 
                var methodBody = '//console.log(\'Init grammar: '  + lngName + '\');';
                Engine.createMethod(nodeID, methodN, [], methodBody);
            }
        },

    } );

} );
