"use strict";

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
var jsDriverSelf = this;



function defaultContext()
{
    this.setProperty = function(id,name,val)
    {

        
       
        
        
        
            vwf.setProperty(id,name,val);
       

     
    }
    this.getProperty = function(id, name)
    {
        var val = vwf.getProperty(id, name);
       
        
        return val;
    }
    this.postUpdates = function()
    {
        throw new Error('Should never get here!')
    }
    this.callMethod = function(id,methodname,params)
    {
        //node that this forces sync!
        
            return vwf.callMethod(id,methodname,params);
       
    }
    this.fireEvent = function(id,eventName,params)
    {
       
            vwf_view.kernel.fireEvent(id,eventName,params);
       
    }
    //this is also where we should be notifiying the refelector of new methods, events, properties and nodes
}
//when a function is called, a context is created to observe changes. When the funtion return, we post changes to VWF.
function executionContext(parentContext)
{
    this.touchedProperties = {};
    this.parent = parentContext;
    this.setProperty = function(id,name,val)
    {
        if(!this.touchedProperties[id+name])
            this.touchedProperties[id+name] = {id:id,name:name,val:null,originalVal:null}
        this.touchedProperties[id+name].val = val;
    }
    this.getProperty = function(id,name)
    {
        if(this.touchedProperties[id+name])
            return this.touchedProperties[id+name].val;
        else
        {
            if(this.parent && this.parent instanceof executionContext &&  this.parent.getProperty(id,name))
            {
                return this.parent.getProperty(id,name);
            }

            var val = vwf.getProperty(id,name);
            if(!(typeof(val) == "number" || typeof(val) == "boolean" || val == null || val == undefined))
            {
            this.touchedProperties[id+name] = {id:id,name:name,val:null,originalVal:null}
            this.touchedProperties[id+name].originalVal = $.extend(true,{},this.touchedProperties[id+name].val);
            this.touchedProperties[id+name].val = val;
            }

            
            return val;
        }

    }
    this.postUpdates = function()
    {
        //debugger;
        for(var i in this.touchedProperties)
        {
            if(!(Object.deepEquals(this.touchedProperties[i].val,this.touchedProperties[i].originalVal)))
                this.parent.setProperty(this.touchedProperties[i].id,this.touchedProperties[i].name,this.touchedProperties[i].val);
        }
    }
    this.callMethod = function(id,methodname,params)
    {
        return this.parent.callMethod(id,methodname,params);
    }
    this.fireEvent = function(id,eventName,params)
    {
        this.parent.fireEvent(id,eventName,params);
    }
}


