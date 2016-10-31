'use strict';

define(['vwf/view/editorview/angular-app', 'vwf/view/editorview/SidePanel', 'vwf/view/editorview/manageAssets'], function(app, SidePanel)
{
	app.directive('treeNode', ['$compile','$timeout', function($compile, $timeout)
	{
		var template = $('#hierarchyManager #hierarchyNodeTemplate').html();

		return {
			restrict: 'E',
			scope: true,
			link: function($scope, elem, attrs)
			{
				$scope.label = attrs.label;
				$scope.node = {};

				if( attrs.nodeId )
				{
					$scope.$watch('fields.nodes["'+attrs.nodeId+'"]', function(newval){
						if(newval){
							$scope.node = $scope.vwfNode = newval;
							var threeMap = $scope.getThreeDescendants($scope.node);
							if( threeMap )
								$scope.node.threeMap = $scope.threeMap = threeMap;
						}
					});
				}
				else if( attrs.threeId )
				{
					$scope.node = $scope.threeMap[attrs.threeId];
				}

				$scope.isSearchResult = function(nodeId)
				{
					function inherits(prototype, className){
						if(prototype === className)
							return true;
						else if(!prototype)
							return false;
						else
							return inherits(Engine.prototype(prototype), className);
					}

					var node = $scope.fields.nodes[nodeId];
					return (!$scope.filter.text || node && node.name && node.name.toLowerCase().indexOf($scope.filter.text.toLowerCase()) > -1)
						&& (!$scope.filter.type || node && (inherits(node.prototype, $scope.filter.type) || $scope.filter.type === 'modifier' && node.typeProp === 'modifier'));
				}

				$scope.isSearchResultAncestor = function(nodeId)
				{
					if( $scope.filter.text || $scope.filter.type )
						return $scope.fields.nodes[nodeId] && $scope.fields.nodes[nodeId].children.reduce(
							function(oldResult, childId){
								return oldResult || $scope.isSearchResult(childId) || $scope.isSearchResultAncestor(childId);
							},
							false
						);
					else
						return $scope.open();
				}

				var cancel = null;
				$scope.$watch('filter.text || filter.type', function(newval)
				{
					if(cancel) $timeout.cancel(cancel);

					cancel = $timeout(function()
					{
						var isAncestor = $scope.isSearchResultAncestor($scope.node.id);
						var isResult = $scope.isSearchResult($scope.node.id);

						elem.toggleClass('hidden', !isAncestor && !isResult);
						if( newval && isAncestor )
							elem.removeClass('collapsed');
					}, 200);
				});

			}
		};
	}]);

	app.directive('treeNodeUnified', ['$interpolate', '$compile', function($interpolate, $compile)
	{
		var templateBase = $('#hierarchyManager #hierarchyNodeUnifiedTemplate').html();

		return {
			restrict: 'E',
			scope: false,
			link: function($scope, elem, attrs)
			{
				if(attrs.nodeId){
					$scope.buildThreeDescendants(attrs.nodeId);
				}

				function updateIcon(forceArrow)
				{
					var classes = ['hierarchyicon', 'glyphicon'];

					if(!forceArrow && $('ul li', $(elem)).length === 0)
						classes.push('glyphicon-ban-circle');

					else if(!$(elem).hasClass('collapsed'))
						classes.push('glyphicon-triangle-bottom');

					else
						classes.push('glyphicon-triangle-right');

					$(elem).children('.hierarchyicon').attr('class', classes.join(' '));
					//attrs.$set('class', classes.join(' '));
				}

				$scope.toggleCollapse = function()
				{
					if( $(elem).hasClass('collapsed') )
						$(elem).removeClass('collapsed');
					else
						$(elem).addClass('collapsed');

					updateIcon();
				};


				var template = templateBase.replace(/\[\[(\w+?)\]\]/g, function(match, attrName){
					return attrs[attrName] || "";
				});

				elem.html('').append($compile(template)($scope));

				if(attrs.nodeId){
					$scope.$watchCollection('fields.nodes["'+attrs.nodeId+'"].children', function(newval){
						updateIcon();
					});
				}
				else if(attrs.threeId && attrs.assetRoot){
					updateIcon($scope.threeMaps[attrs.assetRoot].map[attrs.threeId].children.length);
				}
			}
		};
	}]);


	app.controller('HierarchyController', ['$scope', function($scope)
	{
		window._HierarchyManager = $scope;

		$scope.selectedThreeNode = null;
		var selectionBounds = null;

		$scope.filter = {
			text: '',
			type: 'any'
		};



		/***********************************************
		 * Three.js Node Handling/detection
		 ***********************************************/

		$scope.threeMaps = {};

		$scope.buildThreeDescendants = function(nodeId)
		{
			var threenode = _Editor.findviewnode(nodeId);
			var node = $scope.fields.nodes[nodeId];
			if(threenode)
				node.threeId = threenode.uuid;

			if( node && node.prototype === 'asset-vwf' && threenode )
			{
				if(node.subtype !== 'link_existing/threejs')
				{
					var threeMap = {'root': threenode.uuid};
					buildTree(threenode);
					$scope.threeMaps[nodeId] = threeMap[threenode.uuid];
				}
				else if($scope.threeMaps[node.parent]){
					$scope.threeMaps[nodeId] = $scope.threeMaps[node.parent].map[threenode.uuid];
				}
			}

			function buildTree(threenode)
			{
				var id = threenode.uuid;
				threeMap[threenode.uuid] = {
					id: threenode.uuid,
					name: threenode.name,
					prototype: 'threejs_node',
					children: [],

					node: threenode,
					map: threeMap
				};
				
				for(var i=0; i<threenode.children.length; i++)
				{
					var childnode = threenode.children[i];
					threeMap[id].children.push( childnode.uuid );
					buildTree(childnode);
					threeMap[childnode.uuid].parent = id;
				}

				threeMap[id].children.sort(function(a,b)
				{
					a = threeMap[a];
					b = threeMap[b];

					if( !b || !b.name && a.name || a.name.toLowerCase() < b.name.toLowerCase() )
						return -1;
					else if( !a || !a.name && b.name || b.name.toLowerCase() < a.name.toLowerCase() )
						return 1;
					else
						return 0;
				});
			}
		}
		
		$scope.isThreeNodeBound = function(threeId, ancestorVwfId)
		{
			var vwfNode = $scope.fields.nodes[ancestorVwfId];
			for(var i=0; i<vwfNode.children.length; i++)
			{
				var vwfChild = $scope.fields.nodes[vwfNode.children[i]];
				if( vwfChild.threeId && threeId && vwfChild.threeId === threeId )
					return true;
			}
			return false;
		}

		$scope.hasUnboundThreeChild = function(vwfId)
		{
			var threeNode = $scope.threeMaps[vwfId];

			for(var i=0; threeNode && i<threeNode.children.length; i++){
				if( !$scope.isThreeNodeBound(threeNode.children[i], vwfId) )
					return true;
			}
			return false;
		}



		/***********************************************
		 * Miscellaneous Utilities
		 ***********************************************/

		// open path to selected node on selection
		$scope.$watch('fields.selectedNode', function(newval)
		{
			if( newval )
			{
				$scope.selectedThreeNode = null;

				if( !_SidePanel.isTabOpen('hierarchyManager') )
					$('#hierarchyDisplay tree-node-unified[node-id="'+newval.id+'"]').parents('tree-node-unified:not(.collapsed)').addClass('collapsed');

				// open ancestor nodes
				$('#hierarchyDisplay tree-node-unified[node-id="'+newval.id+'"]').parents('tree-node-unified.collapsed').removeClass('collapsed');
			}
		});

		// apply box effect to selected three nodes
		$scope.$watch('selectedThreeNode', function(newval){
			if( newval )
				$scope.makeBounds(newval.node);
			else
				$scope.makeBounds();
		});

		$scope.select = function(nodeId, ancestorId, evt)
		{
			// vwf nodes
			if( $scope.fields.nodes[nodeId] )
			{
				$scope.selectedThreeNode = null;

				// new selection = 0, add = 2, subtract = 3
				if( !evt.ctrlKey )
				{
					_Editor.SelectObjectPublic(nodeId, 0);
				}
				else if( $scope.fields.selectedNodeIds.indexOf(nodeId) === -1 )
					_Editor.SelectObjectPublic(nodeId, 2);
				else
					_Editor.SelectObjectPublic(nodeId, 3);
			}

			// three.js nodes
			else if( $scope.threeMaps[ancestorId].map[nodeId] && $scope.fields.nodes[ancestorId].threeId !== nodeId )
			{
				_Editor.SelectObject();

				var node = $scope.threeMaps[ancestorId].map[nodeId];

				if( $scope.selectedThreeNode !== node ){
					$scope.selectedThreeNode = node;
				}
				else {
					$scope.selectedThreeNode = null;
				}
			}
		}

		$scope.focusNode = function(nodeId)
		{
			if(nodeId){
				_Editor.focusSelected();
			}
		}

		$scope.handleKeyPress = function(evt)
		{
			evt.preventDefault();

			var curNode = $scope.fields.selectedNode && $scope.fields.nodes[$scope.fields.selectedNode.id]
				|| $scope.selectedThreeNode || null;
			var threeMap = curNode.map || null;
			var parent = $scope.fields.nodes[curNode.parent] || threeMap && threeMap[curNode.parent] || null;

			// delete selection on del key
			if( /^Del/.test(evt.key) || evt.which === 46 ){
				_Editor.DeleteSelection();
			}
			else if( /^Esc/.test(evt.key) || evt.which === 27 ){
				_Editor.SelectObject();
			}
			else if( 'Space' === evt.key || evt.which === 32 ){
				$('#hierarchyDisplay .selected').closest('tree-node-unified').toggleClass('collapsed');
			}

			// select previous sibling
			else if( 'ArrowUp' === evt.key || evt.which === 38 )
			{
				if( $scope.fields.selectedNode )
				{
					var previousSiblingId = parent ? parent.children[ parent.children.indexOf(curNode.id)-1 ] : null;

					if(previousSiblingId)
						_Editor.SelectObject(previousSiblingId);
				}
				else if( $scope.selectedThreeNode )
				{
					var previousSiblingId = parent ? parent.children[ parent.children.indexOf(curNode.id)-1 ] : null;
					while( previousSiblingId && threeMap[previousSiblingId].node.vwfID )
						previousSiblingId = parent.children[ parent.children.indexOf(previousSiblingId)-1 ];

					if(previousSiblingId)
						$scope.selectedThreeNode = threeMap[previousSiblingId];

					// transition from three.js to vwf nodes
					else if(curNode.node.vwfID && $scope.fields.nodes[curNode.node.vwfID].children.length > 0){
						$scope.selectedThreeNode = null;
						var vwfSiblings = $scope.fields.nodes[curNode.node.vwfID].children;
						_Editor.SelectObject(vwfSiblings[vwfSiblings.length-1]);
					}
				}
			}

			// select next sibling
			else if( 'ArrowDown' === evt.key || evt.which === 40 )
			{
				if( $scope.fields.selectedNode )
				{
					var nextSiblingId = parent ? parent.children[ parent.children.indexOf(curNode.id)+1 ] : null;

					if(nextSiblingId)
						_Editor.SelectObject(nextSiblingId);

					// transition from vwf nodes to three nodes
					else if(parent && parent.threeMap){
						_Editor.SelectObject();
						$scope.selectedThreeNode = parent.threeMap[parent.threeId];
					}
				}
				else if( $scope.selectedThreeNode )
				{
					var nextSiblingId = parent ? parent.children[ parent.children.indexOf(curNode.id)+1 ] : null;
					while( nextSiblingId && threeMap[nextSiblingId].node.vwfID )
						nextSiblingId = parent.children[ parent.children.indexOf(nextSiblingId)+1 ];

					if(nextSiblingId)
						$scope.selectedThreeNode = threeMap[nextSiblingId];
				}
			}

			// select parent
			else if( 'ArrowLeft' === evt.key || evt.which === 37 )
			{
				$('#hierarchyDisplay .selected').closest('tree-node-unified').addClass('collapsed');

				if( $scope.fields.selectedNode && parent)
				{
					_Editor.SelectObject(parent.id);
				}
				else if( $scope.selectedThreeNode )
				{
					if( parent )
						$scope.selectedThreeNode = parent;
					else if( curNode.node.vwfID ){
						$scope.selectedThreeNode = null;
						_Editor.SelectObject(curNode.node.vwfID);
					}
				}
			}

			// select first child
			else if( 'ArrowRight' === evt.key || evt.which === 39 )
			{
				$('#hierarchyDisplay .selected').closest('tree-node-unified').removeClass('collapsed');

				if( $scope.fields.selectedNode )
				{
					if( curNode.children[0] ){
						_Editor.SelectObject(curNode.children[0]);
					}
					else if( curNode.threeMap ){
						_Editor.SelectObject();
						$scope.selectedThreeNode = threeMap[curNode.threeId];
					}
				}
				else if( $scope.selectedThreeNode )
				{
					for(var i=0; i<curNode.children.length && threeMap[curNode.children[i]].node.vwfID; i++);
					if( curNode.children[i] ){
						$scope.selectedThreeNode = threeMap[curNode.children[i]];
					}
				}
			}
		}

		$scope.makeBounds = function(node)
		{
			if(node)
			{	
				_RenderManager.removeHilightObject(selectionBounds);
				_RenderManager.addHilightObject(node);
				selectionBounds = node;
			}
			else if( selectionBounds != null )
			{
				_RenderManager.removeHilightObject(selectionBounds);
				selectionBounds = null;
			}
		}

		$scope.makeVWFNode = function()
		{
			function getDescendantVWFNodes(threeNode)
			{
				var ret = [];
				for(var i=0; i<threeNode.children.length; i++)
				{
					if( threeNode.children[i].vwfID ){
						ret.push( threeNode.children[i].vwfID );
					}
					else {
						Array.prototype.push.apply(ret, getDescendantVWFNodes(threeNode.children[i]));
					}
				}

				return ret;
			}

			function reparentTo(nodeId, parentId)
			{
				var val = Engine.getNode(nodeId);

				_UndoManager.startCompoundEvent();

				_UndoManager.recordDelete(nodeId);
				vwf_view.kernel.deleteNode(nodeId);

				_UndoManager.recordCreate(parentId, nodeId, val);
				vwf_view.kernel.createChild(parentId, nodeId, val);

				_UndoManager.stopCompoundEvent();
			}

			if($scope.selectedThreeNode)
			{
				var node = $scope.selectedThreeNode.node;
				var childname = node.name || node.uuid;
				var mat = new THREE.Matrix4();
				mat.copy( node.matrix );

				var parent = node;
				while( !parent.vwfID && parent.id !== 'index-vwf' ){
					parent = parent.parent;
				}
				var parentId = parent.vwfID;

				var proto = {
					extends: 'asset.vwf',
					type: "link_existing/threejs",
					source: childname,
					properties: {
						owner: document.PlayerNumber,
						type: '3DR Object',
						DisplayName: childname,
						transform: mat.elements
					}
				};
				var newname = GUID();

				_UndoManager.startCompoundEvent();

				_UndoManager.recordCreate(parentId, newname, proto);
				vwf_view.kernel.createChild(parentId, newname, proto, null);

				var nodeName = 'asset-vwf-'+newname;
				var deregister = $scope.$watch('fields.nodes["'+nodeName+'"]', function(newval)
				{
					if(newval)
					{
						deregister();

						// check for siblings that should be children
						var toBeMoved = getDescendantVWFNodes(node);
						for(var i=0; i<toBeMoved.length; i++){
							reparentTo(toBeMoved[i], nodeName);
						}

						_UndoManager.stopCompoundEvent();
					}
				});

				_Editor.SelectOnNextCreate([newname]);
			}
		}

	}]);


	app.directive('customSelect', function()
	{
		return {
			restrict: 'E',
			scope: {
				selected: '=model'
			},
			link: function($scope, elem, attrs)
			{
				var options = {};
				var optionsInOrder = $('.menu', elem).children();

				$scope.selected = optionsInOrder.attr('value');

				for(var i=0; i<optionsInOrder.length; i++){
					options[ $(optionsInOrder[i]).attr('value') ] = $(optionsInOrder[i]);
				}

				$scope.$watch('selected', function(newval, oldval)
				{
					options[oldval].removeClass('selected');
					$('.selectedOption', elem).html( options[newval].clone() );
					options[newval].addClass('selected');
				});

				$('.selectedOption', elem).click(function(){
					elem.addClass('expanded');
				});

				optionsInOrder.click(function(evt)
				{
					$scope.selected = $(this).attr('value');
					elem.removeClass('expanded');
					$scope.$apply();
				});
			}
		};
	});

	app.directive('scrollFixed', function()
	{
		return {
			restrict: 'A',
			scope: {
				fixedProps: '@scrollFixed'
			},
			link: function($scope, elem, attrs)
			{
				$scope.fixedProps = $scope.fixedProps.split(' ');

				var initialVals = {};
				for(var i=0; i<$scope.fixedProps.length; i++){
					var propName = $scope.fixedProps[i];
					initialVals[propName] = parseInt(elem[0].style[propName]) || 0;
				}

				var parent = elem.parent()[0];
				elem.parent().scroll(function(evt)
				{
					if( initialVals.top !== undefined ){
						elem[0].style.top = (parent.scrollTop + initialVals.top) + 'px';
					}
					if( initialVals.bottom !== undefined ){
						elem[0].style.bottom = (-parent.scrollTop + initialVals.bottom) + 'px';
					}
					if( initialVals.left !== undefined ){
						elem[0].style.left = (parent.scrollLeft + initialVals.left) + 'px';
					}
					if( initialVals.right !== undefined ){
						elem[0].style.right = (-parent.scrollLeft + initialVals.right) + 'px';
					}
				});
			}
		};
	});


	return window._HierarchyManager;
});

