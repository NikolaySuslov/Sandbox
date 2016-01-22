define([], function()
{
    function SubDriverFactory()
    {
        this.factories = {};
        this.loadSubDriver = function(source)
        {

            var script = $.ajax(
            {
                url: source,
                async: false
            }).responseText;
            if (!script) return null;
            var factory = eval(script);
            if (!factory) return null;
            if (factory.constructor != Function) return null;
            return factory;

        }
        this.createNode = function(childID, childSource, childName, sourceType, assetSource, asyncCallback)
            {

                var APINames = ['callingMethod', 'settingProperty', 'gettingProperty', 'initializingNode', 'addingChild', 'deletingNode', 'ticking'];
                var node = null;
                if (this.factories[childSource])
                    node = this.factories[childSource](childID, childSource, childName, sourceType, assetSource, asyncCallback);
                else
                {
                    this.factories[childSource] = this.loadSubDriver(childSource);
                    node = this.factories[childSource](childID, childSource, childName, sourceType, assetSource, asyncCallback);
                }

                if (node.inherits)
                    if (node.inherits.constructor == Array)
                    {
                        for (var i = 0; i < node.inherits.length; i++)
                        {
                            var proto = null;
                            if (node.inheritFullBase) //does the node do full construction for the base, or partial
                                proto = this.createNode(childID, node.inherits[i], childName, sourceType, assetSource, asyncCallback);
                            else
                                proto = this.createNode('', node.inherits[i], '');

                            for (var j = 0; j < APINames.length; j++)
                            {
                                var api = APINames[j];
                                if (!node[api + 'Internal'])
                                {

                                    var capi = api + "";
                                    node[capi + 'Internal'] = [];
                                    if (node[capi])
                                        node[capi + 'Internal'].push(node[capi]);
                                    node[capi] = new Function(["arg0", "arg1", "arg2", "arg3", "arg4", "arg5"],

                                        "var ret = undefined;\n" +
                                        "for(var i =0; i < this['" + capi + 'Internal' + "'].length; i++)\n" +
                                        "	ret = ret !== undefined ? ret : (this['" + capi + 'Internal' + "'][i] && this['" + capi + 'Internal' + "'][i].call(this,arg0,arg1,arg2,arg3,arg4,arg5));\n" +
                                        "return ret;"

                                    );
                                    if (!proto[api + 'Internal'])
                                    {
                                        if (proto[capi])
                                            node[capi + 'Internal'].push(proto[capi]);
                                    }
                                    else
                                    {
                                        for (var n = 0; n < proto[api + 'Internal'].length; n++)
                                        {
                                            node[api + 'Internal'].push(proto[api + 'Internal'][n]);
                                        }
                                    }
                                }
                                else
                                {
                                    node[api + 'Internal'].push(proto[api]);
                                    //node[capi] = node[capi].bind(node);
                                }

                            }
                            var keys = Object.keys(proto);
                            for (var k = 0; k < keys.length; k++)
                            {
                                var key = keys[k];
                                if (APINames.indexOf(key) == -1)
                                    if (!node.hasOwnProperty(key))
                                    {
                                        if (proto[key].constructor == Function)
                                            node[key] = proto[key];
                                        else
                                            node[key] = proto[key];
                                    }
                            }
                        }
                    }
                if (node.initialize)
                    node.initialize();
                return node;

            }
            //preload common drivers

        this.factories['vwf/model/threejs/cylinder.js'] = this.loadSubDriver('vwf/model/threejs/cylinder.js');
        this.factories['vwf/model/threejs/box.js'] = this.loadSubDriver('vwf/model/threejs/box.js');
        this.factories['vwf/model/threejs/sphere.js'] = this.loadSubDriver('vwf/model/threejs/sphere.js');
        this.factories['vwf/model/threejs/cone.js'] = this.loadSubDriver('vwf/model/threejs/cone.js');
        this.factories['vwf/model/threejs/plane.js'] = this.loadSubDriver('vwf/model/threejs/plane.js');

        this.factories['vwf/model/threejs/prim.js'] = this.loadSubDriver('vwf/model/threejs/prim.js');
        this.factories['vwf/model/threejs/modifier.js'] = this.loadSubDriver('vwf/model/threejs/modifier.js');
        this.factories['vwf/model/threejs/materialDef.js'] = this.loadSubDriver('vwf/model/threejs/materialDef.js');
    }
    return SubDriverFactory;
})