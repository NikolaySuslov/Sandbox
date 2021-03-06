function AlignTool() {
	this.buildGUI = function() {
		
		
		var template = $.ajax({url:"../vwf/view/editorView/templates/alignTool.html",async:false}).responseText;

		$(document.body).append(template);


		this.xDisplay = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshPhongMaterial());
		this.yDisplay = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshPhongMaterial());
		this.zDisplay = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), new THREE.MeshPhongMaterial());

		this.xDisplay.rotation.y = Math.PI / 2;
		this.yDisplay.rotation.x = Math.PI / 2;

		this.xDisplay.updateMatrixWorld(true);
		this.yDisplay.updateMatrixWorld(true);
		this.zDisplay.updateMatrixWorld(true);

		this.xDisplay.material.side = 2
		this.xDisplay.material.transparent = true
		this.xDisplay.material.opacity = .3
		this.xDisplay.material.color.g = 0;
		this.xDisplay.material.color.b = 0;
		this.xDisplay.material.color.r = 1;
		this.xDisplay.material.needsUpdate = true
		
		this.xDisplay.material.wireframe = true;

		this.yDisplay.material.side = 2
		this.yDisplay.material.transparent = true
		this.yDisplay.material.opacity = .3
		this.yDisplay.material.color.g = 1;
		this.yDisplay.material.color.b = 0;
		this.yDisplay.material.color.r = 0;
		this.yDisplay.material.needsUpdate = true
	
		this.yDisplay.material.wireframe = true;

		this.zDisplay.material.side = 2
		this.zDisplay.material.transparent = true
		this.zDisplay.material.opacity = .3
		this.zDisplay.material.color.g = 0;
		this.zDisplay.material.color.b = 1;
		this.zDisplay.material.color.r = 0;
		this.zDisplay.material.needsUpdate = true
		
		this.zDisplay.material.wireframe = true;

		this.xDisplay.material.map = THREE.ImageUtils.loadTexture('./textures/grid2.gif');
		this.yDisplay.material.map = THREE.ImageUtils.loadTexture('./textures/grid2.gif');
		this.zDisplay.material.map = THREE.ImageUtils.loadTexture('./textures/grid2.gif');


		this.xDisplay.visible = false;
		this.yDisplay.visible = false;
		this.zDisplay.visible = false;
		//this.zDisplay.material.depthTest = false;
		this.zDisplay.material.depthWrite = false;
		//this.xDisplay.material.depthTest = false;
		this.xDisplay.material.depthWrite = false;
		//this.yDisplay.material.depthTest = false;
		this.yDisplay.material.depthWrite = false;
		$('#AlignToolGUI input').change(function() {
			_AlignTool.updateDisplay();
		});
		$('#AlignToolGUI_PickTarget').button({
			label: 'Pick Target'
		});
		$('#AlignToolGUI_PickTarget').click(function() {
			_AlignTool.PickTarget()
		});
		//$("#AlignX").checkboxradio();
		//$("#XFrom").controlgroup();
		//$("#XTo").buttonset();
		//$("#AlignY").checkboxradio();
		//$("#YFrom").buttonset();
		//$("#YTo").buttonset();
		//$("#AlignZ").checkboxradio();
		//$("#ZFrom").buttonset();
		//$("#ZTo").buttonset();
		$('#AlignToolGUI').dialog({


			closeOnEscape: false,
			show: {
				effect: "fade",
				duration: 300
			},
			hide: {
				effect: "fade",
				duration: 300
			},
			buttons: {
				OK: function() {
					_AlignTool.OK();
					$(this).dialog('close');
				},
				Cancel: function() {
					_AlignTool.Cancel();
					$(this).dialog('close');
				}

			},
			close: function() {
				_AlignTool.hide();
			},
			autoOpen: false,
			width: 'auto',
			title:"Align"

		});
	}
	this.OK = function() {
		//need to do undo work here

	}
	this.Cancel = function() {

		_UndoManager.startCompoundEvent();
		for (var i = 0; i < this.sourceNodeIDs.length; i++) {
			_UndoManager.recordSetProperty(this.sourceNodeIDs[i], 'transform',  this.sourceBackupTransform[this.sourceNodeIDs[i]]);
			_Editor.setProperty(this.sourceNodeIDs[i], 'transform', this.sourceBackupTransform[this.sourceNodeIDs[i]]);
		}
		_UndoManager.stopCompoundEvent();

	}
	this.updateDisplay = function() {

		var target = this.target; //_Editor.findviewnode(this.targetNodeID);
		var tbounds = target.GetBoundingBox(true);

		tbounds = tbounds.clone();

		var tcenter = new THREE.Vector3();
		var mat = target.matrixWorld.clone();
		tbounds = tbounds.transformBy(mat.clone().transpose().elements);
		this.xDisplay.position.copy(tcenter);
		this.yDisplay.position.copy(tcenter);
		this.zDisplay.position.copy(tcenter);
		var xFrom = $('#AlignToolGUI').find('#XFrom :checked').next().text();
		var xTo = $('#AlignToolGUI').find('#XTo :checked').next().text();

		var yFrom = $('#AlignToolGUI').find('#YFrom :checked').next().text();
		var yTo = $('#AlignToolGUI').find('#YTo :checked').next().text();

		var zFrom = $('#AlignToolGUI').find('#ZFrom :checked').next().text();
		var zTo = $('#AlignToolGUI').find('#ZTo :checked').next().text();

		var alignX = $("#AlignX").is(':checked');
		var alignY = $("#AlignY").is(':checked');
		var alignZ = $("#AlignZ").is(':checked');

		_UndoManager.startCompoundEvent();
		for (var i = 0; i < this.sourceNodeIDs.length; i++) {
			var source = _Editor.findviewnode(this.sourceNodeIDs[i])
			var sbounds = source.GetBoundingBox(true);
			sbounds = sbounds.clone();
			if(sbounds.max[0] == -Infinity)
			{
				sbounds.max = [0,0,0];
				sbounds.min = [0,0,0];	
			}
			var smat = source.matrixWorld.clone();
			smat = smat.setPosition(new THREE.Vector3());
			sbounds = sbounds.transformBy(smat.clone().transpose().elements);

			var scenter = this.scenter[i].clone();
			var spos = scenter.clone();

			if (alignX) {
				this.xDisplay.visible = true;

				spos.x = tcenter.x
				if (xFrom == 'Center' && xTo == 'Max') {
					spos.x += tbounds.max[0];
				}
				if (xFrom == 'Max' && xTo == 'Center') {
					spos.x += sbounds.min[0] + ((tbounds.min[0] + tbounds.max[0]) / 2);
				}

				if (xFrom == 'Center' && xTo == 'Min') {
					spos.x += tbounds.min[0];
				}
				if (xFrom == 'Min' && xTo == 'Center') {
					spos.x += sbounds.max[0] + ((tbounds.min[0] + tbounds.max[0]) / 2);
				}
				if (xFrom == 'Center' && xTo == 'Center') {
					spos.x += ((sbounds.max[0] + sbounds.min[0]) / 2) + ((tbounds.min[0] + tbounds.max[0]) / 2);
				}

				if (xFrom == 'Min' && xTo == 'Max') {
					spos.x += sbounds.max[0];
					spos.x += tbounds.max[0];
				}

				if (xFrom == 'Max' && xTo == 'Min') {
					spos.x += sbounds.min[0];
					spos.x += tbounds.min[0];
				}
				if (xFrom == 'Min' && xTo == 'Min') {
					spos.x += sbounds.max[0];
					spos.x += tbounds.min[0];
				}
				if (xFrom == 'Max' && xTo == 'Max') {
					spos.x += sbounds.min[0];
					spos.x += tbounds.max[0];
				}

			} else {
				this.xDisplay.visible = false;
			}

			if (alignY) {
				spos.y = tcenter.y;
				this.yDisplay.visible = true;
				if (yFrom == 'Center' && yTo == 'Max') {
					spos.y += tbounds.max[1];
				}
				if (yFrom == 'Max' && yTo == 'Center') {
					spos.y += sbounds.min[1] + ((tbounds.min[1] + tbounds.max[1]) / 2);
				}

				if (yFrom == 'Center' && yTo == 'Min') {
					spos.y += tbounds.min[1];
				}
				if (yFrom == 'Min' && yTo == 'Center') {
					spos.y += sbounds.max[1] + ((tbounds.min[1] + tbounds.max[1]) / 2);
				}
				if (yFrom == 'Center' && yTo == 'Center') {
					spos.y += ((sbounds.max[1] + sbounds.min[1]) / 2) + ((tbounds.min[1] + tbounds.max[1]) / 2);
				}

				if (yFrom == 'Min' && yTo == 'Max') {
					spos.y += sbounds.max[1];
					spos.y += tbounds.max[1];
				}

				if (yFrom == 'Max' && yTo == 'Min') {
					spos.y += sbounds.min[1];
					spos.y += tbounds.min[1];
				}
				if (yFrom == 'Min' && yTo == 'Min') {
					spos.y += sbounds.max[1];
					spos.y += tbounds.min[1];
				}
				if (yFrom == 'Max' && yTo == 'Max') {
					spos.y += sbounds.min[1];
					spos.y += tbounds.max[1];
				}

			} else {
				this.yDisplay.visible = false;
			}

			if (alignZ) {
				spos.z = tcenter.z;
				this.zDisplay.visible = true;
				if (zFrom == 'Center' && zTo == 'Max') {
					spos.z += tbounds.max[2];
				}
				if (zFrom == 'Max' && zTo == 'Center') {
					spos.z += sbounds.min[2] + ((tbounds.min[2] + tbounds.max[2]) / 2);
				}

				if (zFrom == 'Center' && zTo == 'Min') {
					spos.z += tbounds.min[2];
				}
				if (zFrom == 'Min' && zTo == 'Center') {
					spos.z += sbounds.max[2] + ((tbounds.min[2] + tbounds.max[2]) / 2);
				}
				if (zFrom == 'Center' && zTo == 'Center') {
					spos.z += ((sbounds.max[2] + sbounds.min[2]) / 2) + ((tbounds.min[2] + tbounds.max[2]) / 2);
				}

				if (zFrom == 'Min' && zTo == 'Max') {
					spos.z += sbounds.max[2];
					spos.z += tbounds.max[2];
				}

				if (zFrom == 'Max' && zTo == 'Min') {
					spos.z += sbounds.min[2];
					spos.z += tbounds.min[2];
				}
				if (zFrom == 'Min' && zTo == 'Min') {
					spos.z += sbounds.max[2];
					spos.z += tbounds.min[2];
				}
				if (zFrom == 'Max' && zTo == 'Max') {
					spos.z += sbounds.min[2];
					spos.z += tbounds.max[2];
				}

			} else {
				this.zDisplay.visible = false;
			}

			var trans = vwf.getProperty(this.sourceNodeIDs[i],'transform');
			trans[12] = spos.x;
			trans[13] = spos.y;
			trans[14] = spos.z;
 			_UndoManager.recordSetProperty(this.sourceNodeIDs[i], 'transform', trans);
 			_Editor.setProperty(this.sourceNodeIDs[i], 'transform', trans);
		}
		_UndoManager.stopCompoundEvent();
		
		var xCenter = (tbounds.min[0] + tbounds.max[0]) / 2;
		var yCenter = (tbounds.min[1] + tbounds.max[1]) / 2;
		var zCenter = (tbounds.min[2] + tbounds.max[2]) / 2;
		
		this.xDisplay.position.y += yCenter;
		this.xDisplay.position.z += zCenter;
		
		this.yDisplay.position.x += xCenter;
		this.yDisplay.position.z += zCenter;
		
		this.zDisplay.position.x += xCenter;
		this.zDisplay.position.y += yCenter;
		
		if (zTo == 'Max')
			this.zDisplay.position.z += tbounds.max[2];
		if (zTo == 'Min')
			this.zDisplay.position.z += tbounds.min[2];
		if (yTo == 'Max')
			this.yDisplay.position.y += tbounds.max[1];
		if (yTo == 'Min')
			this.yDisplay.position.y += tbounds.min[1];
		if (xTo == 'Max')
			this.xDisplay.position.x += tbounds.max[0];
		if (xTo == 'Min')
			this.xDisplay.position.x += tbounds.min[0];
		if (xTo == 'Center')
			this.xDisplay.position.x += xCenter;
		if (yTo == 'Center')
			this.yDisplay.position.y += yCenter;
		if (zTo == 'Center')
			this.zDisplay.position.z += zCenter;

		this.xDisplay.updateMatrixWorld(true);
		this.yDisplay.updateMatrixWorld(true);
		this.zDisplay.updateMatrixWorld(true);
	}
	this.PickTarget = function() {
		this.backcolor = $('#AlignToolGUI_PickTarget').css('background');
		$('#AlignToolGUI_PickTarget').addClass('ui-state-active')
		this.pickMode = 'Pick';
	}
	this.show = function() {

		if ($('#AlignToolGUI').length == 0) {
			this.buildGUI();
		}
		var count = _Editor.getSelectionCount();
		if (!count) {
			_Notifier.alert('You must select at least one object beforing activating the Align tool.');
			return;
		}
		this.sourceNodeIDs = [];
		this.scenter = [];
		this.sourceBackupTransform = {};
		for (var i = 0; i < count; i++) {

			this.sourceNodeIDs.push(_Editor.GetSelectedVWFNode(i).id);
			this.sourceBackupTransform[_Editor.GetSelectedVWFNode(i).id] = vwf.getProperty(_Editor.GetSelectedVWFNode(i).id, 'transform');
			this.scenter.push(new THREE.Vector3().getPositionFromMatrix(_Editor.findviewnode(_Editor.GetSelectedVWFNode(i).id).matrixWorld));
		}


		$('#AlignToolGUI').dialog('open');


		$('#AlignToolGUI_PickTarget').click();
		$('#AlignToolGUI_PickTargetID').text('No Target Selected');
		//_Editor.SelectObject();
		_Editor.addTool('AlignTool', this);
		_Editor.setActiveTool('AlignTool');
		_AlignTool.open = true;
		if (window._dScene) {
			_dScene.add(this.xDisplay, true);
			_dScene.add(this.yDisplay, true);
			_dScene.add(this.zDisplay, true);
		}

	}
	this.hide = function() {
		_Editor.setActiveTool('Gizmo');
		if (this.backcolor)
			$('#AlignToolGUI_PickTarget').removeClass('ui-state-active')
		this.pickMode = "";
		if (window._dScene) {
			_dScene.remove(this.xDisplay, true);
			_dScene.remove(this.yDisplay, true);
			_dScene.remove(this.zDisplay, true);
		}
	}
	this.isOpen = function() {
		return $('#AlignToolGUI').is(':visible');
	}
	this.click = function(e) {
		if (this.pickMode == 'Pick') {

			var c = _Editor.findcamera();
			var campos = [c.position.x, c.position.y, c.position.z];
			var pick = _Editor.ThreeJSPick(campos, _Editor.GetWorldPickRay(e), {
				filter: function(o) {

					if (o.isAvatar != true)
						if (o.parent)
							if (o.parent.name != 'MoveGizmo')
								return true;
					return false;

				}
			});
			if (pick.object)
				this.protoBounds = pick.object.getBoundingBox();
			var vwfnode;
			var picknode = pick.object;
			if (!pick.object) {
				console.log('No node selected');
				return;
			}

			while (pick && pick.object && !pick.object.vwfID)
				pick.object = pick.object.parent;
			if (pick && pick.object)
				vwfnode = pick.object.vwfID;

			console.log(vwfnode);



			//put everything back where it was, to allow picking new target from list of source obhects
			this.Cancel();

			this.targetNodeID = vwfnode || picknode.name;

			this.target = _Editor.findviewnode(this.targetNodeID) || picknode;

			this.tcenter = new THREE.Vector3().getPositionFromMatrix(this.target.matrixWorld);
			$('#AlignToolGUI_PickTargetID').text(this.targetNodeID);

			this.updateDisplay();
			this.pickMode = '';
			$('#AlignToolGUI_PickTarget').removeClass('ui-state-active')
		}
	}
}
_AlignTool = new AlignTool();
_AlignTool.hide();