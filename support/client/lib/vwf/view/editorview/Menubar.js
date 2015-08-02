function clearCameraModeIcons() {
    $('#MenuCameraOrbiticon').removeClass('iconselected');
    $('#MenuCamera3RDPersonicon').removeClass('iconselected');
    $('#MenuCameraNavigateicon').removeClass('iconselected');
    $('#MenuCameraFreeicon').removeClass('iconselected');
}


define(['vwf/view/editorview/manageAssets'], function(manageAssets)
{
	function updateMenuState()
	{
		function nodeInherits(node, ancestor)
		{
			if(!node)
				return false;
			else if(node == ancestor)
				return true;
			else
				return nodeInherits( vwf.prototype(node), ancestor );
		}

		var node = _Editor.GetSelectedVWFNode(),
			selection = !!node,
			hasMaterial = !!(node && node.properties && node.properties.materialDef),
			isBehavior = !!(node && nodeInherits(node.id, 'http-vwf-example-com-behavior-vwf')),
			isEntityAsset = !!(node && node.properties && node.properties.sourceAssetId),
			isMaterialAsset = !!(node && node.properties && node.properties.materialDef && node.properties.materialDef.sourceAssetId),
			isGroup = !!(node && nodeInherits(node.id, 'sandboxGroup-vwf')),
			loggedIn = !!_UserManager.GetCurrentUserName(),
			hasAvatar = !!(loggedIn && _UserManager.GetAvatarForClientID(vwf.moniker())),
			isExample = !!_DataManager.getInstanceData().isExample,
			userIsOwner = _UserManager.GetCurrentUserName() == _DataManager.getInstanceData().owner,
			worldIsPersistent = _DataManager.getInstanceData().publishSettings.persistence,
			worldIsSinglePlayer = _DataManager.getInstanceData().publishSettings.SinglePlayer,
			worldHasTerrain = !!window._dTerrain;

		$('#MenuLogIn').parent()
			.toggleClass('disabled', loggedIn);
		$('#MenuLogOut').parent()
			.toggleClass('disabled', !loggedIn);
		$('#MenuShareWorld').parent()
			.toggleClass('disabled', isExample);
		$('#SetThumbnail').parent()
			.toggleClass('disabled', isExample || !userIsOwner);
		$('#TestSettings').parent()
			.toggleClass('disabled', isExample || !userIsOwner);
		$('#TestLaunch').parent()
			.toggleClass('disabled', !(worldIsPersistent && userIsOwner) || worldIsSinglePlayer || isExample);

		$('#MenuCreateTerrainGrass').parent()
			.toggleClass('disabled', !worldHasTerrain);

		$('#MenuCopy').parent()
			.toggleClass('disabled', !selection);
		$('#MenuDuplicate').parent()
			.toggleClass('disabled', !selection);
		$('#MenuDelete').parent()
			.toggleClass('disabled', !selection);

		$('#MenuCopy').parent()
			.toggleClass('disabled', !selection);
		$('#MenuDuplicate').parent()
			.toggleClass('disabled', !selection);
		$('#MenuDelete').parent()
			.toggleClass('disabled', !selection);

		$('#MenuAssetsSaveAsEntity').parent()
			.toggleClass('disabled', !selection);
		$('#MenuAssetsSaveAsMaterial').parent()
			.toggleClass('disabled', !hasMaterial);
		$('#MenuAssetsSaveAsBehavior').parent()
			.toggleClass('disabled', !isBehavior);
		$('#MenuAssetsSave').parent()
			.toggleClass('disabled', !isEntityAsset && !isMaterialAsset);
		$('#MenuAssetsSaveEntity').parent()
			.toggleClass('disabled', !isEntityAsset || !selection);
		$('#MenuAssetsSaveMaterial').parent()
			.toggleClass('disabled', !isMaterialAsset || !hasMaterial);
		$('#MenuAssetsSaveBehavior').parent()
			.toggleClass('disabled', !isEntityAsset || !isBehavior);

		$('#MenuFocusSelected').parent()
			.toggleClass('disabled', !selection);

		$('#MenuHierarchy').parent()
			.toggleClass('disabled', !selection);
		$('#MenuUngroup').parent()
			.toggleClass('disabled', !isGroup);
		$('#MenuOpenGroup').parent()
			.toggleClass('disabled', !isGroup);
		$('#MenuCloseGroup').parent()
			.toggleClass('disabled', !isGroup);

		$('#MenuLocation').parent()
			.toggleClass('disabled', !hasAvatar);
		$('#MenuAlign').parent()
			.toggleClass('disabled', !selection);
		$('#MenuSplineTools').parent()
			.toggleClass('disabled', !selection);
		$('#ToolsShowID').parent()
			.toggleClass('disabled', !selection);
		$('#ToolsShowVWF').parent()
			.toggleClass('disabled', !selection);
	}

	return {
        updateMenuState: updateMenuState,

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
    
                if (vwf.getProperty('index-vwf', 'owner') != _UserManager.GetCurrentUserName()) {
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
                if (vwf.getProperty('index-vwf', 'owner') != _UserManager.GetCurrentUserName()) {
                    alertify.alert('Sorry, only the world owner can set the thumbnail');
                    return;
                }
                var resolutionScale = _SettingsManager.getKey('resolutionScale')  ;
                var h = parseInt($('#index-vwf').css('height'));
                var w = parseInt($('#index-vwf').css('width'));
                _dRenderer.setSize(600, 300);
                var camera = _dView.getCamera();
                var a = camera.aspect;
                camera.aspect = 2;
                camera.updateProjectionMatrix();
    
                window.takeimage = function() {
    
                    var img = $('#index-vwf')[0].toDataURL();
                    _dRenderer.setSize(w, h);
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

			// determine disabled status when selection changes
			$(document).on('selectionChanged', updateMenuState);

			// load asset manager
			manageAssets.initialize();

			// hook up assets menu
            $('#MenuManageAssets').click(function(e){
				manageAssets.refreshData();
                $('#manageAssetsDialog').dialog('open');
            });

			$('#MenuAssetsSaveAsEntity').click(function(e){
				manageAssets.refreshData();
				manageAssets.uploadSelectedEntity();
                $('#manageAssetsDialog').dialog('open');
			});

			$('#MenuAssetsSaveAsMaterial').click(function(e){
				manageAssets.refreshData();
				manageAssets.uploadSelectedMaterial();
                $('#manageAssetsDialog').dialog('open');
			});

			$('#MenuAssetsSaveAsBehavior').click(function(e){
				manageAssets.refreshData();
				manageAssets.uploadSelectedBehavior();
                $('#manageAssetsDialog').dialog('open');
			});

			$('#MenuAssetsSaveAsFile').click(function(e){
				manageAssets.refreshData();
				manageAssets.uploadFile();
                $('#manageAssetsDialog').dialog('open');
			});

			$('#MenuAssetsSaveEntity').click(function(e){
				manageAssets.refreshData(function(){
					manageAssets.uploadSelectedEntity(true);
				});
                $('#manageAssetsDialog').dialog('open');
			});

			$('#MenuAssetsSaveMaterial').click(function(e){
				manageAssets.refreshData(function(){
					manageAssets.uploadSelectedMaterial(true);
				});
                $('#manageAssetsDialog').dialog('open');
			});

			$('#MenuAssetsSaveBehavior').click(function(e){
				manageAssets.refreshData(function(){
					manageAssets.uploadSelectedBehavior(true);
				});
                $('#manageAssetsDialog').dialog('open');
			});



            $('#SetThumbnail').click(function(e) {
                window.setThumbnail(false);
            });
    
            $('#MenuCreateGUIDialog').click(function(e) {
                _GUIView.createDialog();
            });
            $('#MenuCreateGUIButton').click(function(e) {
                _GUIView.createButton();
            });
            $('#MenuCreateGUILabel').click(function(e) {
                _GUIView.createLabel();
            });
            $('#MenuCreateGUISlider').click(function(e) {
                _GUIView.createSlider();
            });
            $('#MenuCreateGUICheck').click(function(e) {
                _GUIView.createCheckbox();
            });
            $('#MenuCreateGUIPanel').click(function(e) {
                _GUIView.createPanel();
            });
            $('#MenuCreateGUIImage').click(function(e) {
                _GUIView.createImage();
            });
    
    
            $('#MenuEn').click(function(e) {
                i18n.setLng('en', function(t) { /* loading done */ });
                location.reload();
            });
    
            $('#MenuRu').click(function(e) {
                i18n.setLng('ru', function(t) { /* loading done */ });
                location.reload();
    
            });
            $('#MenuEs_ES').click(function(e) {
                i18n.setLng('es_ES', function(t) { /* loading done */ });
                location.reload();
            });
    
    
            //make the menu items disappear when you click one
            //$(".ddsmoothmenu").find('li').click(function(){$(".ddsmoothmenu").find('li').trigger('mouseleave');});
            $('#MenuLogOut').attr('disabled', 'true');
            $('#MenuLogIn').click(function(e) {
                if ($('#MenuLogIn').attr('disabled') == 'disabled') return;
                _UserManager.showLogin();
            });
            $('#MenuSaveNow').click(function(e) {
                _DataManager.saveToServer();
            });
    
    
    
    
            $('#MenuShareWorld').click(function(e) {
    
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
    
            });
    
            $('#MenuLogOut').click(function(e) {
                if ($('#MenuLogOut').attr('disabled') == 'disabled') return;
                window.location = window.location.pathname.replace('/sandbox/', '/sandbox/world/');
            });
            $('#MenuSelectPick').click(function(e) {
                _Editor.SetSelectMode('Pick');
            });
            $('#MenuSelectNone').click(function(e) {
                _Editor.SelectObject(null);
    
            });
            $('#MenuMove').click(function(e) {
                _Editor.SetGizmoMode(_Editor.Move);
                $('#MenuRotateicon').removeClass('iconselected');
                $('#MenuScaleicon').removeClass('iconselected');
                $('#MenuMoveicon').addClass('iconselected');
            });
            $('#MenuRotate').click(function(e) {
                _Editor.SetGizmoMode(_Editor.Rotate);
                $('#MenuRotateicon').addClass('iconselected');
                $('#MenuScaleicon').removeClass('iconselected');
                $('#MenuMoveicon').removeClass('iconselected');
            });
            $('#MenuScale').click(function(e) {
                _Editor.SetGizmoMode(_Editor.Scale);
                $('#MenuRotateicon').removeClass('iconselected');
                $('#MenuScaleicon').addClass('iconselected');
                $('#MenuMoveicon').removeClass('iconselected');
            });
            $('#MenuMulti').click(function(e) {
                _Editor.SetGizmoMode(_Editor.Multi);
            });
            $('#MenuShare').click(function(e) {
                _PermissionsManager.show();
            });
            $('#MenuSetParent').click(function(e) {
                _Editor.SetParent();
            });
            $('#MenuSelectScene').click(function(e) {
                _Editor.SelectScene();
            });
            $('#MenuRemoveParent').click(function(e) {
                _Editor.RemoveParent();
            });
            $('#MenuSelectParent').click(function(e) {
                _Editor.SelectParent();
            });
            $('#MenuHierarchyManager').click(function(e) {
                if (HierarchyManager.isOpen())
                    HierarchyManager.hide();
                else
                    HierarchyManager.show();
            });
            $('#MenuLocal').click(function(e) {
                _Editor.SetCoordSystem(_Editor.LocalCoords);
                if (_Editor.GetMoveGizmo()) _Editor.updateGizmoOrientation(true);
            });
            $('#MenuWorld').click(function(e) {
                _Editor.SetCoordSystem(_Editor.WorldCoords);
                if (_Editor.GetMoveGizmo()) _Editor.updateGizmoOrientation(true);
            });
            $('#MenuDelete').click(function(e) {
                _Editor.DeleteSelection();
            });
            $('#MenuChat').click(function(e) {
                $('#ChatWindow').dialog('open');
            });
            $('#MenuUsers').click(function(e) {
               _UserManager.showPlayers();
            });
            $('#MenuAssets3DRBrowse').click(function(e) {
                _ModelLibrary.show();
            });
            $('#MenuSnapLarge').click(function(e) {
                _Editor.SetSnaps(1, 15 * 0.0174532925, .15);
            });
            $('#MenuSnapMedium').click(function(e) {
                _Editor.SetSnaps(.5, 5 * 0.0174532925, .05);
            });
            $('#MenuSnapSmall').click(function(e) {
                _Editor.SetSnaps(.25, 1 * 0.0174532925, .01);
            });
            $('#MenuSnapOff').click(function(e) {
                _Editor.SetSnaps(.001, .01 * 0.0174532925, .00005);
            });
            $('#MenuMaterialEditor').click(function(e) {
    
                if (_MaterialEditor.isOpen())
                    _MaterialEditor.hide();
                else
                    _MaterialEditor.show();
            });
            $('#MenuScriptEditor').click(function(e) {
                if (_ScriptEditor.isOpen())
                    _ScriptEditor.hide();
                else
                    _ScriptEditor.show();
            });
    
    
            $('#MenuPhysicsEditor').click(function(e) {
    
                if (_PhysicsEditor.isOpen())
                    _PhysicsEditor.hide();
                else
                    _PhysicsEditor.show();
            });
    
            $('#MenuObjectProperties').click(function(e) {
    
                if (_PrimitiveEditor.isOpen())
                    _PrimitiveEditor.hide();
                else
                    _PrimitiveEditor.show();
            });
            $('#MenuLatencyTest').click(function(e) {
                var e = {};
                e.time = new Date();
                vwf_view.kernel.callMethod('index-vwf', 'latencyTest', [e]);
            });
            $('#ResetTransforms').click(function(e) {
                _Editor.ResetTransforms();
            });
            $('#MenuCopy').click(function(e) {
                _Editor.Copy();
            });
    
    
            $('#MenuSelectName').click(function(e) {
                _SelectionEditor.Show();
            });
    
            $('#MenuPaste').click(function(e) {
                _Editor.Paste();
            });
            $('#MenuDuplicate').click(function(e) {
                _Editor.Duplicate();
            });
            $('#MenuCreatePush').click(function(e) {
                _Editor.CreateModifier('push', _UserManager.GetCurrentUserName(), true);
            });
            $('#MenuCreateExtrude').click(function(e) {
                _Editor.CreateModifier('extrude', _UserManager.GetCurrentUserName(), true);
            });
             $('#MenuCreatePathExtrude').click(function(e) {
                _Editor.CreateModifier('pathextrude', _UserManager.GetCurrentUserName(), true);
            });
            $('#MenuCreateLathe').click(function(e) {
                _Editor.CreateModifier('lathe', _UserManager.GetCurrentUserName(), true);
            });
            $('#MenuCreateTaper').click(function(e) {
                _Editor.CreateModifier('taper', _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateBend').click(function(e) {
                _Editor.CreateModifier('bend', _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateTwist').click(function(e) {
                _Editor.CreateModifier('twist', _UserManager.GetCurrentUserName());
            });
    
            $('#MenuCreateUVMap').click(function(e) {
                _Editor.CreateModifier('uvmap', _UserManager.GetCurrentUserName(), true);
            });
            $('#MenuCreateCenterPivot').click(function(e) {
                _Editor.CreateModifier('centerpivot', _UserManager.GetCurrentUserName(), true);
            });
            $('#MenuCreatePerlinNoise').click(function(e) {
                _Editor.CreateModifier('perlinnoise', _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateSimplexNoise').click(function(e) {
                _Editor.CreateModifier('simplexnoise', _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateOffset').click(function(e) {
                _Editor.CreateModifier('offset', _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateStretch').click(function(e) {
                _Editor.CreateModifier('stretch', _UserManager.GetCurrentUserName());
            });
    
            $('#MenuCreateBehaviorRotator').click(function(e) {
                _Editor.CreateBehavior('rotator', _UserManager.GetCurrentUserName());
            });
    
            $('#MenuCreateBehaviorDialog').click(function(e) {
                _Editor.CreateBehavior('DialogSystem', _UserManager.GetCurrentUserName());
            });
    
    
            $('#MenuCreateBehaviorOrbit').click(function(e) {
                _Editor.CreateBehavior('orbit', _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateBehaviorHyperlink').click(function(e) {
                _Editor.CreateBehavior('hyperlink', _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateBehaviorHoverlabel').click(function(e) {
                _Editor.CreateBehavior('hoverlabel', _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateBehaviorLookat').click(function(e) {
                _Editor.CreateBehavior('lookat', _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateBehaviorOneClick').click(function(e) {
                _Editor.CreateBehavior('oneClick', _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateBehaviorSeek').click(function(e) {
                _Editor.CreateBehavior('seek', _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateBehaviorPathFollow').click(function(e) {
                _Editor.CreateBehavior('pathfollow', _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateBehaviorClampToGround').click(function(e) {
                _Editor.CreateBehavior('clamptoground', _UserManager.GetCurrentUserName());
            });
    
            $('#MenuPhysicsPointConstraint').click(function(e) {
                _Editor.CreatePhysicsConstraint('point', _UserManager.GetCurrentUserName());
            });
            $('#MenuPhysicsHingeConstraint').click(function(e) {
                _Editor.CreatePhysicsConstraint('hinge', _UserManager.GetCurrentUserName());
            });
            $('#MenuPhysicsSliderConstraint').click(function(e) {
                _Editor.CreatePhysicsConstraint('slider', _UserManager.GetCurrentUserName());
            });
            $('#MenuPhysicsFixedConstraint').click(function(e) {
                _Editor.CreatePhysicsConstraint('fixed', _UserManager.GetCurrentUserName());
            });
    
    
            
    
            //trigger section
            $('#MenuCreateTriggerDistance').click(function(e) {
                _Editor.CreateBehavior('distancetrigger', _UserManager.GetCurrentUserName());
            });
    
            //trigger section
            $('#MenuCreateTriggerProperty').click(function(e) {
                _Editor.CreateBehavior('propertytrigger', _UserManager.GetCurrentUserName());
            });
    
            //trigger section
            $('#MenuCreateTriggerMethod').click(function(e) {
                _Editor.CreateBehavior('methodtrigger', _UserManager.GetCurrentUserName());
            });
    
    
    
            $('#MenuHelpBrowse').click(function(e) {
                window.open('http://sandboxdocs.readthedocs.org/en/latest/', '_blank');
            });
            $('#MenuHelpAbout').click(function(e) {
                $('#NotifierAlertMessage').dialog('open');
                $('#NotifierAlertMessage').load("./about.html");
                $('#NotifierAlertMessage').dialog('option', 'height', 'auto');
                $('#NotifierAlertMessage').dialog('option', 'width', 'auto');
            });
            $('#MenuSave').click(function(e) {
                _DataManager.save();
            });
            $('#MenuSaveAs').click(function(e) {
                _DataManager.saveAs();
            });
            $('#MenuLoad').click(function(e) {
                _DataManager.load();
            });
            $('#ChatInput').keypress(function(e) {
                e.stopPropagation();
                
            });
            $('#ChatInput').keydown(function(e) {
                e.stopPropagation();
            });
            $('#MenuCreateBlankBehavior').click(function(e) {
                _Editor.AddBlankBehavior();
            });
            $('#MenuViewGlyphs').click(function(e) {
                if ($('#glyphOverlay').css('display') == 'block') {
                    $('#glyphOverlay').hide();
                    _Notifier.notify('Glyphs hidden');
                } else {
                    $('#glyphOverlay').show();
                    _Notifier.notify('Glyphs displayed');
                }
            });
    
            
            $('#MenuViewOctree').click(function(e) {
                _SceneManager.setShowRegions(!_SceneManager.getShowRegions());
            });
            $('#MenuViewStats').click(function(e) {
                if (window.stats.domElement.style.display == 'none')
                    window.stats.domElement.style.display = 'block';
                else
                    window.stats.domElement.style.display = 'none';
            });
            $('#MenuViewShadows').click(function(e) {
                var val = !_Editor.findscene().children[1].castShadows;
                _Editor.findscene().children[1].setCastShadows(val);
            });
            $('#MenuViewBatchingForce').click(function(e) {
                _Editor.findscene().buildBatches(true);
            });
            $('#MenuViewStaticBatching').click(function(e) {
                _Editor.findscene().staticBatchingEnabled = !_Editor.findscene().staticBatchingEnabled;
                if (!_Editor.findscene().staticBatchingEnabled) {
                    _SceneManager.forceUnbatchAll();
                    _Notifier.notify('static batching disabled');
                } else {
                    _Notifier.notify('static batching enabled');
                }
            });
            $('#MenuGroup').click(function(e) {
                _Editor.GroupSelection();
            });
            $('#MenuUngroup').click(function(e) {
                _Editor.UngroupSelection();
            });
            $('#MenuOpenGroup').click(function(e) {
                _Editor.OpenGroup();
            });
            $('#MenuCloseGroup').click(function(e) {
                _Editor.CloseGroup();
            });
            $('#MenuAlign').click(function(e) {
                _AlignTool.show();
            });
            $('#MenuBlockPainter').click(function(e) {
                _PainterTool.show();
            });
            $('#MenuSnapMove').click(function(e) {
                _SnapMoveTool.show();
            });
            $('#MenuSplineTools').click(function(e) {
                _SplineTool.show();
    
            });
    
            $('#MenuViewInterpolation').click(function(e) {
                _dView.interpolateTransforms = !_dView.interpolateTransforms;
                if (!_dView.interpolateTransforms)
                    alertify.log('Animation interpolation disabled');
                else
                    alertify.log('Animation interpolation enabled');
            });
            $('#MenuViewToggleWireframe').click(function(e) {
    
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
            });
            $('#MenuViewTogglePhysics').click(function(e) {
               _PhysicsEditor.toggleWorldPreview()
            });
    
            $('#MenuViewToggleBones').click(function(e) {
                if (_SceneManager.getBonesVisible())
                    _SceneManager.hideBones();
                else
                    _SceneManager.showBones();
    
            })
    
            $('#MenuViewToggleAO').click(function(e) {
                if (_Editor.findscene().getFilter2d()) {
                    _Editor.findscene().setFilter2d();
                } else {
                    var ao = new MATH.FilterAO();
                    _Editor.findscene().setFilter2d(ao)
                }
            });
    
            function focusSelected() {
                _Editor.focusSelected();
            }
    
            $('#MenuActivateCamera').click(function(e) {
                _dView.chooseCamera();
            });
            $('#MenuFocusSelected').click(function(e) {
                _dView.setCameraDefault();
                focusSelected();
            });
            $('#MenuCameraOrbit').click(function(e) {

                _dView.setCameraDefault();
                clearCameraModeIcons();
                $('#MenuCameraOrbiticon').addClass('iconselected');
                var campos = [_Editor.findcamera().position.x, _Editor.findcamera().position.y, _Editor.findcamera().position.z];
                var ray = _Editor.GetCameraCenterRay();
                var dxy = _Editor.intersectLinePlane(ray, campos, [0, 0, 0], _Editor.WorldZ);
                var newintersectxy = MATH.addVec3(campos, MATH.scaleVec3(ray, dxy));
                require("vwf/view/threejs/editorCameraController").getController('Orbit').orbitPoint(newintersectxy);
                require("vwf/view/threejs/editorCameraController").setCameraMode('Orbit');
                require("vwf/view/threejs/editorCameraController").updateCamera();
            });
            // click events for touching sub menus
            $('#MenuViewBatching,#MenuParticles,#MenuLights,#MenuModifiers,#MenuGrouping,#MenuPrimitives,#MenuTransforms,#MenuSnaps,#MenuSelect').click(function(e) {
                $(this).mouseenter();
            });
    
            $('#MenuCameraNavigate').click(function(e) {
                _dView.setCameraDefault();
                clearCameraModeIcons();
                $('#MenuCameraNavigateicon').addClass('iconselected');
                require("vwf/view/threejs/editorCameraController").setCameraMode('Orbit');
                require("vwf/view/threejs/editorCameraController").setCameraMode('Navigate');
            });
    
            $('#MenuCameraDeviceOrientation').click(function(e) {
                _dView.setCameraDefault();
                clearCameraModeIcons();
                require("vwf/view/threejs/editorCameraController").setCameraMode('DeviceOrientation');
            });
            $('#MenuViewHideTools').click(function(e) {
                hideTools();
            });
    
    
    
            $('#MenuCameraReceive').click(function()
            {
                _dView.receiveSharedCameraView();
            });
            $('#MenuCameraReceiveCancel').click(function()
            {
                $('#MenuCameraOrbit').click();
            });
    
            
            $('#MenuCameraShare').click(function(e) {
                if (!_UserManager.GetCurrentUserName()) {
                    alertify.confirm("Anonymous users may not share their camera view.", function(ok) {});
                }
                var broadcasting = _dView.shareCamera;
                if (!broadcasting) {
    
                    alertify.confirm("Are you sure you want to share your camera position? Other users will be able to see from your camera!", function(ok) {
                        if (ok) {
                            _dView.shareCameraView();
                            $('#MenuCameraShare').text('Stop Camera Sharing');
                        }
                    }.bind(this));
                } else {
                    alertify.confirm("You are currently sharing your camera view. Would you like to stop sharing?", function(ok) {
                        if (ok) {
                            _dView.stopShareCameraView();
                            $('#MenuCameraShare').text('Share Camera View');
    
                        }
                    }.bind(this));
    
                }

            });
    
            $('#MenuCameraFly').click(function(e) {
                _dView.setCameraDefault();
                clearCameraModeIcons();
                $('#MenuCameraNavigateicon').addClass('iconselected');
                require("vwf/view/threejs/editorCameraController").setCameraMode('Fly');
    
            });
    
            $('#MenuCameraNone').click(function(e) {
                _dView.setCameraDefault();
                clearCameraModeIcons();
                require("vwf/view/threejs/editorCameraController").setCameraMode('None');
            });
            $('#MenuCameraFree').click(function(e) {
                _dView.setCameraDefault();
                clearCameraModeIcons();
                $('#MenuCameraFreeicon').addClass('iconselected');
                require("vwf/view/threejs/editorCameraController").setCameraMode('Orbit');
                require("vwf/view/threejs/editorCameraController").setCameraMode('Free');
            });
            
    
            
            $('#MenuViewFullscreen').click(function(e) {
               _dView.toggleFullScreen();
            });
            $('#MenuCamera3RDPerson').click(function(e) {
    
                if (_UserManager.GetCurrentUserName()) {
                    _dView.setCameraDefault();
                    clearCameraModeIcons();
                    $('#MenuCamera3RDPersonicon').addClass('iconselected');
                    require("vwf/view/threejs/editorCameraController").getController('Orbit').followObject(vwf.models[0].model.nodes[_UserManager.GetCurrentUserID()]);
                    require("vwf/view/threejs/editorCameraController").setCameraMode('3RDPerson');
                } else {
                    _Notifier.alert('First person mode is not available when you are not logged in.');
                }
            });
    
    
            $('#MenuCreateCameraPerspective').click(function(e) {
                _Editor.CreateCamera(_Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateParticlesBasic').click(function(e) {
                _Editor.createParticleSystem('basic', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateParticlesSpray').click(function(e) {
                _Editor.createParticleSystem('spray', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateParticlesSuspended').click(function(e) {
                _Editor.createParticleSystem('suspended', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateParticlesAtmospheric').click(function(e) {
                _Editor.createParticleSystem('atmospheric', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateLightPoint').click(function(e) {
                _Editor.createLight('point', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateLightSpot').click(function(e) {
                _Editor.createLight('spot', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateLightDirectional').click(function(e) {
                _Editor.createLight('directional', _Editor.GetInsertPoint(), _UserManager.GetCurrentUserName());
            });
            $('#MenuCreateBox').click(function(e) {
                _Editor.CreatePrim('box', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
            $('#MenuCreateLine').click(function(e) {
                _Editor.CreatePrim('line', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
            $('#MenuCreateCircle').click(function(e) {
                _Editor.CreatePrim('circle', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
            $('#MenuCreateStar').click(function(e) {
                _Editor.CreatePrim('star', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
            $('#MenuCreateRectangle').click(function(e) {
                _Editor.CreatePrim('rectangle', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
            $('#MenuCreateLSection').click(function(e) {
                _Editor.CreatePrim('lsection', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
            $('#MenuCreateTSection').click(function(e) {
                _Editor.CreatePrim('tsection', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
            $('#MenuCreateTerrain').click(function(e) {
                if (!window._dTerrain)
                    _Editor.CreatePrim('terrain', [0, 0, 0], [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
                else {
                    alertify.alert('Only one terrain can be created at a time');
                }
            });
    
            $('#MenuAssets3DRUpload').click(function(e) {
                _ModelLibrary.showUpload();
            });
    
    
            $('#MenuUndo').click(function(e) {
                _UndoManager.undo();
            });
            $('#MenuRedo').click(function(e) {
                _UndoManager.redo();
            });
    
            $('#MenuCreateLoadMeshURL').click(function(e) {
                alertify.choice("Choose the mesh format", function(ok, type) {
    
                    if (ok) {
                        alertify.prompt('Input a URL to the mesh. Please note: this must serve from a CORS capable host!', function(ok, val) {
                            if (ok) {
                                if (type == 'Collada')
                                    _Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.collada+xml');
                            //    if (type == 'Optimized Collada')  // Lets remove this until we know the use case better
                            //        _Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.collada+xml+optimized');
                                if (type == '3DR JSON (http://3dr.adlnet.gov)')
                                    _Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.osgjs+json+compressed');
                                if (type == 'glTF (v0.6) JSON')
                                    _Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.gltf+json');
                                if (type == 'Three.js Native JSON')
                                    _Editor.loadMesh(val, 'subDriver/threejs/asset/vnd.three.js+json');
                            }
                        }, 'http://');
                    }
    
                }, ["Collada", "3DR JSON (http://3dr.adlnet.gov)", "glTF (v0.6) JSON", 'Three.js Native JSON'])
    
            });
    
    
            $('#MenuCreateEmpty').click(function(e) {
                _Editor.CreatePrim('node', _Editor.GetInsertPoint(), null, null, _UserManager.GetCurrentUserName(), '');
            });
            $('#MenuCreateSphere').click(function(e) {
                _Editor.CreatePrim('sphere', _Editor.GetInsertPoint(), [.5, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
    
            $('#MenuCreateText').click(function(e) {
                _Editor.CreatePrim('text', _Editor.GetInsertPoint(), [.5, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
            $('#MenuCreateTorus').click(function(e) {
                _Editor.CreatePrim('torus', _Editor.GetInsertPoint(), [.5, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
            $('#MenuCreatePlane').click(function(e) {
                _Editor.CreatePrim('plane', _Editor.GetInsertPoint(), [1, 1, 5], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
            $('#MenuCreateCylinder').click(function(e) {
                _Editor.CreatePrim('cylinder', _Editor.GetInsertPoint(), [1, .5, .5], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
            $('#MenuCreateCone').click(function(e) {
                _Editor.CreatePrim('cone', _Editor.GetInsertPoint(), [.500, 1, .5], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
            $('#MenuCreatePyramid').click(function(e) {
                _Editor.CreatePrim('pyramid', _Editor.GetInsertPoint(), [1, 1, 1], 'checker.jpg', _UserManager.GetCurrentUserName(), '');
            });
    
            $('#LocationGoToPosition').click(function(e) {
                _LocationTools.GoToPosition();
            });
    
            $('#LocationGoToPlacemark').click(function(e) {
                _LocationTools.GoToPlaceMark();
            });
    
            $('#LocationAddPlacemark').click(function(e) {
                _LocationTools.AddPlacemark();
            });
    
            $('#ToolsShowID').click(function(e) {
                if (_Editor.GetSelectedVWFID())
                    alertify.prompt(vwf.getProperty(_Editor.GetSelectedVWFID(), "DisplayName") || "No DisplayName", function() {}, _Editor.GetSelectedVWFID());
                else
                    alertify.alert('No Selection');
            });
            $('#ToolsShowVWF').click(function()

            {
                p = require("vwf/view/editorview/JSONPrompt");
                var ID = _Editor.GetSelectedVWFID();
                if(ID)
                {
                    var data = _DataManager.getCleanNodePrototype(ID);
                    p.prompt(data);
                }
            })
            $('#ToolsShowVWFSaveData').click(function()
            {
                p = require("vwf/view/editorview/JSONPrompt");
                var data = _DataManager.getSaveStateData();
                p.prompt(data);

                
            });
    
            
    
    
    
            $('#LocationMoveToGround').click(function(e) {
                _LocationTools.MoveToGround();
            });
    
            $('#MenuCreateTerrainGrass').click(function(e) {
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
    
            });
    
            $('#MenuViewRenderNormal').click(function(e) {
                _dView.setRenderModeNormal();
                require("vwf/view/threejs/editorCameraController").getController('Orbit').orbitPoint(newintersectxy);
                require("vwf/view/threejs/editorCameraController").setCameraMode('Orbit');
                require("vwf/view/threejs/editorCameraController").updateCamera();
            });
            $('#MenuViewRenderStereo').click(function(e) {
                _dView.setRenderModeStereo()
            });
             $('#MenuViewRenderVR').click(function(e) {
                
                if (navigator.getVRDevices) {
                        _dView.setRenderModeVR();
                        require("vwf/view/threejs/editorCameraController").setCameraMode('VR');
                }else
                {
                    alertify.alert("WebVR is not supported on this browser.");
                }
            });
    
            $('#TestSettings').click(function(e) {
                _Publisher.show();
            });
    
            $('#TestLaunch').click(function(e) {
                _Publisher.testPublish();
            });
            $('#MenuViewTabletDemo').click(function(e) {
                $('#MenuViewRenderStereo').click();
                $('#MenuCameraDeviceOrientation').click();
                $('#MenuViewFullscreen').click();
            });
    
    
    
    
            list = $('#smoothmenu1').find('[id]');
    
            //make every clicked menu item close all menus
            $('#smoothmenu1 li').not('li:has(ul)').click(function(e){ddsmoothmenu.closeall({type:'mouseleave'})});
    	},

		calledMethod: function(id, evtname, data)
		{
			if(/^character-vwf/.test(id) && evtname == 'ready'){
				updateMenuState();
			}
		}
    };

});
