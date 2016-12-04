function findviewnode(id)
{
    for (var i = 0; i < Engine.views.length; i++)
    {
        if (Engine.views[i].state && Engine.views[i].state.nodes && Engine.views[i].state.nodes[id] && Engine.views[i].state.nodes[id].threeObject) return Engine.views[i].state.nodes[id].threeObject;
    }
    return null;
}
var orthoCameraController = function()
{
    this.initialize = function()
    {
        this.zoom = 1;
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
        this.position = new THREE.Vector3(0, 0, 0);
        this.camera.position.copy(this.position);
        this.camera.up.x = 0;
        this.camera.up.y = 0;
        this.camera.up.z = 1;
        this.camera.lookAt(new THREE.Vector3(0, 0, -1));
        this.keysDown = {};
        
        this.rel_x = 0;
        this.rel_y = 0;
        this.loaded = false;
        this.leftdown = false;
        this.middledown = false;
        this.rightdown = false;
        this.last_x = 0;
        this.last_y = 0;
        this.w = 1000;
        this.h = 1000;
    }
    this.getCamera = function()
    {
        return this.camera;
    }
    this.localTouchStart = function(event) {}
    this.localTouchEnd = function(event) {}
    this.localTouchMove = function(event) {}
    this.localpointerDown = function(parms, pickInfo)
    {
        if (!_dView.inDefaultCamera()) return;
        parms.preventDefault();
        if (parms.which == 1) this.leftdown = true;
        if (parms.which == 2) this.middledown = true;
        if (parms.which == 3) this.rightdown = true;
        this.last_x = parms.clientX ;
        this.last_y = parms.clientY ;
    }
    this.localpointerUp = function(parms, pickInfo)
    {
        if (!_dView.inDefaultCamera()) return;
        parms.preventDefault();
        if (parms.which == 1) this.leftdown = false;
        if (parms.which == 3) this.rightdown = false;
        if (parms.which == 2) this.middledown = false;
    }
    this.localKeyDown = function(e)
    {
     
    }
    this.focus = function(p,z)
    {
        this.position.x = p[0];
        this.position.y = p[1];
        this.position.z = p[2];
        this.zoom = Math.abs(z);
    }
    this.localKeyUp = function(e)
    {
       
    }
    this.localpointerMove = function(parms, pickInfo)
    {
        if (!_dView.inDefaultCamera()) return;
        if (document.AxisSelected != null)
            if (document.AxisSelected != -1)
                return;
        if (this.rel_x == undefined) return;
        this.rel_x = this.last_x - parms.clientX;
        this.rel_y = this.last_y - parms.clientY ;
        if(this.middledown)
        {
            if(this.mode == "Top")
                this.position.add(new THREE.Vector3((this.rel_y/this.h) * this.camera.top*2,(-this.rel_x/this.w) * this.camera.left*2,0))
            if(this.mode == "Left")
                this.position.add(new THREE.Vector3((this.rel_x/this.w) * this.camera.left*2,0,(-this.rel_y/this.h) * this.camera.top*2))
            if(this.mode == "Front")
                this.position.add(new THREE.Vector3(0,(-this.rel_x/this.w) * this.camera.left*2,(-this.rel_y/this.h) * this.camera.top*2))
        }
        this.last_x = parms.clientX ;
        this.last_y = parms.clientY ;
    }
    this.orientationEvent = function(e) {}
    this.updateCamera = function(e, vp, h, w)
    {


        if(this.zoom < .01) this.zoom = .01;
        this.w = w;
        this.h = h;
        this.camera.position.copy(this.position);
        this.camera.top = this.zoom;
     
        this.camera.left = -this.zoom * w / h;
        this.camera.right = -this.camera.left;
        this.camera.bottom = -this.camera.top;
        this.camera.updateMatrix();
        this.camera.updateMatrixWorld();
       
    }
    this.activate = function()
    {
        this.position.copy(this.camera.position);
        $('#index-vwf').css('background', 'black');
    }
    this.setCameraMode = function(mode) {
        
        this.mode = mode;
        if(mode == "Top")
        {
            this.position.z = 0;
            this.camera.lookAt(this.camera.position.clone().add(new THREE.Vector3(0, 0, -1)));
        }
        if(mode == "Left")
        {
            this.position.y = 0;
            this.camera.lookAt(this.camera.position.clone().add(new THREE.Vector3(0, -1, 0)));
        }
        if(mode == "Front")
        {
            this.position.x = 0;
            this.camera.lookAt(this.camera.position.clone().add(new THREE.Vector3(-1, 0, 0)));
        }


    }
    this.pointerLeave = function(e) {}
    this.localpointerWheel = function(e)
    {
        if(e.deltaY > 0)
        this.zoom *= 1.1;
        else
        this.zoom *= .9;
    }
    this.prerender = function(e)
    {
        this.updateCamera(null, e[0], e[1], e[2]);
    }
}
define([], function()
{
    return new orthoCameraController();
})