require.config({
    paths: {
        "vwf": "../vwf"
    },
    shim: {
		'vwf/view/editorview/lib/angular-resource': {
			deps: ['vwf/view/editorview/lib/angular']
		},
        'vwf/view/xapi/xapiwrapper': {
            deps: ['vwf/view/editorview/sha256', "vwf/view/editorview/_3DRIntegration"],
            exports: 'XAPIWrapper'
        },
        
        'vwf/model/threejs/GeometryExporter': {
            deps: ["vwf/model/threejs"]
        },
        'vwf/model/threejs/helvetiker_regular.typeface.js': {
            deps: ["vwf/model/threejs"]
        },
        'vwf/view/editorview/lib/html-palette':
        {
            deps: ['vwf/view/editorview/lib/angular'],
            exports:"HtmlPalette"
        }
    },
    waitSeconds: 15
});
define([

    "domReady",
    "vwf/view/editorview/ObjectPools",
    "/socket.io/socket.io.js",
    // This is the common model implementation and an example model that connects the
    // simulation to a WebGL scene manager.
    "vwf/kernel/model",
    "vwf/model/javascript",
    "ohm",
    
    "vwf/model/threejs",
    
    "vwf/model/wires",
    "vwf/model/object",
    "vwf/model/stage/log",
    "vwf/kernel/view",
    "vwf/view/document",
    'vwf/view/editorview/lib/angular',
    "vwf/view/EditorView",
    "vwf/view/threejs",
   
    "vwf/utility",
    "vwf/view/WebRTC",
    "vwf/model/audio",
    "messageCompress",
    "vwf/view/xapi",
    "assetLoader",
    "vwf/model/jqueryui",
    "vwf/view/jqueryui",
    "SettingsManager",
    'vwf/model/threejs/MATH',
    'vwf/model/threejs/sceneManager/_THREERayTracer',
    
    'vwf/model/threejs/GeometryExporter',
    'vwf/model/threejs/helvetiker_regular.typeface.js'

], function(ready,pools,io) {

    window.io = io;
    return function(stateData) {
         //console.log('begin preload');
        require("vwf/view/editorview/ObjectPools").getSingleton();
        window.alertify = require("vwf/view/editorview/lib/alertify.js-0.3.9/src/alertify");
        window._SettingsManager = require("SettingsManager").getSingleton();
        var assetLoader = require("assetLoader").getSingleton();


        // With the scripts loaded, we must initialize the framework. vwf.initialize()
        // accepts three parameters: a world specification, model configuration parameters,
        // and view configuration parameters.
        assetLoader.loadList(stateData, function() {
            vwf.loadConfiguration(null, {
                model: [],
                view: []
            });
        });

    }
});
$('#sidepanel .jspContainer .jspPane').css('left', 0)
