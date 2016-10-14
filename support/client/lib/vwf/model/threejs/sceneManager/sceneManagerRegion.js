define(['vwf/model/threejs/sceneManager/_THREERayTracer'], function()
{
    function SceneManagerRegion(min, max, depth, scene, order)
    {
        this.min = [min[0], min[1], min[2]];
        this.max = [max[0], max[1], max[2]];;
        this.r = Vec3.distance(min, max) / 2;
        this.childCount = 0;
        this.c = [(this.max[0] + this.min[0]) / 2, (this.max[1] + this.min[1]) / 2, (this.max[2] + this.min[2]) / 2];
        this.childRegions = [];
        this.childObjects = [];
        this.depth = depth;
        this.scene = scene;
        this.order = order;
        this.wantsDesplit = false;
        this.isSplit = false;
        this.parent = null;
        if (SceneManagerRegion.drawSceneManagerRegions)
        {
            this.mesh = this.BuildWireBox([this.max[0] - this.min[0], this.max[0] - this.min[0], this.max[0] - this.min[0]], [0, 0, 0], [(this.depth / SceneManagerRegion.maxDepth) * 2, 0, 0]);
            this.mesh.material.depthTest = false;
            this.mesh.material.depthWrite = false;
            this.mesh.material.transparent = true;
            this.mesh.position.x = this.c[0];
            this.mesh.position.y = this.c[1];
            this.mesh.position.z = this.c[2];
            this.mesh.InvisibleToCPUPick = true;
            this.mesh.renderDepth = this.depth * 8 + this.order;
            this.scene.add(this.mesh, true);
            this.mesh.updateMatrixWorld(true);
        }
        if (this.depth <= SceneManagerRegion.batchAtLevel)
        {
            this.RenderBatchManager = new THREE.RenderBatchManager(scene, GUID());
            _SceneManager.BatchManagers.push(this.RenderBatchManager);
        }
    }
    SceneManagerRegion.drawSceneManagerRegions = false;
    SceneManagerRegion.batchAtLevel = 0;
    SceneManagerRegion.maxObjects = 5;
    SceneManagerRegion.maxDepth = 16;
    var sceneManagerRegionRecycleList = [];
    SceneManagerRegion.releaseSceneManagerNode = function(node)
    {
        sceneManagerRegionRecycleList.push(node);
    }
    SceneManagerRegion.cleanRecycledSceneManagerRegion = function(min, max, depth, scene, order)
    {
        this.min[0] = min[0];
        this.min[1] = min[1];
        this.min[2] = min[2];
        this.max[0] = max[0];
        this.max[1] = max[1];
        this.max[2] = max[2];
        this.r = Vec3.distance(min, max) / 2;
        this.childCount = 0;
        this.c[0] = (this.max[0] + this.min[0]) / 2;
        this.c[1] = (this.max[1] + this.min[1]) / 2;
        this.c[2] = (this.max[2] + this.min[2]) / 2;
        this.childRegions.length = 0;
        this.childObjects.length = 0;
        this.depth = depth;
        this.scene = scene;
        this.order = order;
        this.wantsDesplit = false;
        this.isSplit = false;
        this.parent = null;
        if (SceneManagerRegion.drawSceneManagerRegions)
        {
            this.mesh = this.BuildWireBox([this.max[0] - this.min[0], this.max[0] - this.min[0], this.max[0] - this.min[0]], [0, 0, 0], [(this.depth / SceneManagerRegion.maxDepth) * 2, 0, 0]);
            this.mesh.material.depthTest = false;
            this.mesh.material.depthWrite = false;
            this.mesh.material.transparent = true;
            this.mesh.position.x = this.c[0];
            this.mesh.position.y = this.c[1];
            this.mesh.position.z = this.c[2];
            this.mesh.InvisibleToCPUPick = true;
            this.mesh.renderDepth = this.depth * 8 + this.order;
            this.scene.add(this.mesh, true);
            this.mesh.updateMatrixWorld(true);
        }
        if (this.RenderBatchManager)
        {
            _SceneManager.BatchManagers.splice(_SceneManager.BatchManagers.indexOf(this.RenderBatchManager), 1);
            this.RenderBatchManager.deinitialize();
        }
        //TODO: clean and reuse batchmanager;
        if (this.depth <= SceneManagerRegion.batchAtLevel)
        {
            this.RenderBatchManager = new THREE.RenderBatchManager(scene, GUID());
            _SceneManager.BatchManagers.push(this.RenderBatchManager);
        }
    }
    SceneManagerRegion.allocateSceneManagerRegion = function(min, max, depth, scene, order)
    {
        //avoid assinging new node that was just deallocated 
        if (sceneManagerRegionRecycleList.length > 16)
        {
            var newRegion = sceneManagerRegionRecycleList.shift();
            SceneManagerRegion.cleanRecycledSceneManagerRegion.call(newRegion, min, max, depth, scene, order);
            return newRegion;
        }
        else
        {
            return new SceneManagerRegion(min, max, depth, scene, order);
        }
    }
    SceneManagerRegion.prototype.processDesplits = function()
    {
        if (this.wantsDesplit)
            this.desplit();
        for (var i = 0; i < this.childRegions.length; i++)
            this.childRegions[i].processDesplits();
    }
    SceneManagerRegion.prototype.BuildWireBox = function(size, offset, color)
    {
        var mesh = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial(), THREE.LinePieces);
        mesh.material.color.r = color[0];
        mesh.material.color.g = color[1];
        mesh.material.color.b = color[2];
        var vertices = [
            new THREE.Vector3(size[0] / 2, size[1] / 2, size[2] / 2),
            new THREE.Vector3(-size[0] / 2, size[1] / 2, size[2] / 2),
            new THREE.Vector3(-size[0] / 2, -size[1] / 2, size[2] / 2),
            new THREE.Vector3(size[0] / 2, -size[1] / 2, size[2] / 2),
            new THREE.Vector3(size[0] / 2, size[1] / 2, -size[2] / 2),
            new THREE.Vector3(-size[0] / 2, size[1] / 2, -size[2] / 2),
            new THREE.Vector3(-size[0] / 2, -size[1] / 2, -size[2] / 2),
            new THREE.Vector3(size[0] / 2, -size[1] / 2, -size[2] / 2)
        ];
        //mesh.matrix.setPosition(new THREE.Vector3(offset[0],offset[1],offset[2]));
        for (var i = 0; i < vertices.length; i++)
        {
            vertices[i].x += offset[0];
            vertices[i].y += offset[1];
            vertices[i].z += offset[2];
        }
        // TODO: Wouldn't be nice if Line had .segments?
        var geometry = mesh.geometry;
        geometry.vertices.push(
            vertices[0], vertices[1],
            vertices[1], vertices[2],
            vertices[2], vertices[3],
            vertices[3], vertices[0],
            vertices[4], vertices[5],
            vertices[5], vertices[6],
            vertices[6], vertices[7],
            vertices[7], vertices[4],
            vertices[0], vertices[4],
            vertices[1], vertices[5],
            vertices[2], vertices[6],
            vertices[3], vertices[7]
        );
        mesh.matrixAutoUpdate = true;
        mesh.updateMatrixWorld(true);
        return mesh;
    }
    SceneManagerRegion.prototype.deinitialize = function()
    {
        if (this.mesh)
        {
            this.mesh.parent.remove(this.mesh, true);
            this.mesh.geometry.dispose();
            this.mesh = null;
        }
        for (var i = 0; i < this.childRegions.length; i++)
        {
            this.childRegions[i].deinitialize();
        }
        if (this.RenderBatchManager)
        {
            _SceneManager.BatchManagers.splice(_SceneManager.BatchManagers.indexOf(this.RenderBatchManager), 1);
            this.RenderBatchManager.deinitialize();
        }
    }
    SceneManagerRegion.prototype.getChildren = function()
    {
        var count = [];
        for (var i = 0; i < this.childRegions.length; i++)
        {
            count = count.concat(this.childRegions[i].getChildren());
        }
        return count.concat(this.childObjects);
    }
    SceneManagerRegion.prototype.getChildCount = function()
    {
        //can we keep track without the recursive search?
        return this.childCount;
        var count = 0;
        for (var i = 0; i < this.childRegions.length; i++)
        {
            count += this.childRegions[i].getChildCount();
        }
        return count + this.childObjects.length;
    }
    SceneManagerRegion.prototype.childRemoved = function()
    {
        this.childCount--;
        if (this.parent)
            this.parent.childRemoved();
    }
    SceneManagerRegion.prototype.childAdded = function()
    {
        this.childCount++;
        if (this.parent)
            this.parent.childAdded();
    }
    SceneManagerRegion.prototype.removeChild = function(child)
    {
        var removed = false;
        if (this.childObjects.indexOf(child) != -1)
        {
            removed = true;
            child.sceneManagerNode = null;
            this.childObjects.splice(this.childObjects.indexOf(child), 1);
            this.childRemoved();
            if (child.RenderBatchManager)
            {
                child.RenderBatchManager.remove(child);
            }
        }
        else
        {
            for (var i = 0; i < this.childRegions.length; i++)
            {
                removed = this.childRegions[i].removeChild(child);
                if (removed)
                {
                    break;
                }
            }
        }
        if (this.getChildCount() <= SceneManagerRegion.maxObjects && this.isSplit)
        {
            this.wantsDesplit = true;
        }
        return removed;
    }
    SceneManagerRegion.prototype.desplit = function()
    {
        //were going to be moving objects around alot, unlink the parent so the add/remove notifications don't bubble to parent
        //this is because the actual number of objects in this node does not change with split/desplit operation
        var pback = this.parent;
        this.parent = null;
        var children = this.getChildren();
        for (var i = 0; i < this.childRegions.length; i++)
        {
            this.childRegions[i].deinitialize();
            this.childRegions[i].release();
        }
        this.childObjects = children;
        for (var j = 0; j < children.length; j++)
        {
            children[j].sceneManagerNode = this;
            //this.updateObject(children[j]);
        }
        this.childCount = this.childObjects.length;
        this.childRegions.length = 0;
        this.isSplit = false;
        this.wantsDesplit = false;
        this.parent = pback;
    }
    SceneManagerRegion.prototype.release = function()
    {
        for (var i = 0; i < this.childRegions.length; i++)
        {
            this.childRegions[i].release();
        }
        SceneManagerRegion.releaseSceneManagerNode(this);
    }
    SceneManagerRegion.prototype.getLeaves = function(list)
    {
        if (!list)
            list = [];
        for (var i = 0; i < this.childRegions.length; i++)
        {
            this.childRegions[i].getLeaves(list);
        }
        if (this.childRegions.length == 0)
            list.push(this);
    }
    var tempmat = [];
    SceneManagerRegion.prototype.completelyContains = function(object)
    {
        //changing transforms make this cache not work
        if (!object.boundsCache)
            object.boundsCache = object.GetBoundingBox(true).transformBy(object.getModelMatrix(tempmat));
        return this.completelyContainsBox(object.boundsCache);
    }
    SceneManagerRegion.prototype.completelyContainsBox = function(box)
    {
        if (box.min[0] > this.min[0] && box.max[0] < this.max[0])
            if (box.min[1] > this.min[1] && box.max[1] < this.max[1])
                if (box.min[2] > this.min[2] && box.max[2] < this.max[2])
                    return true;
        return false;
    }
    SceneManagerRegion.prototype.addChild = function(child)
    {
        //sort the children down into sub nodes
        var added = this.distributeObject(child);
        if (child.isStatic())
        {
            if (this.depth == SceneManagerRegion.batchAtLevel && added)
            {
                this.RenderBatchManager.add(child);
            }
            if (this.depth >= 0 && this.depth <= SceneManagerRegion.batchAtLevel && !added)
            {
                this.RenderBatchManager.add(child);
            }
        }
    }

    function objectSceneManagerDelete()
    {
        for (var i = 0; i < this.children.length; i++)
        {
            this.children[i].sceneManagerDelete();
        }
        if (this.RenderBatchManager)
            this.RenderBatchManager.remove(this);
        _SceneManager.removeChild(this);
    }

    function objectSceneManagerUpdate()
    {
        //dynamic objects currently should not belong to the octree
        //we really should  try to not get here in the first place. Because when we set
        
        this.boundsCache = this.GetBoundingBox(true).transformBy(this.getModelMatrix(tempmat));
        if (this.isDynamic()) return;
        for (var i = 0; i < this.children.length; i++)
        {
            this.children[i].sceneManagerUpdate();
        }
        if (this.SceneManagerIgnore)
            return;
        if (!this.updateCount)
            this.updateCount = 1;
        this.updateCount++;
        if (this.updateCount == 100 && this.isStatic())
        {
            console.log(this.name + ' is not static, debatching');
            this._static = false;
            _SceneManager.tempDebatchList.push(this);
        }
        // this.updateMatrixWorld(true);
        var oldnode = this.sceneManagerNode;
        if (this.sceneManagerNode)
            this.sceneManagerNode.updateObject(this);
        if (!this.sceneManagerNode)
        {
            this.sceneManagerNode = oldnode;
            if (this.sceneManagerNode)
                this.sceneManagerNode.updateObject(this);
        }
    }
    SceneManagerRegion.prototype.distributeObject = function(object)
    {
        var added = false;
        if (this.childObjects.length + 1 > SceneManagerRegion.maxObjects && this.depth < SceneManagerRegion.maxDepth && this.childRegions.length == 0)
            this.split();
        if (this.childRegions)
        {
            for (var i = 0; i < this.childRegions.length; i++)
            {
                if (this.childRegions[i].completelyContains(object))
                {
                    this.childRegions[i].addChild(object);
                    added = true;
                    //it either goes in me or my children
                    break;
                }
            }
        }
        if (!added)
        {
            if (this.childObjects.indexOf(object) == -1)
            {
                this.childObjects.push(object);
                //it either goes in me or my children
                this.childAdded();
                if (this.getChildCount() > SceneManagerRegion.maxObjects && this.wantsDesplit)
                    this.wantsDesplit = false;
                if (this.mesh)
                {
                    this.mesh.material.color.g = this.childObjects.length / SceneManagerRegion.maxObjects;
                    this.mesh.renderDepth = this.depth * 8 + this.order + this.childObjects.length;
                }
                object.sceneManagerNode = this;
                object.sceneManagerUpdate = objectSceneManagerUpdate;
                object.sceneManagerDelete = objectSceneManagerDelete;
            }
        }
        return added;
    }
    SceneManagerRegion.prototype.updateObject = function(object)
    {
        //the object has not crossed  into a new region, so no need to search up
        if (this.completelyContains(object))
        {
            //if I contain the object, and I'm split, and the object has moved
            //then we need to redistribute it. it may end up back in this node, but
            //we won't know that until we try. If I contain the object, and I'm not split
            //then there is no point in doing all that work - the object is still in its region 
            this.removeChild(object)
            this.addChild(object);
            //even if the object is still in its region, it may need updating in teh render batch, since its dirty.
            if (!this.RenderBatchManager)
            {
                //search up for the lowest level batch manager I fit in
                var p = this;
                var found = false;
                while (!found && p)
                {
                    if (p.RenderBatchManager)
                    {
                        found = true;
                        break;
                    }
                    p = p.parent;
                }
                //remove me from my old batch, if any
                if (object.RenderBatchManager)
                    object.RenderBatchManager.remove(object);
                //add to the correct batch, if I'm static
                if (p && object.isStatic())
                    p.RenderBatchManager.add(object);
            }
        }
        //the object has left the region, search up.
        else
        {
            //if dont have parent, then at top level and cannot toss up
            if (this.parent)
            {
                //so, removechild causes a walk down, but we are already walking up!
                //each step up causes a whole recurse down! check that the child actually belongs to someone
                //if it does not, no need to keep walking down to remove from children
                if (object.sceneManagerNode)
                    this.removeChild(object);
                this.parent.updateObject(object);
            }
            else
            {
                this.addChild(object);
            }
        }
    }
    SceneManagerRegion.prototype.split = function()
    {
        var v0 = [this.min[0], this.min[1], this.min[2]];
        var v0 = [this.min[0], this.min[1], this.min[2]];
        var v1 = [this.min[0], this.min[1], this.max[2]];
        var v2 = [this.min[0], this.max[1], this.min[2]];
        var v3 = [this.min[0], this.max[1], this.max[2]];
        var v4 = [this.max[0], this.min[1], this.min[2]];
        var v5 = [this.max[0], this.min[1], this.max[2]];
        var v6 = [this.max[0], this.max[1], this.min[2]];
        var v7 = [this.max[0], this.max[1], this.max[2]];
        this.c = [(this.max[0] + this.min[0]) / 2, (this.max[1] + this.min[1]) / 2, (this.max[2] + this.min[2]) / 2];
        this.r = MATH.distanceVec3(this.c, this.max);
        var m1 = [this.c[0], this.min[1], this.min[2]];
        var m2 = [this.max[0], this.c[1], this.c[2]];
        var m3 = [this.min[0], this.c[1], this.min[2]];
        var m4 = [this.c[0], this.max[1], this.c[2]];
        var m5 = [this.c[0], this.c[1], this.min[2]];
        var m6 = [this.max[0], this.max[1], this.c[2]];
        var m7 = [this.min[0], this.min[1], this.c[2]];
        var m8 = [this.c[0], this.c[1], this.max[2]];
        var m9 = [this.c[0], this.min[1], this.c[2]];
        var m10 = [this.max[0], this.c[1], this.max[2]];
        var m11 = [this.min[0], this.c[1], this.c[2]];
        var m12 = [this.c[0], this.max[1], this.max[2]];
        this.childRegions[0] = SceneManagerRegion.allocateSceneManagerRegion(v0, this.c, this.depth + 1, this.scene, 0);
        this.childRegions[1] = SceneManagerRegion.allocateSceneManagerRegion(m1, m2, this.depth + 1, this.scene, 1);
        this.childRegions[2] = SceneManagerRegion.allocateSceneManagerRegion(m3, m4, this.depth + 1, this.scene, 2);
        this.childRegions[3] = SceneManagerRegion.allocateSceneManagerRegion(m5, m6, this.depth + 1, this.scene, 3);
        this.childRegions[4] = SceneManagerRegion.allocateSceneManagerRegion(m7, m8, this.depth + 1, this.scene, 4);
        this.childRegions[5] = SceneManagerRegion.allocateSceneManagerRegion(m9, m10, this.depth + 1, this.scene, 5);
        this.childRegions[6] = SceneManagerRegion.allocateSceneManagerRegion(m11, m12, this.depth + 1, this.scene, 6);
        this.childRegions[7] = SceneManagerRegion.allocateSceneManagerRegion(this.c, v7, this.depth + 1, this.scene, 7);
        this.childRegions[0].parent = this;
        this.childRegions[1].parent = this;
        this.childRegions[2].parent = this;
        this.childRegions[3].parent = this;
        this.childRegions[4].parent = this;
        this.childRegions[5].parent = this;
        this.childRegions[6].parent = this;
        this.childRegions[7].parent = this;
        //were going to be moving objects around alot, unlink the parent so the add/remove notifications don't bubble to parent
        //this is because the actual number of objects in this node does not change with split/desplit operation
        var pback = this.parent;
        this.parent = null;
        //if I have faces, but I split, I need to distribute my faces to my children
        var objectsBack = this.childObjects;
        this.childObjects = [];
        for (var i = 0; i < objectsBack.length; i++)
        {
            if (this.RenderBatchManager)
                this.RenderBatchManager.remove(objectsBack[i]);
            var added = this.distributeObject(objectsBack[i]);
            if (!added)
            {
                if (this.RenderBatchManager)
                    if (objectsBack[i].isStatic())
                        this.RenderBatchManager.add(objectsBack[i]);
            }
        }
        this.childCount = objectsBack.length;
        this.parent = pback;
        this.isSplit = true;
    }
    SceneManagerRegion.prototype.contains = function(o)
        {
            if (o[0] > this.min[0] && o[0] < this.max[0])
                if (o[1] > this.min[1] && o[1] < this.max[1])
                    if (o[2] > this.min[2] && o[2] < this.max[2])
                        return true;
            return false;
        }
        //Test a ray against an octree region
    SceneManagerRegion.prototype.CPUPick = function(o, d, opts, hits)
        {
            if (!hits)
                hits = [];
            //if no faces, can be no hits. 
            //remember, faces is all faces in this node AND its children
            if (this.getChildCount() == 0)
                return hits;
            //reject this node if the ray does not intersect it's bounding box
            if (this.testBoundsRay(o, d) == false)
            {
                opts.regionsRejectedByBounds++
                    return hits;
            }
            //use the render batch. Note that this will not give a VWFID, only good when you don't care what you hit
            if (this.RenderBatchManager && opts && opts.useRenderBatches)
            {
                opts.batchesTested++;
                return this.RenderBatchManager.CPUPick(o, d, opts, hits);
            }
            //the the opts specify a max dist
            //if the start is not in me, and im to far, don't bother with my children or my objcts
            if (opts.maxDist > 0)
            {
                if ((MATH.distanceVec3(o, this.c) - this.r) > opts.maxDist)
                {
                    opts.regionsRejectedByDist++;
                    return hits;
                }
            }
            opts.regionTests++;
            //check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
            //for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
            for (var i = 0; i < this.childRegions.length; i++)
            {
                this.childRegions[i].CPUPick(o, d, opts, hits);
            }
            for (var i = 0; i < this.childObjects.length; i++)
            {
                this.childObjects[i].CPUPick(o, d, opts, hits);
            }
            return hits;
        }
        //Test a ray against an octree region
    SceneManagerRegion.prototype.FrustrumCast = function(frustrum, opts, hits)
        {
            if (!hits)
                hits = [];
            //if no faces, can be no hits. 
            //remember, faces is all faces in this node AND its children
            if (this.getChildCount() == 0)
                return hits;
            //reject this node if the ray does not intersect its bounding box
            if (this.testBoundsFrustrum(frustrum).length == 0)
                return hits;
            //the the opts specify a max dist
            //if the start is not in me, and im to far, don't bother with my children or my objcts
            if (opts.maxDist > 0 && this.r + MATH.distanceVec3(o, this.c) > opts.maxDist)
            {
                if (!this.contains(o))
                    return hits;
            }
            //check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
            //for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
            for (var i = 0; i < this.childRegions.length; i++)
            {
                this.childRegions[i].FrustrumCast(frustrum, opts, hits);
            }
            for (var i = 0; i < this.childObjects.length; i++)
            {
                this.childObjects[i].FrustrumCast(frustrum, opts, hits);
            }
            return hits;
        }
        //Test a ray against an octree region
    SceneManagerRegion.prototype.SphereCast = function(center, r, opts)
    {
        var hits = [];
        //if no faces, can be no hits. 
        //remember, faces is all faces in this node AND its children
        if (this.getChildCount() == 0)
            return hits;
        //reject this node if the ray does not intersect it's bounding box
        if (this.testBoundsSphere(center, r).length == 0)
            return hits;
        //the the opts specify a max dist
        //if the start is not in me, and im to far, don't bother with my children or my objcts
        if (opts.maxDist > 0 && this.r + MATH.distanceVec3(o, this.c) > opts.maxDist)
        {
            if (!this.contains(o))
                return hits;
        }
        //check either this nodes faces, or the not distributed faces. for a leaf, this will just loop all faces,
        //for a non leaf, this will iterate over the faces that for some reason are not in children, which SHOULD be none
        for (var i = 0; i < this.childRegions.length; i++)
        {
            var childhits = this.childRegions[i].SphereCast(center, r, opts);
            if (childhits)
            {
                for (var j = 0; j < childhits.length; j++)
                    hits.push(childhits[j]);
            }
        }
        for (var i = 0; i < this.childObjects.length; i++)
        {
            var childhits = this.childObjects[i].SphereCast(center, r, opts);
            if (childhits)
            {
                for (var j = 0; j < childhits.length; j++)
                    hits.push(childhits[j]);
            }
        }
        return hits;
    }
    SceneManagerRegion.prototype.testBoundsRay = BoundingBoxRTAS.prototype.intersect;
    SceneManagerRegion.prototype.testBoundsSphere = BoundingBoxRTAS.prototype.intersectSphere;
    SceneManagerRegion.prototype.intersect = BoundingBoxRTAS.prototype.intersect;
    SceneManagerRegion.prototype.testBoundsFrustrum = BoundingBoxRTAS.prototype.intersectFrustrum;
    return SceneManagerRegion;
})