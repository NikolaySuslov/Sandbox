define(["vwf/model/ammo.js/phyObject"], function(phyObject)
{
    function phyCylinder(id, world)
    {
        this.radius = 1;
        this.height = .5;
        this.world = world;
        this.id = id;
        this.type = CYLINDER;
        this.children = {};
        phyObject.setupPhyObject(this, id, world);
    }
    phyCylinder.prototype = new phyObject();
    phyCylinder.prototype.buildCollisionShape = function()
    {
        return new Ammo.btCylinderShapeZ(new Ammo.btVector3(this.radius * this.getWorldScale()[0], this.radius * this.getWorldScale()[1], this.height * this.getWorldScale()[2]));
    }
    phyCylinder.prototype.setRadius = function(radius)
    {
        if (this.radius == radius) return;
        this.radius = radius;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    phyCylinder.prototype.setHeight = function(height)
    {
        if (this.height == height / 2) return;
        this.height = height / 2;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    return phyCylinder;
})