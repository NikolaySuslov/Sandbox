
define(['vwf/model/threejs/sceneManager/_THREERayTracer','vwf/model/threejs/sceneManager/sceneManagerRegion','vwf/model/threejs/sceneManager/renderBatchManager','vwf/utility/eventSource'],function(tracer,SceneManagerRegion,batchManager,eventSource)
{




var maxSize = 640;


//hook these up at the prototype so that we are not changing the chrome hidden class
THREE.Object3D.prototype.sceneManagerNode = null;
THREE.Object3D.prototype.sceneManagerUpdate = null;
THREE.Object3D.prototype.sceneManagerDelete = null;
THREE.Object3D.prototype.boundsCache = null;
THREE.Object3D.prototype.RenderBatchManager = null;
THREE.Object3D.prototype._static = false;
THREE.Object3D.prototype._dynamic = false;

function SceneManager(scene) {
    this.defaultPickOptions = new THREE.CPUPickOptions();
    this.cullList = [];
    eventSource.call(this,'SceneManager');
}

SceneManager.cullScale = 70;

function GetAllLeafMeshes(threeObject, list) {
    if (threeObject instanceof THREE.Mesh || threeObject instanceof THREE.Line) {
        if (!(threeObject instanceof THREE.SkinnedMesh))
            list.push(threeObject);

    }
    if (threeObject.children) {
        for (var i = 0; i < threeObject.children.length; i++) {
            GetAllLeafMeshes(threeObject.children[i], list);
        }
    }
}

SceneManager.prototype.traverse = function(cb, node)
{
    if (!node)
    {
        node = this.root;
        if (cb.call(this, node)) //CB must return true to keep walking down
        {
            for (var i in node.childRegions)
            {
                this.traverse(cb, node.childRegions[i]);
            }
        }
        node = this.staticRoot;
        if (cb.call(this, node)) //CB must return true to keep walking down
        {
            for (var i in node.childRegions)
            {
                this.traverse(cb, node.childRegions[i]);
            }
        }
        
    }
    else
    {
        if (cb.call(this, node)) //CB must return true to keep walking down
        {
            for (var i in node.childRegions)
            {
                this.traverse(cb, node.childRegions[i]);
            }
        }
    }
}
var CULLSCALE = 20; //pixels
function needsCull(FOV,dist,size,ww)
{
    var visualFOV_in_degrees = Math.atan(size/dist)*57.2958;
    var degree_to_pix = ww/FOV;
    var vfovo = visualFOV_in_degrees*degree_to_pix;
    if(vfovo < CULLSCALE) return true;
        return false;

}

SceneManager.tempmat = new THREE.Matrix4();
SceneManager.prototype.preRender = function(camera,ww)
{
    return; //some objects still cull incorrectly.
    this.trigger('cullStart');
   
    var cameraPos = [camera.matrixWorld.elements[12],camera.matrixWorld.elements[13],camera.matrixWorld.elements[14]]
    //do culling, LOD work
    this.traverse(function(region)
    {
      
        if (needsCull(camera.fov,MATH.distanceVec3(region.c, cameraPos),region.r*2,ww))
        {
            //traverse this region, hide everything
            this.traverse(function(region){
                for (var i in region.childObjects)
                {
                    var o = region.childObjects[i];
                    if(o.visible && o.frustumCulled)
                    {
                        o.visible = false;
                        this.cullList.push(o);
                    }
                }   
                return true; 
            },region)
            //dont continue traversing this region - we've already marked all children hidden
            return false;
        }
        //test each child in this region, traverse children
        for (var i in region.childObjects)
        {
            var o = region.childObjects[i];
            //if (!o.boundsCache)
                o.boundsCache = o.GetBoundingBox(false).transformBy(o.getModelMatrix(SceneManager.tempmat));
            if(o.visible && o.frustumCulled)
            {
                var size = MATH.distanceVec3(o.boundsCache.min,o.boundsCache.max);
              
                var objectCenter = [o.matrixWorld.elements[12], o.matrixWorld.elements[13], o.matrixWorld.elements[14]];
                if (needsCull(camera.fov,MATH.distanceVec3(o.boundsCache.center, cameraPos) ,size,ww))
                {
                    o.visible = false;
                    this.cullList.push(o);
                }
            }
           
        }
        //traverse the children of this node
        return true;
    });
    this.trigger('cullEnd');
}
SceneManager.prototype.postRender = function()
{
    //undo culling.
    for(var i =0; i < this.cullList.length; i++)
    {
        this.cullList[i].visible = true;
    }
    this.cullList.length = 0;
}
SceneManager.prototype.forceBatchAll = function() {

    var list = [];
    GetAllLeafMeshes(this.scene, list);
    for (var i = 0; i < list.length; i++) {
        if (list[i].material.skinning)
            continue;
        if (list[i] instanceof THREE.SkinnedMesh)
            continue;

        if (list[i].setStatic)

            list[i].setStatic(true);
    }
}
SceneManager.prototype.bonesVisible = false;

SceneManager.prototype.getBonesVisible = function() {
    return this.bonesVisible;
}
SceneManager.prototype.showBones = function() {
    this.bonesVisible = true;
    this.updateBoneVisiblitiy(true);
}
SceneManager.prototype.hideBones = function() {
    this.bonesVisible = false;
    this.updateBoneVisiblitiy(false);
}
SceneManager.prototype.updateBoneVisiblitiy = function(visible) {


    var walk = function(root) {
        if (root instanceof THREE.Bone) {
            for (var i in root.children) {
                if (root.children[i].name == "BoneSelectionHandle") {
                    root.children[i].visible = visible;
                }
                walk(root.children[i]);
            }
        }
        for (var i in root.children) {
            walk(root.children[i]);
        }
    }
    walk(this.scene);
}
SceneManager.prototype.forceUnbatchAll = function() {
    var list = [];
    GetAllLeafMeshes(this.scene, list);
    for (var i = 0; i < list.length; i++) {
        if (list[i].setStatic)
            list[i].setStatic(false);
    }
}
SceneManager.prototype.setMaxObjects = function(mo) {
    SceneManagerRegion.maxObjects = mo;
    this.rebuild();
}
SceneManager.prototype.setMaxDepth = function(mo) {
    SceneManagerRegion.maxDepth = mo;
    this.rebuild();
}
SceneManager.prototype.setBatchLevel = function(bl) {
    SceneManagerRegion.batchAtLevel = bl;
    this.rebuild();
}
SceneManager.prototype.setShowRegions = function(bool) {
    SceneManagerRegion.drawSceneManagerRegions = bool;
    this.rebuild();
}
SceneManager.prototype.getShowRegions = function() {
    return SceneManagerRegion.drawSceneManagerRegions;
}
SceneManager.prototype.setExtents = function(extents) {
    SceneManagerRegion.maxSize = extents;
    this.rebuild();
}
SceneManager.prototype.rebuild = function() {

    
    var children = this.root.getChildren().concat(this.staticRoot.getChildren());
    this.root.deinitialize();
    this.staticRoot.deinitialize();
    this.min = [-maxSize, -maxSize, -maxSize];
    this.max = [maxSize, maxSize, maxSize];
    this.root = SceneManagerRegion.allocateSceneManagerRegion(this.min, this.max, 0, this.scene, 0);
    this.staticRoot = SceneManagerRegion.allocateSceneManagerRegion(this.min, this.max, 0, this.scene, 0);
    for (var i = 0; i < children.length; i++) {
        if (!children[i].isDynamic())
        {
            if(children[i].isStatic())
                this.staticRoot.addChild(children[i]);
            else        
                this.root.addChild(children[i]);
        }
        else
            this.addToRoot(children[i]);

    }
}
SceneManager.prototype.show = function() {
    SceneManagerRegion.drawSceneManagerRegions = true;
    this.rebuild(SceneManagerRegion.maxObjects, SceneManagerRegion.maxDepth)
}
SceneManager.prototype.hide = function() {
    SceneManagerRegion.drawSceneManagerRegions = false;
    this.rebuild(SceneManagerRegion.maxObjects, SceneManagerRegion.maxDepth)
}
SceneManager.prototype.addToRoot = function(child) {
    
    this.specialCaseObjects.push(child);
}
SceneManager.prototype.removeFromRoot = function(child) {
    if (this.specialCaseObjects.indexOf(child) != -1)
        this.specialCaseObjects.splice(this.specialCaseObjects.indexOf(child), 1);
}

SceneManager.prototype.buildCPUPickOptions = function(opts) {
    if (!opts) return this.defaultPickOptions;
    if (!(opts instanceof THREE.CPUPickOptions)) {
        var newopts = new THREE.CPUPickOptions();
        for (var i in newopts)
            newopts[i] = opts[i];
        return newopts;
    }
    return null;
}
SceneManager.prototype.CPUPick = function(o, d, opts) {

    //let's lazy update only on demand;
    //removed for performance test. Seems like there might be some work that is done on every update, even if nothing is dirty
    //appears to be in the static batching. 
    //move to scene render for now.
    //this.update();
    if (d[0] == 0 && d[1] == 0 && d[2] == 0)
        return null;
    //console.profile("PickProfile");

    opts = this.buildCPUPickOptions(opts)
    opts.noTraverse = true;
    if (opts) opts.faceTests = 0;
    if (opts) opts.objectTests = 0;
    if (opts) opts.regionTests = 0;
    if (opts) opts.regionsRejectedByDist = 0;
    if (opts) opts.regionsRejectedByBounds = 0;
    if (opts) opts.objectsRejectedByBounds = 0;
    if (opts) opts.objectRegionsRejectedByDist = 0;
    if (opts) opts.objectRegionsRejectedByBounds = 0;
    if (opts) opts.objectRegionsTested = 0;
    if (opts) opts.objectsTested = [];

    var hitlist = [];
    this.root.CPUPick(o, d, opts, hitlist);
    this.staticRoot.CPUPick(o, d, opts, hitlist);


    //so, in the octree, all pickable meshes are sorted - there is no need to walk down the transform graph to an objects children
    //however, the special purpose section does requrie you to walk the children - otherwise you'll never get anywhere!
    var oldNoTraverse = opts.noTraverse;
    opts.noTraverse = false;
    for (var i = 0; i < this.specialCaseObjects.length; i++) {
        this.specialCaseObjects[i].CPUPick(o, d, opts || this.defaultPickOptions, hitlist);
    }
    opts.noTraverse = oldNoTraverse;
    //sort the hits by priority and distance
    hitlist = hitlist.sort(function(a, b) {
        var ret = b.priority - a.priority;
        if (ret == 0)
            ret = a.distance - b.distance;
        return ret;

    });
    // Enter name of script here
    //console.profileEnd();
    var ret = hitlist.shift();
    


    //var intersect = new FaceIntersect();
    for(var i =0; i < hitlist.length; i++)
      hitlist[i].release();

    //_DEALLOC(ret);
    return ret;
}
SceneManager.prototype.FrustrumCast = function(f, opts) {

    //let's lazy update only on demand;
    opts = this.buildCPUPickOptions(opts);
    var hitlist = [];
    this.root.FrustrumCast(f, opts || this.defaultPickOptions,hitlist);
    this.staticRoot.FrustrumCast(f, opts || this.defaultPickOptions,hitlist);
    for (var i = 0; i < this.specialCaseObjects.length; i++) {
        this.specialCaseObjects[i].FrustrumCast(f, opts || this.defaultPickOptions,hitlist);
    }


    return hitlist;
}
SceneManager.prototype.SphereCast = function(center, r, opts) {
    //console.profile("PickProfile");
    //let's lazy update only on demand;
   
    var hitlist = this.root.SphereCast(center, r, opts || this.defaultPickOptions);
    hitlist = hitlist.concat(this.staticRoot.SphereCast(center, r, opts || this.defaultPickOptions));
    for (var i = 0; i < this.specialCaseObjects.length; i++) {
        var childhits = this.specialCaseObjects[i].SphereCast(center, r, opts || this.defaultPickOptions);
        if (childhits)
            hitlist = hitlist.concat(childhits);
    }

    //return an array that is not tracked by the pool, so users will not have to manually deallocate
    var unTrackedReturn = [];
    unTrackedReturn = hitlist.slice(0);
    return unTrackedReturn;
}
SceneManager.prototype.dirtyObjects = [];
SceneManager.prototype.setDirty = function(object) {

    object.boundsCache = null;

   
       //object has no children, and it's a mesh or a line  but not a skinned mesh
        //we create boxes for all the skinned meshes to stand in for bone collision
        if ( (object instanceof THREE.Mesh || object instanceof THREE.Line) && !(object instanceof THREE.SkinnedMesh)) {
            this.dirtyObjects.push(object);
        }
        


}
SceneManager.prototype.update = function(dt) {


    if (!this.initialized) return;

   


    this.trigger('updateStart');
    //first, we sort all dirty objects into their new regions
    for (var i = 0; i < this.dirtyObjects.length; i++) {
        this.dirtyObjects[i].sceneManagerUpdate();
    }

    //now desplit anything that has too few objects
    this.root.processDesplits();
    this.staticRoot.processDesplits();

    this.dirtyObjects.length = 0;

    var dirtybatchcount = 0;
    for (var i = 0; i < this.BatchManagers.length; i++) {
        //only update at most one batch manager per frame
        if (this.BatchManagers[i].dirty) {
            dirtybatchcount++;
        }
    }

    for (var i = 0; i < this.BatchManagers.length; i++) {
        //only update at most one batch manager per frame
        if (this.BatchManagers[i].dirty) {

            this.BatchManagers[i].update();
            break;
        }
    }
    if (dirtybatchcount == 0) {

    }
    var removelist = [];
    for (var i = 0; i < this.tempDebatchList.length; i++) {

        this.tempDebatchList[i].updateCount -= .5;
        if (this.tempDebatchList[i].updateCount < 0) {

            removelist.push(i);
            delete this.tempDebatchList[i]._static;
            console.log('Rebatching ' + this.tempDebatchList[i].name);
            this.tempDebatchList[i].sceneManagerUpdate();
        }
    }
    for (var i = 0; i < removelist.length; i++) {
        this.tempDebatchList.splice(removelist[i], 1);
    }
    for (var i = 0; i < this.particleSystemList.length; i++) {
        this.particleSystemList[i].update(dt);
    }

    this.trigger('updateEnd');


}
SceneManager.prototype.releaseTexture = function(texture) {

    if (!texture) return;
    texture.refCount--;
    if (!texture.refCount) {
        texture.dispose();
    }
}
SceneManager.prototype.getDefaultTexture = function() {
    if (!this.defaultTexture) {

        this.defaultTexture = THREE.ImageUtils.generateDataTexture(8, 8, new THREE.Color(0x0000ff));
        this.defaultTexture.image.src = "";
        this.defaultTexture.minFilter = THREE.LinearMipMapLinearFilter;
        this.defaultTexture.magFilter = THREE.LinearFilter;
        if (window._dRenderer)
            this.defaultTexture.anisotropy = 1; //_dRenderer.getMaxAnisotropy();
        this.defaultTexture.wrapS = THREE.RepeatWrapping;
        this.defaultTexture.wrapT = THREE.RepeatWrapping;
    }

    return this.defaultTexture;
}
function extensionToMimetype(extension)
{
    extension = extension.toLowerCase();
    if(extension == 'png') return 'image/png';
    if(extension == 'jpg') return 'image/jpg';
    if(extension == 'jpeg') return 'image/jpg';
    if(extension == 'gif') return 'image/png';
    if(extension == 'bmp') return 'image/bmp';
    if(extension == 'jp2') return 'image/jpg';
    if(extension == 'dds') return 'image/dds';
    
    return null;

}
function isImage(mimeType)
{
    if(mimeType == 'image/png') return true;
    if(mimeType == 'image/bmp') return true;
    if(mimeType == 'image/x-windows-bmp') return true;
    if(mimeType == 'image/gif') return true;
    if(mimeType == 'image/jpeg') return true;
    if(mimeType == 'image/jpg') return true;
    if(mimeType == 'image/bmp') return true;
    if(mimeType == 'image/jp2') return true;
    return false;
}
function getMimeType(xhr)
{
    //is it in the header?
    var header = xhr.getResponseHeader('content-type');
    if(header && header !== "application/octet-stream" &&
    header !== "application/octet-stream")
    {
        return header;
    }
    //What about the URL? 
    var reg = /\.([a-zA-Z]*)($|\?)/;
    var extension = xhr.responseURL.match(reg);
    if(extension && extension[0])
    {
        return extensionToMimetype(extension[0][1])
    }
    var intArray = new Uint8Array(xhr.response)
    //now we need to look at the first few bytes
    extension = String.fromCharCode(intArray[0])+
    String.fromCharCode(intArray[1])+
    String.fromCharCode(intArray[2])
    return extensionToMimetype(extension)
}
SceneManager.prototype.loadTexture = function(url, mapping, onLoad, onError) {

    var reg = /\.([a-zA-Z]*)($|\?)/;
    var extension = url.match(reg);
    var type = null;
    if (extension && extension[0]) {
        type = extensionToMimetype(extension[1])
    }

    var texture = new THREE.Texture(this.getDefaultTexture().image, mapping);
    texture.format = this.getDefaultTexture().format;
    var buffer;


    if (!type) {


        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(e) {

            if (getMimeType(xhr) == 'image/dds') {

                var blob = new Blob([xhr.response]);
                var dataUrl = window.URL.createObjectURL(blob);
                var loader = new THREE.DDSLoader();
                loader.load(dataUrl, function loaded(newTexture) {
                    texture.image = newTexture.image;
                    texture._needsUpdate = newTexture._needsUpdate;
                    texture.image = newTexture.image;
                    texture.flipY = newTexture.flipY;
                    texture.format = newTexture.format;
                    texture.generateMipmaps = newTexture.generateMipmaps;
                    texture.mapping = newTexture.mapping;
                    texture.mipmaps = newTexture.mipmaps;
                    texture.offset = newTexture.offset;
                    texture.premultiplyAlpha = newTexture.premultiplyAlpha;
                    texture.repeat = newTexture.repeat;
                    texture.type = newTexture.type;
                    texture.unpackAlignment = newTexture.unpackAlignment;
                    texture.wrapS = newTexture.wrapS;
                    texture.wrapT = newTexture.wrapT;
                    texture.isActuallyCompressed = true;
                    newTexture.isActuallyCompressed = true;
                    //hit the async callback
                    if (onLoad) onLoad(texture);
                }, function error() {});
            } else {

                var img = new Image();
                var blob = new Blob([xhr.response]);
                img.src = window.URL.createObjectURL(blob);
                texture.image = img;
                texture.format = THREE.RGBAFormat;
                if (_SettingsManager.getKey('filtering')) {
                    texture.minFilter = THREE.LinearMipMapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                } else {
                    texture.minFilter = THREE.NearestFilter;
                    texture.magFilter = THREE.NearestFilter;
                }
                texture.needsUpdate = true;
                img.onload = function()
                {
                    if (onLoad) onLoad(texture);    
                }
            }
        }
        xhr.send();
        return texture;
    } else {


        //test to see if the url ends in .dds
        if ((/\.dds$/).test(url)) {


            //create a new texture. This texture will be returned now, and filled with the compressed dds data
            //once that data is available
            var temptexture = new THREE.Texture(this.getDefaultTexture().image, mapping);
            temptexture.format = this.getDefaultTexture().format;


            if (_SettingsManager.getKey('filtering')) {
                temptexture.minFilter = THREE.LinearMipMapLinearFilter;
                temptexture.magFilter = THREE.LinearFilter;
            } else {
                temptexture.minFilter = THREE.NearestFilter;
                temptexture.magFilter = THREE.NearestFilter;
            }


            temptexture.minFilter = THREE.LinearMipMapLinearFilter;
            temptexture.magFilter = THREE.LinearFilter;
            temptexture.anisotropy = 1;
            temptexture.sourceFile = url;

            //a variable to hold the loaded texture
            var texture;

            //callback to copy data from the compressed texture to the one we retuned synchronously from this function
            var load = function(event) {


                //image is in closure scope. Copy all relevant data
                temptexture.image = texture.image;


                temptexture._needsUpdate = texture._needsUpdate;


                temptexture.image = texture.image;
                temptexture.flipY = texture.flipY;
                temptexture.format = texture.format;
                temptexture.generateMipmaps = texture.generateMipmaps;
                //temptexture.magFilter = texture.magFilter;
                temptexture.mapping = texture.mapping;
                //temptexture.minFilter = texture.minFilter;
                temptexture.mipmaps = texture.mipmaps;


                temptexture.offset = texture.offset;

                temptexture.premultiplyAlpha = texture.premultiplyAlpha;
                temptexture.repeat = texture.repeat;
                temptexture.type = texture.type;
                temptexture.unpackAlignment = texture.unpackAlignment;

                temptexture.wrapS = texture.wrapS;
                temptexture.wrapT = texture.wrapT;

                temptexture.isActuallyCompressed = true;
                texture.isActuallyCompressed = true;

                //hit the async callback
                if (onLoad) onLoad(texture);
            };

            var error = function(event) {

                if (onError) onError(event.message);

            };

            //create the new texture, and decompress. Copy over with the onload callback above
            //texture = THREE.ImageUtils.loadCompressedTexture(url, mapping, load, error);

            var loader = new THREE.DDSLoader();
            texture = loader.load(url, load, error);

            if (_SettingsManager.getKey('filtering')) {
                texture.minFilter = THREE.LinearMipMapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
            } else {
                texture.minFilter = THREE.NearestFilter;
                texture.magFilter = THREE.NearestFilter;
            }
            texture.generateMipmaps = false;

            if (window._dRenderer)
                texture.anisotropy = 1; //_dRenderer.getMaxAnisotropy();
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;


            //return the temp one, which will be filled later.
            return temptexture;
        } else {
            var image = new Image();

            var texture = new THREE.Texture(this.getDefaultTexture().image, mapping);
            texture.format = this.getDefaultTexture().format;

            if (_SettingsManager.getKey('filtering')) {
                texture.minFilter = THREE.LinearMipMapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
            } else {
                texture.minFilter = THREE.NearestFilter;
                texture.magFilter = THREE.NearestFilter;
            }

            if (window._dRenderer)
                texture.anisotropy = 1; //_dRenderer.getMaxAnisotropy();
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            var loader = new THREE.ImageLoader();

            var load = function(event) {


                texture.image = event;
                texture.format = THREE.RGBAFormat;
                texture.needsUpdate = true;

                if (onLoad) onLoad(texture);

            };

            var error = function(event) {

                if (onError) onError(event.message);
               
            };

            loader.crossOrigin = 'anonymous';
            loader.load(url, load, null, error, image);

            texture.sourceFile = url;

            return texture;

        }

    }

}
SceneManager.prototype.useSimpleMaterials = false;
SceneManager.prototype.createMaterial = function() {
    if (_SceneManager.useSimpleMaterials)
        return new THREE.MeshBasicMaterial();
    return new THREE.MeshPhongMaterial();
}

SceneManager.prototype.GetLoadedTextures = function() {
    var ret = []
    for (var i in this.textureList) {
        if (this.textureList[i].image.src !== '')
            ret.push(i);
    }
    return ret;
}
SceneManager.prototype.getTexture = function(src, noclone) {
    //return THREE.ImageUtils.loadTexture(src)

    var originalSrc = src;
    var p = window.location.pathname;
    if (p[p.length - 1] == '/') {
        p = p.substring(0, p.length - 1)
    };
    p = p.substring(p.lastIndexOf('/') + 1);
    src = src.replace(p, '');


    if (!this.textureList)
        this.textureList = {};
    if (!this.textureList[src]) {

        var tex = this.textureList[src];

        var onload = function(texture) {
            tex.needsUpdate = true;
            if (tex.clones) {
              
                for (var i = 0; i < tex.clones.length; i++) {
                  
                   
                    tex.clones[i].image = texture.image;
                    tex.clones[i].mipmaps = texture.mipmaps;
                    tex.clones[i].generateMipmaps = texture.generateMipmaps;
                    tex.clones[i].format = texture.format;
                    tex.clones[i].needsUpdate = true;
                    tex.clones[i].isActuallyCompressed = texture.isActuallyCompressed;

                }   

            }
        }.bind(this);

        this.textureList[src] = this.loadTexture(src, new THREE.UVMapping(), onload);
        var tex = this.textureList[src];
        tex.clones = [];
        tex._SMsrc = originalSrc;
        return this.textureList[src];
    }
    var ret = this.textureList[src];
    if (noclone) {
        ret.refCount++;
        return ret;
    }
    ret = new THREE.Texture(ret.image);
    ret.format = this.textureList[src].format;
    ret._SMsrc = originalSrc;
    ret.refCount = 1;
    ret.wrapS = this.textureList[src].wrapS;
    ret.wrapT = this.textureList[src].wrapT;
    ret.magFilter = this.textureList[src].magFilter;
    ret.minFilter = this.textureList[src].minFilter;
    ret.repeat.x = this.textureList[src].repeat.x;
    ret.repeat.y = this.textureList[src].repeat.y;
    ret.offset.x = this.textureList[src].offset.x;
    ret.offset.y = this.textureList[src].offset.y;
    ret.anisotropy = this.textureList[src].anisotropy;
    ret.flipY = this.textureList[src].flipY;
    ret.generateMipmaps = this.textureList[src].generateMipmaps;
    ret.needsUpdate = true;
    ret.mipmaps = this.textureList[src].mipmaps;
    ret.isActuallyCompressed = this.textureList[src].isActuallyCompressed;
    this.textureList[src].clones.push(ret);
    return ret;
}
SceneManager.prototype.initialize = function(scene) {
    this.min = [-maxSize, -maxSize, -maxSize];
    this.max = [maxSize, maxSize, maxSize];
    this.BatchManagers = [];
    this.specialCaseObjects = [];
    this.tempDebatchList = [];
    this.particleSystemList = [];
    if (!this.textureList)
        this.textureList = {};
    this.initialized = true;
    THREE.Object3D.prototype.add_internal = THREE.Object3D.prototype.add;
    THREE.Object3D.prototype.add = function(child, SceneManagerIgnore) {
        if (!child) return;
        this.add_internal(child);



        //here, we need to walk up the graph and make sure that at some point, the object is a child of the scene.
        // if it's not, it should not go in the scenemanager.
        var parent = this;
        var found = false;
        while (parent) {
            if (parent instanceof THREE.Scene) {
                found = true;
                break;
            } else {
                parent = parent.parent;
            }
        }
        if (!found) return;

        if (SceneManagerIgnore)
            return;

        var list = [];
        GetAllLeafMeshes(child, list);
        for (var i = 0; i < list.length; i++) {

            list[i].updateMatrixWorld(true);

        }
        for (var i = 0; i < list.length; i++) {
            if (!list[i].isDynamic())
                _SceneManager.addChild(list[i]);
            else
                _SceneManager.addToRoot(list[i]);
            _SceneManager.setDirty(list[i]);
        }

        //DO NOT PUT OBJECT3Ds ON THE DIRTY LIST!	
        //_SceneManager.setDirty(this);
    }
    THREE.Object3D.prototype.remove_internal = THREE.Object3D.prototype.remove;
    THREE.Object3D.prototype.remove = function(child, SceneManagerIgnore) {

        var meshes = [];

        this.remove_internal(child);

        if (SceneManagerIgnore)
            return;

        GetAllLeafMeshes(child, meshes);

        for (var i = 0; i < meshes.length; i++) {
            meshes[i].sceneManagerDelete();
            //_SceneManager.removeChild(meshes[i]);
        }
    }
    THREE.Object3D.prototype.materialUpdated = function() {
        var meshes = [];
        GetAllLeafMeshes(this, meshes);
        for (var i = 0; i < meshes.length; i++) {
            meshes[i].materialUpdated();
            //_SceneManager.removeChild(meshes[i]);
        }

    }

    THREE.Mesh.prototype.materialUpdated = function() {
        if (!this.updateCount)
            this.updateCount = 1;
        this.updateCount++;
        if (this.updateCount == 100) {
            console.log(this.name + ' is not static, debatching');
            this._static = false;
            if (this.RenderBatchManager)
                this.RenderBatchManager.remove(this);

            _SceneManager.tempDebatchList.push(this);
            return;
        }

        if (this.RenderBatchManager)
            this.RenderBatchManager.materialUpdated(this);
    }
    THREE.Line.prototype.materialUpdated = THREE.Mesh.prototype.materialUpdated;
    THREE.Mesh.prototype.setStatic = function(_static) {
        if (this.isDynamic && this.isDynamic()) return;
        if(this._static == _static) return;
        this._static = _static;
        _SceneManager.removeChild(this);
        if(this._static)
            _SceneManager.addStaticChild(this);
        else
            _SceneManager.addChild(this);
        
    }
    THREE.Mesh.prototype.setDynamic = function(_dynamic) {
        if (this._dynamic == _dynamic) return;
        this._dynamic = _dynamic;
        this.setStatic(false);
        if (this._dynamic) {
            this.sceneManagerDelete();
            _SceneManager.addToRoot(this);
        } else {
            _SceneManager.removeFromRoot(this);
            var list = [];
            GetAllLeafMeshes(this, list);
            for (var i = 0; i < list.length; i++) {
                _SceneManager.addChild(list[i]);
            }
            this.sceneManagerUpdate();
        }
    }
    THREE.Object3D.prototype.isStatic = function() {
        if (this._static != undefined)
            return this._static;
        return (this.parent && this.parent.isStatic());
    }
    THREE.Object3D.prototype.isDynamic = function() {
        if (this._dynamic != undefined)
            return this._dynamic;
        return (this.parent && this.parent.isDynamic());
    }
    THREE.Object3D.prototype.sceneManagerUpdate = function() {
        //this.updateMatrixWorld(true);
        this.boundsCache = null;
        if (this.isDynamic && this.isDynamic()) return;
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].sceneManagerUpdate();
        }

    }
    THREE.Object3D.prototype.sceneManagerDelete = function() {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].sceneManagerDelete();
        }

    }
    THREE.Object3D.prototype.sceneManagerIgnore = function() {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].sceneManagerIgnore();
        }

    }
    THREE.Mesh.prototype.sceneManagerIgnore = function() {
        _SceneManager.removeChild(this);
        this.SceneManagerIgnore = true;
    }
    this.root = SceneManagerRegion.allocateSceneManagerRegion(this.min, this.max, 0, scene, 0);
    this.staticRoot = SceneManagerRegion.allocateSceneManagerRegion(this.min, this.max, 0, scene, 0);
    this.scene = scene;
}
SceneManager.prototype.addChild = function(c) {

    this.root.addChild(c);
}
SceneManager.prototype.addStaticChild = function(c) {

    this.staticRoot.addChild(c);
}
SceneManager.prototype.removeChild = function(c) {

    //be sure to remove objects from the dirty list, so they don't get sorted back in
    if (this.dirtyObjects.indexOf(c) != -1) {
        this.dirtyObjects.splice(this.dirtyObjects.indexOf(c), 1);
    }
    if (this.tempDebatchList.indexOf(c) != -1) {
        this.tempDebatchList.splice(this.tempDebatchList.indexOf(c), 1);
    }

    var removed = this.root.removeChild(c);
    this.staticRoot.removeChild(c);

    if(this.specialCaseObjects.indexOf(c) > -1)
        this.specialCaseObjects.splice(this.specialCaseObjects.indexOf(c),1);
}






    window._SceneManager = new SceneManager();
    return SceneManager;
})
//return _SceneManager;
//});