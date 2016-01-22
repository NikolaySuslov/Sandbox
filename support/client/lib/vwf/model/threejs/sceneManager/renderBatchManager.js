define(['vwf/model/threejs/sceneManager/renderBatch'], function()
{
    
    THREE.RenderBatchManager = function(scene, name)
    {
        this.scene = scene;
        this.name = name;
        this.objects = [];
        this.batches = [];
    }
    THREE.RenderBatchManager.prototype.CPUPick = function(o, d, opts, hits)
    {
        if (!hits)
            hits = [];
        for (var i = 0; i < this.batches.length; i++)
            this.batches[i].CPUPick(o, d, opts, hits);
        return hits;
    }
    THREE.RenderBatchManager.prototype.update = function()
    {
        if (this.dirty)
            for (var i = 0; i < this.batches.length; i++)
                this.batches[i].update();
        this.dirty = false;
    }
    THREE.RenderBatchManager.prototype.add = function(child)
    {
        //if(this.objects.indexOf(child) != -1)
        //	return;
        if (child.RenderBatchManager)
            child.RenderBatchManager.remove(child);
        this.objects.push(child);
        //child.visible = false;
        child.originalVisibility = child.visible;
        child.RenderBatchManager = this;
        var added = false;
        for (var i = 0; i < this.batches.length; i++)
        {
            if (this.batches[i].checkSuitability(child))
            {
                this.batches[i].addObject(child);
                if (!child.reBatchCount)
                    child.reBatchCount = 0;
                child.reBatchCount++;
                added = true;
            }
        }
        if (!added)
        {
            var newbatch = new THREE.RenderBatch(child.material.clone(), this.scene);
            newbatch.addObject(child);
            this.batches.push(newbatch);
        }
        //	console.log('adding ' + child.name + ' to batch' + this.name);  
        this.dirty = true;
    }
    THREE.RenderBatchManager.prototype.remove = function(child)
    {
        if (this.objects.indexOf(child) == -1)
            return;
        child.visible = child.originalVisibility;
        child.RenderBatchManager = null;
        //	console.log('removing ' + child.name + ' from batch' + this.name);  
        this.objects.splice(this.objects.indexOf(child), 1);
        var indexToDelete = [];
        for (var i = 0; i < this.batches.length; i++)
        {
            this.batches[i].removeObject(child);
            if (this.batches[i].objects.length == 0)
                indexToDelete.push(i);
        }
        for (var i = 0; i < indexToDelete.length; i++)
        {
            this.batches[indexToDelete[i]].deinitialize();
            this.batches.splice(indexToDelete[i], 1);
        }
        this.dirty = true;
    }
    THREE.RenderBatchManager.prototype.materialUpdated = function(child)
    {
        if (this.objects.indexOf(child) == -1)
        {
            console.log('Should have never got here. Updating material in batch taht does not contain object');
            return;
        }
        this.remove(child);
        this.add(child);
    }
    THREE.RenderBatchManager.prototype.deinitialize = function(child)
    {
        if (this.mesh)
            this.scene.remove_internal(this.mesh);
        for (var i = 0; i < this.batches.length; i++)
        {
            this.batches[i].deinitialize();
        }
    }
    return THREE.RenderBatchManager
})