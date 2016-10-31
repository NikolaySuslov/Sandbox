define(["vwf/model/ammo.js/phyObject"], function(phyObject)
{
    //assets can be any type of collision, including trimesh
    function phyAsset(id, world)
    {
        this.length = .5;
        this.width = .5;
        this.height = .5;
        this.radius = .5;
        this.type = ASSET;
        this.colType = NONE;
        this.world = world;
        this.id = id;
        this.children = {};
        phyObject.setupPhyObject(this, id, world);
    }
    phyAsset.prototype = new phyObject();
    phyAsset.prototype.setMass = function(mass)
        {
            if (!this.colType !== MESH) phyObject.prototype.setMass.call(this, mass);
            else phyObject.prototype.setMass.call(this, 0);
        }
        //because a mesh may have geometry offset from the center, we must build a compound shape with an offset
    phyAsset.prototype.buildCollisionShape = function()
    {
        var compound = new Ammo.btCompoundShape();
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.getOrigin().setX(this.collisionBodyOffsetPos[0]);
        transform.getOrigin().setY(this.collisionBodyOffsetPos[1]);
        transform.getOrigin().setZ(this.collisionBodyOffsetPos[2]);
        //var q = new Ammo.btQuaternion(this.collisionBodyOffsetRot[0], this.collisionBodyOffsetRot[1], this.collisionBodyOffsetRot[2], this.collisionBodyOffsetRot[3]);
        //transform.setRotation(q);
        var col = this.buildCollisionShapeInner();
        if (col)
        {
            compound.addChildShape(transform, col);
            compound.setLocalScaling(new Ammo.btVector3(this.getWorldScale()[0], this.getWorldScale()[1], this.getWorldScale()[2]));
            return compound;
        }
        return null;
    }
    phyAsset.prototype.buildCollisionShapeInner = function()
    {
        if (this.colType == PLANE) return new Ammo.btBoxShape(new Ammo.btVector3(this.length * this.getWorldScale()[0], this.width * this.getWorldScale()[1], .001));
        if (this.colType == CONE) return new Ammo.btConeShapeZ(this.radius * this.getWorldScale()[0], this.height * this.getWorldScale()[1]);
        if (this.colType == CYLINDER) return new Ammo.btCylinderShapeZ(new Ammo.btVector3(this.radius * this.getWorldScale()[0], this.height * this.getWorldScale()[1], this.height * this.getWorldScale()[1]));
        if (this.colType == SPHERE) return new Ammo.btSphereShape(this.radius * this.getWorldScale()[0]);
        if (this.colType == BOX) return new Ammo.btBoxShape(new Ammo.btVector3(this.length * this.getWorldScale()[0], this.width * this.getWorldScale()[1], this.height * this.getWorldScale()[2]));
        if (this.colType == MESH)
        {
            return this.buildMeshCollision();
            //here be dragons
        }
    }
    phyAsset.prototype.setLength = function(length)
    {
        if (this.length == length / 2) return;
        this.length = length / 2;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    phyAsset.prototype.setWidth = function(width)
    {
        if (this.width == width / 2) return;
        this.width = width / 2;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    phyAsset.prototype.setHeight = function(height)
    {
        if (this.height == height / 2) return;
        this.height = height / 2;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    phyAsset.prototype.setRadius = function(radius)
    {
        if (this.radius == radius) return;
        this.radius = radius;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    phyAsset.prototype.buildMeshCollision = function()
    {
        var threejsNode = _Editor.findviewnode(this.id);
        //so, we are going to find all child meshes, and find the matrix that puts their geometry into the coordspace of this node
        //NOTE: deal here with children? Might not want to collect children that are part of different VWF node?
        var list = [];
        threejsNode.updateMatrixWorld(true)
        var selfmat = threejsNode.matrixWorld.clone();
        var selfI = new THREE.Matrix4();
        selfI.getInverse(selfmat);
        var walk = function(tn)
        {
            for (var i = 0; i < tn.children.length; i++) walk(tn.children[i]);
            if (tn instanceof THREE.Mesh)
            {
                var lmat = tn.matrixWorld.clone();
                lmat = (new THREE.Matrix4()).multiplyMatrices(selfI, lmat);
                list.push(
                {
                    mat: lmat,
                    mesh: tn
                })
            }
        }
        walk(threejsNode);
        var triangle_mesh = new Ammo.btTriangleMesh();
        // well, this seems right, but I can't find where the collision body actually ended up
        for (var i in list)
        {
            if (list[i].mesh.geometry && list[i].mesh.geometry instanceof THREE.Geometry)
            {
                for (var j = 0; j < list[i].mesh.geometry.faces.length; j++)
                {
                    var face = list[i].mesh.geometry.faces[j];
                    var v1 = list[i].mesh.geometry.vertices[face.a];
                    var v2 = list[i].mesh.geometry.vertices[face.b];
                    var v3 = list[i].mesh.geometry.vertices[face.c];
                    v1 = v1.clone().applyMatrix4(list[i].mat);
                    v2 = v2.clone().applyMatrix4(list[i].mat);
                    v3 = v3.clone().applyMatrix4(list[i].mat);
                    triangle_mesh.addTriangle(new Ammo.btVector3(v1.x, v1.y, v1.z), new Ammo.btVector3(v2.x, v2.y, v2.z), new Ammo.btVector3(v3.x, v3.y, v3.z), false);
                }
            }
        }
        var shape = new Ammo.btBvhTriangleMeshShape(triangle_mesh, true, true);
        //Cool, not list contains all the meshes
        return shape;
    }
    phyAsset.prototype.setType = function(type)
        {
            if (this.colType == type) return;
            this.colType = type;
            if (this.initialized === true)
            {
                this.collisionDirty = true;
                this.markRootBodyCollisionDirty();
            }
            //meshes account for offsets
            //might have to think about how to center up center of mass
            if (this.colType == MESH)
            {
                //careful not to confuse VWF by modifying internal state but not informing kernel
                this.backup_collisionBodyOffsetPos = this.collisionBodyOffsetPos;
                this.collisionBodyOffsetPos = [0, 0, 0];
            }
            else
            {
                if (this.backup_collisionBodyOffsetPos)
                {
                    this.collisionBodyOffsetPos = this.backup_collisionBodyOffsetPos;
                    delete this.backup_collisionBodyOffsetPos;
                }
            }
        }
        //only assets have interface to move collision body away from mesh center point
        //prims are centered properly or account for it themselves
    phyAsset.prototype.setCollisionOffset = function(vec)
    {
        //meshes account for offsets
        //might have to think about how to center up center of mass
        if (this.type == MESH) return;
        this.collisionBodyOffsetPos = vec;
        if (this.initialized === true)
        {
            this.collisionDirty = true;
            this.markRootBodyCollisionDirty();
        }
    }
    return phyAsset;
})