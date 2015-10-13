"use strict";
(function()
{

    // n = 6 gives a good enough approximation
function rnd2() {
    return Math.random()*2 - 1;
    return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) / 3;
}

    //enum to keep track of assets that fail to load
    function ocean(childID, childSource, childName, childType, assetSource, asyncCallback)
    {
        //asyncCallback(false);
        this.childID = childID;
        this.childSource = childSource;
        this.childName = childName;
        this.childType = childType;
        this.assetSource = assetSource;
        this.inheritFullBase = true; //actually construct the base classes
        this.inherits = ['vwf/model/threejs/visible.js', 'vwf/model/threejs/transformable.js']
        this.vertShaderURL = "./ocean/ocean.vert.glsl";
        this.fragShaderURL = "./ocean/ocean.frag.glsl";
        this.direction = 90;
        this.directionVariation = 1.3;
        this.amplitude = 5;
        this.amplitudeVariation = 3;
        this.waveNum = 9;
        this.resolution = 50;
        this.waterHeight = 20;
        this.timers = [];
        this.getSync = function(url)
        {
            return $.ajax(
            {
                async: false,
                url: url,
                method: "GET",
                contentType: "text",
                dataType: "text"
            }).responseText;
        }
        this.setNumWaves = function(num)
        {
             this.waveNum = num;
             this.generateWaves();
             this.buildMat();
             for(var i =0; i < this.waveNum; i++)
             {
                this.timers[i]= (Math.random());
             }
        }
        this.generateWaves = function()
        {
            
 for(var i =0; i < this.waveNum; i++)
             {
                this.timers[i]= (Math.random());
             }
            this.uniforms.waves.value.length = 0;
            for(var i = 0; i < this.waveNum; i++)
            {
                this.uniforms.waves.value.push(new THREE.Vector4())
            }
            for(var i = 0; i < this.waveNum; i++)
            {
                var b = Math.random();
                var amp = rnd2() * this.amplitudeVariation + this.amplitude;
                this.uniforms.waves.value[i].x = amp;
                this.uniforms.waves.value[i].ox = amp;
                this.uniforms.waves.value[i].w = b;
                console.log(amp);
            }

           

            for(var i = 0; i < this.waveNum; i++)
            {
                var b = Math.random();
                var amp = rnd2() * this.directionVariation + this.direction;
                var dir = [1,0];

                //amp/= 57;
                console.log(amp);
                var x1 = 1 * Math.cos(amp) - 0 * Math.sin(amp);
                var y1 = 0 * Math.cos(amp) + 1 * Math.sin(amp);
                this.uniforms.waves.value[i].y = x1;
                this.uniforms.waves.value[i].z = y1;
                console.log(x1,y1);
            }
            this.uniforms.waves.value.sort(function(a,b)
            {
                if(a.x < b.x) return 1;
                else
                    return -1;
            })
        }
        this.initialize = function()
        {
            this.uniforms = {
                t:
                {
                    type: "f",
                    value: 0.0
                },
                uChop:
                {
                    type: "f",
                    value: 1.4
                },
                uReflectPow:
                {
                    type: "f",
                    value: 3.5
                },
                uHalfGrid:
                {
                    type: "f",
                    value: this.resolution/2
                },
                waves:{
                    type: "v4v",
                    value:[
                    (new THREE.Vector4(9,1.0, 1.0,.5)),
                    (new THREE.Vector4(3.5,-1.0, 1.0,.5)),
                    (new THREE.Vector4(6,1.0, -1.0,.5)),
                    (new THREE.Vector4(5,1.6, 1.4,.5)),
                    (new THREE.Vector4(8,-0.3, 1.0,.5)),
                    (new THREE.Vector4(3,6.0, -1.0,.5)),
                    (new THREE.Vector4(4,6.0, -1.0,.5)),
                    (new THREE.Vector4(8,-1.0, 61.0,.5)),
                    (new THREE.Vector4(8,-1.6, 1.0,.5))
                    ]
                },
                uFoam:
                {
                    type: "f",
                    value: 1
                },
                uMag:
                {
                    type: "f",
                    value: .5
                },
                uWaterHeight:
                {
                    type: "f",
                    value: this.waterHeight
                },
                texture:
                {
                    type: "t",
                    value: _SceneManager.getTexture("./checker.jpg")
                },
                oNormal:
                {
                    type: "t",
                    value: _SceneManager.getTexture("./ocean/oNormal.jpeg")
                },
                diffuse:
                {
                    type: "t",
                    value: _SceneManager.getTexture("./ocean/diffuse.jpg")
                },
                endColor:
                {
                    type: "v4",
                    value: new THREE.Vector4(0, 0, 0, 1)
                },
                mProj:
                {
                    type: "m4",
                    value: new THREE.Matrix4()
                },
                oCamPos:
                {
                    type: "v3",
                    value: new THREE.Vector3(0, 0, 0, 1)
                },
                wPosition:
                {
                    type: "v3",
                    value: new THREE.Vector3(0, 0, 0, 1)
                }
            };
            var sky = vwf_view.kernel.kernel.callMethod(vwf.application(), 'getSkyMat')
            if (sky)
            {
                this.uniforms.texture.value = sky.uniforms.texture.value;
                this.uniforms.texture.value.mapping = new THREE.CubeReflectionMapping();
            }
            for (var i in THREE.UniformsLib.fog)
            {
                this.uniforms[i] = THREE.UniformsLib.fog[i];
            }
            for (var i in THREE.UniformsLib.lights)
            {
                this.uniforms[i] = THREE.UniformsLib.lights[i];
            }
            this.buildMat();
            this.near = new THREE.PlaneGeometry(1, 1, this.resolution  , this.resolution);
            
            
            this.nearmesh = new THREE.Mesh(this.near, this.mat);
            
            this.nearmesh.InvisibleToCPUPick = true;
            this.getRoot().add(this.nearmesh);
            
            this.nearmesh.frustumCulled  = false;
            _dView.bind('prerender', this.prerender.bind(this));
            window._dOcean = this;
            this.waves = this.uniforms.waves.value;
            this.generateWaves();
        }
        this.setResolution = function(res)
        {

            this.resolution = res;
            
            this.nearmesh.parent.remove(this.nearmesh);
            this.near.dispose();

            this.near = new THREE.PlaneGeometry(1, 1, this.resolution  , this.resolution);
            
            this.nearmesh = new THREE.Mesh(this.near, this.mat);
            
            this.nearmesh.InvisibleToCPUPick = true;
            this.getRoot().add(this.nearmesh);
            
            this.nearmesh.frustumCulled  = false;
            this.uniforms.uHalfGrid.value = this.resolution/2;


        }
        this.buildMat = function()
        {
            this.vertexShader = "#define numWaves " + this.waveNum + "\n"+ this.getSync(this.vertShaderURL);
            this.fragmentShader = "#define numWaves " + this.waveNum + "\n"+ this.getSync(this.fragShaderURL);
            this.mat = new THREE.ShaderMaterial(
            {
                uniforms: this.uniforms,
                attributes: this.attributes,
                vertexShader: this.vertexShader,
                fragmentShader: this.fragmentShader
            });
            this.mat.transparent = true;
            this.mat.lights = true;
            this.mat.side = 0;
            this.mat.wireframe = false;
            if (this.nearmesh)
                this.nearmesh.material = this.mat;
        }
        this.up = new THREE.Vector3(0,0,1);
        this.f = 10;
        this.h = 1;
        this.prerender = function()
        {
            if(this.disable) return;


            var vp = _dView.getCamera().matrixWorld.elements;
            var root = this.getRoot();
            root.position.set(0, 0, 0);
            root.updateMatrix();
            root.updateMatrixWorld();
            var now = performance.now();
            var deltaT = now - this.lastFrame || 0;

           
            /*for(var i =0; i < this.waveNum; i++)
            {
                this.timers[i] += deltaT;
                this.waves[i].x = this.waves[i].ox * ((Math.sin(this.timers[i]/100)+1.0)/2.0);
                if(this.waves[i].x < .001)
                {
                    var amp = rnd2() * this.amplitudeVariation + this.amplitude;
                    this.waves.x = amp;
                    this.waves.ox = amp;
                    var amp = rnd2() * this.directionVariation + this.direction;
                    var dir = [1,0];
                    var x1 = 1 * Math.cos(amp) - 0 * Math.sin(amp);
                    var y1 = 0 * Math.cos(amp) + 1 * Math.sin(amp);
                    this.uniforms.waves.value[i].y = x1;
                    this.uniforms.waves.value[i].z = y1;
                }
            }*/

            var _viewProjectionMatrix = new THREE.Matrix4();

            var target = new THREE.Vector3(0,0,-Math.abs(this.f));
            target.applyMatrix4(_dView.getCamera().matrixWorld);
            target.z = 0.0;
            var eye = new THREE.Vector3(vp[12],vp[13],vp[14] +Math.abs(this.h))
            var lookat = (new THREE.Matrix4()).lookAt(eye,target,this.up,2);
            lookat.setPosition(eye);
            
            var campos = [vp[12],vp[13],vp[14]];
            var ivp = MATH.inverseMat4(this.getViewProjection());
            var cornerPoints = [];
            cornerPoints.push(this.GetWorldPickRay([1,1,1,1],ivp,campos));
            cornerPoints.push(this.GetWorldPickRay([1,-1,1,1],ivp,campos));
            cornerPoints.push(this.GetWorldPickRay([-1,1,1,1],ivp,campos));
            cornerPoints.push(this.GetWorldPickRay([-1,-1,1,1],ivp,campos));
            cornerPoints.push(this.GetWorldPickRay([1,1,0,1],ivp,campos));
            cornerPoints.push(this.GetWorldPickRay([1,-1,0,1],ivp,campos));
            cornerPoints.push(this.GetWorldPickRay([-1,1,0,1],ivp,campos));
            cornerPoints.push(this.GetWorldPickRay([-1,-1,0,1],ivp,campos));

 
            var intersections = [];
           

            var hit = this.intersectLinePlane(cornerPoints[0],cornerPoints[4]);
            if(hit) intersections.push(hit);
            hit = this.intersectLinePlane(cornerPoints[1],cornerPoints[5]);
            if(hit) intersections.push(hit);
            hit = this.intersectLinePlane(cornerPoints[2],cornerPoints[6]);
            if(hit) intersections.push(hit);
            hit = this.intersectLinePlane(cornerPoints[3],cornerPoints[7]);
            if(hit) intersections.push(hit);

            if(intersections.length < 4)
            {
                 var hit = this.intersectLinePlane(cornerPoints[1],cornerPoints[0]);
                if(hit) intersections.push(hit);

                var hit = this.intersectLinePlane(cornerPoints[3],cornerPoints[2]);
                if(hit) intersections.push(hit);
            }
           
            var lookatI = (new THREE.Matrix4()).getInverse(lookat);
            _viewProjectionMatrix.multiplyMatrices(_dView.getCamera().projectionMatrix,lookatI);
            
            this.uniforms.mProj.value.getInverse(_viewProjectionMatrix);
            
            var projSpacePoints = []
            for(var i =0; i < intersections.length; i++)
            {
                intersections[i][2] = this.waterHeight;
                var pv = new THREE.Vector4(intersections[i][0],intersections[i][1],intersections[i][2]);
                pv.applyMatrix4( _viewProjectionMatrix)
                pv.x /= pv.w;
                pv.y /= pv.w;
                pv.z /= pv.w;

                projSpacePoints.push(pv);
            }

            var xMax = -Infinity;
            var xMin = Infinity;

            var yMax = -Infinity;
            var yMin = Infinity;

            for(var i =0 ;i < projSpacePoints.length; i++)
            {
                if(projSpacePoints[i].x < xMin)
                    xMin = projSpacePoints[i].x;
                if(projSpacePoints[i].y < yMin)
                    yMin = projSpacePoints[i].y;

                if(projSpacePoints[i].x > xMax)
                    xMax = projSpacePoints[i].x;
                if(projSpacePoints[i].y > yMax)
                    yMax = projSpacePoints[i].y;
            }
            yMin -= 1.0;
            this.mRange[0] = xMax-xMin;
            this.mRange[5] = yMax-yMin;
            this.mRange[12] = xMin + (xMax-xMin)/2
            this.mRange[13] = yMin + (yMax-yMin)/2;

            var mRangeM = (new THREE.Matrix4()).fromArray(this.mRange);
            var posfd = [this.uniforms.mProj.value.elements[3],this.uniforms.mProj.value.elements[7],this.uniforms.mProj.value.elements[14]];
            this.uniforms.mProj.value.multiplyMatrices(this.uniforms.mProj.value.clone(),mRangeM);
           
            this.uniforms.t.value += (deltaT / 1000.0) || 0;
            this.uniforms.oCamPos.value.set(vp[12] - root.matrixWorld.elements[12], vp[13] - root.matrixWorld.elements[13], vp[14] - root.matrixWorld.elements[14]);
            this.uniforms.wPosition.value.set(0,0,0);
            this.lastFrame = now;
            this.uniforms.uWaterHeight.value = this.waterHeight;
        }
        this.mRange = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]
        this.intersectLinePlane = function(raypoint0, raypoint ) {
            var planepoint = [0,0,this.waterHeight];
            var planenormal = [0,0,1];
            var ray = MATH.subVec3(raypoint,raypoint0);
            var len = MATH.lengthVec3(ray)
            var ray = MATH.toUnitVec3(ray);
            var n = MATH.dotVec3(MATH.subVec3(planepoint, raypoint), planenormal);
            var d = MATH.dotVec3(ray, planenormal);
            if (d == 0) return null;
            if(d < 0) return null;
            if(d > len) return null;
            if(Math.abs(d) > len) return null;
            var dist = n / d;
            var alongray = MATH.scaleVec3(ray,dist);
            var intersect = MATH.addVec3(alongray,    raypoint);
            return intersect;
        }.bind(this);
        this.getViewProjection = function() {
          
            var cam = _dView.getCamera();
            cam.matrixWorldInverse.getInverse(cam.matrixWorld);
            var _viewProjectionMatrix = new THREE.Matrix4();
            _viewProjectionMatrix.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
            return MATH.transposeMat4(_viewProjectionMatrix.toArray([]));
        }
        this.GetWorldPickRay = function(vec,ivp,campos) {
            var worldmousepos = MATH.mulMat4Vec4(ivp,vec);//@ sourceURL=threejs.subdriver.ocean()), screenmousepos);
            worldmousepos[0] /= worldmousepos[3];
            worldmousepos[1] /= worldmousepos[3];
            worldmousepos[2] /= worldmousepos[3];
           
            
            return worldmousepos;
        }.bind(this);
        this.settingProperty = function(propertyName, propertyValue) 
        {

            if(propertyName == "uMag")
            {
                this.uniforms.uMag.value = propertyValue;
            }
            if(propertyName == "uReflectPow")
            {
                this.uniforms.uReflectPow.value = propertyValue;
            }
            if(propertyName == "uChop")
            {
                this.uniforms.uChop.value = propertyValue;
            }
            if(propertyName == "uFoam")
            {
                this.uniforms.uFoam.value = propertyValue;
            }

        }
        
        this.getRoot = function()
        {
            return this.rootNode;
        }
        this.rootNode = new THREE.Object3D();
    }
    //default factory code
    return function(childID, childSource, childName, childType, assetSource, asyncCallback)
    {
        //name of the node constructor
        var ocean1 = new ocean(childID, childSource, childName, childType, assetSource, asyncCallback);
        return ocean1;
    }

})();
//@ sourceURL=threejs.subdriver.ocean