
define(['vwf/view/editorview/angular-app', 'vwf/view/editorview/manageAssets'], function(app, manageAssets)
{
	app.controller('MenuController', ['$scope', 'MenuHandlers', function($scope, handlers)
	{
		function nodeInherits(node, ancestor)
		{
			if(!node)
				return false;
			else if(node == ancestor)
				return true;
			else
				return nodeInherits( Engine.prototype(node), ancestor );
		}

		$scope.$watchGroup([
			'fields.worldIsReady',
			'fields.selectedNode.id',
			'fields.selectedNode.properties.sourceAssetId',
			'fields.selectedNode.properties.materialDef.sourceAssetId'
		], function(newvals)
		{
			//console.log('Updating menu state');
			var node = _Editor.GetSelectedVWFNode();
			var instanceData = _DataManager.getInstanceData();

			$scope.selection = !!node;
			$scope.hasMaterial = !!(node && node.properties && node.properties.materialDef);
			$scope.isBehavior = !!(node && nodeInherits(node.id, 'http-vwf-example-com-behavior-vwf'));
			$scope.isEntityAsset = !!(node && node.properties && node.properties.sourceAssetId);
			$scope.isMaterialAsset = !!(node && node.properties && node.properties.materialDef && node.properties.materialDef.sourceAssetId);
			$scope.isGroup = !!(node && nodeInherits(node.id, 'sandboxGroup-vwf'));
			$scope.loggedIn = !!_UserManager.GetCurrentUserName();
			$scope.hasAvatar = !!(($scope.loggedIn || instanceData.publishSettings.allowAnonymous) && instanceData.publishSettings.createAvatar);
			$scope.isExample = !!instanceData.isExample;
			$scope.userIsOwner = _UserManager.GetCurrentUserName() === instanceData.owner;
			$scope.worldIsPersistent = instanceData.publishSettings.persistence;
			$scope.worldIsSinglePlayer = instanceData.publishSettings.SinglePlayer;
			$scope.worldIsNotLaunchable = !($scope.worldIsPersistent && $scope.userIsOwner) || $scope.worldIsSinglePlayer || $scope.isExample;
			$scope.worldHasTerrain = !!window._dTerrain;
			$scope.hasContinuesFlag = /[?&]allowContinues/.test(window.location.search);
			$scope.allowPlayPause = instanceData.allowPlayPause;

			//console.log('UserIsOwner:', $scope.userIsOwner);
		});

		$scope.lookUpHandler = function(e){
			$('#ddsmoothmenu li').trigger('mouseleave');
			//we used to use pointer-events:none in the css, but that is causing some problems with mouseover. 
			//now using application logic to reject clicks
			if($(e.currentTarget).parent().hasClass('disabled'))
			  return;
			handlers[e.currentTarget.id](e);
		}
	}]);

	app.service('MenuHandlers', function(){
		var handlers =
		{
			MenuLogOut:function(e){
				window.location = "/";
			},
			// hook up assets menu
			MenuManageAssets: function(e){
				$('#manageAssetsDialog').dialog('open');
			},

			MenuAssetsSaveAsEntity: function(e){
				manageAssets.uploadSelectedEntity();
				$('#manageAssetsDialog').dialog('open');
			},

			MenuAssetsSaveAsMaterial: function(e){
				manageAssets.uploadSelectedMaterial();
				$('#manageAssetsDialog').dialog('open');
			},

			MenuAssetsSaveAsBehavior: function(e){
				manageAssets.uploadSelectedBehavior();
				$('#manageAssetsDialog').dialog('open');
			},

			MenuAssetsSaveAsFile: function(e){
				manageAssets.uploadFile();
				$('#manageAssetsDialog').dialog('open');
			},

			MenuAssetsSaveEntity: function(e){
				manageAssets.uploadSelectedEntity(true);
				$('#manageAssetsDialog').dialog('open');
			},

			MenuAssetsSaveMaterial: function(e){
				manageAssets.uploadSelectedMaterial(true);
				$('#manageAssetsDialog').dialog('open');
			},

			MenuAssetsSaveBehavior: function(e){
				manageAssets.uploadSelectedBehavior(true);
				$('#manageAssetsDialog').dialog('open');
			},


			MenuSetAvatar:function(e)
			{
				avatarTools.postAvatarDefinition()
			},
			SetThumbnail: function(e) {
				window.setThumbnail(false);
			},

			MenuCreateGUIDialog: function(e) {
				_GUIView.createDialog();
			},
			MenuCreateGUIButton: function(e) {
				_GUIView.createButton();
			},
			MenuCreateGUILabel: function(e) {
				_GUIView.createLabel();
			},
			MenuCreateGUISlider: function(e) {
				_GUIView.createSlider();
			},
			MenuCreateGUICheck: function(e) {
				_GUIView.createCheckbox();
			},
			MenuCreateGUIPanel: function(e) {
				_GUIView.createPanel();
			},
			MenuCreateGUIImage: function(e) {
				_GUIView.createImage();
			},
			MenuCreateGUIHtml: function(e) {
				_GUIView.createHtml();
			},


			MenuEn: function(e) {
				i18n.setLng('en', function(t) { /* loading done */ });
				location.reload();
			},

			MenuRu: function(e) {
				i18n.setLng('ru', function(t) { /* loading done */ });
				location.reload();

			},
			MenuEs_ES: function(e) {
				i18n.setLng('es_ES', function(t) { /* loading done */ });
				location.reload();
			},


			//make the menu items disappear when you click one
			//$(".ddsmoothmenu").find('li').click(function(){$(".ddsmoothmenu").find('li').trigger('mouseleave');});
			MenuLogIn: function(e) {
				if ($('#MenuLogIn').attr('disabled') == 'disabled') return;
				_UserManager.showLogin();
			},
			MenuSaveNow: function(e) {
				_DataManager.saveToServer();
			},




			MenuShareWorld: function(e) {

				var state = _DataManager.getCurrentSession();
				state = state.replace(/\//g, '_');
				var turl = "/vwfdatamanager.svc/statedata?SID=" + state;
				$.getJSON(turl, function(data) {
					placehodler = '';
					if (data)
						placeholder = data.title;
					alertify.prompt('Use the URL below to share this world with your friends! Just have them paste it into their browsers address bar.', function() {},
						window.location.host + '/worlds/' + placeholder);

				});

			},

			
			MenuSelectPick: function(e) {
				_Editor.SetSelectMode('Pick');
			},
			MenuSelectNone: function(e) {
				_Editor.SelectObject(null);

			},
			MenuMove: function(e) {
				_Editor.SetGizmoMode(_Editor.Move);
				$('#MenuRotateicon').removeClass('iconselected');
				$('#MenuScaleicon').removeClass('iconselected');
				$('#MenuMoveicon').addClass('iconselected');
			},
			MenuRotate: function(e) {
				_Editor.SetGizmoMode(_Editor.Rotate);
				$('#MenuRotateicon').addClass('iconselected');
				$('#MenuScaleicon').removeClass('iconselected');
				$('#MenuMoveicon').removeClass('iconselected');
			},
			MenuScale: function(e) {
				_Editor.SetGizmoMode(_Editor.Scale);
				$('#MenuRotateicon').removeClass('iconselected');
				$('#MenuScaleicon').addClass('iconselected');
				$('#MenuMoveicon').removeClass('iconselected');
			},
			MenuMulti: function(e) {
				_Editor.SetGizmoMode(_Editor.Multi);
			},
			MenuShare: function(e) {
				_PermissionsManager.show();
			},
			MenuSetParent: function(e) {
				_Editor.SetParent();
			},
			MenuSelectScene: function(e) {
				_Editor.SelectScene();
			},
			MenuRemoveParent: function(e) {
				_Editor.RemoveParent();
			},
			MenuSelectParent: function(e) {
				_Editor.SelectParent();
			},
			MenuHierarchyManager: function(e) {
				if (HierarchyManager.isOpen())
					HierarchyManager.hide();
				else
					HierarchyManager.show();
			},
			MenuLocal: function(e) {
				_Editor.SetCoordSystem(_Editor.LocalCoords);
				if (_Editor.GetMoveGizmo()) _Editor.updateGizmoOrientation(true);
			},
			MenuWorld: function(e) {
				_Editor.SetCoordSystem(_Editor.WorldCoords);
				if (_Editor.GetMoveGizmo()) _Editor.updateGizmoOrientation(true);
			},
			MenuDelete: function(e) {
				_Editor.DeleteSelection();
			},
			MenuChat: function(e) {
				$('#ChatWindow').dialog('open');
			},
			MenuUsers: function(e) {
			   _UserManager.showPlayers();
			},
			MenuAssets3DRBrowse: function(e) {
				_ModelLibrary.show();
			},
			MenuSnapLarge: function(e) {
				_Editor.SetSnaps(1, 15 * 0.0174532925, .15);
			},
			MenuSnapMedium: function(e) {
				_Editor.SetSnaps(.5, 5 * 0.0174532925, .05);
			},
			MenuSnapSmall: function(e) {
				_Editor.SetSnaps(.25, 1 * 0.0174532925, .01);
			},
			MenuSnapOff: function(e) {
				_Editor.SetSnaps(.001, .01 * 0.0174532925, .00005);
			},
			MenuMaterialEditor: function(e) {

				if (_MaterialEditor.isOpen())
					_MaterialEditor.hide();
				else
					_MaterialEditor.show();
			},
			MenuScriptEditor: function(e) {
				if (_ScriptEditor.isOpen())
					_ScriptEditor.hide();
				else
					_ScriptEditor.show();
			},


			MenuPhysicsEditor: function(e) {

				if (_PhysicsEditor.isOpen())
					_PhysicsEditor.hide();
				else
					_PhysicsEditor.show();
			},

			MenuObjectProperties: function(e) {

				if (_PrimitiveEditor.isOpen())
					_PrimitiveEditor.hide();
				else
					_PrimitiveEditor.show();
			},
			MenuLatencyTest: function(e) {
				var e = {};
				e.time = new Date();
				vwf_view.kernel.callMethod('index-vwf', 'latencyTest', [e]);
			},
			ResetTransforms: function(e) {
				_Editor.ResetTransforms();
			},
			MenuCopy: function(e) {
				_Editor.Copy();
			},


			MenuSelectName: function(e) {
				_SidePanel.showTab('hierarchyManager');
			},

			MenuPaste: function(e) {
				_Editor.Paste();
			},
			MenuDuplicate: function(e) {
				_Editor.Duplicate();
			},
			MenuCreatePush: function(e) {
				_Editor.CreateModifier('push', _UserManager.GetCurrentUserName(), true);
			},
			MenuCreateExtrude: function(e) {
				_Editor.CreateModifier('extrude', _UserManager.GetCurrentUserName(), true);
			},
			 MenuCreatePathExtrude: function(e) {
				_Editor.CreateModifier('pathextrude', _UserManager.GetCurrentUserName(), true);
			},
			MenuCreateLathe: function(e) {
				_Editor.CreateModifier('lathe', _UserManager.GetCurrentUserName(), true);
			},
			MenuCreateTaper: function(e) {
				_Editor.CreateModifier('taper', _UserManager.GetCurrentUserName(),true);
			},
			MenuCreateBend: function(e) {
				_Editor.CreateModifier('bend', _UserManager.GetCurrentUserName(),true);
			},
			MenuCreateTwist: function(e) {
				_Editor.CreateModifier('twist', _UserManager.GetCurrentUserName(),true);
			},

			MenuCreateUVMap: function(e) {
				_Editor.CreateModifier('uvmap', _UserManager.GetCurrentUserName(), true);
			},
			MenuCreateCenterPivot: function(e) {
				_Editor.CreateModifier('centerpivot', _UserManager.GetCurrentUserName(), true);
			},
			MenuCreatePerlinNoise: function(e) {
				_Editor.CreateModifier('perlinnoise', _UserManager.GetCurrentUserName());
			},
			MenuCreateSimplexNoise: function(e) {
				_Editor.CreateModifier('simplexnoise', _UserManager.GetCurrentUserName(),true);
			},
			MenuCreateOffset: function(e) {
				_Editor.CreateModifier('offset', _UserManager.GetCurrentUserName(),true);
			},
			MenuCreateStretch: function(e) {
				_Editor.CreateModifier('stretch', _UserManager.GetCurrentUserName(),true);
			},

			MenuCreateBehaviorRotator: function(e) {
				_Editor.CreateBehavior('rotator', _UserManager.GetCurrentUserName());
			},

			MenuCreateBehaviorDialog: function(e) {
				_Editor.CreateBehavior('DialogSystem', _UserManager.GetCurrentUserName());
			},


			MenuCreateBehaviorOrbit: function(e) {
				_Editor.CreateBehavior('orbit', _UserManager.GetCurrentUserName());
			},
			MenuCreateBehaviorHyperlink: function(e) {
				_Editor.CreateBehavior('hyperlink', _UserManager.GetCurrentUserName());
			},
			MenuCreateBehaviorHoverlabel: function(e) {
				_Editor.CreateBehavior('hoverlabel', _UserManager.GetCurrentUserName());
			},
			MenuCreateBehaviorLookat: function(e) {
				_Editor.CreateBehavior('lookat', _UserManager.GetCurrentUserName());
			},
			MenuCreateBehaviorOneClick: function(e) {
				_Editor.CreateBehavior('oneClick', _UserManager.GetCurrentUserName());
			},
			MenuCreateBehaviorSeek: function(e) {
				_Editor.CreateBehavior('seek', _UserManager.GetCurrentUserName());
			},
			MenuCreateBehaviorPathFollow: function(e) {
				_Editor.CreateBehavior('pathfollow', _UserManager.GetCurrentUserName());
			},
			MenuCreateBehaviorClampToGround: function(e) {
				_Editor.CreateBehavior('clamptoground', _UserManager.GetCurrentUserName());
			},

			MenuPhysicsPointConstraint: function(e) {
				_Editor.CreatePhysicsConstraint('point', _UserManager.GetCurrentUserName());
			},
			MenuPhysicsHingeConstraint: function(e) {
				_Editor.CreatePhysicsConstraint('hinge', _UserManager.GetCurrentUserName());
			},
			MenuPhysicsSliderConstraint: function(e) {
				_Editor.CreatePhysicsConstraint('slider', _UserManager.GetCurrentUserName());
			},
			MenuPhysicsFixedConstraint: function(e) {
				_Editor.CreatePhysicsConstraint('fixed', _UserManager.GetCurrentUserName());
			},




			//trigger section
			MenuCreateTriggerDistance: function(e) {
				_Editor.CreateBehavior('distancetrigger', _UserManager.GetCurrentUserName());
			},

			//trigger section
			MenuCreateTriggerProperty: function(e) {
				_Editor.CreateBehavior('propertytrigger', _UserManager.GetCurrentUserName());
			},

			//trigger section
			MenuCreateTriggerMethod: function(e) {
				_Editor.CreateBehavior('methodtrigger', _UserManager.GetCurrentUserName());
			},

			MenuHelpBrowse: function(e) {
				window.open('http://sandboxdocs.readthedocs.org/en/latest/', '_blank');
			},
			MenuHelpAbout: function(e) {
				$('#NotifierAlertMessage').dialog('open');
				$('#NotifierAlertMessage').load('./about.html');
				$('#NotifierAlertMessage').dialog('option', 'height', 'auto');
				$('#NotifierAlertMessage').dialog('option', 'width', 'auto');
			},
			MenuSave: function(e) {
				_DataManager.save();
			},
			MenuSaveAs: function(e) {
				_DataManager.saveAs();
			},
			MenuLoad: function(e) {
				_DataManager.load();
			},
			/*$('#ChatInput').keypress(function(e) {
				e.stopPropagation();

			},
			$('#ChatInput').keydown(function(e) {
				e.stopPropagation();
			},*/
			MenuCreateBlankBehavior: function(e) {
				_Editor.AddBlankBehavior();
			},
			MenuViewGlyphs: function(e) {
				if ($('#glyphOverlay').css('display') == 'block') {
					$('#glyphOverlay').hide();
					_Notifier.notify('Glyphs hidden');
				} else {
					$('#glyphOverlay').show();
					_Notifier.notify('Glyphs displayed');
				}
			},


			MenuViewOctree: function(e) {
				_SceneManager.setShowRegions(!_SceneManager.getShowRegions());
			},
			MenuViewStats: function(e) {
				if (_PerformanceManager.isOpen())
					_PerformanceManager.hide()
				else
					_PerformanceManager.show()
			},
			MenuViewShadows: function(e) {
				var val = !_Editor.findscene().children[1].castShadows;
				_Editor.findscene().children[1].setCastShadows(val);
			},
			MenuViewBatchingForce: function(e) {
				_Editor.findscene().buildBatches(true);
			},
			MenuViewStaticBatching: function(e) {
				_Editor.findscene().staticBatchingEnabled = !_Editor.findscene().staticBatchingEnabled;
				if (!_Editor.findscene().staticBatchingEnabled) {
					_SceneManager.forceUnbatchAll();
					_Notifier.notify('static batching disabled');
				} else {
					_Notifier.notify('static batching enabled');
				}
			},
			MenuGroup: function(e) {
				_Editor.GroupSelection();
			},
			MenuUngroup: function(e) {
				_Editor.UngroupSelection();
			},
			MenuOpenGroup: function(e) {
				_Editor.OpenGroup();
			},
			MenuCloseGroup: function(e) {
				_Editor.CloseGroup();
			},
			MenuAlign: function(e) {
				_AlignTool.show();
			},
			MenuBlockPainter: function(e) {
				_PainterTool.show();
			},
			MenuSnapMove: function(e) {
				_SnapMoveTool.show();
			},
			MenuSplineTools: function(e) {
				_SplineTool.show();

			},

			MenuViewInterpolation: function(e) {
				_dView.interpolateTransforms = !_dView.interpolateTransforms;
				if (!_dView.interpolateTransforms)
					alertify.log('Animation interpolation disabled');
				else
					alertify.log('Animation interpolation enabled');
			},
			MenuViewToggleWireframe: function(e) {

				if (_Editor.findscene().overrideMaterial) {
					_Editor.findscene().overrideMaterial = null;
				} else {
					_Editor.findscene().overrideMaterial = new THREE.MeshPhongMaterial();
					_Editor.findscene().overrideMaterial.wireframe = true;
					_Editor.findscene().overrideMaterial.color.r = 0;
					_Editor.findscene().overrideMaterial.color.g = 0;
					_Editor.findscene().overrideMaterial.color.b = 0;
					_Editor.findscene().overrideMaterial.fog = false;
				}
			},
			MenuViewTogglePhysics: function(e) {
			   _PhysicsEditor.toggleWorldPreview()
			},

			MenuViewToggleBones: function(e) {
				if (_SceneManager.getBonesVisible())
					_SceneManager.hideBones();
				else
					_SceneManager.showBones();

			},

			MenuViewToggleAO: function(e) {
				if (_Editor.findscene().getFilter2d()) {
					_Editor.findscene().setFilter2d();
				} else {
					var ao = new MATH.FilterAO();
					_Editor.findscene().setFilter2d(ao)
				}
			},

			MenuActivateCamera: function(e) {
				_dView.chooseCamera();
			},
			MenuFocusSelected: function(e) {
				_dView.setCameraDefault();
				_Editor.focusSelected();
			},
			MenuCameraOrbit: function(e) {
				_dView.setCameraDefault();
				var campos = [_Editor.findcamera().position.x, _Editor.findcamera().position.y, _Editor.findcamera().position.z];
				var ray = _Editor.GetCameraCenterRay();
				var dxy = _Editor.intersectLinePlane(ray, campos, [0, 0, 0], _Editor.WorldZ);
				var newintersectxy = MATH.addVec3(campos, MATH.scaleVec3(ray, dxy));
				require("vwf/view/threejs/editorCameraController").getController('Orbit').orbitPoint(newintersectxy);
				require("vwf/view/threejs/editorCameraController").setCameraMode('Orbit');
				require("vwf/view/threejs/editorCameraController").updateCamera();
			},

			MenuCameraNavigate: function(e) {
				_dView.setCameraDefault();
				require("vwf/view/threejs/editorCameraController").setCameraMode('Orbit');
				require("vwf/view/threejs/editorCameraController").setCameraMode('Navigate');
			},

			MenuCameraDeviceOrientation: function(e) {
				_dView.setCameraDefault();
				require("vwf/view/threejs/editorCameraController").setCameraMode('DeviceOrientation');
			},
			MenuViewHideTools: function(e) {
				hideTools();
			},



			MenuCameraReceive: function()
			{
				_dView.receiveSharedCameraView();
			},
			MenuCameraReceiveCancel: function()
			{
				$('#MenuCameraOrbit').click();
			},


			MenuCameraShare: function(e) {
				if (!_UserManager.GetCurrentUserName()) {
					alertify.confirm("Anonymous users may not share their camera view.", function(ok) {});
				}
				var broadcasting = _dView.shareCamera;
				if (!broadcasting) {

					alertify.confirm("Are you sure you want to share your camera position? Other users will be able to see from your camera!", function(ok) {
						if (ok) {
							_dView.shareCameraView();
							$('#MenuCameraShare').html(('Stop Camera Sharing').escape());
						}
					}.bind(this));
				} else {
					alertify.confirm("You are currently sharing your camera view. Would you like to stop sharing?", function(ok) {
						if (ok) {
							_dView.stopShareCameraView();
							$('#MenuCameraShare').html(('Share Camera View').escape());

						}
					}.bind(this));

				}
			},

			MenuCameraFly: function(e) {
				_dView.setCameraDefault();

				$('#MenuCameraNavigateicon').addClass('iconselected');
				require("vwf/view/threejs/editorCameraController").setCameraMode('Fly');

			},

			MenuCameraNone: function(e) {
				_dView.setCameraDefault();

				require("vwf/view/threejs/editorCameraController").setCameraMode('None');
			},
			MenuCameraFree: function(e) {
				_dView.setCameraDefault();

				$('#MenuCameraFreeicon').addClass('iconselected');
				require("vwf/view/threejs/editorCameraController").setCameraMode('Orbit');
				require("vwf/view/threejs/editorCameraController").setCameraMode('Free');
			},



			MenuViewFullscreen: function(e) {
			   _dView.toggleFullScreen();
			},
			MenuCamera3RDPerson: function(e) {

				if (_UserManager.GetCurrentUserName()) {
					_dView.setCameraDefault();

					$('#MenuCamera3RDPersonicon').addClass('iconselected');
					require("vwf/view/threejs/editorCameraController").getController('Orbit').followObject(Engine.models[0].model.nodes[_UserManager.GetCurrentUserID()]);
					require("vwf/view/threejs/editorCameraController").setCameraMode('3RDPerson');
				} else {
					_Notifier.alert('First person mode is not available when you are not logged in.');
				}
			},


			MenuCreateCameraPerspective: function(e) {
				_Editor.CreateCamera(_Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
			},
			MenuCreateParticlesBasic: function(e) {
				_Editor.createParticleSystem('basic', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
			},
			MenuCreateParticlesSpray: function(e) {
				_Editor.createParticleSystem('spray', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
			},
			MenuCreateParticlesSuspended: function(e) {
				_Editor.createParticleSystem('suspended', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
			},
			MenuCreateParticlesAtmospheric: function(e) {
				_Editor.createParticleSystem('atmospheric', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
			},
			MenuCreateLightPoint: function(e) {
				_Editor.createLight('point', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
			},
			MenuCreateLightSpot: function(e) {
				_Editor.createLight('spot', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
			},
			MenuCreateLightDirectional: function(e) {
				_Editor.createLight('directional', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
			},
			MenuCreateBox: function(e) {
				_Editor.CreatePrim('box', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreateLine: function(e) {
				_Editor.CreatePrim('line', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreateCircle: function(e) {
				_Editor.CreatePrim('circle', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreateStar: function(e) {
				_Editor.CreatePrim('star', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreateRectangle: function(e) {
				_Editor.CreatePrim('rectangle', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreateLSection: function(e) {
				_Editor.CreatePrim('lsection', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreateTSection: function(e) {
				_Editor.CreatePrim('tsection', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreateTurtle: function(e) {
				_Editor.CreateTurtle('turtle', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreateTerrain: function(e) {
				if (!window._dTerrain)
					_Editor.CreatePrim('terrain', [0, 0, 0], [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
				else {
					alertify.alert('Only one terrain can be created at a time');
				}
			},
			MenuCreateTerrainOcean: function(e) {
				var def = {
				    "extends": "ocean/ocean.vwf",
				    "properties": {
				        "DisplayName": "OceanShader",
				        "gA": 0.092,
				        "transform": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
				        "uChop": 0.733,
				        "uNormalPower": 0.184,
				        "uOceanDepth": 0.037,
				        "uReflectPow": 3,
				        "waterHeight" :1
				    },
				    "source": "ocean/ocean.js",
				    "type": "subDriver/threejs"
				}
				_Editor.createChild(Engine.application(),GUID(),def);
			},

			MenuAssets3DRUpload: function(e) {
				_ModelLibrary.showUpload();
			},
			MenuConsole:function()
			{
				logger.open();
			},
			MenuUndo: function(e) {
				_UndoManager.undo();
			},
			MenuRedo: function(e) {
				_UndoManager.redo();
			},

			MenuCreateLoadMeshURL: function(e) {
				alertify.choice("Choose the mesh format", function(ok, type) {

					if (ok) {
						alertify.prompt('Input a URL to the mesh. Please note: this must serve from a CORS capable host!', function(ok, val) {
							if (ok) {
								if (type == 'Collada')
									_Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.collada+xml');
							//	if (type == 'Optimized Collada')  // Lets remove this until we know the use case better
							//		_Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.collada+xml+optimized');
								if (type == '3DR JSON (http://3dr.adlnet.gov)')
									_Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.osgjs+json+compressed');
								if (type == 'glTF (v0.6) JSON')
									_Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.gltf+json');
								if (type == 'Three.js Native JSON')
									_Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.three.js+json');
								if (type == 'Wavefront OBJ (.obj)')
									_Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.wavefront-obj');
							}
						}, 'http://');
					}

				}, ["Collada", "3DR JSON (http://3dr.adlnet.gov)", "glTF (v0.6) JSON", 'Three.js Native JSON','Wavefront OBJ (.obj)'])

			},

			MenuCreateContinuesNode: function(e){
				alertify.prompt('Input a URL to an entity JSON body.', function(ok, val){
					if(ok && val){
						Engine.createChild('index-vwf', GUID(), {continues: val});
					}
				});
			},


			MenuCreateEmpty: function(e) {
				_Editor.CreatePrim('node', _Editor.GetInsertPoint(), null, null, _UserManager.GetCurrentUserName(), '');
			},
			MenuCreateSphere: function(e) {
				_Editor.CreatePrim('sphere', _Editor.GetInsertPoint(), [.5, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},

			MenuCreateText: function(e) {
				_Editor.CreatePrim('text', _Editor.GetInsertPoint(), [.5, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreateTorus: function(e) {
				_Editor.CreatePrim('torus', _Editor.GetInsertPoint(), [.5, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreatePlane: function(e) {
				_Editor.CreatePrim('plane', _Editor.GetInsertPoint(), [1, 1, 5], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreateText2D: function(e) {
				_Editor.CreatePrim('text2D', _Editor.GetInsertPoint(), [1, 1, 5], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreateCylinder: function(e) {
				_Editor.CreatePrim('cylinder', _Editor.GetInsertPoint(), [1, .5, .5], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreateCone: function(e) {
				_Editor.CreatePrim('cone', _Editor.GetInsertPoint(), [.500, 1, .5], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},
			MenuCreatePyramid: function(e) {
				_Editor.CreatePrim('pyramid', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
			},

			LocationGoToPosition: function(e) {
				_LocationTools.GoToPosition();
			},

			LocationGoToPlacemark: function(e) {
				_LocationTools.GoToPlaceMark();
			},

			LocationAddPlacemark: function(e) {
				_LocationTools.AddPlacemark();
			},

			ToolsShowID: function(e) {
				if (_Editor.GetSelectedVWFID())
					alertify.prompt(Engine.getProperty(_Editor.GetSelectedVWFID(), "DisplayName") || "No DisplayName", function() {}, _Editor.GetSelectedVWFID());
				else
					alertify.alert('No Selection');
			},
			ToolsShowVWF: function() {
				p = require("vwf/view/editorview/JSONPrompt");
				var ID = _Editor.GetSelectedVWFID();
				if(ID)
				{
					var data = _DataManager.getCleanNodePrototype(ID);
					p.prompt(data);
				}
			},
			ToolsShowVWFSaveData: function()
			{
				p = require("vwf/view/editorview/JSONPrompt");
				var data = _DataManager.getSaveStateData();
				p.prompt(data);

			},
			MenuObjectCenters:function()
			{
				var off = !_Editor.GetMoveGizmo().transformOffsets;
				_Editor.GetMoveGizmo().setApplyOffset(off);
				$scope.fields.useObjectCenters = off;
			},
			LocationMoveToGround: function(e) {
				_LocationTools.MoveToGround();
			},

			MenuCreateTerrainGrass: function(e) {
				try {
					var parent = _dTerrain.ID;
				}
				catch(e){
					alertify.alert('The scene must first contain a terrain object');
					return;
				}

				var GrassProto = {
					extends: 'http://vwf.example.com/node3.vwf',
					properties: {}
				};
				GrassProto.type = 'subDriver/threejs';
				GrassProto.source = 'vwf/model/threejs/' + 'terrainDecorationManager' + '.js';

				GrassProto.properties.owner = _UserManager.GetCurrentUserName();
				GrassProto.properties.DisplayName = _Editor.GetUniqueName('Grass');
				_Editor.createChild(parent, GUID(), GrassProto, null, null);

			},

			MenuViewRenderNormal: function(e) {
				_dView.setRenderModeNormal();
				require("vwf/view/threejs/editorCameraController").getController('Orbit').orbitPoint(newintersectxy);
				require("vwf/view/threejs/editorCameraController").setCameraMode('Orbit');
				require("vwf/view/threejs/editorCameraController").updateCamera();
			},
			MenuViewRenderStereo: function(e) {
				_dView.setRenderModeStereo()
			},
			 MenuViewRenderVR: function(e) {

				if (navigator.getVRDevices) {
						_dView.setRenderModeVR();
						require("vwf/view/threejs/editorCameraController").setCameraMode('VR');
				}else
				{
					alertify.alert("WebVR is not supported on this browser.");
				}
			},

			TestSettings: function(e) {
				if(window._Publisher)
				_Publisher.show();
			},

			TestLaunch: function(e) {
				if(window._Publisher)
				_Publisher.testPublish();
			},
			MenuViewTabletDemo: function(e) {
				$('#MenuViewRenderStereo').click();
				$('#MenuCameraDeviceOrientation').click();
				$('#MenuViewFullscreen').click();
			}
		};

		return handlers;
	});

	return {
		initialize: function()
		{
			//$(document.body).append('');
			window.menus = ddsmoothmenu.init({
				mainmenuid: "smoothmenu1", //menu DIV id
				orientation: 'h', //Horizontal or vertical menu: Set to "h" or "v"
				classname: 'ddsmoothmenu', //class added to menu's outer DIV
				//customtheme: ["#1c5a80", "#18374a"],
				contentsource: "markup", //"markup" or ["container_id", "path_to_menu_file"]
				method: 'hover'
			});

			$(document).on('setstatecomplete', function() {


				//lets try to grab a screenshot if it's not set already

				if (Engine.getProperty('index-vwf', 'owner') != _UserManager.GetCurrentUserName()) {
					//don't bother if this is not the owner
					return;
				}

				window.setTimeout(function() {

					//only set the thumb automatically if the user has not specified one
					if(!_DataManager.getInstanceData().userSetThumbnail)
						window.setThumbnail(true);

				}, 10000)

				//let's warn people that they have to hit stop
				 $('#stopButton').tooltip('open');
				window.setTimeout(function() {
					$('#stopButton').tooltip('close');
				}, 2000)


			});

			window.setThumbnail = function(auto) {

				if(!window._dRenderer)
					return;
				if (Engine.getProperty('index-vwf', 'owner') != _UserManager.GetCurrentUserName()) {
					alertify.alert('Sorry, only the world owner can set the thumbnail');
					return;
				}
				var resolutionScale = _SettingsManager.getKey('resolutionScale')  ;
				_dRenderer.setSize(600, 300);
				var camera = _dView.getCamera();
				camera.aspect = 2;
				camera.updateProjectionMatrix();

				window.takeimage = function() {

					var img = $('#index-vwf')[0].toDataURL();

					$('#index-vwf').css('width', '');
					$('#index-vwf').css('height', '');

					window._resizeCanvas();

					/*_dRenderer.setViewport(0,0, w, h);
					camera.aspect = a;
					camera.updateProjectionMatrix();
					$('#index-vwf')[0].height = h / resolutionScale;
					$('#index-vwf')[0].width = w / resolutionScale;
					if(window._dRenderer)
						_dRenderer.setViewport(0, 0, w / resolutionScale, h / resolutionScale)

					//note, this changes some renderer internals that need to be set, but also resizes the canvas which we don't want.
					//much of the resize code is in WindowResize.js
					if(window._dRenderer)
						_dRenderer.setSize(w / resolutionScale, h / resolutionScale);

					$('#index-vwf').css('height', h);
					$('#index-vwf').css('width', w);
					*/

					jQuery.ajax({
						type: 'POST',
						url: './vwfDataManager.svc/thumbnail?SID=' + _DataManager.getCurrentSession().replace(/\//g, '_') +'&auto=' + auto,
						data: JSON.stringify({
							image: img
						}),
						contentType: "application/json; charset=utf-8",
						success: function(data, status, xhr) {

						},
						error: function(xhr, status, err) {


						},
						dataType: "text"
					});
					_dView.unbind('postrender', takeimage);
					//$(window).resize();
				}
				_dView.bind('postrender', takeimage);



			}

			// load asset manager
			manageAssets.initialize();
		}
	};
});