define(["module", "vwf/model", "vwf/utility"], function(module, model, utility) {

    // vwf/model/javascript.js is a placeholder for the JavaScript object interface to the
    // simulation.

    return model.load(module, {

        // This is a placeholder for providing a natural integration between simulation and the
        // browser's JavaScript environment.
        // 
        // Within the JavaScript environment, component instances appear as JavaScript objects.
        // 
        //   - Properties appear in the "properties" field. Each property contains a getter and
        //     setter callback to notify the object of property manipulation.
        //   - Methods appear in "methods".
        //   - Events appear in "events".
        //   - "parent" refers to the parent node and "children" is an array of the child nodes.
        // 
        //   - Node prototypes use the JavaScript prototype chain.
        //   - Properties, methods, events, and children may be referenced directly on the node or
        //     within their respective collections by name when there is no conflict with another
        //     attribute.
        //   - Properties support getters and setters that invoke a handler that may influence the
        //     property access.

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            jsDriverSelf = this;
            this.nodes = {}; // maps id => new type()
            this.creatingNode(undefined, 0); // global root  // TODO: to allow vwf.children( 0 ), vwf.getNode( 0 ); is this the best way, or should the kernel createNode( global-root-id /* 0 */ )?
        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------
        getTopContext : function()
        {
            return this.contextStack[0];
        },
        enterNewContext: function(log)
        {
            
            this.contextStack.unshift(new executionContext(this.contextStack[0]))
        },
        exitContext:function(log)
        {
            
            var topContext = this.contextStack.shift();
            topContext.postUpdates();
        },
        contextStack :[new defaultContext()],
        creatingNode: function(nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */ ) {



            // Get the prototype node.

            var prototype = this.nodes[childExtendsID] || Object.prototype;

            // Get the behavior nodes.

            var behaviors = (childImplementsIDs || []).map(function(childImplementsID) {
                return jsDriverSelf.nodes[childImplementsID];
            });

            // For each behavior, create a proxy for this node to the behavior and attach it above
            // the prototype, or above the most recently-attached behavior.

            behaviors.forEach(function(behavior) {
                prototype = proxiedBehavior.call(jsDriverSelf, prototype, behavior);
            });

            // Create the node. It's prototype is the most recently-attached behavior, or the
            // specific prototype if no behaviors are attached.

            var node = this.nodes[childID] = Object.create(prototype);
            node.__children_by_name = {};
            node.childExtendsID = childExtendsID;
            node.parentId = nodeID;
            Object.defineProperty(node, "private", {
                value: {} // for bookkeeping, not visible to scripts on the node  // TODO: well, ideally not visible; hide this better ("_private", "vwf_private", ?)
            });

            node.id = childID; // TODO: move to vwf/model/object

            node.name = childName;

            node.parent = undefined;

            node.source = childSource;
            node.type = childType;

            Object.defineProperty(node, "logger", {
                value: this.logger.for(childName),
                enumerable: true,
            });

            node.properties = Object.create(prototype.properties || Object.prototype, {
                node: {
                    value: node
                } // for node.properties accessors (non-enumerable)  // TODO: hide this better
            });

            Object.defineProperty(node.properties, "create", {
                value: function(name, value, get, set) { // "this" is node.properties
                    return jsDriverSelf.kernel.createProperty(this.node.id, name, value, get, set);
                }
            });

            node.private.getters = Object.create(prototype.private ?
                prototype.private.getters : Object.prototype
            );

            node.private.setters = Object.create(prototype.private ?
                prototype.private.setters : Object.prototype
            );

            node.methods = Object.create(prototype.methods || Object.prototype, {
                node: {
                    value: node
                } // for node.methods accessors (non-enumerable)  // TODO: hide this better
            });

            Object.defineProperty(node.methods, "create", {
                value: function(name, parameters, body) { // "this" is node.methods  // TODO: also accept create( name, body )
                    return jsDriverSelf.kernel.createMethod(this.node.id, name, parameters, body);
                }
            });

            node.private.bodies = Object.create(prototype.private ?
                prototype.private.bodies : Object.prototype
            );

            node.private.methods = Object.create(prototype.private ?
                prototype.private.methods : Object.prototype
            );

            node.private.events = Object.create(prototype.private ?
                prototype.private.events : Object.prototype
            );

            node.events = Object.create(prototype.events || Object.prototype, {
                node: {
                    value: node
                }, // for node.events accessors (non-enumerable)  // TODO: hide this better
            });

            // TODO: these only need to be on the base node's events object

            Object.defineProperty(node.events, "create", {
                value: function(name, parameters) { // "this" is node.events
                    return jsDriverSelf.kernel.createEvent(this.node.id, name, parameters);
                }
            });

            // Provide helper functions to create the directives for adding, removing and flushing
            // event handlers.

            // Add: node.events.*eventName* = node.events.add( *handler* [, *phases* ] [, *context* ] )

            Object.defineProperty(node.events, "add", {
                value: function(handler, phases, context) {
                    if (arguments.length != 2 || typeof phases == "string" || phases instanceof String || phases instanceof Array) {
                        return {
                            add: true,
                            handler: handler,
                            phases: phases,
                            context: context
                        };
                    } else { // interpret add( handler, context ) as add( handler, undefined, context )
                        return {
                            add: true,
                            handler: handler,
                            context: phases
                        };
                    }
                }
            });

            // Remove: node.events.*eventName* = node.events.remove( *handler* )

            Object.defineProperty(node.events, "remove", {
                value: function(handler) {
                    return {
                        remove: true,
                        handler: handler
                    };
                }
            });

            // Flush: node.events.*eventName* = node.events.flush( *context* )

            Object.defineProperty(node.events, "flush", {
                value: function(context) {
                    return {
                        flush: true,
                        context: context
                    };
                }
            });

            node.private.listeners = {}; // not delegated to the prototype as with getters, setters, and bodies; findListeners() filters recursion

            node.children = []; // TODO: connect children's prototype like properties, methods and events do? how, since it's an array? drop the ordered list support and just use an object?

            Object.defineProperty(node.children, "node", {
                value: node // for node.children accessors (non-enumerable)  // TODO: hide this better
            });

            Object.defineProperty(node.children, "create", {
                value: function(name, component, callback /* ( child ) */ ) { // "this" is node.children
                    return jsDriverSelf.kernel.createChild(this.node.id, name, component /* , callback */ ); // TODO: support callback and map callback's childID parameter to the child node
                }
            });

            Object.defineProperty(node.children, "delete", {
                value: function(child) {
                    return jsDriverSelf.kernel.deleteNode(child.id);
                }
            });

            Object.defineProperty(node, "children_by_name", { // same as "in"  // TODO: only define on shared "node" prototype?
                get: function() {
                    return this.__children_by_name;
                },
                enumerable: true,

            });

            Object.defineProperty(node, "broadcast", { // same as "in"  // TODO: only define on shared "node" prototype?
                value: function(signal,data,range)
                    {
                        var self = this;
                        var thisid = self.id;
                        var fromPos = vwf.getProperty(thisid,'worldPosition');
                        for(var i in jsDriverSelf.nodes)
                        {
                            var targetNode = jsDriverSelf.nodes[i];
                            var targetPos = vwf.getProperty(targetNode.id,'worldPosition');
                            if(range  )
                            {
                                if(targetPos && fromPos && MATH.distanceVec3(fromPos,targetPos) < range)
                                {
                                    jsDriverSelf.callingMethod(targetNode.id,signal,[data],thisid);
                                }
                            }else
                            {
                                    jsDriverSelf.callingMethod(targetNode.id,signal,[data],thisid);
                            }
                        }
                    
                },
               enumerable: false,
               configurable: false
            });
            Object.defineProperty(node.children, "broadcast", { // same as "in"  // TODO: only define on shared "node" prototype?
                value: function(signal,data,range)
                    {
                        var self = this.node;
                        var thisid = self.id;
                        var fromPos = vwf.getProperty(thisid,'worldPosition');
                        var decendents = vwf.decendants(thisid);
                        for(var i in decendents)
                        {
                            var targetNode = jsDriverSelf.nodes[decendents[i]];
                            var targetPos = vwf.getProperty(targetNode.id,'worldPosition');
                            if(range  )
                            {
                                if(targetPos && fromPos && MATH.distanceVec3(fromPos,targetPos) < range)
                                {
                                    jsDriverSelf.callingMethod(targetNode.id,signal,[data],thisid);
                                }
                            }else
                            {
                                    jsDriverSelf.callingMethod(targetNode.id,signal,[data],thisid);
                            }
                        }
                },
               enumerable: false,
               configurable: false
            });

            Object.defineProperty(node, "signal", { // same as "in"  // TODO: only define on shared "node" prototype?
                value:function(id,signal,data)
                {
                    var self = this;
                    var thisid = self.id;
                    var targetNode = jsDriverSelf.nodes[id];
                    
                    if(targetNode)
                    {
                        jsDriverSelf.callingMethod(targetNode.id,signal,[data],thisid);  
                    }
                },
                enumerable: false,
                configurable: false
            });
           
            // Define the "time", "client", and "moniker" properties.

            Object.defineProperty(node, "time", { // TODO: only define on shared "node" prototype?
                get: function() {
                    return jsDriverSelf.kernel.time();
                },
                enumerable: true,
            });

            Object.defineProperty(node, "client", { // TODO: only define on shared "node" prototype?
                get: function() {
                    return jsDriverSelf.kernel.client();
                },
                enumerable: true,
            });

            Object.defineProperty(node, "moniker", { // TODO: only define on shared "node" prototype?
                get: function() {
                    return jsDriverSelf.kernel.moniker();
                },
                enumerable: true,
            });

            Object.defineProperty(node, "Scene", { // TODO: only define on shared "node" prototype?
                get: function() {
                    return jsDriverSelf.nodes['index-vwf'];
                },
                enumerable: true,
            });
            Object.defineProperty(node, "random", { // TODO: only define on shared "node" prototype?
                value: function() {
                    return vwf.random(this.id);
                },
                enumerable: true,
            });

            Object.defineProperty(node, 'bind', {

                value: function(eventName, value) {
                    var listeners = this.private.listeners[eventName] ||
                        (this.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if (typeof value == "function" || value instanceof Function) {
                        listeners.push({
                            handler: value,
                            context: this
                        }); // for n
                    } else {
                        console.error('bound value must be a function');
                    }

                },
                enumerable: true,
                configurable: false
            });
            Object.defineProperty(node, 'unbind', {

                value: function(eventName, value) {
                    var listeners = this.private.listeners[eventName] ||
                        (this.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if (typeof value == "function" || value instanceof Function) {

                        var found = -1;
                        for (var i = 0; i < listeners.length; i++) {
                            if (listeners[i].handler == value)
                                found = i;
                        }
                        if (found != -1) {
                            listeners.splice(found, 1);
                        }
                    } else {
                        //no need to report this, is commonly expected
                        //console.error('bound value must be a function');
                    }

                },
                enumerable: true,
                configurable: false
            });

            // Define a "future" proxy so that for any this.property, this.method, or this.event, we
            // can reference this.future( when, callback ).property/method/event and have the
            // expression evaluated at the future time.

            Object.defineProperty(node, "in", { // TODO: only define on shared "node" prototype?
                value: function(when, callback) { // "this" is node
                    return refreshedFuture.call(jsDriverSelf, this, -when, callback); // relative time
                },
                enumerable: true,
            });

            Object.defineProperty(node, "at", { // TODO: only define on shared "node" prototype?
                value: function(when, callback) { // "this" is node
                    return refreshedFuture.call(jsDriverSelf, this, when, callback); // absolute time
                },
                enumerable: true,
            });

            Object.defineProperty(node, "future", { // same as "in"  // TODO: only define on shared "node" prototype?
                get: function() {
                    return this.in;
                },
                enumerable: true,
            });



            node.private.future = Object.create(prototype.private ?
                prototype.private.future : Object.prototype
            );

            Object.defineProperty(node.private.future, "private", {
                value: {
                    when: 0,
                    callback: undefined,
                    change: 0,
                }
            });

            node.private.change = 1; // incremented whenever "future"-related changes occur

            if (nodeID)
                this.addingChild(nodeID, childID, childName);


        },
        //allow a behavior node to directly acess the properties of it's parent
        hookupBehaviorProperty: function(behaviorNode, parentid, propname) {
            if (behaviorNode[propname] !== undefined) return;
            if (Object.keys(behaviorNode).indexOf(propname) != -1)
                return;

            //jsDriverSelf = this;
            var node = this.nodes[parentid];
            Object.defineProperty(behaviorNode, propname, { // "this" is node in get/set
                get: function() {
                    return node[propname];
                },
                set: function(value) {
                    node[propname] = value
                },
                enumerable: true
            });
        },
        //Allow the behavior to call the parent's methods
        hookupBehaviorMethod: function(behaviorNode, parentid, propname) {
            if (propname == "initialize") return;
            if (behaviorNode[propname] !== undefined) return;
            if (Object.keys(behaviorNode).indexOf(propname) != -1)
                return;

            var node = this.nodes[parentid];

            Object.defineProperty(behaviorNode, propname, {
                value: node.methods[propname].bind(node),
                enumerable: true,
                configurable: true
            });
        },
        //hook the behavior as a sort of proxy to the parent property and methods
        hookupBehavior: function(behaviorNode, parentid) {


            var node = this.nodes[parentid];
            for (var i in node.properties) {
                this.hookupBehaviorProperty(behaviorNode, parentid, i);
            }

            for (var i in node.methods) {
                this.hookupBehaviorMethod(behaviorNode, parentid, i);
            }



        },
        //hook up the system API. They are defined in properties, and we dont' want to cause the context to think it needs to set them
        //so the user should not really call the APIs directly, but instead use these getters
        hookUpAPIs : function(node)
        {
            
            if(node.hasOwnProperty("___transformAPI"))
            {
                Object.defineProperty(node, "transformAPI", { // TODO: only define on shared "node" prototype?
                    get: function() {
                        return vwf.getProperty(this.id,"___transformAPI");
                    },
                    enumerable: true,
                });
            }
           if(node.hasOwnProperty("___audioAPI"))
            {
                Object.defineProperty(node, "audioAPI", { // TODO: only define on shared "node" prototype?
                    get: function() {
                        return vwf.getProperty(this.id,"___audioAPI");
                    },
                    enumerable: true,
                });
            }
            if(node.hasOwnProperty("___physicsAPI"))
            {
                Object.defineProperty(node, "physicsAPI", { // TODO: only define on shared "node" prototype?
                    get: function() {
                        return vwf.getProperty(this.id,"___physicsAPI")},
                    enumerable: true,
                });
            }
            if(node.hasOwnProperty("___clientAPI"))
            {
                Object.defineProperty(node, "clientAPI", { // TODO: only define on shared "node" prototype?
                    get: function() {
                        return vwf.getProperty(this.id,"___clientAPI")},
                    enumerable: true,
                });
            }
            if(node.hasOwnProperty("___commsAPI"))
            {
                Object.defineProperty(node, "commsAPI", { // TODO: only define on shared "node" prototype?
                    get: function() {
                        return vwf.getProperty(this.id,"___commsAPI")},
                    enumerable: true,
                });
            }
            if(node["___xAPI"])
            {
                Object.defineProperty(node, "xAPI", { // TODO: only define on shared "node" prototype?
                    get: function() {
                        return vwf.getProperty(this.id,"___xAPI")},
                    enumerable: true,
                });
            }
            if(node.hasOwnProperty("___traceAPI"))
            {
                Object.defineProperty(node, "traceAPI", { // TODO: only define on shared "node" prototype?
                    get: function() {
                        return vwf.getProperty(this.id,"___traceAPI")},
                    enumerable: true,
                });
            }
        },

        // -- initializingNode ---------------------------------------------------------------------

        // Invoke an initialize() function if one exists.

        initializingNode: function(nodeID, childID) {

            var child = this.nodes[childID];

            if (this.isBehavior(child)) {
                this.hookupBehavior(child, nodeID);


            }
            this.hookUpAPIs(child);
            var scriptText = "this.initialize && this.initialize()";

            try {
                return (function(scriptText) {
                    return eval(scriptText)
                }).call(child, scriptText);
            } catch (e) {
                console.error("initializingNode", childID,
                    "exception in initialize:", utility.exceptionMessage(e));
            }

            return undefined;
        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function(nodeID) {


            var child = this.nodes[nodeID];
            //this.callMethodTraverse(this.nodes['index-vwf'],'deletingNode',[nodeID]);
            var node = child.parent;

            if (child.parent && child.parent.__children_by_name) {
                var oldname = vwf.getProperty(nodeID, 'DisplayName');
                delete child.parent.__children_by_name[oldname];

            }

            if (node) {

                if (child.children)
                    for (var i = 0; i < child.children.length; i++) {
                        this.deletingNode(child.children[i].id);
                    }

                var index = node.children.indexOf(child);

                if (index >= 0) {
                    node.children.splice(index, 1);
                }

                delete node.children[child.name]; // TODO: conflict if childName is parseable as a number

                if (node[child.name] === child) {
                    delete node[child.name]; // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                }

                child.parent = undefined;

            }

            var scriptText = "this.deinitialize && this.deinitialize()";

            try {
                (function(scriptText) {
                    return eval(scriptText)
                }).call(child, scriptText);
            } catch (e) {
                console.error("deinitializingNode", childID,
                    "exception in deinitialize:", utility.exceptionMessage(e));
            }

            delete this.nodes[nodeID];
           

        },

        // -- addingChild --------------------------------------------------------------------------

        addingChild: function(nodeID, childID, childName) {


            var node = this.nodes[nodeID];
            var child = this.nodes[childID];

            child.parent = node;

            if (node) {

                node.children.push(child);
                node.children[parseInt(childName) ? "node-" + childName : childName] = child; 

                node.hasOwnProperty(childName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                (node[childName] = child);

            }

            var scriptText = "this.attached && this.attached()";

            try {
                (function(scriptText) {
                    return eval(scriptText)
                }).call(child, scriptText);
            } catch (e) {
                console.error("addingChild", childID,
                    "exception in addingChild:", utility.exceptionMessage(e));
            }

            scriptText = "this.childAdded && this.childAdded('" + childID + "')";

            try {
                (function(scriptText) {
                    return eval(scriptText)
                }).call(node, scriptText);
            } catch (e) {
                console.error("addingChild", childID,
                    "exception in addingChild:", utility.exceptionMessage(e));
            }

        },

        // TODO: removingChild

        // -- parenting ----------------------------------------------------------------------------

        parenting: function(nodeID) { // TODO: move to vwf/model/object

            var node = this.nodes[nodeID];

            return node && node.parent && node.parent.id || 0;
        },

        // -- childrening --------------------------------------------------------------------------

        childrening: function(nodeID) { // TODO: move to vwf/model/object

            var node = this.nodes[nodeID];
            if (!node) return null;
            return jQuery.map(node.children, function(child) {
                return child.id;
            });
        },

        // -- naming -------------------------------------------------------------------------------

        naming: function(nodeID) { // TODO: move to vwf/model/object

            var node = this.nodes[nodeID];

            return node.name || "";
        },

        // -- settingProperties --------------------------------------------------------------------

        settingProperties: function(nodeID, properties) { // TODO: these are here as a hack to keep scripts from coloring the setNode()/getNode() property values; vwf/kernel/model's disable and set/getProperties need to handle this properly (problem: getters can still return a value even when reentry is blocked)
        },

        // -- gettingProperties --------------------------------------------------------------------

        gettingProperties: function(nodeID, properties) { // TODO: these are here as a hack to keep scripts from coloring the setNode()/getNode() property values; vwf/kernel/model's disable and set/getProperties need to handle this properly (problem: getters can still return a value even when reentry is blocked)
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function(nodeID, propertyName, propertyValue, propertyGet, propertySet) {

            var node = this.nodes[nodeID];

            if (propertyGet) { // TODO: assuming javascript here; how to specify script type?
                //  try {
                node.private.getters[propertyName] = eval(getterScript(propertyGet));
                //  } catch ( e ) {
                //      this.logger.warn( "creatingProperty", nodeID, propertyName, propertyValue,
                //          "exception evaluating getter:", utility.exceptionMessage( e ) );
                //  }
            } else {
                node.private.getters[propertyName] = true; // set a guard value so that we don't call prototype getters on value properties
            }

            if (propertySet) { // TODO: assuming javascript here; how to specify script type?
                // try {
                node.private.setters[propertyName] = eval(setterScript(propertySet));
                // } catch ( e ) {
                //     this.logger.warn( "creatingProperty", nodeID, propertyName, propertyValue,
                //         "exception evaluating setter:", utility.exceptionMessage( e ) );
                // }
            } else {
                node.private.setters[propertyName] = true; // set a guard value so that we don't call prototype setters on value properties
            }

            //add the new property to the API for the children nodes
            for (var i = 0; i < node.children.length; i++) {

                if (this.isBehavior(node.children[i])) {
                    this.hookupBehaviorProperty(node.children[i], nodeID, propertyName);
                }

            }


            return this.initializingProperty(nodeID, propertyName, propertyValue);
        },
        
        
        initializingProperty: function(nodeID, propertyName, propertyValue) {

            var node = this.nodes[nodeID];

           
            Object.defineProperty(node.properties, propertyName, { // "this" is node.properties in get/set
                get: function() {
                    return vwf.getProperty(this.id,propertyName)
                },
                set: function(value) {
                    return vwf.setProperty(this.id,propertyName,value)
                },
                enumerable: true
            });

            var APIs = ["transformAPI","traceAPI","commsAPI","clientAPI","physicsAPI","audioAPI","xAPI"];
            if (!node.hasOwnProperty(propertyName) && APIs.indexOf(propertyName) == -1) // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
            {
                Object.defineProperty(node, propertyName, { // "this" is node in get/set
                    get: function() {

                       return jsDriverSelf.getTopContext().getProperty(this.id,propertyName)
                    },
                    set: function(value) {
                         return jsDriverSelf.getTopContext().setProperty(this.id,propertyName,value)
                    },
                    enumerable: true
                });
            }
            node.private.change++; // invalidate the "future" cache

            return propertyValue !== undefined ?
                this.settingProperty(nodeID, propertyName, propertyValue) : undefined;
        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------
        callSetter: function(setter, node, propertyValue, propertyName) {
        //    this.enterNewContext()
            try {
                return setter.call(node, propertyValue);
            } catch (e) {
                console.error("settingProperty", node.ID, propertyName, propertyValue,
                    "exception in setter:", utility.exceptionMessage(e));
            }
        //    this.exitContext();
        },
        settingProperty: function(nodeID, propertyName, propertyValue) {

            //notify all nodes of property changes
            //this.callMethodTraverse(this.nodes['index-vwf'],'satProperty',[nodeID, propertyName, propertyValue]);

            var node = this.nodes[nodeID];

            if (!node) return; // TODO: patch until full-graph sync is working; drivers should be able to assume that nodeIDs refer to valid objects

            if (propertyName == 'DisplayName' && this.nodes[node.parentId]) {

                var oldname = vwf.getProperty(nodeID, 'DisplayName');
                delete this.nodes[node.parentId].__children_by_name[oldname];
                this.nodes[node.parentId].__children_by_name[propertyValue] = node;
            }
            var setter = node.private.setters && node.private.setters[propertyName];

            if (setter && setter !== true) { // is there is a setter (and not just a guard value)

                this.callSetter(setter, node, propertyValue, propertyName);

            }


           

            return undefined;
        },
        // -- gettingProperty ----------------------------------------------------------------------
        tryGetter : function(node, getter) {
           // this.enterNewContext()
            try {
                
                var ret = getter.call(node);
                
                return ret;
            } catch (e) {
                console.error("gettingProperty", node.id,
                    "exception in getter:", utility.exceptionMessage(e));
                return undefined;
            }
           // this.exitContext();
        },
        gettingProperty: function(nodeID, propertyName, propertyValue) {
            if (this.disabled) return;
            var node = this.nodes[nodeID];
            if (!node) return undefined;
            var getter = node.private.getters && node.private.getters[propertyName];

            if (getter && getter !== true) { // is there is a getter (and not just a guard value)
                return this.tryGetter(node,getter);
            }else
                return undefined;
        },
        gettingMethod: function(nodeID, methodName) {


            var node = this.nodes[nodeID];
            var method;

            var func = node.private.methods && node.private.methods[methodName];
            if (func) {
                var str = func.body;
                method = str;
            }
            return method;
        },
        gettingMethods: function(nodeID) {


            var node = this.nodes[nodeID];
            var methods = {};
            if(!node) return methods;

            for (var i in node.methods) {
                if (node.methods.hasOwnProperty(i)) {
                    var methodName = i;
                    var func = node.private.methods && node.private.methods[methodName];
                    if (func) {
                        var str = func.body;
                        var params = func.parameters;
                        methods[methodName] = {
                            body: str,
                            parameters: params
                        };
                    }
                }
            }
            node = Object.getPrototypeOf(node);

            return methods;
        },
        gettingEvents: function(nodeID) {

            var node = this.nodes[nodeID];
            var events = {};
            if(!node) return events;


            if (node.events)
                for (var i in node.events) {
                    var eventName = i;
                    if (node.events.hasOwnProperty(i)) {
                        //TODO: deal with multiple handlers. Requires refactor of childcomponent create code.
                        for (var j = 0; j < node.private.events[eventName].length; j++) {
                            var func = node.private.events && node.private.events[eventName] && node.private.events[eventName][j];
                            if (func) {
                                events[eventName] = {
                                    parameters: func.parameters,
                                    body: func.body
                                };
                            }
                        }
                    }
                }

            node = Object.getPrototypeOf(node);

            return events;
        },

        // -- creatingMethod -----------------------------------------------------------------------

        creatingMethod: function(nodeID, methodName, methodParameters, methodBody) {

            var node = this.nodes[nodeID];
            //this.callMethodTraverse(this.nodes['index-vwf'],'creatingMethod',[methodName, methodParameters, methodBody]);

            Object.defineProperty(node.methods, methodName, { // "this" is node.methods in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node.methods
                        return jsDriverSelf.kernel.callMethod(this.id, methodName, arguments);
                    };
                },
                set: function(value) {
                    this.node.methods.hasOwnProperty(methodName) ||
                        jsDriverSelf.kernel.createMethod(this.id, methodName);
                    this.node.private.bodies[methodName] = value;
                },
                enumerable: true,
                configurable: true
            });

            node.hasOwnProperty(methodName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
            Object.defineProperty(node, methodName, { // "this" is node in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node
                        return jsDriverSelf.kernel.callMethod(this.id, methodName, arguments);
                    };
                },
                set: function(value) {
                    this.methods.hasOwnProperty(methodName) ||
                        jsDriverSelf.kernel.createMethod(this.id, methodName);
                    this.private.bodies[methodName] = value;
                },
                enumerable: true,
                configurable: true
            });
            node.private.methods[methodName] = {body:methodBody,parameters:methodParameters,name:methodName};
            try {
                node.private.bodies[methodName] = eval(bodyScript(methodParameters || [], methodBody || ""));
            } catch (e) {
                console.error("creatingMethod", nodeID, methodName, methodParameters,
                    "exception evaluating body:", utility.exceptionMessage(e));
            }


            for (var i = 0; i < node.children.length; i++) {

                if (this.isBehavior(node.children[i])) {
                    this.hookupBehaviorMethod(node.children[i], nodeID, methodName);
                }

            }
            node.private.change++; // invalidate the "future" cache

        },

        deletingMethod: function(nodeID, methodName) {


            var node = this.nodes[nodeID];
            //this.callMethodTraverse(this.nodes['index-vwf'],'deletingMethod',[nodeID,methodName]);
            if (!node) return undefined;


            var body = node.private.bodies && node.private.bodies[methodName];

            if (body) {
                try {

                    delete node.private.bodies[methodName];
                    if (node.hasOwnProperty(methodName))
                        delete node[methodName];
                    delete node.methods[methodName];

                    delete node.private.methods[methodName];

                } catch (e) {
                    console.error("deletingMethod", nodeID, methodName, methodParameters, // TODO: limit methodParameters for log
                        "exception:", utility.exceptionMessage(e));
                }
            }

            for (var i = 0; i < node.children.length; i++) {

                if (this.isBehavior(node.children[i])) {
                    this.dehookupBehaviorMethod(node.children[i], nodeID, methodName);
                }

            }

            return undefined;
        },
        // -- callingMethod ------------------------------------------------------------------------
        dehookupBehaviorMethod: function(obj, id, methodName) {
            if (obj[methodName]) {
                delete obj[methodName];
            }

        },
        tryCallMethod: function(node,body,methodName,methodParameters)
        {
             try {
                    var ret = body.apply(node, methodParameters);
                    
                    return ret;
                } catch (e) {
                    console.error(e.toString() + " Node:'" + (node.properties.DisplayName || node.id) + "' during: '" + methodName + "' with '" + JSON.stringify(methodParameters) + "'");
                    //            this.logger.warn( "callingMethod", nodeID, methodName, methodParameters, // TODO: limit methodParameters for log
                    //              "exception:", utility.exceptionMessage( e ) );
                    return;
                }

        },
        callingMethod: function(nodeID, methodName, methodParameters) {


            //this.callMethodTraverse(this.nodes['index-vwf'],'calledMethod',[nodeID, methodName, methodParameters]);

            var node = this.nodes[nodeID];
            if (!node) return undefined;

            //used for the autocomplete - eval in the context of the node, and get the keys
            if (methodName == 'JavascriptEvalKeys') {
                var ret = (function() {

                    try {
                        return eval(
                            '(function(){' +
                            'var keys = [];' +
                            'for (var i in ' + methodParameters[0] + '){keys.push(i)}' +
                            'var ret = [];' +
                            'for( var i = 0; i < keys.length; i++) {' +
                            'ret.push([keys[i],' + methodParameters[0] + '[keys[i]] ?' + methodParameters[0] + '[keys[i]].constructor:null])' +
                            '};' +
                            'return ret;' +
                            '}.bind(this))()');
                    } catch (e) {
                        return null;
                    }

                }).apply(node);
                return ret;
            }
            //used by the autocomplete - eval in the context of the node and get the function params
            if (methodName == 'JavascriptEvalFunction') {

                var ret = (function() {

                    try {
                        return eval(
                            '(function(){' +
                            //'debugger;'+
                            'return ' + methodParameters[0] + '.toString();' +

                            '}.bind(this))()');
                    } catch (e) {
                        return null;
                    }

                }).apply(node);

                if (ret && ret.indexOf("function ( /* parameter1, parameter2, ... */ )") == 0) {

                    var nodereference = methodParameters[0].substr(0, methodParameters[0].lastIndexOf('.'));
                    var funcid = methodParameters[0].substr(methodParameters[0].lastIndexOf('.') + 1);

                    var refid = (function() {

                        try {
                            return eval(
                                '(function(){' +
                                //'debugger;'+
                                'return ' + nodereference + '.id' +

                                '}.bind(this))()');
                        } catch (e) {
                            return null;
                        }

                    }).apply(node);
                    ret = (this.nodes[refid].private.bodies[funcid] || "").toString();
                }

                if (ret) {
                    ret = ret.match(/\(.*\)/);
                    if (ret && ret[0])
                        return ret[0];
                    return null;
                } else
                    return null;
            }
            var body = node.private.bodies && node.private.bodies[methodName];

            if (body) {
                var inContext = this.contextStack.length > 1;
                if(!inContext)
                    this.enterNewContext(["enter" , nodeID, methodName]);
                try {
                    var ret = this.tryExec(node,body,methodParameters);//body.apply(node, methodParameters);
                 
                    
                        if(!inContext)
                            this.exitContext(["exit",nodeID, methodName]);
                        return ret;
                    
                } catch (e) {
                    console.error(e.toString() + " Node:'" + (node.properties.DisplayName || nodeID) + "' during: '" + methodName + "' with '" + JSON.stringify(methodParameters) + "'");
                    //            this.logger.warn( "callingMethod", nodeID, methodName, methodParameters, // TODO: limit methodParameters for log
                    //              "exception:", utility.exceptionMessage( e ) );
                }
                if(!inContext)
                    this.exitContext(["exit",nodeID, methodName]);
            }

            //call the method on the child behaviors
            
            for(var i =0; i < node.children.length; i++)
            {
                if(node.children[i] && this.isBehavior(node.children[i]))
                {
                    this.callingMethod(node.children[i].id, methodName, methodParameters)
                }
            }


            return undefined;
        },

        // -- creatingEvent ------------------------------------------------------------------------

        creatingEvent: function(nodeID, eventName, eventParameters, eventBody) {


            var node = this.nodes[nodeID];


            Object.defineProperty(node.events, eventName, { // "this" is node.events in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node.events
                        return jsDriverSelf.kernel.fireEvent(this.node.id, eventName, arguments);
                    };
                },
                set: function(value) {
                    var listeners = this.node.private.listeners[eventName] ||
                        (this.node.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if (typeof value == "function" || value instanceof Function) {
                        listeners.push({
                            handler: value,
                            context: this.node
                        }); // for node.events.*event* = function() { ... }, context is the target node
                    } else if (value.add) {
                        if (!value.phases || value.phases instanceof Array) {
                            listeners.push({
                                handler: value.handler,
                                context: value.context,
                                phases: value.phases
                            });
                        } else {
                            listeners.push({
                                handler: value.handler,
                                context: value.context,
                                phases: [value.phases]
                            });
                        }
                    } else if (value.remove) {
                        this.node.private.listeners[eventName] = listeners.filter(function(listener) {
                            return listener.handler !== value.handler;
                        });
                    } else if (value.flush) {
                        this.node.private.listeners[eventName] = listeners.filter(function(listener) {
                            return listener.context !== value.context;
                        });
                    }
                },
                enumerable: true,
                configurable: true
            });

            node.hasOwnProperty(eventName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
            Object.defineProperty(node, eventName, { // "this" is node in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node
                        return jsDriverSelf.kernel.fireEvent(this.id, eventName, arguments);
                    };
                },
                set: function(value) {
                    var listeners = this.private.listeners[eventName] ||
                        (this.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if (typeof value == "function" || value instanceof Function) {
                        listeners.push({
                            handler: value,
                            context: this
                        }); // for node.*event* = function() { ... }, context is the target node
                    } else if (value.add) {
                        if (!value.phases || value.phases instanceof Array) {
                            listeners.push({
                                handler: value.handler,
                                context: value.context,
                                phases: value.phases
                            });
                        } else {
                            listeners.push({
                                handler: value.handler,
                                context: value.context,
                                phases: [value.phases]
                            });
                        }
                    } else if (value.remove) {
                        this.private.listeners[eventName] = listeners.filter(function(listener) {
                            return listener.handler !== value.handler;
                        });
                    } else if (value.flush) {
                        this.private.listeners[eventName] = listeners.filter(function(listener) {
                            return listener.context !== value.context;
                        });
                    }
                },
                enumerable: true,
                configurable: true
            });

            node.private.listeners[eventName] = [];
            node.private.events[eventName] = [];
            if (eventBody) {

                try {
                    var handler = {
                        handler: null,
                        context: node
                    }
                    handler.handler = eval(bodyScript(eventParameters || [], eventBody || ""));
                    node.private.listeners[eventName].push(handler);
                    node.private.events[eventName].push({name:eventName,body:eventBody,parameters:eventParameters});
                } catch (e) {
                    console.error("creatingEvent", nodeID, eventName, eventParameters, // TODO: limit methodParameters for log
                        "exception:", utility.exceptionMessage(e));
                }
            }

            node.private.change++; // invalidate the "future" cache

        },

        deletingEvent: function(nodeID, eventName) {

            var node = this.nodes[nodeID];
            if (!node) return undefined;
            if (node) {
                try {
                    if( node.private.events && node.private.events[eventName])
                        delete node.private.events[eventName];
                    if (node.private.listeners && node.private.listeners[eventName])
                        delete node.private.listeners[eventName];
                    if (node.hasOwnProperty(eventName))
                        delete node[eventName];
                    if (node.events.hasOwnProperty(eventName))
                        delete node.events[eventName];
                } catch (e) {
                    console.error("deletingEvent", nodeID, eventName, eventParameters, // TODO: limit methodParameters for log
                        "exception:", utility.exceptionMessage(e));
                }
            }

        },
        tryExec:function(node,body,args)
        {
            if(node && body)
            {
                try{
                    return body.apply(node,args);
                }catch(e){
                    console.error("Error executing " + node.id,body,args,e)
                    return undefined;
                }
            }
        },
        callMethodTraverse: function(node, method, args)
        {
            if (!node) return;
            var body = node.private.bodies && node.private.bodies[method];
            var inContext = this.contextStack.length > 1;
            if (!inContext)
                this.enterNewContext();
            if (body)
            {
                this.tryExec(node, body, args);
            }
            if (node.children)
                for (var i = 0; i < node.children.length; i++)
                {
                    this.callMethodTraverse(node.children[i], method, args);
                }
            if (!inContext)
                this.exitContext();
        },
        ticking: function() {
            this.callMethodTraverse(this.nodes['index-vwf'], 'tick', []);
        },
        isBehavior: function(node) {
            if (!node)
                return false;
            if (node.childExtendsID == 'http-vwf-example-com-behavior-vwf') {
                return true;
            }
            return this.isBehavior(node.__proto__);
        },
        // -- firingEvent --------------------------------------------------------------------------
        firingEvent: function(nodeID, eventName, eventParameters) {

            var phase = eventParameters && eventParameters.phase; // the phase is smuggled across on the parameters array  // TODO: add "phase" as a fireEvent() parameter? it isn't currently needed in the kernel public API (not queueable, not called by the drivers), so avoid if possible

            var node = this.nodes[nodeID];
            if (!node) return;
            var listeners = findListeners(node, eventName);



            // Call the handlers registered for the event, and calculate the logical OR of each
            // result. Normally, callers to fireEvent() ignore the handler result, but dispatched
            // events use the return value to determine when an event has been handled as it bubbles
            // up from its target.

            var handled = listeners && listeners.reduce(function(handled, listener) {
                // Call the handler. If a phase is provided, only call handlers tagged for that
                // phase.
                if (!phase || listener.phases && listener.phases.indexOf(phase) >= 0) {

                    //var result = listener.handler.apply(listener.context || jsDriverSelf.nodes[0], eventParameters); // default context is the global root  // TODO: this presumes this.creatingNode( undefined, 0 ) is retained above
                    var result = jsDriverSelf.tryExec(listener.context || jsDriverSelf.nodes[0],listener.handler,eventParameters)
                    return handled || result === true || result === undefined; // interpret no return as "return true"
                }
                return handled;

            }, false);

            if (handled) return handled;

            //if not handled, iterate over all children.
            /*
            handled = handled || phase != 'bubble' && node.children && node.children.reduce( function( handled, child ) {
                        
                        //don't distribute to child behaviors.
                        //behavior listeners are picked up in findListeners
                        if(child.childExtendsID == 'http-vwf-example-com-behavior-vwf')
                            return false;

                        var result = handled || jsDriverSelf.firingEvent(child.id,eventName, eventParameters); // default context is the global root  // TODO: this presumes this.creatingNode( undefined, 0 ) is retained above
                        return handled || result===true || result===undefined; // interpret no return as "return true"
            }, handled );*/


            return handled;
        },

        // -- executing ----------------------------------------------------------------------------

        executing: function(nodeID, scriptText, scriptType) {

            var node = this.nodes[nodeID];

            if (scriptType == "application/javascript") {
                // try {
                return (function(scriptText) {
                    return eval(scriptText)
                }).call(node, scriptText);
                // } catch ( e ) {
                //     this.logger.warn( "executing", nodeID,
                //         ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ), scriptType, "exception:", utility.exceptionMessage( e ) );
                // }
            }

            return undefined;
        },

    });

    // == Private functions ========================================================================

    // -- proxiedBehavior --------------------------------------------------------------------------

    function proxiedBehavior(prototype, behavior) { // invoke with the model as "this"  // TODO: this is a lot like createProperty()/createMethod()/createEvent(), and refreshedFuture(). Find a way to merge.



        var proxy = Object.create(prototype);

        Object.defineProperty(proxy, "private", {
            value: Object.create(behavior.private || Object.prototype)
        });

        proxy.private.origin = behavior; // the node we're the proxy for

        proxy.id = behavior.id; // TODO: move to vwf/model/object

        proxy.name = behavior.name;

        proxy.parent = behavior.parent;

        proxy.source = behavior.source;
        proxy.type = behavior.type;

        proxy.properties = Object.create(prototype.properties || Object.prototype, {
            node: {
                value: proxy
            } // for proxy.properties accessors (non-enumerable)  // TODO: hide this better
        });

        for (var propertyName in behavior.properties) {

            if (behavior.properties.hasOwnProperty(propertyName)) {

                (function(propertyName) {

                    Object.defineProperty(proxy.properties, propertyName, { // "this" is proxy.properties in get/set
                        get: function() {
                            return jsDriverSelf.kernel.getProperty(this.node.id, propertyName)
                        },
                        set: function(value) {
                            jsDriverSelf.kernel.setProperty(this.node.id, propertyName, value)
                        },
                        enumerable: true
                    });

                    proxy.hasOwnProperty(propertyName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                    Object.defineProperty(proxy, propertyName, { // "this" is proxy in get/set
                        get: function() {
                            return jsDriverSelf.kernel.getProperty(this.id, propertyName)
                        },
                        set: function(value) {
                            jsDriverSelf.kernel.setProperty(this.id, propertyName, value)
                        },
                        enumerable: true
                    });

                })(propertyName);

            }

        }

        proxy.methods = Object.create(prototype.methods || Object.prototype, {
            node: {
                value: proxy
            } // for proxy.methods accessors (non-enumerable)  // TODO: hide this better
        });

        for (var methodName in behavior.methods) {

            if (behavior.methods.hasOwnProperty(methodName)) {

                (function(methodName) {

                    Object.defineProperty(proxy.methods, methodName, { // "this" is proxy.methods in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy.methods
                                return jsDriverSelf.kernel.callMethod(this.node.id, methodName, arguments);
                            };
                        },
                        set: function(value) {
                            this.node.methods.hasOwnProperty(methodName) ||
                                jsDriverSelf.kernel.createMethod(this.node.id, methodName);
                            this.node.private.bodies[methodName] = value;
                        },
                        enumerable: true,
                    });

                    proxy.hasOwnProperty(methodName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                    Object.defineProperty(proxy, methodName, { // "this" is proxy in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy
                                return jsDriverSelf.kernel.callMethod(this.id, methodName, arguments);
                            };
                        },
                        set: function(value) {
                            this.methods.hasOwnProperty(methodName) ||
                                jsDriverSelf.kernel.createMethod(this.id, methodName);
                            this.private.bodies[methodName] = value;
                        },
                        enumerable: true,
                    });

                })(methodName);

            }

        }

        proxy.events = Object.create(prototype.events || Object.prototype, {
            node: {
                value: proxy
            } // for proxy.events accessors (non-enumerable)  // TODO: hide this better
        });

        for (var eventName in behavior.events) {

            if (behavior.events.hasOwnProperty(eventName)) {

                (function(eventName) {

                    Object.defineProperty(proxy.events, eventName, { // "this" is proxy.events in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy.events
                                return jsDriverSelf.kernel.fireEvent(this.node.id, eventName, arguments);
                            };
                        },
                        set: function(value) {
                            var listeners = this.node.private.listeners[eventName] ||
                                (this.node.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                            if (typeof value == "function" || value instanceof Function) {
                                listeners.push({
                                    handler: value,
                                    context: this.node
                                }); // for node.events.*event* = function() { ... }, context is the target node
                            } else if (value.add) {
                                if (!value.phases || value.phases instanceof Array) {
                                    listeners.push({
                                        handler: value.handler,
                                        context: value.context,
                                        phases: value.phases
                                    });
                                } else {
                                    listeners.push({
                                        handler: value.handler,
                                        context: value.context,
                                        phases: [value.phases]
                                    });
                                }
                            } else if (value.remove) {
                                this.node.private.listeners[eventName] = listeners.filter(function(listener) {
                                    return listener.handler !== value.handler;
                                });
                            } else if (value.flush) {
                                this.node.private.listeners[eventName] = listeners.filter(function(listener) {
                                    return listener.context !== value.context;
                                });
                            }
                        },
                        enumerable: true,
                    });

                    proxy.hasOwnProperty(eventName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                    Object.defineProperty(proxy, eventName, { // "this" is proxy in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy
                                return jsDriverSelf.kernel.fireEvent(this.id, eventName, arguments);
                            };
                        },
                        set: function(value) {
                            var listeners = this.private.listeners[eventName] ||
                                (this.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                            if (typeof value == "function" || value instanceof Function) {
                                listeners.push({
                                    handler: value,
                                    context: this
                                }); // for node.*event* = function() { ... }, context is the target node
                            } else if (value.add) {
                                if (!value.phases || value.phases instanceof Array) {
                                    listeners.push({
                                        handler: value.handler,
                                        context: value.context,
                                        phases: value.phases
                                    });
                                } else {
                                    listeners.push({
                                        handler: value.handler,
                                        context: value.context,
                                        phases: [value.phases]
                                    });
                                }
                            } else if (value.remove) {
                                this.private.listeners[eventName] = listeners.filter(function(listener) {
                                    return listener.handler !== value.handler;
                                });
                            } else if (value.flush) {
                                this.private.listeners[eventName] = listeners.filter(function(listener) {
                                    return listener.context !== value.context;
                                });
                            }
                        },
                        enumerable: true,
                    });

                })(eventName);

            }

        }

        return proxy;
    }

    // -- refreshedFuture --------------------------------------------------------------------------

    function refreshedFuture(node, when, callback) { // invoke with the model as "this"



        if (Object.getPrototypeOf(node).private) {
            refreshedFuture.call(this, Object.getPrototypeOf(node));
        }

        var future = node.private.future;

        future.private.when = when;
        future.private.callback = callback; // TODO: would like to be able to remove this reference after the future call has completed

        if (future.private.change < node.private.change) { // only if out of date

            future.id = node.id;

            future.properties = Object.create(Object.getPrototypeOf(future).properties || Object.prototype, {
                future: {
                    value: future
                } // for future.properties accessors (non-enumerable)  // TODO: hide this better
            });

            for (var propertyName in node.properties) {

                if (node.properties.hasOwnProperty(propertyName)) {

                    (function(propertyName) {

                        Object.defineProperty(future.properties, propertyName, { // "this" is future.properties in get/set
                            get: function() {
                                return jsDriverSelf.kernel.getProperty(this.future.id,
                                    propertyName, this.future.private.when, this.future.private.callback
                                )
                            },
                            set: function(value) {
                                jsDriverSelf.kernel.setProperty(this.future.id,
                                    propertyName, value, this.future.private.when, this.future.private.callback
                                )
                            },
                            enumerable: true
                        });

                        future.hasOwnProperty(propertyName) || // TODO: calculate so that properties take precedence over methods over events, for example
                        Object.defineProperty(future, propertyName, { // "this" is future in get/set
                            get: function() {
                                return jsDriverSelf.kernel.getProperty(this.id,
                                    propertyName, this.private.when, this.private.callback
                                )
                            },
                            set: function(value) {
                                jsDriverSelf.kernel.setProperty(this.id,
                                    propertyName, value, this.private.when, this.private.callback
                                )
                            },
                            enumerable: true
                        });

                    })(propertyName);

                }

            }

            future.methods = Object.create(Object.getPrototypeOf(future).methods || Object.prototype, {
                future: {
                    value: future
                } // for future.methods accessors (non-enumerable)  // TODO: hide this better
            });

            for (var methodName in node.methods) {

                if (node.methods.hasOwnProperty(methodName)) {

                    (function(methodName) {

                        Object.defineProperty(future.methods, methodName, { // "this" is future.methods in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future.methods
                                    return jsDriverSelf.kernel.callMethod(this.future.id,
                                        methodName, arguments, this.future.private.when, this.future.private.callback
                                    );
                                }
                            },
                            enumerable: true
                        });

                        future.hasOwnProperty(methodName) || // TODO: calculate so that properties take precedence over methods over events, for example
                        Object.defineProperty(future, methodName, { // "this" is future in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future
                                    return jsDriverSelf.kernel.callMethod(this.id,
                                        methodName, arguments, this.private.when, this.private.callback
                                    );
                                }
                            },
                            enumerable: true
                        });

                    })(methodName);

                }

            }

            future.events = Object.create(Object.getPrototypeOf(future).events || Object.prototype, {
                future: {
                    value: future
                } // for future.events accessors (non-enumerable)  // TODO: hide this better
            });

            for (var eventName in node.events) {

                if (node.events.hasOwnProperty(eventName)) {

                    (function(eventName) {

                        Object.defineProperty(future.events, eventName, { // "this" is future.events in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future.events
                                    return jsDriverSelf.kernel.fireEvent(this.future.id,
                                        eventName, arguments, this.future.private.when, this.future.private.callback
                                    );
                                };
                            },
                            enumerable: true,
                        });

                        future.hasOwnProperty(eventName) || // TODO: calculate so that properties take precedence over methods over events, for example
                        Object.defineProperty(future, eventName, { // "this" is future in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future
                                    return jsDriverSelf.kernel.fireEvent(this.id,
                                        eventName, arguments, this.private.when, this.private.callback
                                    );
                                };
                            },
                            enumerable: true,
                        });

                    })(eventName);

                }

            }

            future.private.change = node.private.change;

        }

        return future;
    }

    // -- getterScript -----------------------------------------------------------------------------

    function getterScript(body) {
        return accessorScript("( function() {", body, "} )");
    }

    // -- setterScript -----------------------------------------------------------------------------

    function setterScript(body) {
        return accessorScript("( function( value ) {", body, "} )");
    }

    // -- bodyScript -------------------------------------------------------------------------------

    function bodyScript(parameters, body) {
        var parameterString = (parameters.length ? " " + parameters.join(", ") + " " : "");
        return accessorScript("( function(" + parameterString + ") {\n", body, "\n} )");
        // return accessorScript( "( function(" + ( parameters.length ? " " + parameters.join( ", " ) + " " : ""  ) + ") {", body, "} )" );
    }

    // -- accessorScript ---------------------------------------------------------------------------

    function accessorScript(prefix, body, suffix) { // TODO: sanitize script, limit access
        if (body.length && body.charAt(body.length - 1) == "\n") {
            var bodyString = body.replace(/^./gm, "  $&");
            return prefix + "\n" + bodyString + suffix + "\n";
        } else {
            var bodyString = body.length ? " " + body + " " : "";
            return prefix + bodyString + suffix;
        }
    }

    // -- findListeners ----------------------------------------------------------------------------

    // TODO: this walks the full prototype chain and is probably horribly inefficient.

    function nodeInstanceOf(node, type) {
        while (node) {
            if (node.childExtendsID == type)
                return true;
            if (vwf.prototype(node.id))
                node = jsDriverSelf.nodes[vwf.prototype(node.id)];
            else
                node = null;

        }
        return false;
    }

    function findListeners(node, eventName, targetOnly) {

        var prototypeListeners = Object.getPrototypeOf(node).private ? // get any jsDriverSelf-targeted listeners from the prototypes
            findListeners(Object.getPrototypeOf(node), eventName, true) : [];

        var nodeListeners = node.private.listeners && node.private.listeners[eventName] || [];


        if (targetOnly) {
            return prototypeListeners.concat(nodeListeners.filter(function(listener) {
                return listener.context == node || listener.context == node.private.origin; // in the prototypes, select jsDriverSelf-targeted listeners only
            }));
        } else {

            //run find listeners in the child behavior nodes
            var childBehaviorListeners = [];
            for (var i = 0; i < node.children.length; i++) {
                if (nodeInstanceOf(node.children[i], 'http-vwf-example-com-behavior-vwf'))
                    childBehaviorListeners = childBehaviorListeners.concat(findListeners(node.children[i], eventName));
            }

            return prototypeListeners.map(function(listener) { // remap the prototype listeners to target the node
                return {
                    handler: listener.handler,
                    context: node,
                    phases: listener.phases
                };
            }).concat(childBehaviorListeners).concat(nodeListeners);
        }

    }

});
