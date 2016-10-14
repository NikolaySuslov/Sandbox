define(["vwf/model/ammo.js/phyObject"], function(phyObject)
{
    function phyPlane(id, world)
    {
        this.length = .5;
        this.width = .5;
        this.world = world;
        this.id = id;
        this.type = PLANE;
        this.children = {};
        phyObject.setupPhyObject(this, id, world);
    }
    phyPlane.prototype = new phyObject();
    phyPlane.prototype.buildCollisionShape = function()
    {
        return new Ammo.btBoxShape(new Ammo.btVector3(this.length * this.getWorldScale()[0], this.width * this.getWorldScale()[1], .001));
    }
    phyPlane.prototype.setLength = function(length)
    {
        if (this.length == length / 2) return;
        this.length = length / 2;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    phyPlane.prototype.setWidth = function(width)
    {
        if (this.width == width / 2) return;
        this.width = width / 2;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    return phyPlane;
})