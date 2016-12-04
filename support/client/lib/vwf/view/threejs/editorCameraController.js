define(["vwf/view/threejs/oldCameraController", "vwf/view/threejs/AvatarCameraController", "vwf/view/threejs/VRCameraController", "vwf/view/threejs/orthoCameraController"], function(oldCameraController, avatarCameraController, VRCameraController,orthoCameraController)
{
    function editorCameraController()
    {
        this.cameraType = "perspective";
    }
    editorCameraController.prototype.setCameraType = function(v)
    {
        this.cameraType = v;
    }
    editorCameraController.prototype.getCamera = function()
    {
        if(!this.cameraControllers) return this.defaultcamera;
        if (!this.cameraControllers[this.cameramode]) return this.defaultcamera;
        else return this.cameraControllers[this.cameramode].getCamera();

    }
    editorCameraController.prototype.initialize = function()
    {
        var defaultcamera = new THREE.PerspectiveCamera(35, $(document).width() / $(document).height(), .01, 10000);
        
        this.camera = defaultcamera;
        this.cameraControllers = {};
        oldCameraController.initialize(this.camera);
        avatarCameraController.initialize(this.camera);
        VRCameraController.initialize(this.camera);
        orthoCameraController.initialize(this.camera);
        this.addController('Orbit', oldCameraController);
        this.addController('Navigate', oldCameraController);
        this.addController('Free', oldCameraController);
        this.addController('Fly', oldCameraController);
        this.addController('3RDPerson', avatarCameraController);
        this.addController('FirstPerson', oldCameraController);
        this.addController('DeviceOrientation', oldCameraController);
        this.addController('VR', VRCameraController);

        this.addController('Top', orthoCameraController);
        this.addController('Front', orthoCameraController);
        this.addController('Left', orthoCameraController);
    


        this.setCameraMode('Orbit');
        
        $(document).on('setstatecomplete',function()
        {
            //if the world is published without tools, but it is creating avatars, then the editor camera controller should use the 
            //avatar mode. Setting a world camera will override this.
            var metadata = _DataManager.getInstanceData();
            if(metadata && metadata.publishSettings)
            {
                if(!metadata.publishSettings.allowTools && metadata.publishSettings.createAvatar)
                    this.setCameraMode('3RDPerson');
            }
        }.bind(this));
        
        $('#index-vwf').mousedown(function(e)
        {
            this.localpointerDown(e);
        }.bind(this));
        window.addEventListener("deviceorientation", this.orientationEvent.bind(this), true);
        $('#index-vwf').mousewheel(function(e)
        {
            e.deltaY *= -1;
            this.localpointerWheel(e);
        }.bind(this));
        $('#index-vwf').mouseup(function(e)
        {
            this.localpointerUp(e);
        }.bind(this));
        $('#index-vwf').mouseleave(function(e)
        {
            if ($(e.toElement).hasClass('glyph') || $(e.toElement).hasClass('nametag') || $(e.toElement).hasClass('ignoreMouseLeave'))
            {}
            else
            {
                this.localpointerUp(e);
            }
        }.bind(this));
        $('#index-vwf').mousemove(function(e)
        {
            this.localpointerMove(e);
        }.bind(this));
        $('#index-vwf').keydown(function(e)
        {
            this.localKeyDown(e);
        }.bind(this));
        $('#index-vwf').keyup(function(e)
        {
            this.localKeyUp(e);
        }.bind(this));
        $('#index-vwf')[0].addEventListener("touchstart", this.localTouchStart.bind(this), true);
        $('#index-vwf')[0].addEventListener("touchend", this.localTouchEnd.bind(this), true);
        $('#index-vwf')[0].addEventListener("touchmove", this.localTouchMove.bind(this), true);
        this.prerendercallback = this.prerender.bind(this);
        _dView.bind('prerender', this.prerendercallback);
        this.postrendercallback = this.postrender.bind(this);
        _dView.bind('postrender', this.postrendercallback);
        this.updateCamera();
        window.editorCameraController = this;
        return  this.camera;
    }
    editorCameraController.prototype.addController = function(name, controller)
    {
        this.cameraControllers[name] = controller;
    }
    editorCameraController.prototype.getController = function(name)
    {
        return this.cameraControllers[name];
    }
    editorCameraController.prototype.prerender = function(e, vp, h, w)
    {
        if (!this.cameraControllers[this.cameramode]) return;
        this.cameraControllers[this.cameramode].prerender(e, vp, h, w)
            //lets construct a screenspace rect of the selection region

        
        return; //below code needs to be faster to be useful
        var top = 0;
        var left = 0
        var bottom = h;
        var right = w;
       
        var TopLeftRay = _Editor.GetWorldPickRay(
        {
            clientX: left,
            clientY: top
        });
        var TopRightRay = _Editor.GetWorldPickRay(
        {
            clientX: right,
            clientY: top
        });
        var BottomLeftRay = _Editor.GetWorldPickRay(
        {
            clientX: left,
            clientY: bottom
        });
        var BottomRighttRay = _Editor.GetWorldPickRay(
        {
            clientX: right,
            clientY: bottom
        });
        //now we build a frustum from the screenspace rect and the camera
        var campos = _Editor.getCameraPosition();
        var ntl = MATH.addVec3(campos, TopLeftRay);
        var ntr = MATH.addVec3(campos, TopRightRay);
        var nbl = MATH.addVec3(campos, BottomLeftRay);
        var nbr = MATH.addVec3(campos, BottomRighttRay);
        var ftl = MATH.addVec3(campos, MATH.scaleVec3(TopLeftRay, 10000));
        var ftr = MATH.addVec3(campos, MATH.scaleVec3(TopRightRay, 10000));
        var fbl = MATH.addVec3(campos, MATH.scaleVec3(BottomLeftRay, 10000));
        var fbr = MATH.addVec3(campos, MATH.scaleVec3(BottomRighttRay, 10000));
        var frustrum = new Frustrum(ntl, ntr, nbl, nbr, ftl, ftr, fbl, fbr);
        //get all the objects intersected
        var hits = _SceneManager.FrustrumCast(frustrum,
        {
            OneHitPerMesh: true,
            cullQuery: true
        });
        var htl = _SceneManager.CPUPick(campos, TopLeftRay,
        {
            OneHitPerMesh: true,
            cullQuery: true
        });
        var htr = _SceneManager.CPUPick(campos, TopRightRay,
        {
            OneHitPerMesh: true,
            cullQuery: true
        });
        var hbl = _SceneManager.CPUPick(campos, BottomLeftRay,
        {
            OneHitPerMesh: true,
            cullQuery: true
        });
        var hbr = _SceneManager.CPUPick(campos, BottomRighttRay,
        {
            OneHitPerMesh: true,
            cullQuery: true
        });
        if (hbr) hits.push(hbr);
        if (hbl) hits.push(hbl);
        if (htr) hits.push(htr);
        if (htl) hits.push(htl);
        if (hits.length)
        {
            var objects = {};
            for (var i in hits)
            {
                if (!objects[hits[i].object.uuid])
                    objects[hits[i].object.uuid] = {
                        object: hits[i].object,
                        hits: []
                    }
                objects[hits[i].object.uuid].hits.push(hits[i])
            }
            var intersections = []
            for (var i in objects)
            {
                var oneInFront = false;
                var ssPoints = [];
                for (var j in objects[i].hits)
                {
                    var screenspacehit = MATH.mulMat4Vec3(vp, objects[i].hits[j].point);
                    if (isFinite(screenspacehit[2]) || !isNaN(screenspacehit[2]))
                    {
                        if (screenspacehit[2] > 0)
                        {
                            ssPoints.push(screenspacehit)
                            oneInFront = true;
                        }
                    }
                }
                if (oneInFront)
                    intersections = intersections.concat(ssPoints)
            }
            var near = Infinity;
            var far = -Infinity;
            for (var i in intersections)
            {
                if (!isFinite(intersections[i][2]) || isNaN(intersections[i][2])) continue;
                if (intersections[i][2] < near)
                    near = intersections[i][2];
                if (intersections[i][2] > far)
                    far = intersections[i][2];
            }
            near = Math.max(.001, near);
            
            //far = Math.min(.001,near);
            if (isFinite(near) && isFinite(far))
            {
                this.camera.near = near/2;
                this.camera.far = far * 2;
                this.camera.updateProjectionMatrix();
            }
        }
    }
    editorCameraController.prototype.postrender = function(e)
    {
        //this.camera.near = .01;;
       // this.camera.far = 5000;
       // this.camera.updateProjectionMatrix();
    }
    editorCameraController.prototype.updateCamera = function(e)
    {
        if (!this.cameraControllers[this.cameramode]) return;
        this.cameraControllers[this.cameramode].updateCamera(e)  
    }
    editorCameraController.prototype.focus = function(point,extents)
    {
        if (!this.cameraControllers[this.cameramode]) return;
        if(this.cameraControllers[this.cameramode].focus)
            this.cameraControllers[this.cameramode].focus(point,extents) 
    }
    editorCameraController.prototype.orientationEvent = function(e)
    {
        if (!this.cameraControllers[this.cameramode]) return;
        this.cameraControllers[this.cameramode].orientationEvent(e);
    }
    editorCameraController.prototype.localpointerMove = function(e)
    {
        if (!this.cameraControllers[this.cameramode]) return;
        this.cameraControllers[this.cameramode].localpointerMove(e);
    }
    editorCameraController.prototype.localpointerUp = function(e)
    {
        if (!this.cameraControllers[this.cameramode]) return;
        this.cameraControllers[this.cameramode].localpointerUp(e);
    }
    editorCameraController.prototype.localpointerWheel = function(e)
    {
        if (!this.cameraControllers[this.cameramode]) return;
        this.cameraControllers[this.cameramode].localpointerWheel(e);
    }
    editorCameraController.prototype.localpointerDown = function(e)
    {
        if (!this.cameraControllers[this.cameramode]) return;
        this.cameraControllers[this.cameramode].localpointerDown(e);
    }
    editorCameraController.prototype.localKeyUp = function(e)
    {
        if (!this.cameraControllers[this.cameramode]) return;
        this.cameraControllers[this.cameramode].localKeyUp(e);
    }
    editorCameraController.prototype.localKeyDown = function(e)
    {
        if (!this.cameraControllers[this.cameramode]) return;
        this.cameraControllers[this.cameramode].localKeyDown(e);
    }
    editorCameraController.prototype.localTouchMove = function(e)
    {
        if (!this.cameraControllers[this.cameramode]) return;
        this.cameraControllers[this.cameramode].localTouchMove(e);
    }
    editorCameraController.prototype.localTouchEnd = function(e)
    {
        if (!this.cameraControllers[this.cameramode]) return;
        this.cameraControllers[this.cameramode].localTouchEnd(e);
    }
    editorCameraController.prototype.localTouchStart = function(e)
    {
        if (!this.cameraControllers[this.cameramode]) return;
        this.cameraControllers[this.cameramode].localTouchStart(e);
    }
    editorCameraController.prototype.setCameraMode = function(mode)
    {
        if (this.cameraControllers[this.cameramode] && this.cameraControllers[this.cameramode].deactivate)
            this.cameraControllers[this.cameramode].deactivate();
        this.cameramode = mode;
        if (this.cameraControllers[this.cameramode])
            this.cameraControllers[this.cameramode].setCameraMode(mode);
        if (this.cameraControllers[this.cameramode] && this.cameraControllers[this.cameramode].activate)
            this.cameraControllers[this.cameramode].activate();
    }
    return new editorCameraController()
})