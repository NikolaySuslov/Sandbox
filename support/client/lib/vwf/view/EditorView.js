"use strict";
jQuery.extend(
{
    parseQuerystring: function()
    {
        var nvpair = {};
        var qs = window.location.search.replace('?', '');
        var pairs = qs.split('&');
        $.each(pairs, function(i, v)
        {
            var pair = v.split('=');
            nvpair[pair[0]] = pair[1];
        });
        return nvpair;
    }
});
define([
	"module", "version", "vwf/view",'vwf/utility/eventSource',

	// dependencies
	"vwf/view/editorview/lib/alertify.js-0.3.9/src/alertify",
	"vwf/view/editorview/angular-app",
	"vwf/view/editorview/Menubar",
    "vwf/view/editorview/avatarTools",
    "vwf/view/editorview/log",

	// other things that need to be loaded first
	"touch.js",
	"vwf/view/editorview/ObjectPools",
	"vwf/view/editorview/LocationTools",
	"vwf/view/editorview/WindowResize",
	"vwf/view/editorview/_PermissionsManager",
	"vwf/view/editorview/InputSetup",
	"vwf/view/editorview/SaveLoadTimer",
	"vwf/view/editorview/TouchHandler",
	"vwf/view/editorview/SidePanel",
	"vwf/view/editorview/Toolbar",
	"vwf/view/editorview/ChatSystemGUI",
	"vwf/view/editorview/PrimitiveEditor",
	"vwf/view/editorview/MaterialEditor",
	"vwf/view/editorview/Notifier",
	"vwf/view/editorview/ScriptEditor",
	"vwf/view/editorview/Editor",
	"vwf/view/editorview/_3DRIntegration",
	"vwf/view/editorview/HierarchyManager",
	"vwf/view/editorview/DataManager",
	"vwf/view/editorview/UserManager",
	"vwf/view/editorview/help",
	"vwf/view/editorview/wireeditor",
	"vwf/view/editorview/UndoManager",
	"vwf/view/editorview/Publisher",
	"vwf/view/editorview/EntityLibrary",
	"vwf/view/editorview/PhysicsEditor",
	"vwf/view/editorview/PerformanceManager",
	"vwf/view/editorview/JSONPrompt",
     "vwf/view/localization/translate",
     "vwf/view/editorview/lib/beautify.module.js"
	//"vwf/view/editorview/panelEditor",
], function(module, version, view,eventSource, alertify, angular_app, Menubar,avatarTools,log) {
    return view.load(module, {
        // == Module Definition ====================================================================
        needTools: function()
        {
            var instanceData = _DataManager.getInstanceData() ||
            {};
            var needTools = instanceData && instanceData.publishSettings ? instanceData.publishSettings.allowTools : true;
            if ($.parseQuerystring().notools) needTools = false;
            return needTools;
        },
        initialize: function() {
            window._EditorView = this;
            eventSource.call(this,'EditorView');
            //intialize the logger interface
            log.initialize();
            if (!window._EditorInitialized) {

				$(document).keydown(function(e){
					var elem = e.target.nodeName.toLowerCase();
					var exceptions = ['input','textarea','select'];
					if(e.keyCode === 8 && exceptions.indexOf(elem) === -1){
						console.log('Block backspace navigation');
						e.preventDefault();
					}
				});

                window._DataManager = require("vwf/view/editorview/DataManager").getSingleton();;
                //set the title of the window to the title of the world.
                //if(_DataManager.getInstanceData())
                //	document.title = _DataManager.getInstanceData().title;
                window._Editor = require("vwf/view/editorview/Editor").getSingleton();
                if (this.needTools())
                {
                    /*var data = $.ajax('vwf/view/editorview/menus.html', {
                        async: false,
                        dataType: 'html'
                    }).responseText;
                    $(document.body).append(data);*/
                    //$('#smoothmenu1').show();
                    $(document.head).append('<script type="text/javascript" src="vwf/view/editorview/lib/ddsmoothmenu.js"></script>');

                    window._PhysicsEditor = require("vwf/view/editorview/PhysicsEditor").getSingleton();
                   // window._MaterialEditor.hide();

                    window._Notifier = require("vwf/view/editorview/Notifier").getSingleton();
                    require('vwf/view/editorview/ScriptEditor').initialize();
                    window._ModelLibrary = require("vwf/view/editorview/_3DRIntegration").getSingleton();
                    
                    //the publisher is only loaded if the world settings allow it
                    if(window._DataManager.getInstanceData().publishSettings.allowPlayPause)
                        window._Publisher = require("vwf/view/editorview/Publisher").getSingleton();
                    
                    window._PermissionsManager = require("vwf/view/editorview/_PermissionsManager").getSingleton();
                    window._WireEditor = require("vwf/view/editorview/wireeditor").getSingleton();
                    window._UndoManager = require("vwf/view/editorview/UndoManager").getSingleton();
                    require("vwf/view/editorview/EntityLibrary").initialize();
                    require("vwf/view/editorview/JSONPrompt").initialize();
                    //this.addManager(_ScriptEditor);
                    this.addManager(_UndoManager);
                    this.addManager(_ModelLibrary);
                    this.addManager(_Notifier);
                    //this.addManager(_MaterialEditor);
                    //this.addManager(_PrimitiveEditor);
                    this.addManager(_PermissionsManager);
                    this.addManager(_WireEditor);
                   //the publisher is only loaded if the world settings allow it
                    if(window._DataManager.getInstanceData().publishSettings.allowPlayPause)
                        this.addManager(_Publisher);
                    this.addManager(_PhysicsEditor);
                    window.avatarTools = avatarTools;
                }
                window._LocationTools = require("vwf/view/editorview/LocationTools").getSingleton();
                window._UserManager = require("vwf/view/editorview/UserManager").getSingleton();
                window._PerformanceManager = require("vwf/view/editorview/PerformanceManager").getSingleton();
                this.addManager(_PerformanceManager);
                if (this.needTools())
                {
                    require("vwf/view/editorview/help").getSingleton();
                    $(document.head).append('<script type="text/javascript" src="vwf/view/editorview/PainterTool.js"></script>');
                    $(document.head).append('<script type="text/javascript" src="vwf/view/editorview/AlignTool.js"></script>');
                    $(document.head).append('<script type="text/javascript" src="vwf/view/editorview/SplineTool.js"></script>');
                    $(document.head).append('<script type="text/javascript" src="vwf/view/editorview/TerrainTool.js"></script>');
                    $(document.head).append('<script type="text/javascript" src="vwf/view/editorview/lib/jquery.qtip-1.0.0-rc3.min.js"></script>');
                    
                }
                $(document.head).append('<script type="text/javascript" src="vwf/view/editorview/sha256.js"></script>');
                $(document.head).append('<script type="text/javascript" src="vwf/view/editorview/lib/jquery.ui.touch-punch.min.js"></script>');
                require("vwf/view/editorview/WindowResize").initialize();
                /*$('input[type="text"]').keypress(function(e)
                {
                    e.stopImmediatePropagation();
                });*/
                this.addManager(_UserManager);
                this.addManager(_DataManager);
                this.addManager(_Editor);
                angular_app.initialize();
                this.addManager(angular_app);
            }
        },
        managers: [], //list of objects that need notification of events
        addManager: function(manager)
        {
            this.managers.push(manager);
            manager.sendMessage = this.sendMessage;
            manager.getParent = function()
            {
                return this;
            }.bind(this);
        },
        //actual sending of messages. Stops and returns when a manager returns a value
        _sendMessage: function(message, data, sender)
        {
            for (var i = 0; i < this.managers.length; i++)
            {
                var manager = this.managers[i];
                if (manager[message] && (typeof manager[message] == "function"))
                {
                    var tret = null;
                    if (data && data.constructor == Array)
                        tret = manager[message].apply(manager, data);
                    else
                        tret = manager[message].apply(manager, [data]);
                    return tret;
                }
                else if (manager.receiveMessage)
                {
                    var tret = manager.receiveMessage(message, data, sender);
                    if (tret)
                        return tret;
                }
            }
            return null;
        },
        //handle that is applied to each registered manager, allowing them to send messages over the bus
        /* message,data */
        sendMessage: function( /* message,data */ )
        {
            var args = []
            for (var i = 0; i < arguments.length; i++)
            {
                args.push(arguments[i]);
            }
            var message = args.shift();
            return this.getParent()._sendMessage(message, args, this);
        },
        // send the VWF events down to all registered objects
        viewAPINotify: function(functionName, data)
        {

            //only pass messages to the editor components if the world is stopped, or if the messages are necessary to handle the play pause logic
            if (
                !_DataManager.getInstanceData().publishSettings.allowPlayPause ||
                Engine.models.object.gettingProperty(Engine.application(), 'playMode') !== 'play'||
                data[1] =='playMode' ||data[1] =='playBackup' || data[1] == 'restoreState' || data[1] == 'postWorldRestore' || data[1] == 'preWorldPlay'
                )
            {
                for (var i = 0; i < this.managers.length; i++)
                {
                    var manager = this.managers[i];
                    if (manager[functionName])
                    {
                        try{
                        manager[functionName].apply(manager, data)
                        }catch(e)
                        {
                            console.error('error processing view api message ' + functionName)
                        }
                    }
                }
            }
        },
        createdNode: function(nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childURI, childName, callback /* ( ready ) */ )
        {
            this.viewAPINotify('createdNode', arguments);
        },
        initializedNode: function(nodeID, childID)
        {
            this.viewAPINotify('initializedNode', [nodeID, childID]);
            if (childID == 'index-vwf')
            {
                if (window._Editor)
                {
                    _Editor.initialize();
                    InitializeEditor();
                    //disable text selection on the entire page, except for input elements and draggables
              //      $('body *').not(':has(input)').not('[draggable]').not('input').disableSelection();
                    //enable selection on the ancestors of all draggables, to make drag work in FF
              //      $('[draggable]').parentsUntil().enableSelection();
                }
                //make sure to setup the view correctly
                _resizeCanvas();
            }
            if (window._Editor && childID != 'index-vwf')
            {
                if (window._Editor.createNodeCallback != null)
                {
                    window._Editor.CallCreateNodeCallback(childID, nodeID, Engine.name(childID));
                }
            }
        },
        createdProperty: function(nodeID, propertyName, propertyValue)
        {
            this.viewAPINotify('createdProperty', [nodeID, propertyName, propertyValue]);
        },
        initializedProperty: function(nodeID, propertyName, propertyValue)
        {
            this.viewAPINotify('initializedProperty', [nodeID, propertyName, propertyValue]);
        },
        deletedNode: function(nodeID)
        {
            this.viewAPINotify('deletedNode', [nodeID]);
            if (window._Editor && _Editor.SelectedVWFID == nodeID)
            {
                _Editor.SelectObject(null);
            }
        },
        satProperty: function(nodeID, propertyName, propertyValue)
        {
            this.viewAPINotify('satProperty', [nodeID, propertyName, propertyValue]);
        },
        createdMethod: function(nodeID, methodName, methodParameters, methodBody)
        {
            this.viewAPINotify('createdMethod', [nodeID, methodName, methodParameters, methodBody]);
        },
        calledMethod: function(nodeID, methodName, methodParameters)
        {
            this.viewAPINotify('calledMethod', [nodeID, methodName, methodParameters]);
        },
        deletedMethod: function(nodeID, methodName, methodParameters, body)
        {
            this.viewAPINotify('deletedMethod', [nodeID, methodName, methodParameters, body]);
        },
        createdEvent: function(nodeID, eventName, eventParameters, eventBody)
        {
            this.viewAPINotify('createdEvent', [nodeID, eventName, eventParameters,eventBody]);
        },
        firedEvent: function(nodeID, eventName, eventParameters)
        {
            this.viewAPINotify('firedEvent', [nodeID, eventName, eventParameters]);
        },
        deletedEvent: function(nodeID, eventName, eventParams)
        {
            this.viewAPINotify('deletedEvent', [nodeID, eventName, eventParams]);
        },
        executed: function(nodeID, scriptText, scriptType)
        {
            this.viewAPINotify('executed', [nodeID, scriptText, scriptType]);
        },
        ticked: function()
        {
            //this.viewAPINotify('ticked', arguments);
            this.viewAPINotify('ticked', []);
        }
    });
});

