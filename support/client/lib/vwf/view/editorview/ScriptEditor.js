'use strict';

define(['vwf/view/editorview/angular-app', 'vwf/view/editorview/HierarchyManager', './ScriptEditorAutocomplete','./lib/ace/ace.js'], function(app)
{
	//$(document.head).append('<script src="../vwf/view/editorview/lib/ace/ace.js" type="text/javascript" charset="utf-8"></script>');

	var methodSuggestions = [
		{
			name: 'attached',
			value: {
				parameters: [],
				body: [
					"// attached is called when the object is hooked up to the scene.",
					"// Note that this happens after initialize. At this point, you can access the objects parent."
				].join('\n')
			}
		}, {
			name: 'collision',
			value: {
				parameters: ['obstacle', 'data'],
				body: '// The body has collided with another body. The ID of the node is param 1, collision data in param 2'
			}
		}, {
			name: 'deinitialize',
			value: {
				parameters: [],
				body: [
					"// Deinitialize is called when the object is being destroyed.",
					"// Clean up here if your object allocated any resources manually during initialize."
				].join('\n')
			}
		}, {
			name: 'initialize',
			value: {
				parameters: [],
				body: [
					"// Initialize is called when the node is constructed.",
					"// Write code here to setup the object, or hook up event handlers.",
					"// Note that the object is not yet hooked into the scene - that will happen during the 'Added' event.",
					"// You cannot access this.parent in this function."
				].join('\n')
			}
		}, {
			name: 'prerender',
			value: {
				parameters: [],
				body: [
					"// This function is called at every frame. Don't animate object properties here - that can break syncronization.",
					"// This can happen because each user might have a different framerate.",
					"// Most of the time, you should probably be using Tick instead."
				].join('\n')
			}
		}, {
			name: 'ready',
			value: {
				parameters: [],
				body: '// The scene is now completely loaded. This will fire on each client when the client joins, so it`s not a great place to create objects'
			}
		}, {
			name: 'tick',
			value: {
				parameters: [],
				body: [
					"// The tick function is called 20 times every second.",
					"// Write code here to animate over time"
				].join('\n')
			}
		}
	];

	var eventSuggestions = [
		{
			name: 'pointerClick',
			value: {
				parameters: ['eventData','nodeData'],
				body: 'console.log("got here");'
			}
		},
		{
			name: 'pointerDown',
			value: {
				parameters: ['eventData','nodeData'],
				body: 'console.log("got here");'
			}
		},
		{
			name: 'pointerMove',
			value: {
				parameters: ['eventData','nodeData'],
				body: 'console.log("got here");'
			}
		},
		{
			name: 'pointerOut',
			value: {
				parameters: ['eventData','nodeData'],
				body: 'console.log("got here");'
			}
		},
		{
			name: 'pointerOver',
			value: {
				parameters: ['eventData','nodeData'],
				body: 'console.log("got here");'
			}
		},
		{
			name: 'pointerUp',
			value: {
				parameters: ['eventData','nodeData'],
				body: 'console.log("got here");'
			}
		},
		{
			name: 'pointerWheel',
			value: {
				parameters: ['eventData','nodeData'],
				body: 'console.log("got here");'
			}
		},
	];

	/*****************************************************************************
	 * aceCodeEditor directive
	 * All of the text editor code is here
	 ****************************************************************************/

	app.directive('aceCodeEditor', ['ScriptEditorAutocomplete', function(AC)
	{
		return {
			restrict: 'E',
			scope: true,
			template: '<pre></pre>',
			link: function($scope,elem,attrs)
			{
				console.error(elem);
				var editor = ace.edit(elem.children()[0]);



				editor.setTheme("ace/theme/monokai");
				editor.setShowPrintMargin(false);
				editor.resize();
				elem[0]._editor = editor;
				_ScriptEditor._editor = editor;

				$scope.$watch(attrs.disabled, function(newval){
					editor.setReadOnly(!!newval);
					$('.ace_content', elem).css('opacity', newval ? 0.3 : 1);
				});

				$(document).on('viewportresize', function(e){
					editor.resize();
				});

				editor.on('change', function(){
					$scope.dirty[$scope.selectedField.id] = true;
					$scope.$emit('codeChanged');
					$scope.$apply();
				});


				var autocomplete = AC.initialize(editor);

				$scope.sessions = {};
				function cleanScopes()
				{
					for(var i in $scope.sessions)
					{
						if(!$scope.dirty[i])
							if($scope.sessions[i])
							{
								$scope.sessions[i].destroy();
								delete $scope.sessions[i];
							}
					}
				}
				$scope.$watchGroup(['selectedField','dirty[selectedField.id]'], function(newvals)
				{


					if(newvals[0])
					{
						if( !$scope.sessions[newvals[0].id] || !newvals[1] )
							regenerateBody(newvals[0]);

						editor.setSession( $scope.sessions[newvals[0].id] );
						editor.clearSelection();
					}
					else {
						editor.setSession( ace.createEditSession('') );
					}
				});

				function regenerateBody(item)
				{
					var newBody = '';
					if( /^(methods|events)$/.test($scope.guiState.openTab) ){
						var fullBody = 'function '+item.name+'('+item.value.parameters.join(',')+')\n'
							+'{\n'
							+item.value.body
							+'\n}';
						newBody = $.trim(js_beautify(fullBody, {
							max_preserve_newlines: 2,
							braces_on_own_line: true,
							opt_keep_array_indentation: true
						}));
					}
					else if( $scope.guiState.openTab === 'properties' ){

						if (item.name.indexOf('ohm') !== -1) {
							newBody = item.value;
						} else { 
							newBody = angular.toJson(item.value, 4); 
						}
					}
					if($scope.sessions[item.id])
					{

						var oldSession = $scope.sessions[item.id];
						oldSession.destroy();
					}
					cleanScopes();
					$scope.sessions[item.id] = ace.createEditSession(newBody);

					if( $scope.guiState.openTab === 'properties' )
						$scope.sessions[item.id].setMode("ace/mode/json");
					else
						$scope.sessions[item.id].setMode("ace/mode/javascript");

					$scope.sessions[item.id].on('changeAnnotation', function(a, b){
						// this thing is undocumented, god only knows if it'll keep working
						$scope.$emit('codeLinted', b.$annotations);
					});
				}

				$('textarea.ace_text-input', elem).keydown(function(e)
				{
					
					// implement ctrl-s to save
					if((e.key === 's' || e.which == 83) && e.ctrlKey == true)
					{
						e.preventDefault();
						$scope.save();
					}

					// trigger autocomplete
					else if(e.which == 32 && e.ctrlKey == true)
					{
						e.preventDefault();


						//Don't show for lines that have ( or ) (other than the one that triggered the autocomplete) because function calls
						//might have side effects

						autocomplete.autoComplete(editor, true);

					}

				});

			}
		};
	}]);

	/***************************************************************************
	 * ScriptEditorController
	 * All the business logic, and some of the presentation logic, used to
	 * drive the script editor is found here.
	 **************************************************************************/

	app.controller('ScriptEditorController', ['$scope','$timeout', function($scope, $timeout)
	{
		/*
		 * All variables specific to this scope
		 *
		 */

		window._ScriptEditor = $scope;

		$scope.guiState = {
			openTab: 'methods',
			showHiddenProperties: false,
			inheritPrototype: false
		};

		$scope.dirty = {};

		var methodsDirty = false, eventsDirty = false, propertiesDirty = false, timeoutSet = false;

		$scope.methodList = [];
		$scope.methodList.selected = '';
		$scope.eventList = [];
		$scope.eventList.selected = '';
		$scope.propertyList = [];
		$scope.propertyList.selected = '';

		$scope.currentList = [];

		/*
		 * All watchers, most of them synchronizing derived values
		 *
		 * Summary of relevant root-scope values:
		 * 	fields.selectedNode:
		 * 		The selected VWF editor node, as determined by _Editor.GetSelectedVWFNode(), and as updated by
		 * 		the 'selectionChanged' event and the VWF events created/deletedMethod, created/deletedEvent,
		 * 		initialized/created/satProperty
		 *
		 * Summary of derived values:
		 *	methodList:
		 *		A sorted array version of fields.selectedNode.methods, with an additional 'selected' property
		 *	eventList:
		 *		A sorted array version of fields.selectedNode.events, with an additional 'selected' property
		 *	propertyList:
		 *		A sorted array version of fields.selectedNode.properties, with an additional 'selected' property
		 * 	currentList:
		 * 		Either methodList, eventList, or propertyList, as determined by the currently open tab
		 *	currentSuggestions:
		 *		A sorted list of pseudo-methods/events. Used for the grey items in the method/event list
		 *	selectedField:
		 *		The method, event, or property currently being viewed/edited, as determined by currentList.selected
		 */

		$scope.$watchGroup(['guiState.openTab','methodList','eventList','propertyList'], function(newvals)
		{
			switch(newvals[0])
			{
				case 'methods':
					$scope.currentList = newvals[1];
					$scope.currentSuggestions = methodSuggestions;
				break;

				case 'events':
					$scope.currentList = newvals[2];
					$scope.currentSuggestions = eventSuggestions;
				break;

				case 'properties':
					$scope.currentList = newvals[3];
					$scope.currentSuggestions = [];
				break;

				default:
					$scope.currentList = [];
					$scope.currentList.selected = '';
					$scope.currentSuggestions = [];
				break;
			}
		});

		$scope.$watchGroup(['currentList','currentList.selected'], function(newvals)
		{
			if( newvals[0] )
			{
				$scope.selectedField =
					newvals[0].reduce(function(old,cur){ return cur.name === newvals[1] ? cur : old; }, null)
					||
					$scope.currentSuggestions.reduce(function(old,cur){ return cur.name === newvals[1] ? cur : old; }, null);

				if( $scope.selectedField && !$scope.selectedField.id ){
					$scope.selectedField.id = [$scope.fields.selectedNode.id, $scope.guiState.openTab, newvals[1]].join('_');
				}
				$scope.checkingSyntax = false;
			}
			else {
				$scope.selectedField = null;
			}
		});

		$scope.$watch('fields.selectedNode', function(){
			$scope.methodList.selected = $scope.eventList.selected = $scope.propertyList.selected = null;
		});

		$scope.$watch('guiState.inheritPrototype', function(newval){
			propertiesDirty = true;
			$scope.rebuildLists();
		});

		$scope.$watchCollection('fields.selectedNode.methods', function(){
			methodsDirty = true;
			if(!timeoutSet){
				timeoutSet = $timeout(function(){
					$scope.rebuildLists();
					methodsDirty = eventsDirty = propertiesDirty = timeoutSet = false;
				});
			}
		});

		$scope.$watchCollection('fields.selectedNode.events', function(){
			eventsDirty = true;
			if(!timeoutSet){
				timeoutSet = $timeout(function(){
					$scope.rebuildLists();
					methodsDirty = eventsDirty = propertiesDirty = timeoutSet = false;
				});
			}
		});

		$scope.$watch('fields.selectedNode.properties', function(){
			propertiesDirty = true;
			if(!timeoutSet){
				timeoutSet = $timeout(function(){
					$scope.rebuildLists();
					methodsDirty = eventsDirty = propertiesDirty = timeoutSet = false;
				});
			}
		}, true);

		// Life would be easier if currentList could be an object, but alas.
		// This function does a name lookup on the given list.
		$scope.hasField = function(name, list){
			return list.reduce(
				function(old,val){ return old || val.name === name; },
				false
			);
		}

		$scope.hasFieldFilter = function(item){
			return !$scope.hasField(item.name, $scope.currentList);
		}

		// This method regenerates the field lists as needed from the selected node's
		// "methods", "events", and "properties" objects. Used by the watchers of those
		// objects above
		$scope.rebuildLists = function()
		{
			var oldMethods = $scope.methodList,
				oldEvents = $scope.eventList,
				oldProperties = $scope.propertyList;

			if( methodsDirty ){
				$scope.methodList = [];
				$scope.methodList.selected = oldMethods.selected;
			}

			if( eventsDirty ){
				$scope.eventList = [];
				$scope.eventList.selected = oldEvents.selected;
			}

			if( propertiesDirty ){
				$scope.propertyList = [];
				$scope.propertyList.selected = oldProperties.selected;
			}

			/*if( !$scope.fields.selectedNode ){
				$scope.guiState.openTab = '';
				return;
			}
			else if( !$scope.guiState.openTab ){
				$scope.guiState.openTab = 'methods';
			}*/

			// populate lists
			var curNode = $scope.fields.selectedNode;
			while(curNode)
			{
				if( methodsDirty ){
					for(var i in curNode.methods){
						if( !$scope.hasField(i, $scope.methodList) )
							$scope.methodList.push({'name': i, 'id': curNode.id+'_methods_'+i, 'value': curNode.methods[i]});
					}
				}

				if( eventsDirty ){
					for(var i in curNode.events){
						if( !$scope.hasField(i, $scope.eventList) )
							$scope.eventList.push({'name': i, 'id': curNode.id+'_events_'+i, 'value': curNode.events[i]});
					}
				}

				if( propertiesDirty ){
					for(var i in curNode.properties){
						if( !$scope.hasField(i, $scope.propertyList) )
							$scope.propertyList.push({'name': i, 'id': curNode.id+'_properties_'+i, 'value': curNode.properties[i]});
					}
				}

				if($scope.guiState.inheritPrototype)
					curNode = _Editor.getNode(Engine.prototype(curNode.id), true);
				else
					break;
			}

			function sortByName(a,b){
				return a.name > b.name ? 1 : -1;
			};
			$scope.methodList.sort(sortByName);
			$scope.eventList.sort(sortByName);
			$scope.propertyList.sort(sortByName);

		}

		// simple string formatting
		$scope.getSingular = function(tabname)
		{
			switch(tabname){
				case 'methods': return 'Method';
				case 'events': return 'Event';
				case 'properties': return 'Property';
				default: return 'Method';
			}
		}

		// determine if the session is capable of editing scripts
		function checkPermission()
		{
			if (!_UserManager.GetCurrentUserName()) {
				_Notifier.notify('You must log in to edit scripts');
				return false;
			}

			if( !$scope.fields.selectedNode ){
				return false;
			}

			if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), $scope.fields.selectedNode.id) == 0) {
				_Notifier.notify('You do not have permission to script this object');
				return false;
			}
			return true;
		}

		// determine if Ace has detected any syntax errors in the current code window
		var annotations = null, checkerCb = null;
		$scope.$on('codeChanged', function(evt){
			annotations = null;
		});
		$scope.$on('codeLinted', function(evt, ann){
			annotations = ann;
			if(checkerCb) checkerCb();
		});

		$scope.checkSyntax = function(dialog, fromSave)
		{
			if(!annotations)
			{
				// postpone check until checker comes back
				checkerCb = function(){
					if(fromSave)
						$scope.save();
					else
						$scope.checkSyntax(dialog);
					checkerCb = null;
				}
				return false;
			}
			else
			{
				var editor = document.querySelector('ace-code-editor')._editor;
				var s = annotations;
				var fieldName = $.trim($scope.selectedField.name);
				var errors = "";
				for (var i = 0; i < s.length; i++) {
					if (s[i].type == 'error') errors += "<br/> line: " + s[i].row + "-" + s[i].text;
				}

				if (fieldName.indexOf('ohm') !== -1) {
					return true;
				}

				if (errors != "") {
					alertify.alert('This script contains syntax errors, and cannot be saved. The errors are: \n' + errors.toString());
					return false;
				}
				if(dialog){
					alertify.alert('This script contains no syntax errors.');
				}

				return true;
			}
		}

		// The 'Save Method/Event/Property' click handler
		$scope.save = function()
		{
			if( checkPermission() && $scope.checkSyntax(false, true) && $scope.dirty[$scope.selectedField.id] && $scope.fields.selectedNode.id !== 'index-vwf' )
			{
				var editor = document.querySelector('ace-code-editor')._editor;

				var fieldName = $.trim($scope.selectedField.name);
				var rawtext = editor.getValue();

				if( /^(?:methods|events)$/.test($scope.guiState.openTab) )
				{
					var params = rawtext.substring(rawtext.indexOf('(') + 1, rawtext.indexOf(')'));
					params = params.split(',');
					var cleanParams = [];

					for (var i = 0; i < params.length; i++) {
						params[i] = $.trim(params[i]);
						if (params[i] != '' && params[i] != null && params[i] !== undefined)
							cleanParams.push(params[i]);
					}

					var body = rawtext.substring(rawtext.indexOf('{') + 1, rawtext.lastIndexOf('}'));
					body = $.trim(body);

					if( $scope.guiState.openTab === 'methods' )
					{
						_UndoManager.pushEvent( new _UndoManager.SetMethodEvent($scope.fields.selectedNode.id, fieldName, {parameters: cleanParams, body: body}) );

						if( $scope.fields.selectedNode.methods && $scope.fields.selectedNode.methods[fieldName] ){
							vwf_view.kernel.deleteMethod($scope.fields.selectedNode.id, fieldName);
						}

						vwf_view.kernel.createMethod($scope.fields.selectedNode.id, fieldName, cleanParams, body);
					}
					else
					{
						_UndoManager.pushEvent( new _UndoManager.SetEventEvent($scope.fields.selectedNode.id, fieldName, {parameters: cleanParams, body: body}) );

						if( $scope.fields.selectedNode.events && $scope.fields.selectedNode.events[fieldName] ){
							vwf_view.kernel.deleteEvent($scope.fields.selectedNode.id, fieldName);
						}

						vwf_view.kernel.createEvent($scope.fields.selectedNode.id, fieldName, cleanParams, body);
					}
				}
				else if( $scope.guiState.openTab === 'properties' )
				{
					try {

						if (fieldName.indexOf('ohm') !== -1) {
							var val = rawtext;

						} else {

						var val = JSON.parse(rawtext);}
					}
					catch(e){
						val = rawtext;
					}

					_UndoManager.pushEvent( new _UndoManager.SetPropertyEvent($scope.fields.selectedNode.id, fieldName, val) );

					if( $scope.fields.selectedNode.properties && $scope.fields.selectedNode.properties[fieldName] !== undefined ){
						vwf_view.kernel.setProperty($scope.fields.selectedNode.id, fieldName, val);
					}
					else {
						vwf_view.kernel.createProperty($scope.fields.selectedNode.id, fieldName, val);
					}
				}

				//$timeout(function(){
					$scope.dirty[$scope.selectedField.id] = false;
				//});
			}
		}

		// The 'Discard Changes' click handler
		$scope.discard = function()
		{
			alertify.confirm('Are you SURE you want to discard your unsaved changes?', function(ok){
				if(ok){
					$scope.dirty[$scope.selectedField.id] = false;
					$scope.$apply();
				}
			});
		}

		// The 'Call Method/Event' click handler
		$scope.call = function()
		{
			var map = {
				'methods': vwf_view.kernel.callMethod.bind(vwf_view.kernel),
				'events': vwf_view.kernel.fireEvent.bind(vwf_view.kernel)
			};

			map[ $scope.guiState.openTab ]($scope.fields.selectedNode.id, $scope.currentList.selected);
		}

		// The 'Delete Method/Event' click handler
		$scope.delete = function()
		{
			if( checkPermission() )
			{
				var map = {
					'methods': vwf_view.kernel.deleteMethod.bind(vwf_view.kernel),
					'events': vwf_view.kernel.deleteEvent.bind(vwf_view.kernel)
				};

				alertify.confirm('Are you SURE you want to delete the "'+$scope.currentList.selected+'" '+$scope.getSingular($scope.guiState.openTab).toLowerCase()+'?',
					function(ok){
						if(ok){
							map[ $scope.guiState.openTab ]($scope.fields.selectedNode.id, $scope.currentList.selected);
							$scope.currentList.selected = '';
						}
					}
				);
			}
		}

		// The 'New Method/Event/Property' click handler
		$scope.new = function()
		{
			var idRE = /^\w+$/;
			var type = $scope.getSingular($scope.guiState.openTab).toLowerCase();
			if( checkPermission() )
			{
				alertify.prompt('What is the new '+type+' called?', function(e, name)
				{
					if( !idRE.test(name) ){
						alertify.alert('That name is invalid!');
					}
					else if( $scope.hasField(name, $scope.propertyList) ){
						alertify.alert('There is already a'+(type[0]==='e'?'n ':' ')+type+' by that name!');
					}
					else if( $scope.guiState.openTab === 'methods')
					{
						vwf_view.kernel.createMethod($scope.fields.selectedNode.id, name, [], 'console.log("got here");');
						$scope.methodList.selected = name;
					}
					else if( $scope.guiState.openTab === 'events')
					{
						vwf_view.kernel.createEvent($scope.fields.selectedNode.id, name, ['eventData','nodeData'], 'console.log("got here");');
						$scope.eventList.selected = name;
					}
					else if( $scope.guiState.openTab === 'properties' )
					{
						vwf_view.kernel.createProperty($scope.fields.selectedNode.id, name, '');
						$scope.propertyList.selected = name;
					}
				});
			}
		}


		var defaultSize = 14;
		$scope.fontSize = _SettingsManager.getKey('scriptEditorFontSize') || defaultSize;

		$scope.$watch('fontSize', function(newval){
			_SettingsManager.setKey('scriptEditorFontSize', newval);
			$('#ScriptEditor ace-code-editor pre').css('font-size', newval);
		});

		$scope.defaultFont = function(){
			$scope.fontSize = defaultSize;
		}

		$scope.increaseFont = function(){
			$scope.fontSize++;
		}

		$scope.decreaseFont = function(){
			$scope.fontSize--;
		}


		/*
		 * Manage the visibility state of the script editor
		 */

		$scope.isOpen = function(){
			return !! parseInt($('#ScriptEditor').css('height'));
		}

		$scope.show = function(){
			$('#ScriptEditor').removeClass('minimized');
		}
		$scope.hide = function(){
			if($scope.maximized){
				$scope.unmaximize();
			}
			$('#ScriptEditor').addClass('minimized');
		}

		$scope.maximized = false;
		$scope.maximize = function(){
			$('#vwf-root').hide();
			$('#ScriptEditor').addClass('maximized');

			try{
			var evt = new Event('viewportresize');
				document.dispatchEvent(evt);
			}catch(e)
			{
				$(document).trigger('viewportresize');
			}

			$scope.maximized = true;
		}
		$scope.unmaximize = function(){
			$('#vwf-root').show();
			$('#ScriptEditor').removeClass('maximized');

			try{
			var evt = new Event('viewportresize');
				document.dispatchEvent(evt);
			}catch(e)
			{
				$(document).trigger('viewportresize');
			}

			$scope.maximized = false;
		}

	}]);

	return {
		initialize: function()
		{

		}
	};
});
