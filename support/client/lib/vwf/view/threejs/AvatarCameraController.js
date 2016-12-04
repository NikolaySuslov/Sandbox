
var AvatarCameraController = function()
{
    this.initialize = function(camera)
    {
        this.camera = camera;
        this.offset = new THREE.Vector3(0, 1, 0);
        this.last_x = 0;
        this.rel_x = 0;
        this.last_y = 0;
        this.rel_y = 0;
        this.totalz = 0;
        this.zoom = 3;
        this.mouseDown = false;
        this.shiftDown = false;
        this.ctrlDown = false;
        this.keysDown = {};
         this.lastpos = new THREE.Vector3(0,0,0);
    }
    this.getCamera = function()
    {
        return this.camera;
    }
    this.localTouchStart = function(event) {}
    this.localTouchEnd = function(event) {}
    this.localTouchMove = function(event) {}
    this.localpointerDown = function(e, pickInfo)
    {
        if (e.button == 2)
            this.mouseDown = true;
        this.last_x = e.clientX;
        this.last_y = e.clientY;
    }
    this.localpointerUp = function(e, pickInfo)
    {
        if (e.button == 2)
            this.mouseDown = false;
    }
    this.localKeyDown = function(e)
    {
       // if(e.keyCode !=87 && e.keyCode != 38 && this.keysDown[e.keyCode]) return;
        
        var id = _UserManager.GetAvatarForClientID(Engine.moniker()).id;
        if (e.keyCode == 16)
            this.shiftDown = true;
        if (e.keyCode == 17)
            this.ctrlDown = true;
        if (e.keyCode == 87 || e.keyCode == 38) //W
        {
            vwf_view.kernel.callMethod(id, 'lookat', [
                [-this.offset.x, -this.offset.y, -this.offset.z]
            ]);
            this.keysDown[e.keyCode] = true;
        }
        if (e.keyCode == 65 || e.keyCode == 37) //A
        {
            var up = new THREE.Vector3(0, 0, 1);
            var side = this.offset.clone().cross(up);
            vwf_view.kernel.callMethod(id, 'lookat', [
                [side.x, side.y, side.z]
            ]);
            this.keysDown[e.keyCode] = true;
        }
        if (e.keyCode == 68 || e.keyCode == 39) //D
        {
            var up = new THREE.Vector3(0, 0, 1);
            var side = this.offset.clone().cross(up);
            vwf_view.kernel.callMethod(id, 'lookat', [
                [-side.x, -side.y, -side.z]
            ]);
            this.keysDown[e.keyCode] = true;
        }
        if (e.keyCode == 83 || e.keyCode == 40) //S
        {
            vwf_view.kernel.callMethod(id, 'lookat', [
                [-this.offset.x, -this.offset.y, -this.offset.z]
            ]);
            this.keysDown[e.keyCode] = true;
        }
    }
    this.localKeyUp = function(e)
    {
        delete this.keysDown[e.keyCode];
        if (e.keyCode == 16)
            this.shiftDown = false;
        if (e.keyCode == 17)
            this.ctrlDown = false;
    }
    this.localpointerMove = function(e, pickInfo)
    {
        this.rel_x = e.clientX - this.last_x;
        this.last_x = e.clientX;
        if (this.mouseDown || this.shiftDown)
        {
            var rot_z = new THREE.Quaternion();
            rot_z.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -this.rel_x / 100);
            this.offset = this.offset.applyQuaternion(rot_z);
            if(this.zoom < .5)
            {
                 var id = _UserManager.GetAvatarForClientID(Engine.moniker()).id;
                vwf_view.kernel.callMethod(id, 'lookat', [
                [-this.offset.x, -this.offset.y, -this.offset.z]
            ]);
            }
        }
        this.rel_y = e.clientY - this.last_y;
        this.last_y = e.clientY;
        if (this.mouseDown || this.shiftDown)
            this.totalz += this.rel_y;
        else if (this.ctrlDown)
        {
            this.zoom += this.rel_y / 100;
        }
    }
    this.orientationEvent = function(e) {}

    this.updateCamera = function()
    {
        if (Object.keys(this.keysDown).length > 0)
        {
            var transform = Engine.getProperty(_UserManager.GetAvatarForClientID(Engine.moniker()).id, 'transform');
            var charspaceforward = Mat4.multVec3NoTranslate(transform, [0, 1, 0], []);
            this.offset.x = this.offset.x * .97 + charspaceforward[0] * .03;
            this.offset.y = this.offset.y * .97 + charspaceforward[1] * .03;
        }
        var avatarNode = _UserManager.GetAvatarForClientID(Engine.moniker());
        if(!avatarNode)
            return;
        var avatarRoot = findviewnode(avatarNode.id);
        var avatar = [avatarRoot.matrixWorld.elements[12],avatarRoot.matrixWorld.elements[13],avatarRoot.matrixWorld.elements[14]];
        var center = new THREE.Vector3(avatar[0], avatar[1], avatar[2] + 1.5);
        

        var pos = center.clone().add(this.offset.setLength(this.zoom));
        if(this.zoom > 10)
            this.zoom = 10;
        if(this.zoom > .05)
        {
            pos.z += this.totalz / 200 * this.zoom;
            findviewnode(_UserManager.GetAvatarForClientID(Engine.moniker()).id).traverse(function(o)
            {
                if(o instanceof THREE.Mesh && o.name !== "BoneSelectionHandle")
                    o.visible = true;
            })
        }
        else{
            this.zoom = .05;
            pos.z -= this.totalz / 2000;
            findviewnode(_UserManager.GetAvatarForClientID(Engine.moniker()).id).traverse(function(o)
            {
                if(o instanceof THREE.Mesh && o.name !== "BoneSelectionHandle")
                    o.visible = false;
            })
        }
         if(this.zoom > .05 && Object.keys(this.keysDown).length == 0)
        {
        this.lastpos.x = (this.lastpos.x * 90 + pos.x*10)/100;
        this.lastpos.y = (this.lastpos.y * 90 + pos.y*10)/100;
        this.lastpos.z = (this.lastpos.z * 90 + pos.z*10)/100;
        this.camera.position.copy(this.lastpos);
        }
        else
        {
            this.lastpos.copy(pos);
             this.camera.position.copy(pos);
        }
        this.camera.lookAt(center);
    }
    this.setCameraMode = function(mode) {}
    this.pointerLeave = function(e) {
        this.keysDown = {};
    }
    this.localpointerWheel = function(e)
    {
        if (e.deltaY > 0)
        {
            this.zoom *= 1.1;
            if(this.zoom < .5)
                this.zoom = .55;
        }
        else
            this.zoom *= .9;
        if (this.zoom < .5)
        {
            this.zoom = .05;
        }
    }
    this.totalTime = 0;
    this.prerender = function()
    {
        //framerate independant smoothing
         var now = performance.now();
         this.totalTime += now - (this.lastTime ? this.lastTime : now);
         this.lastTime = now;
         while(this.totalTime > 0)
         {
            this.totalTime -= 16;
            this.updateCamera();
        }
    }
}
define([], function()
{
    return new AvatarCameraController();
})