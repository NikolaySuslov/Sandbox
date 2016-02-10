define(function() {
    var UserManager = {};
    var isInitialized = false;
    return {
        getSingleton: function() {
            if (!isInitialized) {
                initialize.call(UserManager);
                isInitialized = true;
            }
            return UserManager;
        }
    }

    function initialize() {
        this.currentUsername = null;
        
		$('#sidepanel .main').append("<div id='UserProfileWindow' class='ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active' style='padding-bottom:5px;overflow:hidden;height:auto'></div>");
        $('#UserProfileWindow').append("<div id='userprofiletitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>User Profile</span></div>");
        $('#userprofiletitle').append('<a id="userprofileclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
        $("#UserProfileWindow").append("<table id='UserProfiletable' class='usertable'></table>");
        $("#UserProfiletable").append("<tr><td><div>Username</div></td><td><div id='ProfileUsername'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Name</div></td><td><div id='ProfileName'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Age</div></td><td><div id='ProfileAge'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Birthday</div></td><td><div id='ProfileBirthday'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Relationship</div></td><td><div id='ProfileRelationship'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>City</div></td><td><div id='ProfileCity'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>State</div></td><td><div id='ProfileState'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Homepage</div></td><td><div id='ProfileHomepage'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Employer</div></td><td><div id='ProfileEmployer'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Title</div></td><td><div id='ProfileTitle'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Height</div></td><td><div id='ProfileHeight'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Weight</div></td><td><div id='ProfileWeight'></div></td></tr>");
        $("#UserProfiletable").append("<tr><td><div>Nationality</div></td><td><div id='ProfileNationality'></div></td></tr>");
        //$('#UserProfileWindow').dialog({title:'Profile',autoOpen:false});
        $('#UserProfileWindow').css('border-bottom', '5px solid #444444')
        $('#UserProfileWindow').css('border-left', '2px solid #444444')
        $('#userprofiletitle').prepend('<div class="headericon user" />');
        $("#UserProfileWindow").append("<div id='FollowUser'></div>");
        $("#UserProfileWindow").append("<div id='PrivateMessage'></div>");
        $("#UserProfileWindow").append("<div id='CallUser'></div>");
        $("#UserProfileWindow").append("<div id='VideoCallUser'></div>");


        $("#userprofileclose").click(function() {
            $("#UserProfileWindow").hide('blind', function() {


                if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
                //if (!$('#sidepanel').children().is(':visible')) hideSidePanel();
            });
        });
        $('#sidepanel .main').append('<div id="Players"  class="ui-accordion-content ui-helper-reset ui-corner-bottom ui-accordion-content-active" style="border-radius: 2px;width: 100%;margin:0px;padding:0px">' + "<div id='playerstitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='sidetab-editor-title ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>Players</span></div>" + '	 <div id="PlayerList"></div>' + '</div>');
        
        ;
        $('#playerstitle').prepend('<div class="headericon users"  />');

        $('#playerstitle').click(function() {

                if ($('#PlayerList').is(':visible'))
                    _UserManager.hidePlayers();
                else
                    _UserManager.showPlayers();
            })

        $(document.body).append('<div id="CreateProfileDialog"/>');

        $("#FollowUser").button({
            label: 'Follow This User'
        });
        $("#FollowUser").click(function() {
            var id = '-object-Object-player-' + _UserManager.SelectedProfile.Username;
            require("vwf/view/threejs/editorCameraController").setCameraMode('Orbit');
            require("vwf/view/threejs/editorCameraController").followObject(Engine.models[0].model.nodes[id]);
        });
        $("#PrivateMessage").button({
            label: 'Private Message'
        });
        $("#PrivateMessage").click(function() {
            setupPmWindow(_UserManager.SelectedProfile.clientID);
        });

        $("#CallUser").button({
            label: 'Voice Call'
        });
        $("#CallUser").click(function() {
           
            Engine.callMethod('index-vwf', 'rtcCall', {
                target: _UserManager.SelectedProfile.clientID
            });
        });

        $("#VideoCallUser").button({
            label: 'Video Call'
        });
        $("#VideoCallUser").click(function() {
            Engine.callMethod('index-vwf', 'rtcVideoCall', {
                target: _UserManager.SelectedProfile.clientID
            });
        });

        //ping the server every minute to keep session alive
        window.setInterval(function()
        {
            $.get("./vwfDataManager.svc/logindata");
        },1000 * 60)
        this.GetNextAnonName = function(clients)
        {
            return "Anonymous_" + Engine.moniker();
        }
        $(document).on('setstatecomplete', function() {

            if (this.GetCurrentUserName()) return;
            if ($('#GuestLogin').length > 0) return;

            //by default, you need to log in. Only in the case of published states do you not need to log in.
            var needlogin = true;
            var statedata = _DataManager.getInstanceData();

            //published worlds may choose to allow anonymous users
            //singleplayers worlds do not need login
            if (statedata && statedata.publishSettings && (statedata.publishSettings.allowAnonymous || statedata.publishSettings.singlePlayer))
                needlogin = false;

            if (needlogin) {
                this.installSessionHoldTimer();
                $.ajax('/vwfDataManager.svc/logindata', {
                    cache: false,
                    async: false,
                    success: function(data, status, xhr) {
                        var logindata = JSON.parse(xhr.responseText);
                        var username = logindata.username || logindata.user_uid || logindata.UID;
                        var userID = logindata.user_uid || logindata.UID;


                        this.Login(username, userID);
                    


                    }.bind(this),
                    error: function(xhr, status, err) {


                        hideTools();
                        //$('#NotifierAlertMessage').dialog('open');
                        //$('#NotifierAlertMessage').html('You are viewing this world as a guest. Please <a style="color:blue" href="'+_DataManager.getCurrentApplication() + "/login?return=" + _DataManager.getCurrentSession().substr(13)+'">sign in</a> to participate');



                        $(document.body).append('<a href="#" id="GuestLogin" style="font-family: sans-serif;z-index:99;position:fixed;font-size: 2em;" class="alertify-button alertify-button-ok" id="alertify-ok">' + i18n.t('Login') + '</a>');
                        $('#GuestLogin').click(function() {

                            window.location = _DataManager.getCurrentApplication() + "login?return=" + window.location.pathname.substring(window.location.pathname.indexOf(window.appPath) + window.appPath.length) + window.location.hash + window.location.search;
                        });

                    }.bind(this)
                });
            } else {
                
                //this is a published world, and you do not need to be logged in
                $.ajax('/vwfDataManager.svc/logindata', {
                    cache: false,
                    async: false,
                    success: function(data, status, xhr) {
                        //however, if you are logged in, this manager needs to know your name
                        //since the server knows your name via the session cookie, it will fire
                        //a login event with the users name. 
                        var logindata = JSON.parse(xhr.responseText);
                        var username = logindata.username || logindata.user_uid || logindata.UID;
                        var userID = logindata.user_uid || logindata.UID;

                        var clients = Engine.getProperty(Engine.application(), 'clients');
                        var anonName = this.GetNextAnonName(clients);

                        //only the first client from a given login should create the avatart
                        //this is a poor way to detect that teh user is already in the space
                        
                            this.Login(username, userID);
                    


                    }.bind(this),
                    error: function(xhr, status, err) {
                        //in this case, the world allows anonymous users, and you really are anonymous, so log in as
                        //anonymous;

                        
                        var clients = Engine.getProperty(Engine.application(), 'clients');
                        var anonName = this.GetNextAnonName(clients);

                        

                        this.Login(anonName,anonName);
                    }.bind(this)
                });



            }



        }.bind(this));
        this.SelectedProfile = null;
        this.installSessionHoldTimer = function()
        {
            //keep a ping to the server on a loop to keep the session alive.
            window.setTimeout(function()
            {
                $.ajax('/vwfDataManager.svc/logindata', {
                        cache: false,
                        async: false,
                        success: function(data, status, xhr) {
                        },
                        error: function(xhr, status, err) {
                        }
                });
            },1000*6*3)   //every 3 minutes
        }
        this.showProfile = function(clientID) {

            var clients = Engine.getProperty(Engine.application(), 'clients');
            var profile = _DataManager.GetProfileForUser(clients[clientID].UID) || {};
            profile.clientID = clientID;
            if (!profile) return;


            $('#UserProfileWindow').prependTo($('#UserProfileWindow').parent());
            $('#UserProfileWindow').show('blind', function() {
                $('#MenuUsersicon').addClass('iconselected');

            });
            _SidePanel.showPanel();
            this.SelectedProfile = profile;

            for (i in profile) {
                $('#Profile' + i).text(profile[i]);
            }
            $('#EditProfile').hide();
            $('#PrivateMessage').show();
            $('#CallUser').show();
            $('#FollowUser').show();
            $('#VideoCallUser').show();
            if (clientID == Engine.moniker()) {
                $('#EditProfile').show();
                $('#PrivateMessage').hide();
                $('#CallUser').hide();
                $('#FollowUser').hide();
                $('#VideoCallUser').hide();
            }
        }
        this.GetCurrentUserName = function() {
            return this.currentUsername;
        }
        this.GetCurrentUserID = function() {
            return 'character-vwf-' + this.currentUsername.replace(/ /g, '-');
        }
        this.createdNode = function(nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childURI, childName, callback /* ( ready ) */ ) {
            if (childName && childName == this.GetCurrentUserName()) {
                var statedata = _DataManager.getInstanceData();


                if ((statedata && statedata.publishSettings && !statedata.publishSettings.camera) || !statedata || !statedata.publishSettings) {

                    //set cameramode to avatar if an avatar is created
                    //but only if the world is playing
                    if (Engine.getProperty(Engine.application(), 'playMode') === 'play') {
                        _dView.setCameraDefault();
                        clearCameraModeIcons();
                        $('#MenuCamera3RDPersonicon').addClass('iconselected');
                        require("vwf/view/threejs/editorCameraController").getController('Orbit').followObject(Engine.models[0].model.nodes[_UserManager.GetCurrentUserID()]);
                        require("vwf/view/threejs/editorCameraController").setCameraMode('3RDPerson');
                    }
                }



            }
        }
        this.Login = function(username, userID) {

            $('#StatusUserName').text(username);
            var needlogin = true;
            
            var statedata = _DataManager.getInstanceData();

            //published worlds may choose to allow anonymous users
            //singleplayers worlds do not need login
            if (statedata && statedata.publishSettings && (statedata.publishSettings.allowAnonymous || statedata.publishSettings.singlePlayer))
                needlogin = false;


            if (this.GetCurrentUserName()) return;
            //clear this. No reason to have it saved in the dom

            this.currentUsername = userID;
            //only take control of hte websocket if you have to log in. Don't do this for allow anon and or singleplayer
           
            $('#MenuLogInicon').addClass('icondisabled')
            $('#MenuLogOuticon').removeClass('icondisabled');
            $('#MenuLogIn').attr('disabled', 'disabled');
            $('#MenuLogOut').removeAttr('disabled');


            var newintersectxy = _LocationTools.getCurrentPlacemarkPosition() || _LocationTools.getPlacemarkPosition('Origin') || _Editor.GetInsertPoint();
            
            require("vwf/view/threejs/editorCameraController").getController('Orbit').orbitPoint(newintersectxy);
            require("vwf/view/threejs/editorCameraController").setCameraMode('Orbit');
            
            //if no one has logged in before, this world is yours
            if (Engine.getProperty('index-vwf', 'owner') == null) Engine.setProperty('index-vwf', 'owner', this.currentUsername);

            //if single player, world is yours
            if (statedata && statedata.publishSettings && statedata.publishSettings.singlePlayer)
                Engine.setProperty('index-vwf', 'owner', this.currentUsername);

            var parms = new Array();
            parms.push(JSON.stringify({
                sender: '*System*',
                text: (this.currentUsername + " logging on")
            }));
            vwf_view.kernel.callMethod('index-vwf', 'receiveChat', parms);
        }
        
        this.PlayerDeleted = function(e) {

            $("#" + e + "label").remove();
            var index = this.playerNames.indexOf(e);
            this.playerNames.splice(index, 1);
            index = this.playerIDs.indexOf('character-vwf-' + e);
            this.playerIDs.splice(index, 1);
        }
        this.getPlayerIDs = function() {
            return this.playerIDs || [];
        }
        this.getPlayers = function() {
            var playerNodes = [];
            for (var i = 0; i < this.getPlayerIDs().length; i++) {
                playerNodes.push(Engine.models.javascript.nodes[this.getPlayerIDs()[i]]);

            }
            playerNodes.sort(function(a, b) {

                if (a.ownerClientID[0] > b.ownerClientID[0]) return 1;
                return -1;
            })
            return playerNodes;
        }
        //note:: this depends on avatar creation. Remove that
        this.PlayerCreated = function(e, id) {
            //refresh the list if a player joins while it is open
            if ($('#PlayerList').is(':visible'))
                this.showPlayers();
        }
        this.firedEvent = function(id, event, params) {
            if (id == Engine.application() && event == 'clientConnected') {
                if ($('#PlayerList').is(':visible'))
                    this.showPlayers();
            }
            if (id == Engine.application() && event == 'clientDisconnected') {
                if ($('#PlayerList').is(':visible'))
                    this.showPlayers();
            }
        }
       
        this.showLogin = function() {
            //new system does not do logins!


            $.ajax('/vwfDataManager.svc/logindata', {
                cache: false,
                success: function(data, status, xhr) {
                    var logindata = JSON.parse(xhr.responseText);
                    var username = logindata.username;

                
                        this.Login(username);
                

                }.bind(this),
                error: function(xhr, status, err) {

                    window.onbeforeunload = '';

                    window.location = _DataManager.getCurrentApplication() + "login?return=" + _DataManager.getCurrentSession().substring(window.location.pathname.indexOf(window.appPath) + window.appPath.length) + window.location.hash;
                }.bind(this)
            });

        }
       

        //these three functions should be deprecated and replaced by the ClientAPI on the Scene object for access
        //from within the model.
        this.GetPlayernameForClientID = function(id) {
            var clients = Engine.getProperty(Engine.application(), 'clients')
            if (clients && clients[id])
                return clients[id].UID;
        }
        this.GetAvatarForClientID = function(id) {
            for (var i in Engine.models[0].model.nodes) {
                var node = Engine.models[0].model.nodes[i];
                if (node.ownerClientID && node.ownerClientID.indexOf(id)>-1)
                    return node;
            }
        }
        this.GetClientIDForPlayername = function(id) {
            var clients = Engine.getProperty(Engine.application(), 'clients')
            for (var i in clients) {
                if (clients[i].UID == id) return clietns[i].cid;
            }
        }
        this.satProperty = function(id,name,val)
        {
            if(name == 'permission')
                this.updatePermissions();
        }
        this.updatePermissions = function()
        {
            var clients = Engine.getProperty(Engine.application(),'clients');
            for(var id in clients)
            {
            var e = ToSafeID(id)
            if(_PermissionsManager.getPermission(clients[id].name,Engine.application()))
                    $("#" + e + "label .glyphicon-share").css('color','rgb(130, 184, 255)')
                else    
                    $("#" + e + "label .glyphicon-share").css('color','')
            }
        }
        this.hidePlayers = function()
        {
            $('#playerstitle').removeClass('sidetab-editor-title-active')
            $('#PlayerList').hide('blind', function() {
                $('#MenuUsersicon').removeClass('iconselected');
                //if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
                //if (!$('#sidepanel').children('.jspContainer').children('.jspPane').children().is(':visible')) hideSidePanel();
            });
        }
        this.hidePlayers();
        this.showPlayers = function() {
           // $('#Players').prependTo($('#Players').parent());
            $('#PlayerList').show('blind', function() {});
            $('#playerstitle').addClass('sidetab-editor-title-active')
            $("#PlayerList").empty();
            var clients = Engine.getProperty(Engine.application(), 'clients');
            
            for (var i in clients) {
                var e = ToSafeID(i);
                 var id = i;
                var self = this;
                (function(e,id,clients){
                $("#PlayerList").append("<div id='" + (e + "label") + "'  class='playerlabel'><span class='playerlabelname'>" + clients[i].name + (e == Engine.moniker() ? " (me)":"") + "<div class='playerlabelID'>" + i + "</div></span></div>");
                $("#" + e + "label").append("<div class='glyphicon glyphicon-comment' />");
                $("#" + e + "label").append("<div class='glyphicon glyphicon-user' />");
                $("#" + e + "label").append("<div class='glyphicon glyphicon-earphone' />");
                $("#" + e + "label").append("<div class='glyphicon glyphicon-facetime-video' />");
                $("#" + e + "label").append("<div class='glyphicon glyphicon-share' />");
               
                 $("#" + e + "label .glyphicon-comment").click(function()
                 {
                     setupPmWindow(id);
                 });
                 $("#" + e + "label .glyphicon-user").click(function()
                 {
                     self.showProfile(id);
                 })
                 $("#" + e + "label .glyphicon-facetime-video").click(function()
                 {
                     Engine.callMethod('index-vwf', 'rtcVideoCall', {
                        target: id
                    });
                 });
                 $("#" + e + "label .glyphicon-earphone").click(function()
                 {
                     Engine.callMethod('index-vwf', 'rtcCall', {
                        target: id
                    });
                 })

                 function updatePermission()
                 {
                    if(_PermissionsManager.getPermission(clients[id].name,Engine.application()))
                        $("#" + e + "label .glyphicon-share").css('color','rgb(130, 184, 255)')
                    else    
                        $("#" + e + "label .glyphicon-share").css('color','')
                 }
                 updatePermission();
                 $("#" + e + "label .glyphicon-share").click(function()
                 {
                    if(_PermissionsManager.getPermission(clients[id].name,Engine.application()))
                        _PermissionsManager.setPermission(clients[id].name,Engine.application(),0);
                    else
                        _PermissionsManager.setPermission(clients[id].name,Engine.application(),1);
                    
                    window.setTimeout(function(){
                        updatePermission();        
                    },500)

                 })
             })(e,id,clients);

                 
               
            }


            _SidePanel.showPanel();
        }
        $('#UserProfileWindow').hide();
        
    }
});
