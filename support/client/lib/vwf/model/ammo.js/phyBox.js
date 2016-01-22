define(["vwf/model/ammo.js/phyObject"], function(phyObject)
{
    function phyBox(id, world)
    {
        this.length = .5;
        this.width = .5;
        this.height = .5;
        this.world = world;
        this.id = id;
        this.type = BOX;
        this.children = {};
        phyObject.setupPhyObject(this, id, world);
    }
    phyBox.prototype = new phyObject();
    phyBox.prototype.buildCollisionShape = function()
    {
        var f = new Ammo.btVector3(this.length * this.getWorldScale()[0], this.width * this.getWorldScale()[1], this.height * this.getWorldScale()[2]);
        return new Ammo.btBoxShape(f);
    }
    phyBox.prototype.setLength = function(length)
    {
        if (this.length == length / 2) return;
        this.length = length / 2;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    phyBox.prototype.setWidth = function(width)
    {
        if (this.width == width / 2) return;
        this.width = width / 2;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    phyBox.prototype.setHeight = function(height)
    {
        if (this.height == height / 2) return;
        this.height = height / 2;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    return phyBox;
})