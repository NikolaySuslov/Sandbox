define(function() {
	var HierarchyManager = {};
	var isInitialized = false;
	return {
		getSingleton: function() {
			if (!isInitialized) {

				
				var baseclass = require("vwf/view/editorview/panelEditor");
				//var base = new baseclass('hierarchyManager','Hierarchy','hierarchy',false,true,'#sidepanel')
				//base.init();
				//$.extend(HierarchyManager,base);
				baseclass(HierarchyManager,'hierarchyManager','Hierarchy','hierarchy',false,true,'#sidepanel')
				
				HierarchyManager.init()
				initialize.call(HierarchyManager);
				HierarchyManager.bind()
				isInitialized = true;
			}
			return HierarchyManager;
		}
	}

	function initialize() {
		var self = this;
		this.ready = false;
		
		//$('#' + this.contentID).append("<span>Filter: </span><input type='text' id='HeirarchyFilter' class=''></input>");
		$('#' + this.contentID).append("<div id='hierarchyDisplay' style=''></div>");
		$('#' + this.contentID).append("<div id='hierarchyManagerMakeNode'></div>");
		$('#' + this.contentID).append("<div id='hierarchyManagerSelect'></div>");
		$('#' + this.contentID).append("<div id='hierarchyManagerExplode'></div>");

		$('#HeirarchyFilter').keyup(function() {
			self.BuildGUI();
		});

		$('#hierarchyManagerMakeNode').button({
			label: 'Make VWF Node'
		});

		$('#hierarchyManagerMakeNode').hide();
		$('#hierarchyManagerExplode').button({
			label: 'Explode'
		});
		$('#hierarchyManagerExplode').hide();
		$('#hierarchyManagerSelect').button({
			label: 'Select'
		});
		$('#hierarchyManagerSelect').hide();
		
		$('#hierarchyManagertitle').prepend('<div class="headericon hierarchy" />');
		$('#' + this.contentID).css('border-bottom', '5px solid #444444')
		$('#' + this.contentID).css('border-left', '2px solid #444444')
		
		$('#hierarchyManagerMakeNode').click(function() {
			HierarchyManager.makeVWFNode()
		});
		$('#hierarchyManagerSelect').click(function() {
			HierarchyManager.select()
		});
		$('#hierarchyManagerExplode').click(function() {
			HierarchyManager.explode()
		});
		this.createChild = function(parent, name, proto, uri, callback) {
			if (_UserManager.GetCurrentUserName() == null) {
				_Notifier.notify('You must log in to participate');
				return;
			}
			_UndoManager.recordCreate(parent, name, proto, uri);
			vwf_view.kernel.createChild(parent, name, proto, uri, callback);
		}
		$('#hierarchyManagertitle').click(function()
        {
            
            if(self.isOpen())
                self.hide()
            else
                self.show();
        })
		
		this.offClicked = function() {
			$('#InventoryRename').hide();
			if (HierarchyManager.inRename) {
				_DataManager.renamehierarchyItem(_UserManager.GetCurrentUserName(), HierarchyManager.selectedName, $('#InventoryRename').val(), HierarchyManager.selectedType);
				HierarchyManager.BuildGUI();
				HierarchyManager.inRename = false;
			}
		}
		this.makeBounds = function(node, color) {
			if (node) {
				if (this.SelectionBounds != null) {
					this.SelectionBounds.parent.remove(this.SelectionBounds);
					this.SelectionBounds = null;
				}
				var box = node.GetBoundingBox(true);
				box.max[0] += .05;
				box.max[1] += .05;
				box.max[2] += .05;
				box.min[0] -= .05;
				box.min[1] -= .05;
				box.min[2] -= .05;
				var mat = matCpy(node.matrixWorld.elements);
				//mat = GLGE.inverseMat4(mat);
				//mat[3] = 0;
				//mat[7] = 0;
				//mat[11] = 0;
				this.SelectionBounds = _Editor.BuildWireBox([box.max[0] - box.min[0], box.max[1] - box.min[1], box.max[2] - box.min[2]], [box.min[0] + (box.max[0] - box.min[0]) / 2, box.min[1] + (box.max[1] - box.min[1]) / 2, box.min[2] + (box.max[2] - box.min[2]) / 2], color);
				//this.SelectionBounds = _Editor.BuildBox([box.max[0] - box.min[0],box.max[1] - box.min[1],box.max[2] - box.min[2]],[0,0,0],color);
				this.SelectionBounds.matrixAutoUpdate = false;
				this.SelectionBounds.matrix.elements = mat;
				this.SelectionBounds.updateMatrixWorld(true);
				this.SelectionBounds.material = new THREE.LineBasicMaterial();
				this.SelectionBounds.material.color.r = color[0];
				this.SelectionBounds.material.color.g = color[1];
				this.SelectionBounds.material.color.b = color[2];
				this.SelectionBounds.material.wireframe = true;
				this.SelectionBounds.renderDepth = 10000 - 3;
				this.SelectionBounds.material.depthTest = false;
				this.SelectionBounds.material.depthWrite = false;
				this.SelectionBounds.PickPriority = -1;
				_Editor.findscene().add(this.SelectionBounds);
			}
		}
		$('#hierarchyDisplay').click(this.offClicked);
		this.makeVWFNode = function() {
			if (HierarchyManager.selectedType == 'three') {

				var node = this.findTHREEChild(_Editor.findviewnode(_Editor.GetSelectedVWFID()), this.selectedName);
				var parent = _Editor.GetSelectedVWFID();
				var childname = HierarchyManager.selectedName;
				var proto = {
					extends: 'asset.vwf',
					type: "link_existing/threejs",
					source: childname,
					properties: {
						owner: _UserManager.GetCurrentUserName(),
						type: '3DR Object',
						DisplayName: childname,
						transform: matCpy(node.matrix.elements)
					}
				};
				var newname = GUID();
				_UndoManager.recordCreate(parent, newname, proto);
				vwf_view.kernel.createChild(parent, newname, proto, null);
			} else {
				alertify.alert('Select a "SceneNode" to become a "VWF" node.')
			}
		}
		this.explode = function() {
			var self = this;
			alertify.confirm("Would you like to make all SceneNode children into VWF children?", function(ok) {
				if (ok) {
					var nodes = self.getTHREEChildren(self.findTHREEChild(_Editor.findviewnode(self.selectedID), self.selectedName));

					for (var i in nodes.children) {
						var node = self.findTHREEChild(_Editor.findviewnode(self.selectedID), nodes.children[i].name);
						var parent = self.selectedID;
						var childname = nodes.children[i].name;
						var proto = {
							extends: 'asset.vwf',
							type: "link_existing/threejs",
							source: childname,
							properties: {
								owner: _UserManager.GetCurrentUserName(),
								type: '3DR Object',
								DisplayName: childname,
								transform: matCpy(node.matrix.elements)
							}
						};
						var newname = GUID();
						_UndoManager.recordCreate(parent, newname, proto);
						vwf_view.kernel.createChild(parent, newname, proto, null);
					}
				}
			})
		}
		this.select = function() {
			if (HierarchyManager.selectedType == 'vwf') {
				_Editor.SelectObject(HierarchyManager.selectedName);
			}
		}
		this.itemClicked = function() {
			var name = $(this).attr('name');
			var type = $(this).attr('type');
			HierarchyManager.selectItem(name, type);
		}
		this.itemDblClicked = function() {
			var name = $(this).attr('name');
			var type = $(this).attr('type');
			_Editor.SelectObject(name);
		}
		this.selectItem = function(name, type) {
			HierarchyManager.selectedType = type;
			HierarchyManager.selectedName = name;
			$('#hierarchyManagerMakeNode').show();
			var node;
			var color = [0, .5, 1, 1];
			if (type == 'vwf') {
				node = _Editor.findviewnode(name);
				color = [0, 1, .5, 1];
			}
			if (type == 'three') node = HierarchyManager.findTHREEChild(_Editor.findviewnode(_Editor.GetSelectedVWFID()), name);
			HierarchyManager.makeBounds(node, color);
			_RenderManager.removeHilightObject(HierarchyManager.previewNode);
			HierarchyManager.previewNode = node;
			_RenderManager.addHilightObject(node);
			$(".hierarchyItem").removeClass('hierarchyItemSelected');
			$('#heirarchyParent').removeClass('hierarchyItemSelected');
			$('#hierarchyDisplay').find('[name="' + name + '"]').addClass('hierarchyItemSelected');
		}

		this.getVWFChildren = function(nodeID) {
			if (nodeID === undefined) {
				nodeID = _Editor.GetSelectedVWFID();
			}
			var ret = {
				name: '',
				vwfID: '',
				children: [],
				parent:null,
				state : 'closed'
			};
			ret.vwfID = nodeID;

			
			ret.name = vwf.getProperty(nodeID,'DisplayName') || nodeID;

			var children = vwf.children(nodeID);
			if (children)
			{
				for (var i = 0; i < children.length; i++) {
					ret.children.push(this.getVWFChildren(children[i]));
				}
				for( var i in ret.children)
					ret.children[i].parent = ret;
			}

			return ret;
		}
		this.markOpenAncestors = function(node)
		{
			if(!node) return;
			node.state = 'open';
			this.markOpenAncestors(node.parent)
		}
		this.findInTree = function(node,id)
		{
			if(!node) return null;
			if(node.vwfID == id) return node;
			else
				for(var i in node.children)
				{
					var ret = this.findInTree(node.children[i],id);
					if(ret) return ret;
				}
			return null;	
		}
		this.getVWFParent = function(node) {
			if (node === undefined) {
				node = _Editor.GetSelectedVWFID();
			}
			if (!node) return null;
			var parent = vwf.parent(node);
			if (!parent) return null;
			parent = _Editor.getNode(parent);
			if (!parent) return null;
			return parent.properties.DisplayName || parent.id;
		}
		this.findTHREEChild = function(node, name) {
			if (node.name == name) return node;
			if (node.children)
				for (var i = 0; i < node.children.length; i++) {
					var ret2 = this.findTHREEChild(node.children[i], name);
					if (ret2) return ret2;
				}
			return null;
		}
		this.getTHREEChildren = function(threenode) {
			var ret = {
				name: "",
				children: []
			};
			if (threenode === undefined) {
				threenode = _Editor.findviewnode(_Editor.GetSelectedVWFID());
			}
			if (!threenode) {
				return ret;
			}

			ret.name = threenode.name || threenode.uid || threenode.VWFID || 'No Name';



			if (threenode.children)
				for (var i = 0; i < threenode.children.length; i++) {
					if (!threenode.children[i].vwfID)
						ret.children.push(this.getTHREEChildren(threenode.children[i]));
				}

			return ret;


		}
		this.BuildGUI = function() {

			if(!this.ready)
				return;

			if (this.SelectionBounds != null) {
					this.SelectionBounds.parent.remove(this.SelectionBounds);
					this.SelectionBounds = null;
			}

			$('#hierarchyManagerMakeNode').hide();
			_RenderManager.removeHilightObject(HierarchyManager.previewNode);
			
			$('#hierarchyDisplay').empty();
			$('#InventoryRename').hide();
			$('#InventoryRename').keypress(HierarchyManager.rename)
			$('#InventoryRename').keydown(function(e) {
				e.stopPropagation();
			})
			$('#InventoryRename').focus(function() {
				$(this).select();
			});
			if (this.getVWFParent()) $('#hierarchyDisplay').append("<div id='heirarchyParent' style='display:none;font-weight:bold;white-space: nowrap;text-overflow: ellipsis;overflow:hidden'><div>&#x25B2 Parent (" + HierarchyManager.getVWFParent() + ")</div></div>");
			$('#hierarchyDisplay').append("<div id='VWFChildren' tabindex=0 style='font-weight:bold'><div>Scene</div></div>");
			$('#hierarchyDisplay').append("<div id='THREEChildren' tabindex=1 style='font-weight:bold'><div>SceneNode Children</div></div>");

			//move the selection up or down with a keypress
			$('#VWFChildren, #THREEChildren').keyup(function(evt,ui)
			{
				console.log(evt.keyCode);
				if(evt.keyCode == 27)
				{
					$('#heirarchyParent').dblclick();
					$($($('#VWFChildren').children()[1]).children()[1]).click();
					$('#VWFChildren').focus();
				}
				if(evt.keyCode == 32)
				{
					$(this).find('[name="' + HierarchyManager.selectedName +'"]').dblclick()
					$($($('#VWFChildren').children()[1]).children()[1]).click();
					$('#VWFChildren').focus();
				}
				//find and click the next node and click it; The click handlers should deal the bounds checking the list;
				if(evt.keyCode == 40)
				{
					if($(this).find('[name="' + HierarchyManager.selectedName +'"]').parent().children()[3] && $($(this).find('[name="' + HierarchyManager.selectedName +'"]').parent().children()[0]).text() == '-')
						$($($(this).find('[name="' + HierarchyManager.selectedName +'"]').parent().children()[3]).children()[1]).click()
					else
						$($(this).find('[name="' + HierarchyManager.selectedName +'"]').parent().next().children()[1]).click();
				}
				if(evt.keyCode == 38)
				{
					if($(this).find('[name="' + HierarchyManager.selectedName +'"]').parent().prev().children()[1])
						$($(this).find('[name="' + HierarchyManager.selectedName +'"]').parent().prev().children()[1]).click();
					else
						$($(this).find('[name="' + HierarchyManager.selectedName +'"]').parent().parent().children()[1]).click()
				}
				if(evt.keyCode == 39 || evt.keyCode == 37)
				{
					$(this).find('[name="' + HierarchyManager.selectedName +'"]').prev().click();
				}
				
			})
			
			$('#heirarchyParent').dblclick(function() {
				_Editor.SelectObject(vwf.parent(_Editor.GetSelectedVWFID()));
			}.bind(this));
			$('#heirarchyParent').click(this.itemClicked);
			$('#heirarchyParent').attr('name', vwf.parent(_Editor.GetSelectedVWFID()));
			$('#heirarchyParent').attr('type', 'vwf');
			
			var VWFChildren = HierarchyManager.getVWFChildren(vwf.application());
			for(var i = 0; i < _Editor.getSelectionCount(); i++)
				this.markOpenAncestors(this.findInTree(VWFChildren,_Editor.GetSelectedVWFID(i)));

			for(var i = 0; i < _Editor.getSelectionCount(); i++)
				this.findInTree(VWFChildren,_Editor.GetSelectedVWFID(i)).state = 'selected';
			for (var i = 0; i < VWFChildren.children.length; i++)
				this.appendThreeChildDOM(VWFChildren.children[i], 'VWFChildren', 'vwf');


			//only show the scenenode children of an asset
			var node = _Editor.GetSelectedVWFID();
			var found = false;
			while(node)
			{
				if(node == 'asset-vwf')
					found = true;
				node = vwf.prototype(node)
			}
			if(found)
			{
			var THREEChildren = HierarchyManager.getTHREEChildren();
			for (var i = 0; i < THREEChildren.children.length; i++)
				this.appendThreeChildDOM(THREEChildren.children[i], 'THREEChildren', 'three');

			}

			if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
		}
		this.BuildGUI = this.BuildGUI.bind(this);
		this.BuildGUI = debounce(this.BuildGUI, 250);
		this.appendThreeChildDOM = function(node, parentDiv, type) {
			
			//there are one or 2 objects that should never be listed in the scene
			if(node.name == "http-vwf-example-com-camera-vwf-camera") return;
			var thisid = 'THREEChild' + ToSafeID(node.name) + ToSafeID(GUID());
			var classname = 'glyphicon-triangle-right hierarchyicon';
			if(node.children.length == 0)
				classname = " glyphicon-ban-circle hierarchyicondisable";
			$('#' + parentDiv).append('<div id="' + thisid + 'container' + '" class="hierarchyentry" style="height:1em"><span class="hierarchytoggle glyphicon '+classname+'" id="' + thisid + 'toggle' + '"></span><span class="hierarchyItem" style="" id="' + thisid + '" ></span>');
			$('#' + thisid + 'toggle').css('cursor', 'pointer');
			$('#' + thisid + 'toggle').click(function() {

				if ($(this).hasClass("glyphicon-triangle-bottom")) {
					$(this).parent().css('height', '1em');
					
					$(this).removeClass("glyphicon-triangle-bottom")
					$(this).addClass("glyphicon-triangle-right")
					window.updateSidepanelScrollbars()
				} else if ($(this).hasClass("glyphicon-triangle-right")){
					$(this).parent().css('height', '');
					$(this).removeClass("glyphicon-triangle-right")
					$(this).addClass("glyphicon-triangle-bottom")
					window.updateSidepanelScrollbars()
				}

			});
			if(node.state == 'open')
				$('#' + thisid + 'toggle').click();
			if(node.state == 'selected')
			{
				$('#' + thisid + 'toggle').click();
				$('#' + thisid).addClass('hierarchyItemSelected');
			}


			$('#' + thisid).text(node.name);
			$('#' + thisid).attr('name', node.vwfID || node.name);
			$('#' + thisid).attr('type', type);
			
			if (type == 'vwf')
			{
				$('#' + thisid).click(function(){
					_Editor.SelectObjectPublic($(this).attr('name'));
				});	
			}else
			{
				$('#' + thisid).click(HierarchyManager.itemClicked);
				$('#' + thisid).dblclick(HierarchyManager.itemDblClicked);
			}
			for (var i = 0; i < node.children.length; i++) {
				this.appendThreeChildDOM(node.children[i], thisid + 'container', type);
			}
		}
		this.initializedNode = function(id)
		{
			if(id == vwf.application())
				this.ready = true;
		}
		this.calledMethod = function(id,method) {

				if(method == 'ready' && this.isOpen())
				{
					this.BuildGUI();
			    }
			
		}
		this.deletedNode = function(id) {
				this.BuildGUI();
		}
		this.satProperty = function(id,propname,val)
		{
			if(propname == 'DisplayName')
				this.BuildGUI();
		}
		
		
	}
});