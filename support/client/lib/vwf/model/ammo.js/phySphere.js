define(["vwf/model/ammo.js/phyObject"], function(phyObject)
{
    function phySphere(id, world)
    {
        this.radius = 1;
        this.world = world;
        this.id = id;
        this.type = SPHERE;
        this.children = {};
        phyObject.setupPhyObject(this, id, world);
    }
    phySphere.prototype = new phyObject();
    phySphere.prototype.buildCollisionShape = function()
    {
        return new Ammo.btSphereShape(this.radius * this.getWorldScale()[0]);
    }
    phySphere.prototype.setRadius = function(radius)
    {
        if (this.radius == radius) return;
        this.radius = radius;
        if (this.enabled === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    return phySphere
})