//this is a very async bit of code, that loads all assets and parses them before continuing to boot up the VWF
//over time, we might expand this to include sounds and other assets, now only works on 3D models and textures.
//Note that the sim can go forward before the textures are loaded - the scene manager just fills them with blue 
//textures and replaces them when loaded. So, we don't have to cache texture here, but we do let the scenemanager know to fire up
//and start loading, just to give the textures a head start.
define(["vwf/model/threejs/backgroundLoader", "vwf/view/editorview/lib/alertify.js-0.3.9/src/alertify", "vwf/model/threejs/BufferGeometryUtils", 'vwf/model/threejs/ColladaLoaderOptimized','progressScreen','vwf/model/threejs/scenemanager/sceneManager','vwf/model/threejs/OBJMTLLoader','vwf/model/threejs/MTLLoader'],
        function(backgroundLoader,alertify,BufferGeometryUtils,ColladaLoaderOptimized,progressScreen)
        {
            var assetLoader = {};
            var isInitialized = false;
            return {
                getSingleton: function()
                {
                    if (!isInitialized)
                    {
                        initialize.call(assetLoader);
                        isInitialized = true;
                        window._assetLoader = assetLoader;
                    }
                    return assetLoader;
                }
            }

            function initialize()
            {
                this.loadList = function(stateData, cb)
                {
                    var regExp = new RegExp(window.appPath + ".*\/");
                    $.ajax(
                    {
                        url: '../vwfdatamanager.svc/getAssets?SID=' + ((regExp).exec(window.location.toString()).toString()),
                        success: function(data, status, xhr)
                        {
                            if (xhr.status == 200)
                            {
                                $.ajax(
                                {
                                    url: '../vwfdatamanager.svc/profile',
                                    success: function(data2, status2, xhr2)
                                    {
                                        if (xhr.status == 200)
                                        {
                                            var assets = JSON.parse(xhr.responseText);
                                            var profile = JSON.parse(xhr2.responseText);
                                            if (!stateData || !stateData.publishSettings ||
                                                (stateData && stateData.publishSettings && stateData.publishSettings.createAvatar && !stateData.publishSettings.allowAnonymous))
                                            {
                                                assets.push(
                                                {
                                                    type: "subDriver/threejs/asset/vnd.collada+xml",
                                                    url: profile.avatarModel
                                                });
                                                assets.push(
                                                {
                                                    type: "texture",
                                                    url: profile.avatarTexture
                                                });
                                            }
                                            assetLoader.loadAssets(assets, cb);
                                        }
                                        else
                                        {
                                            assetLoader.loadAssets(JSON.parse(xhr.responseText), cb);
                                        }
                                    },
                                    error: function()
                                    {
                                        assetLoader.loadAssets(JSON.parse(xhr.responseText), cb);
                                    }
                                })
                            }
                            else
                            {
                                cb();
                            }
                        },
                        error: function()
                        {
                            cb();
                        }
                    })
                }
                this.cache = {};
                this.types = [];
                this.loaders = {};
                this.addType = function(type, loaderFunc)
                {
                    this.loaders[type] = loaderFunc;
                    this.types.push(type);
                    this.cache[type] = {};
                }
                this.getOrLoadAsset = function(url, type, cb)
                {
                    if (assetLoader.cache[type][url])
                    {
                        cb(assetLoader.cache[type][url]);
                        return;
                    }
                    assetLoader.load(url, type, function()
                    {
                        cb(assetLoader.cache[type][url]);
                    });
                }
                this.cleanMaterial = function(mat, skinning)
                {
                    if( mat instanceof THREE.MeshFaceMaterial)
                    {
                        for(var i =0; i < mat.materials.length; i++)
                            this.cleanMaterial(mat.materials[i],skinning)
                    }else
                    {
                        if (mat.hasOwnProperty('map') && !mat.map)
                            mat.map = _SceneManager.getTexture('white.png');

                        mat.skinning = skinning;
                    }
                }
                this.cleanThreeJSMesh = function(root)
                {
                    var self = this;
                    var lights = [];
                    root.traverse(function(o)
                    {
                        if(o instanceof THREE.Light)
                        {
                           lights.push(o)
                        }
                    })
                    for( var i = 0; i < lights.length; i ++)
                    {
                         lights[i].parent.remove(lights[i]);
                    }

                    root.traverse(function(o)
                    {
                       
                        if(o instanceof THREE.Mesh)
                        {
                            o.geometry.dynamic = true;
                            o.castShadow = _SettingsManager.getKey('shadows');
                            o.receiveShadow = _SettingsManager.getKey('shadows');
                            self.cleanMaterial(o.material,o instanceof THREE.SkinnedMesh)
                            o.material = o.material.clone();

                            if (o.geometry instanceof THREE.Geometry && (!o.geometry.faceVertexUvs[0] || o.geometry.faceVertexUvs[0].length == 0))
                            {
                                o.geometry.faceVertexUvs[0] = [];
                                for (var k = 0; k < o.geometry.faces.length; k++)
                                {
                                    if (!o.geometry.faces[k].d)
                                        o.geometry.faceVertexUvs[0].push([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
                                    else
                                        o.geometry.faceVertexUvs[0].push([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
                                }
                            }
                            if(o instanceof THREE.SkinnedMesh && o.material)
                            {
                                if(o.material instanceof THREE.MeshFaceMaterial)
                                    for(var i in o.material.materials)
                                        o.material.materials[i].skinning = true;
                                else 
                                    o.material.skinning = true;
                            }
                            if(o.material)
                            {
                                if(o.material instanceof THREE.MeshFaceMaterial)
                                    for(var i in o.material.materials)
                                        o.material.materials[i].lights = true;
                                else 
                                    o.material.lights = true;
                            }

                            //use the code in materialCache to clean up materials before it hits the renderer
                            {
                                var matCache = require("./vwf/model/threejs/materialCache");
                                if(o.material)
                                {
                                    var def = matCache.getDefForMaterial(o.material);
                                    matCache.setMaterial(o,def);
                                }


                            }

                            //lets set all animations to frame 0
                            if (o.animationHandle)
                            {
                                o.CPUPick([0, 0, 0], [0, 0, 1],
                                _SceneManager.defaultPickOptions,[]); //this is sort of a silly way to initialize the bone handles, but it works
                                o.animationHandle.setKey(this.animationFrame);
                                o.updateMatrixWorld();
                                //odd, does not seem to update matrix on first child bone. 
                                //how does the bone relate to the skeleton?
                                for (var j = 0; j < o.children.length; j++)
                                {
                                    o.children[j].updateMatrixWorld(true);
                                }
                            }

                        }



                    })
                }
                this.BuildCollisionData = function(root, cb3)
                {
                    var self = this;
                    progressScreen.stepForward();
                    if (root instanceof THREE.Geometry || root instanceof THREE.BufferGeometry)
                    {
                        root.GenerateBounds();
                        root.BuildRayTraceAccelerationStructure();
                        
                    }
                    if (root.children)
                    {
                        //for(var i =0;i < root.children.length; i++)
                        //make this async so that we can get GUI updates.
                        async.eachSeries(root.children, function(child, cb4)
                        {
                            self.BuildCollisionData(child, function()
                            {
                                async.nextTick(cb4);
                            });
                        }, cb3)
                    }
                    if (root.geometry)
                    {
                        self.BuildCollisionData(root.geometry, cb3);
                    }
                }
                this.get = function(url, type)
                {
                    if (this.cache[type])
                        return this.cache[type][url]
                    return null;
                }
                this.load = function(url, type, cb)
                {
                    if (assetLoader.loaders[type])
                        assetLoader.loaders[type](url, cb)
                    else
                        cb(null);
                }
                this.loadCollada = function(url, cb2)
                    {
                        var loader = new THREE.ColladaLoader();
                        var time = performance.now();
                        loader.load(url, function(asset)
                        {
                            //console.log(url, performance.now() - time);
                            assetLoader.cleanThreeJSMesh(asset.scene);
                            assetLoader.BuildCollisionData(asset.scene, function(cb3)
                            {
                                delete asset.dae;
                                cb2(asset);
                                loader.cleanup();
                            });
                        }, function(progress)
                        {
                            //it's really failed
                            if (!progress)
                            {
                                cb2();
                                loader.cleanup();
                            }
                        });
                    },
                    this.loadTHREEJS = function(url, cb2)
                    {
                        var loader = new THREE.JSONLoader()
                        loader.load(url, function(asset)
                        {
                            //console.log(url, performance.now() - time);
                            //if a loader does not return a three.mesh
                            if (asset instanceof THREE.Geometry)
                            {
                                var shim;
                                if (asset.skinIndices && asset.skinIndices.length > 0)
                                {
                                    shim = {
                                        scene: new THREE.SkinnedMesh(asset, new THREE.MeshPhongMaterial())
                                    }
                                }
                                else
                                    shim = {
                                        scene: new THREE.Mesh(asset, new THREE.MeshPhongMaterial())
                                    }
                                if (asset.animation)
                                {
                                    shim.scene.animationHandle = new THREE.Animation(
                                        shim.scene,
                                        asset.animation
                                    );
                                }
                                asset = shim;
                            }
                            assetLoader.cleanThreeJSMesh(asset.scene);
                            assetLoader.BuildCollisionData(asset.scene, function(cb3)
                            {
                                cb2(asset);
                            });
                        });
                    },
                    this.loadRMX = function(url, cb2)
                    {
                        var jsonmodel, binarymodel, asset;
                        async.series([
                                function loadone(cb)
                                {
                                    $.getJSON(url, function(data)
                                    {
                                        jsonmodel = data;
                                        cb();
                                    });
                                },
                                function loadtwo(cb)
                                {
                                    var src = url.substr(0, url.lastIndexOf(".")) + ".bin";
                                    var xhr = new XMLHttpRequest();
                                    xhr.onload = function(e)
                                    {
                                        binarymodel = xhr.response;
                                        cb();
                                    };
                                    xhr.open("GET", src, true);
                                    xhr.responseType = "arraybuffer";
                                    xhr.send();
                                },
                                function load_from_data(cb)
                                {
                                    var loader = new RMXModelLoader;
                                    loader.load(jsonmodel, binarymodel, function(model)
                                    {
                                        console.log(model);
                                        asset = model;
                                        cb();
                                    });
                                }
                            ],
                            function done()
                            {
                                assetLoader.cleanThreeJSMesh(asset.scene);
                                assetLoader.BuildCollisionData(asset.scene, function(cb3)
                                {
                                    cb2(asset);
                                });
                            })
                    },
                    this.loadColladaOptimized = function(url, cb2)
                    {
                        var loader = new ColladaLoaderOptimized();
                        var time = performance.now();
                        loader.load(url, function(asset)
                        {
                            assetLoader.cleanThreeJSMesh(asset.scene);
                            assetLoader.BuildCollisionData(asset.scene, function(cb3)
                            {
                                delete asset.dae;
                                cb2(asset);
                                loader.cleanup();
                            });
                        }, function(progress)
                        {
                            //it's really failed
                            if (!progress)
                            {
                                cb2();
                                loader.cleanup();
                            }
                        });
                    },
                    this.loadUTf8Json = function(url, cb2)
                    {
                        var time = performance.now();
                        this.loader = new UTF8JsonLoader(
                        {
                            source: url
                        }, function(asset)
                        {
                            //console.log(url, performance.now() - time);
                            assetLoader.cleanThreeJSMesh(asset.scene);
                            assetLoader.BuildCollisionData(asset.scene, function(cb3)
                            {
                                //console.log(url, performance.now() - time);
                                cb2(asset);
                            });
                        }, function(err)
                        {
                            cb2();
                        });
                    },
                    this.loadOBJMTL = function(url, cb2)
                    {
                        var time = performance.now();
                        var loader = new THREE.OBJMTLLoader();
                        loader.load(url,url.replace(".obj",".mtl"),
                        function(asset)
                        {
                            asset = {scene:asset};
                            //console.log(url, performance.now() - time);
                            assetLoader.cleanThreeJSMesh(asset.scene);
                            assetLoader.BuildCollisionData(asset.scene, function(cb3)
                            {
                                //console.log(url, performance.now() - time);
                                cb2(asset);
                            });
                        }, 
                        function(progress)
                        {

                        },
                        function(err)
                        {
                            cb2();
                        });
                    },
                    this.loadUTf8JsonOptimized = function(url, cb2)
                    {
                        var time = performance.now();
                        this.loader = new UTF8JsonLoader_Optimized(
                        {
                            source: url
                        }, function(asset)
                        {
                            //console.log(url, performance.now() - time);
                            assetLoader.cleanThreeJSMesh(asset.scene);
                            assetLoader.BuildCollisionData(asset.scene, function(cb3)
                            {
                                //console.log(url, performance.now() - time);
                                cb2(asset);
                            });
                        }, function(err)
                        {
                            cb2();
                        });
                    },
                    this.loadglTFAnimation = function(url, cb2)
                    {
                        assetLoader.loadglTF(url, cb2, true);
                    }        
                    this.loadglTF = function(url, cb2, animOnly)
                    {
                        var time = performance.now();
                        var loader = new THREE.glTFLoader()
                        loader.useBufferGeometry = true;
                        //create a queue to hold requests to the loader, since the loader cannot be re-entered for parallel loads
                        if (!THREE.glTFLoader.queue)
                        {
                            //task is an object that olds the info about what to load
                            //nexttask is supplied by async to trigger the next in the queue;
                            //note the timeout does not account for the fact that the load has not really started because of the queue
                            THREE.glTFLoader.queue = new async.queue(function(task, nextTask)
                            {
                                var node = task.node;
                                var cb = task.cb;
                                //call the actual load function
                                //signature of callback dictated by loader
                                node.loader.load(node.source, function(geometry, materials)
                                {
                                    //do whatever it was (asset loaded) that this load was going to do when complete
                                    cb(geometry, materials);
                                    //ok, this model loaded, we can start the next load
                                    nextTask();
                                }, node.animOnly);
                            }, 1);
                        }
                        //we need to queue up our entry to this module, since it cannot handle re-entry. This means that while it 
                        //is an async function, it cannot be entered again before it completes
                        THREE.glTFLoader.queue.push(
                        {
                            node:
                            {
                                source: url,
                                loader: loader,
                                animOnly:animOnly
                            },
                            cb: function(asset)
                            {
                                //console.log(url, performance.now() - time);
                                if (animOnly)
                                {
                                    console.log(url, performance.now() - time);
                                    return cb2(asset);
                                }
                                assetLoader.cleanThreeJSMesh(asset.scene);
                                assetLoader.BuildCollisionData(asset.scene, function(cb3)
                                {
                                    // console.log(url, performance.now() - time);
                                    cb2(asset);
                                });
                            }
                        })
                    },
                    this.loadUnknown = function(url, cb2)
                    {
                        $.ajax(
                        {
                            url: url,
                            success: function(data2, status2, xhr2)
                            {
                                cb2(xhr2);
                            },
                            error: function()
                            {
                                cb2();
                            }
                        });
                    };
                    this.loadImgTerrain = function(url, cb2)
                    {
                        canvas = document.createElement('canvas');
                        var img = new Image();
                        img.src = this.url;
                        img.onload = function()
                        {
                            var dataHeight = img.naturalHeight;
                            var dataWidth = img.naturalWidth;
                            canvas.height = this.dataHeight;
                            canvas.width = this.dataWidth;
                            var context = canvas.getContext('2d');
                            context.drawImage(img, 0, 0);
                            var data = context.getImageData(0, 0, dataHeight, dataWidth).data;
                            var array = new Uint8Array(dataHeight * dataWidth);
                            for (var i = 0; i < dataHeight * dataWidth * 4; i += 4)
                                array[Math.floor(i / 4)] = Math.pow(data[i] / 255.0, 1.0) * 255;
                            var data = new Uint8Array(dataHeight * dataWidth);
                            for (var i = 0; i < dataWidth; i++)
                            {
                                for (var j = 0; j < dataHeight; j++)
                                {
                                    var c = i * dataWidth + j;
                                    var c2 = j * dataHeight + i;
                                    data[c] = array[c2];
                                }
                            }
                            var terraindata = {
                                dataHeight: this.dataHeight,
                                dataWidth: this.dataWidth,
                                min: 0,
                                data: data
                            };
                            cb2(terraindata);
                        }
                        img.onerror = function()
                        {
                            cb2();
                        }
                    }
                    this.loadBTTerrain = function(url, cb2)
                    {
                        var buff;
                        var xhr = new XMLHttpRequest();
                        xhr.responseType = 'arraybuffer';
                        xhr.onload = function(e)
                        {
                            if (xhr.status === 200)
                            {
                                buff = xhr.response;
                                var terraindata = assetLoader.parseBT(buff);
                                cb2(terraindata);
                            }
                            else
                            {
                                cb2();
                            }
                        };
                        xhr.open('GET', url);
                        xhr.send();
                    }
                    this.parseBT = function(arraybuf)
                    {
                        var DV = new DataView(arraybuf);
                        var dataWidth = DV.getInt32(10, true);
                        var dataHeight = DV.getInt32(14, true);
                        var dataSize = DV.getInt16(18, true);
                        var isfloat = DV.getInt16(20, true);
                        var scale = DV.getFloat32(62, true);
                        var data;
                        if (isfloat == 1)
                        {
                            data = new Float32Array(dataWidth * dataHeight);
                        }
                        else
                        {
                            data = new Int16Array(dataWidth * dataHeight);
                        }
                        var min = Infinity;
                        for (var i = 0; i < dataWidth * dataHeight; i++)
                        {
                            if (isfloat == 1)
                            {
                                data[i] = DV.getFloat32(256 + 4 * i, true);
                            }
                            else
                            {
                                data[i] = DV.getInt16(256 + 2 * i, true);
                            }
                            if (data[i] < min)
                                min = data[i];
                        }
                        return {
                            worldLength: null,
                            worldWidth: null,
                            dataHeight: dataHeight,
                            dataWidth: dataWidth,
                            min: min,
                            data: data
                        }
                    };
                    this.loadMorph = function(url, cb2)
                    {
                        var MorphRawJSONLoader = function ()
                        {
                            this.load = function(url, callback)
                            {
                                $.get(url, function(data)
                                {
                                    var dummyNode = new THREE.Object3D();
                                    dummyNode.morphTarget = JSON.parse(data);
                                    callback(
                                    {
                                        scene: dummyNode
                                    });
                                });
                            }
                        }
                        loader = new MorphRawJSONLoader();
                        loader.load(url, function(data)
                        {
                            cb2(data)
                        })
                    }
                    this.loadTexture = function(url, cb2)
                    {
                        //because of the way texture loads are handled in the scenemanager, we can actually go ahead and continue immediately here
                        //though we might as well let the scenemanager know to set started
                        _SceneManager.getTexture(url);
                        cb2();
                    }
                    this.loadTerrain = function(url, cb2)
                    {
                        var type = url.substr(url.lastIndexOf('.') + 1).toLowerCase();
                        if (type == 'bt')
                        {
                            assetLoader.loadBTTerrain(url, cb2);
                        }
                        else
                        {
                            assetLoader.loadImgTerrain(url, cb2);
                        }
                    }
                    this.loadSubDriver = function(url, cb2)
                    {
                        cb2();
                    }
                    this.addType('subDriver/threejs/asset/vnd.collada+xml', this.loadCollada);
                    this.addType('subDriver/threejs/asset/vnd.collada+xml+optimized', this.loadColladaOptimized);
                    this.addType('subDriver/threejs/asset/vnd.osgjs+json+compressed', this.loadUTf8Json);
                    this.addType("subDriver/threejs/asset/vnd.rmx+json", this.loadRMX);
                    this.addType("subDriver/threejs/asset/vnd.three.js+json", this.loadTHREEJS);
                    this.addType('subDriver/threejs/asset/vnd.gltf+json', this.loadglTF);
                    this.addType('subDriver/threejs/asset/vnd.raw-animation', this.loadglTFAnimation);
                    this.addType('subDriver/threejs/asset/vnd.osgjs+json+compressed+optimized', this.loadUTf8JsonOptimized);
                    this.addType('subDriver/threejs/asset/vnd.raw-morphttarget', this.loadMorph);
                    this.addType('subDriver/threejs/asset/vnd.wavefront-obj', this.loadOBJMTL);
                    this.addType('terrain', this.loadTerrain);
                    this.addType('texture', this.loadTexture);
                    this.addType('subDriver/threejs', this.loadSubDriver);
                    this.addType('unknown', this.loadUnknown);
                    
                    this.loadAssets = function(assets, cb, noProgressbar)
                    {
                        var total = assets.length;
                        if (!noProgressbar)
                            progressScreen.startProgressGui(total);
                        var count = 0;
                        async.forEachSeries(assets, function(i, cb2)
                        {
                            count++;
                            if (!noProgressbar)
                                progressScreen.updateProgressGui(count / total, i);
                            var type = i.type;
                            var url = i.url;
                            if (url)
                            {
                                if (assetLoader.loaders[type])
                                {
                                    var loaded = function (results)
                                    {
                                        assetLoader.cache[type][url] = results;
                                        cb2();
                                    }
                                    assetLoader.loaders[type](url, loaded)
                                }
                                else
                                {
                                    cb2();
                                }
                            }
                            else
                            {
                                cb2();
                            }
                        }, function(err)
                        {
                            //assetLoader.closeProgressGui();
                            
                            cb();
                        })
                    }
                }
            });
