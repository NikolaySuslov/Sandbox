define(["vwf/model/ammo.js/phyObject"], function(phyObject)
{
    function phyCone(id, world)
    {
        this.radius = 1;
        this.height = 1;
        this.world = world;
        this.id = id;
        this.type = CONE;
        this.children = {};
        phyObject.setupPhyObject(this, id, world);
    }
    phyCone.prototype = new phyObject();
    phyCone.prototype.buildCollisionShape = function()
    {
        return new Ammo.btConeShapeZ(this.radius * this.getWorldScale()[0], this.height * this.getWorldScale()[1]);
    }
    phyCone.prototype.setRadius = function(radius)
    {
        if (this.radius == radius) return;
        this.radius = radius;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    phyCone.prototype.setHeight = function(height)
    {
        if (this.height == height) return;
        this.height = height;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
        }
    };
    return phyCone;
})