function InitializeEditor() {
    var instanceData = _DataManager.getInstanceData() || {};

    document._UserManager = _UserManager;
    $('#vwf-root').css('overflow', 'hidden');
    $(document.body).css('font-size', '10px');
    $('#tabs').css('z-index', '101');
    $('#AvatarChoice').buttonset();
    $('#vwf-root').attr('tabindex', '0');
    Engine.logger.level = 6;
    if (document.Players)
    {
        for (var i = 0; i < document.Players.length; i++)
        {
            _UserManager.PlayerCreated(document.Players[i]);
        }
    }
    require("vwf/view/editorview/InputSetup").initialize();
    require("vwf/view/editorview/ChatSystemGUI").initialize();

    if (_EditorView.needTools()) {
        //$('#sidepanel').css('height', $(window).height() - ($('#statusbar').height() + $('#toolbar').height() + $('#smoothmenu1').height()) + 'px')
        //$('#sidepanel').jScrollPane();
        require("vwf/view/editorview/Toolbar").initialize();
        require("vwf/view/editorview/Menubar").initialize();
        //_EditorView.addManager(require("vwf/view/editorview/Menubar"));
        //require("vwf/view/editorview/SideTabs").initialize();

		$('#toolbarLevel').show();
        require("vwf/view/localization/translate").initialize();
        window.translateMenu();
        //default to select mode
        _Editor.SetSelectMode('Pick');
    }
    else
    {
        $('#index-vwf').css('border', 'none');
    }
    require("vwf/view/editorview/SaveLoadTimer").initialize();
    require("vwf/view/editorview/TouchHandler").initialize();
    $(document.body).css('overflow', 'hidden');
    $(window).resize();
    //	$('body *').not(':has(input)').not('input').disableSelection();
    //	$('#vwf-root').enableSelection();
    //	$('#vwf-root').parent().enableSelection();
    //	$('#vwf-root').parent().parent().enableSelection();
    //	$('#index-vwf').enableSelection();
    //	$('* :not(input)').disableSelection();
    //localization
}

function PlayerDeleted(e)
{
    $("#" + e + "label").remove();
}
