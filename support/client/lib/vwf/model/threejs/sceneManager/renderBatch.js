define([], function()
{
    function compareMaterials(m1, m2)
    {
        if (!m1 || !m2) return false;
        // this does not catch all!!!!
        if (m1.constructor != m2.constructor)
        {
            return false;
        }
        if (m1 instanceof THREE.MeshPhongMaterial && m2 instanceof THREE.MeshPhongMaterial)
        {
            return compareMaterialsPhong(m1, m2);
        }
        if (m1 instanceof THREE.MeshBasicMaterial && m2 instanceof THREE.MeshBasicMaterial)
        {
            return compareMaterialsBasic(m1, m2);
        }
        if (m1 instanceof THREE.MeshLambertMaterial && m2 instanceof THREE.MeshLambertMaterial)
        {
            return compareMaterialsLambert(m1, m2);
        }
        if (m1 instanceof THREE.MeshFaceMaterial && m2 instanceof THREE.MeshFaceMaterial)
        {
            return compareMaterialsFace(m1, m2);
        }
        return false;
    }

    function compareMaterialsFace(m1, m2)
    {
        //TODO: not used in VTCE
    }

    function compareMaterialsBasic(m1, m2)
    {
        //TODO: not used in VTCE
    }

    function compareMaterialsLambert(m1, m2)
    {
        var delta = 0;
        delta += Math.abs(m1.color.r - m2.color.r);
        delta += Math.abs(m1.color.g - m2.color.g);
        delta += Math.abs(m1.color.b - m2.color.b);
        delta += Math.abs(m1.ambient.r - m2.ambient.r);
        delta += Math.abs(m1.ambient.g - m2.ambient.g);
        delta += Math.abs(m1.ambient.b - m2.ambient.b);
        delta += Math.abs(m1.emissive.r - m2.emissive.r);
        delta += Math.abs(m1.emissive.g - m2.emissive.g);
        delta += Math.abs(m1.emissive.b - m2.emissive.b);
        delta += Math.abs(m1.opacity - m2.opacity);
        delta += Math.abs(m1.transparent - m2.transparent);
        delta += Math.abs(m1.reflectivity - m2.reflectivity);
        delta += Math.abs(m1.alphaTest - m2.alphaTest);
        delta += m1.side != m2.side ? 1000 : 0;
        var mapnames = ['map', 'lightMap', 'specularMap'];
        for (var i = 0; i < mapnames.length; i++)
        {
            var mapname = mapnames[i];
            if (m1[mapname] && !m2[mapname])
            {
                delta += 1000;
            }
            if (!m1[mapname] && m2[mapname])
            {
                delta += 1000;
            }
            if (m1[mapname] && m2[mapname])
            {
                if (m1[mapname].image && m2[mapname].image)
                    if (m1[mapname].image.src && m1[mapname].image.src)
                    {
                        if (m1[mapname].image.src.toString() != m2[mapname].image.src.toString())
                            delta += 1000;
                        if (m1[mapname]._SMsrc != m2[mapname]._SMsrc)
                            delta += 1000;
                    }
                    else
                    {
                        if (m1[mapname].image != m2[mapname].image)
                            delta += 1000;
                    }
                delta += m1[mapname].wrapS != m1[mapname].wrapS;
                delta += m1[mapname].wrapT != m1[mapname].wrapT;
                delta += Math.abs(m1[mapname].mapping.constructor != m2[mapname].mapping.constructor) * 1000;
                delta += Math.abs(m1[mapname].repeat.x - m2[mapname].repeat.x);
                delta += Math.abs(m1[mapname].repeat.y - m2[mapname].repeat.y);
                delta += Math.abs(m1[mapname].offset.x - m2[mapname].offset.x);
                delta += Math.abs(m1[mapname].offset.y - m2[mapname].offset.y);
            }
        }
        if (delta < .001)
            return true;
        return false;
    }

    function compareMaterialsPhong(m1, m2)
    {
        var delta = 0;
        delta += Math.abs(m1.color.r - m2.color.r);
        delta += Math.abs(m1.color.g - m2.color.g);
        delta += Math.abs(m1.color.b - m2.color.b);
        delta += Math.abs(m1.ambient.r - m2.ambient.r);
        delta += Math.abs(m1.ambient.g - m2.ambient.g);
        delta += Math.abs(m1.ambient.b - m2.ambient.b);
        delta += Math.abs(m1.emissive.r - m2.emissive.r);
        delta += Math.abs(m1.emissive.g - m2.emissive.g);
        delta += Math.abs(m1.emissive.b - m2.emissive.b);
        delta += Math.abs(m1.specular.r - m2.specular.r);
        delta += Math.abs(m1.specular.g - m2.specular.g);
        delta += Math.abs(m1.specular.b - m2.specular.b);
        delta += Math.abs(m1.opacity - m2.opacity);
        delta += Math.abs(m1.transparent - m2.transparent);
        delta += Math.abs(m1.shininess - m2.shininess);
        delta += Math.abs(m1.reflectivity - m2.reflectivity);
        delta += Math.abs(m1.alphaTest - m2.alphaTest);
        delta += Math.abs(m1.bumpScale - m2.bumpScale);
        delta += Math.abs(m1.normalScale.x - m2.normalScale.x);
        delta += Math.abs(m1.normalScale.y - m2.normalScale.y);
        delta += m1.side != m2.side ? 1000 : 0;
        var mapnames = ['map', 'bumpMap', 'lightMap', 'normalMap', 'specularMap'];
        for (var i = 0; i < mapnames.length; i++)
        {
            var mapname = mapnames[i];
            if (m1[mapname] && !m2[mapname])
            {
                delta += 1000;
            }
            if (!m1[mapname] && m2[mapname])
            {
                delta += 1000;
            }
            if (m1[mapname] && m2[mapname])
            {
                if (m1[mapname].image && m2[mapname].image)
                    if (m1[mapname].image.src && m1[mapname].image.src)
                    {
                        if (m1[mapname].image.src.toString() != m2[mapname].image.src.toString())
                            delta += 1000;
                        if (m1[mapname]._SMsrc != m2[mapname]._SMsrc)
                            delta += 1000;
                    }
                    else
                    {
                        if (m1[mapname].image != m2[mapname].image)
                            delta += 1000;
                    }
                delta += m1[mapname].wrapS != m1[mapname].wrapS;
                delta += m1[mapname].wrapT != m1[mapname].wrapT;
                delta += Math.abs(m1[mapname].mapping.constructor != m2[mapname].mapping.constructor) * 1000;
                delta += Math.abs(m1[mapname].repeat.x - m2[mapname].repeat.x);
                delta += Math.abs(m1[mapname].repeat.y - m2[mapname].repeat.y);
                delta += Math.abs(m1[mapname].offset.x - m2[mapname].offset.x);
                delta += Math.abs(m1[mapname].offset.y - m2[mapname].offset.y);
            }
        }
        if (delta < .001)
            return true;
        return false;
    }
    
    THREE.RenderBatch = function(material, scene)
    {
        this.objects = [];
        this.material = material;
        //hack for VTCE - should probably find and deal with mirrored meshes better
        this.dirty = false;
        this.scene = scene;
        this.totalVerts = 0;
        this.totalFaces = 0;
        this.toAdd = [];
        this.toRemove = [];
    }
    THREE.RenderBatch.prototype.addObject = function(object)
    {
        if (this.objects.indexOf(object) == -1)
        {
            this.totalVerts += object.geometry.vertices.length;
            this.totalFaces += object.geometry.faces.length;
            this.objects.push(object);
            //this.toAdd.push(object);
            this.dirty = true;
        }
    }
    THREE.RenderBatch.prototype.removeObject = function(object)
    {
        if (this.objects.indexOf(object) != -1)
        {
            this.totalVerts -= object.geometry.vertices.length;
            this.totalFaces -= object.geometry.faces.length;
            this.objects.splice(this.objects.indexOf(object), 1);
            //this.toRemove.push(object);
            this.dirty = true;
        }
    }
    THREE.RenderBatch.prototype.update = function()
    {
        if (this.dirty)
            this.build();
        this.dirty = false;
    }
    THREE.RenderBatch.prototype.checkSuitability = function(object)
    {
        if (this.totalFaces + object.geometry.faces.length > 32767 || this.totalVerts + object.geometry.vertices.length > 32767) return false;
        return compareMaterials(this.material, object.material);
    }
    THREE.RenderBatch.prototype.deinitialize = function()
    {
        if (this.mesh)
        {
            this.scene.remove_internal(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh = null;
        }
    }
    THREE.RenderBatch.prototype.CPUPick = function(o, d, opts, hits)
    {
        if (!hits)
            hits = [];
        if (this.mesh)
            return this.mesh.CPUPick(o, d, opts, hits);
        return hits;
    }
    THREE.RenderBatch.prototype.testForMirroredMatrix = function(matrix)
    {
        if (!matrix)
            throw new Error('matrix was null');
        var xAxis = new THREE.Vector3(matrix.elements[0], matrix.elements[4], matrix.elements[8]);
        var yAxis = new THREE.Vector3(matrix.elements[1], matrix.elements[5], matrix.elements[9]);
        var zAxis = new THREE.Vector3(matrix.elements[2], matrix.elements[6], matrix.elements[10]);
        xAxis.normalize();
        yAxis.normalize();
        zAxis.normalize();
        var xDot = xAxis.clone().cross(yAxis).dot(zAxis);
        var yDot = yAxis.clone().cross(zAxis).dot(xAxis);
        var zDot = zAxis.clone().cross(xAxis).dot(yAxis);
        if (xDot * yDot * zDot < 0)
        {
            return true;
        }
        return false;
    }
    THREE.RenderBatch.prototype.build = function()
    {
        console.log('Building batch ' + this.name + ' : objects = ' + this.objects.length);
        //do the merge:
        if (this.mesh)
        {
            this.scene.remove_internal(this.mesh);
            this.mesh.geometry.dispose();
        }
        if (this.objects.length == 0) return;
        this.mesh = null;
        var geo = new THREE.Geometry();
        geo.normals = [];
        this.mesh = new THREE.Mesh(geo, this.objects[0].material.clone());
        this.mesh.castShadow = _SettingsManager.getKey('shadows');
        this.mesh.receiveShadow = _SettingsManager.getKey('shadows');
        this.scene.add_internal(this.mesh);
        var totalUVSets = 1;
        var needColors = false;
        for (var i = 0; i < this.objects.length; i++)
        {
            totalUVSets = Math.max(totalUVSets, this.objects[i].geometry.faceVertexUvs.length);
            needColors = needColors || (this.objects[i].geometry.vertexColors && this.objects[i].geometry.vertexColors.length);
        }
        //console.log(totalUVSets);
        for (var i = 0; i < totalUVSets; i++)
        {
            geo.faceVertexUvs[i] = [];
        }
        for (var i = 0; i < this.objects.length; i++)
        {
            if (this.objects[i].originalVisibility === false) continue;
            this.objects[i].visible = false;
            var tg = this.objects[i].geometry;
            var matrix = this.objects[i].matrixWorld.clone();
            var matrixIsMirrored = this.testForMirroredMatrix(matrix);
            var normalMatrix = new THREE.Matrix3();
            normalMatrix.getInverse(matrix);
            normalMatrix.transpose();
            //normalMatrix.elements[3] = normalMatrix.elements[7] = normalMatrix.elements[11] = 0;
            if (tg)
            {
                for (var j = 0; j < tg.faces.length; j++)
                {
                    var face = tg.faces[j];
                    var newface;
                    if (face.d !== undefined)
                        newface = new THREE.Face4();
                    else
                        newface = new THREE.Face3();
                    if (!matrixIsMirrored)
                    {
                        newface.a = face.a + geo.vertices.length;
                        newface.b = face.b + geo.vertices.length;
                        newface.c = face.c + geo.vertices.length;
                        if (face.d !== undefined)
                            newface.d = face.d + geo.vertices.length;
                    }
                    else
                    {
                        newface.b = face.a + geo.vertices.length;
                        newface.a = face.b + geo.vertices.length;
                        if (face.d !== undefined)
                        {
                            newface.d = face.c + geo.vertices.length;
                            newface.c = face.d + geo.vertices.length;
                        }
                        else
                        {
                            newface.c = face.c + geo.vertices.length;
                        }
                    }
                    //newface.materialIndex = face.materialIndex;
                    newface.normal.copy(face.normal);
                    newface.normal.applyMatrix3(normalMatrix).normalize();
                    for (var k = 0; k < face.vertexNormals.length; k++)
                        newface.vertexNormals.push(face.vertexNormals[k].clone().applyMatrix3(normalMatrix).normalize());
                    for (var k = 0; k < face.vertexColors.length; k++)
                        if (face.vertexColors[k])
                            newface.vertexColors.push(face.vertexColors[k].clone());
                    geo.faces.push(newface);
                }
                for (var j = 0; j < tg.vertices.length; j++)
                {
                    geo.vertices.push(tg.vertices[j].clone().applyMatrix4(matrix));
                }
                if (tg.normals)
                    for (var j = 0; j < tg.normals.length; j++)
                    {
                        geo.normals.push(tg.normals[j].clone().applyMatrix4(matrix));
                    }
                for (var l = 0; l < totalUVSets; l++)
                {
                    var uvs2 = tg.faceVertexUvs[l];
                    if (uvs2 && uvs2.length === tg.faces.length)
                    {
                        for (var u = 0, il = uvs2.length; u < il; u++)
                        {
                            var uv = uvs2[u],
                                uvCopy = [];
                            for (var j = 0, jl = uv.length; j < jl; j++)
                            {
                                uvCopy.push(new THREE.Vector2(uv[j] ? uv[j].x : 0, uv[j] ? uv[j].y : 0));
                            }
                            geo.faceVertexUvs[l].push(uvCopy);
                        }
                    }
                    else
                    {
                        for (var u = 0, il = tg.faces.length; u < il; u++)
                        {
                            var count = 3;
                            if (tg.faces[u].d !== undefined)
                                count = 4;
                            var uvCopy = [];
                            for (var j = 0, jl = count; j < jl; j++)
                            {
                                uvCopy.push(new THREE.Vector2(0, 0));
                            }
                            geo.faceVertexUvs[l].push(uvCopy);
                        }
                    }
                }
            }
        }
        geo.computeBoundingSphere();
        geo.computeBoundingBox();
    }
    return THREE.RenderBatch;
})