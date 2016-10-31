define([], function() {
    var Publisher = {};
    var isInitialized = false;
    return {
        getSingleton: function() {
            if (!isInitialized) {
                initialize.call(Publisher);
                isInitialized = true;
            }
            return Publisher;
        }
    }

    function merge(o1,o2,id)
    {
        var r = {};
        for(var i in o1)
            r[i] = o1[i];
        for(var i in o2)
            if(!(i in o1))
                r[i] = Engine.getProperty(Engine.prototype(id),i);
        return r;
    }
    function initialize() {

        // Represents the three buttons; Play, Pause, and Stop that control the simulation
        var simulationControlButtons = { "Play": 1, "Pause": 2, "Stop": 3 };

        this.setup = function() {
            $(document.body).append('<div id="publishSettings"></div>');

            $('#publishSettings').dialog({
                show: {
                    effect: "fade",
                    duration: 300
                },
                hide: {
                    effect: "fade",
                    duration: 300
                },
                title: "Test Publish",
                buttons: {
                    ok: function() {
                        _Publisher.savePublishSettings();
                        $(this).dialog('close');
                    },
                    cancel: function() {
                        $(this).dialog('close');
                    }
                },
                position: 'center',
                width: 'auto',
                height: 'auto',
                resizable: 'false',
                moveable: 'false',
                modal: 'true',
                autoOpen: false
            });
            $('#publishSettings').append('<div><input type="checkbox" id="singlePlayer" /><span>Single Player</span></div>');
            $('#publishSettings').append('<div><input type="checkbox" id="allowAnonymous" /><span>Allow Anonymous</span></div>');
            $('#publishSettings').append('<div><input type="checkbox" id="createAvatar" /><span>Create Avatars</span></div>');
            $('#publishSettings').append('<div><input type="checkbox" id="allowTools" /><span>Allow Tools</span></div>');
            $('#publishSettings').append('<div id="chooseCamera" >Choose Camera</div>');

            $('#chooseCamera').button();
            $('#chooseCamera').click(function() {

                var list = _dView.getCameraList();

                var camList = list[0];
                var idList = list[1];

                alertify.choice("Choose the camera to use in the Published Scene", function(ok, val) {
					//Only update if ok button was pressed, not cancel
					if(ok){
						$('#chooseCamera').button('option', 'label', val);
						$('#chooseCamera').attr('cameraID', idList[camList.indexOf(val)]);
					}
                }, camList)
            })
            $(window).on('setstatecomplete', function() {

                var statebackup = Engine.getProperty(Engine.application(), 'playBackup');
                if (!statebackup) {
                    _Publisher.backupState();
                }

            })
        }

        this.setup();

        this.show = function() {
            this.loadPublishSettings();
            $('#publishSettings').dialog('open');
        }
        this.savePublishSettings = function() {
            var statedata = {};
            statedata.SinglePlayer = $('#singlePlayer').is(':checked');
            statedata.camera = $('#chooseCamera').attr('cameraID');
            statedata.allowAnonymous = $('#allowAnonymous').is(':checked');
            statedata.createAvatar = $('#createAvatar').is(':checked');
            statedata.allowTools = $('#allowTools').is(':checked');
            _Editor.setProperty(Engine.application(), 'publishSettings', statedata);
        }
        this.loadPublishSettings = function() {
            var statedata = Engine.getProperty(Engine.application(), 'publishSettings') || {};

            if (statedata.SinglePlayer)
                $('#singlePlayer').prop('checked', 'checked');
            else
                $('#singlePlayer').prop('checked', '');

            if (statedata.allowAnonymous)
                $('#allowAnonymous').prop('checked', 'checked');
            else
                $('#allowAnonymous').prop('checked', '');

            if (statedata.createAvatar)
                $('#createAvatar').prop('checked', 'checked');
            else
                $('#createAvatar').prop('checked', '');

            if (statedata.allowTools)
                $('#allowTools').prop('checked', 'checked');
            else
                $('#allowTools').prop('checked', '');

            if (statedata.camera) {
                $('#chooseCamera').button('option', 'label', Engine.getProperty(statedata.camera, 'DisplayName'));
                $('#chooseCamera').attr('cameraID', statedata.camera);
            } else {
                $('#chooseCamera').button('option', 'label', "Choose Camera");
                $('#chooseCamera').attr('cameraID', null);
            }

        }

        this.stateBackup = null;
        this.backupState = function() {
            var s = _Editor.getNode(Engine.application(),true);

            function walk(node) {
                if(!node)return;
                for (var i in node.properties) {
                    //4th param as true returns whether or not delegation happened during get. if so, no need to store this property.
                    if (Engine.getProperty(node.id, i, false, true)) {
                        // console.log('Removing delegated property', node.id, i);
                        delete node.properties[i];
                    }
                }
                for (var i in node.children) {
                    walk(node.children[i]);
                }
            }
            walk(s)

            vwf_view.kernel.setProperty(Engine.application(), 'playBackup', s);


        }
        this.satProperty = function(id, prop, val) {
            if (id == Engine.application()) {
                var disableSelector = '#ScriptEditor, #sidepanel, #sidetabs, #statusbarinner, #toolbar, #EntityLibrary, .sidetab, #smoothmenu1, #smoothmenu1 ul li a';
                if (prop == 'playMode' && val == 'play') {
                    this.updateSimulationControlButtons(simulationControlButtons.Play);

                    $(disableSelector).css('opacity', .3);
                    $(disableSelector).css('background-color', 'gray');
                    $(disableSelector).css('pointer-events', 'none');
                    $(disableSelector).css('cursor', 'not-allowed');

                    _Editor.SetSelectMode('none');
                    $('#index-vwf').focus();
                }
                if (prop == 'playMode' && val == 'paused') {
                    //restore selection
                    this.updateSimulationControlButtons(simulationControlButtons.Pause);

                    $(disableSelector).css('opacity', '');
                    $(disableSelector).css('pointer-events', '');
                    $(disableSelector).css('cursor', '');
                    $(disableSelector).css('background-color', '');
                  
                    _Editor.SetSelectMode('Pick');
                }
                if (prop == 'playMode' && val == 'stop') {
                    this.updateSimulationControlButtons(simulationControlButtons.Stop);

                    $(disableSelector).css('opacity', '');
                    $(disableSelector).css('pointer-events', '');
                    $(disableSelector).css('cursor', '');
                    $(disableSelector).css('background-color', '');
                    _Editor.SetSelectMode('Pick');
                }
            }
        }
        this.calledMethod = function(id, name, args) {
            if (id == Engine.application() && name == 'restoreState') {
                this.restoreState_imp(args[0]);
            }
        }
        this.restoreState_imp = function(s) {
            //when stopping a published world, there will be no backup
            if (!s) return;
            Engine.private.queue.suspend();
            Engine.models.kernel.disable();
           
            var currentState = _Editor.getNode(Engine.application(),true);

            //find a node from one state in another
            var find = function(node, id) {
                    if (node.id == id)
                        return true;
                    for (var i in node.children) {
                        var ret = find(node.children[i], id);
                        if (ret) return true;
                    }
                    return false;
                }
                //async walk the graph and create nodes that don't exist. if htey do exist, set all their props
            var walk = function(node, walkCallback) {
                if (!node || !node.children) {
                    walkCallback();
                    return;
                }
                async.eachSeries(Object.keys(node.children), function(i, eachSeriesCallback) {

                   // console.log(node.id,i)
                    //does the node exist?
                    var exists = false;
                    try {
                        exists = Engine.getNode(node.children[i].id);
                    } catch (e) {
                        //create it and when done, do the next child of the current node
                        if (node.children[i].extends != 'character.vwf')
                            Engine.createChild(node.id, i, node.children[i], null, function(childID) {
                                eachSeriesCallback();
                            });
                        else
                            eachSeriesCallback();
                        return;
                    }
                    if (exists) {
                        //set all the props of this node
                        var testProps = merge( node.children[i].properties,exists.properties,node.children[i].id)
                        for (var j in testProps) {

                            var currentprop = Engine.getProperty(node.children[i].id, j);
                            //dont set props that have not changed, as this can be a lot of work for nothign
                            if (JSON.stringify(currentprop) !== JSON.stringify(testProps[j]))
                                Engine.setProperty(node.children[i].id, j, testProps[j]);
                        }
                        //create or set props of the child
                        walk(node.children[i], eachSeriesCallback)

                    } else {
                        //create it and when done, do the next child of the current node
                        if (node.children[i].extends != 'character.vwf')
                            Engine.createChild(node.id, i, node.children[i], null, function(childID) {
                                eachSeriesCallback();
                            });
                        else
                            eachSeriesCallback();
                    }

                }, walkCallback);
            }

            //walk, and when done, delete anything that was created
            walk(s, function() {

                //set all the properties on the root scene
                var testProps = s.properties;

                for (var j in testProps) {
                    var currentprop = Engine.getProperty(s.id, j);
                    //dont set props that have not changed, as this can be a lot of work for nothing
                    if (JSON.stringify(currentprop) !== JSON.stringify(testProps[j]) && j !== 'clients')
                        Engine.setProperty(s.id, j, testProps[j]);
                }

                //synchronous walk of graph to find children that exist in the current state but not the old one. Delete nodes that were created
                var walk2 = function(node) {
                    //don't delete avatars
                    if(!node) return;
                    if (!find(s, node.id) && node.extends != 'character.vwf') {
                        try{
                            Engine.deleteNode(node.id);
                        }catch(e){}
                    } else {
                        for (var i in node.children) {
                            walk2(node.children[i]);
                        }
                    }
                }
                walk2(currentState);

                Engine.models.kernel.enable();

                Engine.callMethod(Engine.application(), 'postWorldRestore');
                Engine.markAllPropsCurrent();
                Engine.private.queue.resume();

            });

            //_PhysicsDriver.resetWorld();

        }
        this.restoreState = function() {
            if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), Engine.application()) == 0) {
                alertify.log('You do not have permission to modify this world');
                return;
            }
            var s = Engine.getProperty(Engine.application(), 'playBackup');
            vwf_view.kernel.setProperty(Engine.application(), 'playBackup', null);
            vwf_view.kernel.callMethod(Engine.application(), 'restoreState', [s]);



        }
        this.playWorld = function() {
            this.updateSimulationControlButtons(simulationControlButtons.Play);

            if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), Engine.application()) == 0) {
                alertify.log('You do not have permission to modify this world');
                return;
            }
            var currentState = Engine.getProperty(Engine.application(), 'playMode');
            if (currentState === 'play') return;
            if (currentState === 'stop')
                this.backupState();

            vwf_view.kernel.callMethod(Engine.application(), 'preWorldPlay');
            vwf_view.kernel.setProperty(Engine.application(), 'playMode', 'play')
        }

        this.stopWorld = function() {
            this.updateSimulationControlButtons(simulationControlButtons.Stop);

            if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), Engine.application()) == 0) {
                alertify.log('You do not have permission to modify this world');
                return;
            }
            var currentState = Engine.getProperty(Engine.application(), 'playMode');
            if (currentState === 'stop') return;
           
            vwf_view.kernel.callMethod(Engine.application(), 'preWorldStop');
            vwf_view.kernel.setProperty(Engine.application(), 'playMode', 'stop');
            this.restoreState();
            this.stateBackup = null;
             vwf_view.kernel.callMethod(Engine.application(), 'postWorldStop');

        }

        this.togglePauseWorld = function() {
            this.updateSimulationControlButtons(simulationControlButtons.Pause);

            if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), Engine.application()) == 0) {
                alertify.log('You do not have permission to modify this world');
                return;
            }
            var currentState = Engine.getProperty(Engine.application(), 'playMode');
            if (currentState === 'stop') return;
            vwf_view.kernel.setProperty(Engine.application(), 'playMode', 'paused')
        }

        this.updateSimulationControlButtons = function(activeButton) {
            switch (activeButton) {
                case simulationControlButtons.Play:
                   $('#playButton').addClass('pulsing');
                   $('#pauseButton').removeClass('pulsing');
                   $('#stopButton').removeClass('pulsing');
                   break;

                case simulationControlButtons.Pause:
                   $('#playButton').addClass('pulsing');
                   $('#pauseButton').addClass('pulsing');
                   $('#stopButton').removeClass('pulsing');
                   break;

                case simulationControlButtons.Stop:
                   $('#playButton').removeClass('pulsing');
                   $('#pauseButton').removeClass('pulsing');
                   $('#stopButton').addClass('pulsing');
                   break;
            }
        }

        //quickly clone a world, publish it and open it. When that world closes, delete it.
        this.testPublish = function() {
            var testSettings = Engine.getProperty(Engine.application(), 'publishSettings') || {
                SinglePlayer: true,
                camera: null,
                allowAnonymous: false,
                createAvatar: false,
                allowTools: false
            };
            var instance = _DataManager.getCurrentSession();
            var instanceSettings = _DataManager.getInstanceData();
            var user = _UserManager.GetCurrentUserName();
            if (user != instanceSettings.owner) {
                alertify.alert('You must be the world owner to complete this action');
                return;
            }
            _DataManager.saveToServer(true);
            $.get('./vwfdatamanager.svc/copyinstance?SID=' + instance, function(o) {
                var newID = $.trim(o);
                var statedata = testSettings;



                jQuery.ajax({
                    type: 'POST',
                    url: './vwfDataManager.svc/publish?SID=' + newID,
                    data: JSON.stringify(statedata),
                    contentType: statedata ? "application/json; charset=utf-8" : "application/text; charset=utf-8",
                    dataType: "text",
                    success: function(data, status, xhr) {
                        var windowObjectReference;
                        var strWindowFeatures = "menubar=no,location=no,resizable=yes,scrollbars=no,status=no";
                        windowObjectReference = window.open("../../.." + newID.replace(/_/g, "/"), "TESTPUBLISH", strWindowFeatures);
                        var thisconsole = console;
                        if (windowObjectReference) {
                            $(document.body).append("<div id='publishblocker' style='position: absolute;top: 0px;bottom: 0px;left: 0px;right: 0px;background-color: black;opacity: .8;z-index: 10000000;color: white;font-size: 30em;text-align: center;vertical-align: middle;margin: auto;padding-top: 1em;' >Testing</div>");
                            _dView.paused = true;
                            var pollForClose = function() {

                                if(windowObjectReference.closed == true)
                                {
                                    jQuery.ajax({
                                        type: 'DELETE',
                                        url: './vwfDataManager.svc/state?SID=' + newID,
                                        dataType: "text",
                                        success: function(data, status, xhr) {
                                            $('#publishblocker').remove();
                                            _dView.paused = false;
                                        },
                                        error: function(xhr, status, err) {

                                        }

                                    });
                                }else
                                setTimeout(pollForClose,500)
                            };
                            setTimeout(pollForClose,500)
                        }
                    },
                    error: function(xhr, status, err) {

                    }
                });
            });
        }
    }
});