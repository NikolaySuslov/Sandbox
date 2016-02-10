

define(['vwf/view/editorview/lib/angular', './UndoManager', 'vwf/view/editorview/lib/html-palette'], function(angular, UndoManager)
{
	var app = angular.module('SandboxEditor', ['html-palette']);
	var playing = false;

	app.run(['$timeout', '$rootScope', function($timeout, $rootScope)
	{
		app.root = $rootScope;
		$rootScope.fields = {
			selectedNode: null,
			selectedNodeIds: [],
			selectedNodeChildren: [],
			worldIsReady: false,
			nodes: {},
			cameras: [],

			undoAction: '',
			redoAction: ''
		};

		$(document).on('selectionChanged', function(e,node)
		{
			$rootScope.fields.selectedNode = node;
			$rootScope.fields.selectedNodeIds = [];
			$rootScope.fields.selectedNodeChildren.length = 0;

			for(var i=0; i<_Editor.getSelectionCount(); i++)
				$rootScope.fields.selectedNodeIds.push(_Editor.GetSelectedVWFID(i));

			if(node){
				node.methods = node.methods || {};
				node.events = node.events || {};
				node.properties = node.properties || {};
				getSelectedNodeChildren();
			}

			$timeout($rootScope.$apply.bind($rootScope));
		});

		$(document).on('setstatecomplete', function(){
			$rootScope.fields.worldIsReady = true;
			$timeout($rootScope.$apply.bind($rootScope));
		});
	}]);

	app.initialize = function(){
		angular.bootstrap( document.body, ['SandboxEditor'] );
	}
	app.apply = debounce(function(){
		if(!playing || !_DataManager.getInstanceData().publishSettings.allowPlayPause) app.root.$apply();
	},200);

	UndoManager = UndoManager.getSingleton();
	UndoManager.modCb = function(undoFrame, redoFrame)
	{
		if(!undoFrame)
			app.root.fields.undoAction = '';
		else if(undoFrame instanceof UndoManager.CreateNodeEvent)
			app.root.fields.undoAction = 'create '+undoFrame.proto.properties.DisplayName;
		else if(undoFrame instanceof UndoManager.DeleteNodeEvent)
			app.root.fields.undoAction = 'delete '+undoFrame.proto.properties.DisplayName;
		else if(undoFrame instanceof UndoManager.SelectionEvent)
			app.root.fields.undoAction = 'selection';
		else if(undoFrame instanceof UndoManager.SetPropertyEvent)
			app.root.fields.undoAction = 'change '+undoFrame.property;
		else if(undoFrame instanceof UndoManager.SetEventEvent)
			app.root.fields.undoAction = 'change '+undoFrame.name;
		else if(undoFrame instanceof UndoManager.SetMethodEvent)
			app.root.fields.undoAction = 'change '+undoFrame.name;
		else if(undoFrame instanceof UndoManager.CompoundEvent)
			app.root.fields.undoAction = undoFrame.list.length+' changes';

		if(!redoFrame)
			app.root.fields.redoAction = '';
		else if(redoFrame instanceof UndoManager.CreateNodeEvent)
			app.root.fields.redoAction = 'create '+redoFrame.proto.properties.DisplayName;
		else if(redoFrame instanceof UndoManager.DeleteNodeEvent)
			app.root.fields.redoAction = 'delete '+redoFrame.proto.properties.DisplayName;
		else if(redoFrame instanceof UndoManager.SelectionEvent)
			app.root.fields.redoAction = 'selection';
		else if(redoFrame instanceof UndoManager.SetPropertyEvent)
			app.root.fields.redoAction = 'change '+redoFrame.property;
		else if(redoFrame instanceof UndoManager.SetEventEvent)
			app.root.fields.redoAction = 'change '+redoFrame.name;
		else if(redoFrame instanceof UndoManager.SetMethodEvent)
			app.root.fields.redoAction = 'change '+redoFrame.name;
		else if(redoFrame instanceof UndoManager.CompoundEvent)
			app.root.fields.redoAction = redoFrame.list.length+' changes';

		app.apply();
	}

	function sortChildren(nodeId)
	{
		var parent = app.root.fields.nodes[nodeId];

		if(parent)
		{
			parent.children.sort(function(a,b)
			{
				a = app.root.fields.nodes[a];
				b = app.root.fields.nodes[b];

				if( !b || !b.name && a.name || a.name && a.name.toLowerCase() < b.name.toLowerCase() )
					return -1;
				else if( !a || !a.name && b.name || b.name && b.name.toLowerCase() < a.name.toLowerCase() )
					return 1;
				else
					return 0;
			});
		}
	}

	function getSelectedNodeChildren(arr){
		var fields = app.root.fields;
		var nodes = fields.nodes;

		if(!arr){
			fields.selectedNodeChildren.length = 0;

			var id = fields.selectedNode.id;
			arr = fields.nodes[id].children;
		}

		for(var i = 0; i < arr.length; i++){
			var node = nodes[arr[i]];

			//Only add to array and descend if this node is a modifier or behavior
			if( _hasPrototype(node.id, 'http-vwf-example-com-behavior-vwf') ||
			    vwf.getProperty(node.id, 'isModifier') === true ) {

				node.properties = vwf.getProperties(node.id);
				fields.selectedNodeChildren.push(node);

				if(nodes[arr[i]] && nodes[arr[i]].children)
					getSelectedNodeChildren(nodes[arr[i]].children);
			}
		}
	}

	//Private function used exclusively by getSelectedNodeChildren
	function _hasPrototype(id, prototype) {
        if (!id) return false;
        if (id == prototype) return true;
        else return _hasPrototype(vwf.prototype(id), prototype);
    }

	app.createdMethod = function(id, name, params, body)
	{
		if( app.root.fields.selectedNode && id === app.root.fields.selectedNode.id ){
			app.root.fields.selectedNode.methods[name] = {
				parameters: params,
				body: body
			};
			this.apply()
		}
	}

	app.deletedMethod = function(id, name)
	{
		if( app.root.fields.selectedNode && id === app.root.fields.selectedNode.id ){
			delete app.root.fields.selectedNode.methods[name];
			this.apply()
		}
	}

	app.createdEvent = function(id, name, params, body)
	{
		if( app.root.fields.selectedNode && id === app.root.fields.selectedNode.id ){
			app.root.fields.selectedNode.events[name] = {
				parameters: params,
				body: body
			};
			this.apply()
		}
	}

	app.deletedEvent = function(id, name){
		if( app.root.fields.selectedNode && id === app.root.fields.selectedNode.id ){
			delete app.root.fields.selectedNode.events[name];
			this.apply()
		}
	}


	app.initializedProperty = app.createdProperty = app.satProperty = function(id, prop, val)
	{
		var apply = false;
		var fields =  app.root.fields;
		var selectedNode = fields.selectedNode;

		if( id === 'index-vwf' && prop === 'playMode' ){
			playing = val === 'play';
			if( !playing ) apply = true;
			if(!_DataManager.getInstanceData().publishSettings.allowPlayPause)
				apply = true;
		}

		if( selectedNode && id === selectedNode.id )
		{
			// See issue #267 on Github for why this change is necessary
			var property = selectedNode.properties[prop];
			if(Array.isArray(property) && Array.isArray(val) && val.length < 32){
				for(var i = 0; i < val.length; i++){
					if(property[i] !== val[i]){
						property[i] = val[i];
						apply = true;
					}
				}
			}
			else{
				selectedNode.properties[prop] = val;
				apply = true;
			}
		}

		// if this node is a child of the selected node...
		else if(fields.selectedNodeChildren.indexOf(fields.nodes[id]) > -1){
			fields.nodes[id].properties[prop] = val;
			apply = true;
		}

		if(prop === 'DisplayName')
		{
			app.root.fields.nodes[id].name = val;

			// name has just been set, so update position in parent's children array
			sortChildren( app.root.fields.nodes[id].parent );

			apply = true;
		}
		else if( prop === 'type' ){
			app.root.fields.nodes[id].typeProp = val;
			apply = true;
		}

		// do as INFREQUENTLY as possible, pretty expensive
		if(apply) this.apply()
	}

	app.createdNode = function(parentId, newId, newExtends, newImplements, newSource, newType)
	{
		
		if( newId === 'http-vwf-example-com-camera-vwf-camera' ) return;

		var node = app.root.fields.nodes[newId] = {};
		node.id = newId;
		node.prototype = newExtends;
		node.continues = vwf.getNode(newId).continues;
		node.subtype = newType;
		node.name = newId;
		node.children = [];

		if( parentId ){
			node.parent = parentId;
			app.root.fields.nodes[parentId].children.push(newId);
			sortChildren( parentId );
		}

		if(newExtends === 'SandboxCamera-vwf')
			app.root.fields.cameras.push(newId);

		if(app.root.fields.selectedNode)
			getSelectedNodeChildren();

		this.apply()
	}

	/*app.initializedNode = function(nodeId)
	{
		if(app.root.fields.nodes[nodeId]){
			console.log('Initialized', nodeId);
			app.root.fields.nodes[nodeId].childrenBound = true;
			this.apply()
		}
	}*/

	app.deletedNode = function(nodeId)
	{
		var node = app.root.fields.nodes[nodeId];
		if(!node) return;
		var parent = app.root.fields.nodes[node.parent];

		for(var i=0; i<parent.children.length; i++){
			if( parent && parent.children[i] === node.id ){
				parent.children.splice(i, 1);
				break;
			}
		}

		delete app.root.fields.nodes[nodeId];

		if( app.root.fields.cameras.indexOf(nodeId) > -1 )
			app.root.fields.cameras.splice( app.root.fields.cameras.indexOf(nodeId), 1 );

		//not sure what this is doing, but the node is gone at this point, you cant get the children
		//if(app.root.fields.selectedNode)
		//	getSelectedNodeChildren();

		this.apply();
	}

	return app;
});
