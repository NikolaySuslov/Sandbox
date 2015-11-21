"use strict";

//https://github.com/davidbau/seedrandom
!function(a,b){function c(c,j,k){var n=[];j=1==j?{entropy:!0}:j||{};var s=g(f(j.entropy?[c,i(a)]:null==c?h():c,3),n),t=new d(n),u=function(){for(var a=t.g(m),b=p,c=0;q>a;)a=(a+c)*l,b*=l,c=t.g(1);for(;a>=r;)a/=2,b/=2,c>>>=1;return(a+c)/b};return u.int32=function(){return 0|t.g(4)},u.quick=function(){return t.g(4)/4294967296},u["double"]=u,g(i(t.S),a),(j.pass||k||function(a,c,d,f){return f&&(f.S&&e(f,t),a.state=function(){return e(t,{})}),d?(b[o]=a,c):a})(u,s,"global"in j?j.global:this==b,j.state)}function d(a){var b,c=a.length,d=this,e=0,f=d.i=d.j=0,g=d.S=[];for(c||(a=[c++]);l>e;)g[e]=e++;for(e=0;l>e;e++)g[e]=g[f=s&f+a[e%c]+(b=g[e])],g[f]=b;(d.g=function(a){for(var b,c=0,e=d.i,f=d.j,g=d.S;a--;)b=g[e=s&e+1],c=c*l+g[s&(g[e]=g[f=s&f+b])+(g[f]=b)];return d.i=e,d.j=f,c})(l)}function e(a,b){return b.i=a.i,b.j=a.j,b.S=a.S.slice(),b}function f(a,b){var c,d=[],e=typeof a;if(b&&"object"==e)for(c in a)try{d.push(f(a[c],b-1))}catch(g){}return d.length?d:"string"==e?a:a+"\0"}function g(a,b){for(var c,d=a+"",e=0;e<d.length;)b[s&e]=s&(c^=19*b[s&e])+d.charCodeAt(e++);return i(b)}function h(){try{if(j)return i(j.randomBytes(l));var b=new Uint8Array(l);return(k.crypto||k.msCrypto).getRandomValues(b),i(b)}catch(c){var d=k.navigator,e=d&&d.plugins;return[+new Date,k,e,k.screen,i(a)]}}function i(a){return String.fromCharCode.apply(0,a)}var j,k=this,l=256,m=6,n=52,o="random",p=b.pow(l,m),q=b.pow(2,n),r=2*q,s=l-1;if(b["seed"+o]=c,g(b.random(),a),"object"==typeof module&&module.exports){module.exports=c;try{j=require("crypto")}catch(t){}}else"function"==typeof define&&define.amd&&define(function(){return c})}([],Math);

(function()
{
    // n = 6 gives a good enough approximation
    var seedRandom;
    function rnd2()
    {
        return seedRandom() * 2 - 1;
      
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
        this.waveNum = 20;
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
            for (var i = 0; i < this.waveNum; i++)
            {
                this.timers[i] = (rnd2());
            }
        }
        this.seed = 12312123;
        this.generateWaves = function()
        {
            this.uniforms.maxWaveDisplace.value = this.amplitude;
            seedRandom = new Math.seedrandom(this.seed);
            for (var i = 0; i < this.waveNum; i++)
            {
                this.timers[i] = (rnd2());
                this.uniforms.gB.value[i] = 1;
            }
            this.uniforms.waves.value.length = 0;
            for (var i = 0; i < this.waveNum; i++)
            {
                this.uniforms.waves.value.push(new THREE.Vector4())
            }
            for (var i = 0; i < this.waveNum; i++)
            {
                var b = rnd2();
                var amp = rnd2() * this.amplitudeVariation + this.amplitude;
                this.uniforms.waves.value[i].x = amp;
                this.uniforms.waves.value[i].ox = 5 + 10 * rnd2();
                this.uniforms.waves.value[i].w = b;
                console.log(amp);
            }
            for (var i = 0; i < this.waveNum; i++)
            {
                var b = rnd2();
                var amp = rnd2() * this.directionVariation + this.direction;
                var dir = [1, 0];
                //amp/= 57;
                console.log(amp);
                var x1 = 1 * Math.cos(amp) - 0 * Math.sin(amp);
                var y1 = 0 * Math.cos(amp) + 1 * Math.sin(amp);
                this.uniforms.waves.value[i].y = x1;
                this.uniforms.waves.value[i].z = y1;
                console.log(x1, y1);
            }
            this.uniforms.waves.value.sort(function(a, b)
            {
                if (a.x < b.x) return 1;
                else
                    return -1;
            })
            this.setupGertsnerShadeConstants();
        }
        this.forceA = function(a)
        {
            var A = this.uniforms.A.value;
            for (var i = 0; i < this.waveNum; i++)
            {
                this.uniforms.A.value[i] = a
            }
        }
        this.setupGertsnerShadeConstants = function()
        {
            var Qa = this.uniforms.uChop.value / this.uniforms.uMag.value;
            var L = this.uniforms.L.value;
            var D = this.uniforms.D.value;
            var A = this.uniforms.A.value;
            var S = this.uniforms.S.value;
            var W = this.uniforms.W.value;
            var Q = this.uniforms.Q.value;
            var waves = this.uniforms.waves.value;
            var PI = Math.PI;

            for (var i = 0; i < this.waveNum; i++)
            {
                L[i] = waves[i].x;
                //L[i] *= uMag / 2.0;
                D[i] = new THREE.Vector2(waves[i].y, waves[i].z);
                D[i].normalize();
                var w = 2.0 * PI / L[i];
                A[i] = 0.5 / (w * 2.718281828459045); //for ocean on Earth, A is ususally related to L
                
                //S[i] =     1.0 * uMag; //for ocean on Earth, S is ususally related to L
                S[i] = .65 * (waves[i].w + 0.5) * Math.sqrt(.98 * (3.0 * PI / w));
                W[i] = w;
                Q[i] = Qa / (w * A[i] * this.waveNum);
            }
        }
        this.nm510C = [3.4,7.3,11.55,13.5,21,33,54,90];
        this.nm440C = [1.9,6.8,13.5,25,39,56,89,160];
        this.nm645C = [36,40,44.5,45,46,54,63,76];
        this.nmB0C = [.037,.037,.037,.219,.56,.78,1.1,1.824];
        this.waterType = 0;
        this.setupPhysicalShadeConstants = function()
        {
            var b0 = this.nmB0C[this.waterType];

            var water = new THREE.Vector3(this.nm645C[this.waterType], //645nm
            this.nm510C[this.waterType], //510nm
            this.nm440C[this.waterType]);
            water.setLength(36.21008146911575);

            var Kd_r = water.x;//this.nm645C[this.waterType]; //645nm
            var Kd_g = water.y;//this.nm510C[this.waterType]; //510nm
            var Kd_b = water.z;//this.nm440C[this.waterType]; //440nm
            var wl0 = 514.0;
            var m = -0.00113;
            var i = -1.62517;
            var b645 = b0 + ((645.0 * m + i) / (wl0 * m + i));
            var b510 = b0 + ((510.0 * m + i) / (wl0 * m + i));
            var b440 = b0 + ((440.0 * m + i) / (wl0 * m + i));
            var bb645 = 0.01829 * b645 + 0.00006;
            var bb510 = 0.01829 * b510 + 0.00006;
            var bb440 = 0.01829 * b440 + 0.00006;
            var a645 = Kd_r;
            var a510 = Kd_g;
            var a440 = Kd_b;
            var c645 = a645 + b645;
            var c510 = a510 + b510;
            var c440 = a440 + b440;
            this.uniforms.Kd.value.set(Kd_r, Kd_g, Kd_b);
            this.uniforms.c.value.set(c645, c510, c440);
            this.uniforms.a.value.set(a645, a510, a440);
            this.uniforms.bb.value.set(bb645, bb510, bb440);
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
                waveEffectDepth: {
                    type: "f",
                    value: 1
                },
                L:{type: "fv1",value: []},
                D:{type: "v2v",value: []},
                A:{type: "fv1",value: []},
                S:{type: "fv1",value: []},
                W:{type: "fv1",value: []},
                Q:{type: "fv1",value: []},
                gB:{type: "fv1",value: []},
                uHalfGrid:
                {
                    type: "f",
                    value: this.resolution / 2
                },
                waves:
                {
                    type: "v4v",
                    value: [
                        (new THREE.Vector4(9, 1.0, 1.0, .5)), (new THREE.Vector4(3.5, -1.0, 1.0, .5)), (new THREE.Vector4(6, 1.0, -1.0, .5)), (new THREE.Vector4(5, 1.6, 1.4, .5)), (new THREE.Vector4(8, -0.3, 1.0, .5)), (new THREE.Vector4(3, 6.0, -1.0, .5)), (new THREE.Vector4(4, 6.0, -1.0, .5)), (new THREE.Vector4(8, -1.0, 61.0, .5)), (new THREE.Vector4(8, -1.6, 1.0, .5))
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
                uSunPower:
                {
                    type: "f",
                    value: 500
                },
                uAmbientPower:
                {
                    type: "f",
                    value: 500
                },
                uOceanDepth:
                {
                    type: "f",
                    value: 500
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
                uNormalPower:
                {
                    type: "f",
                    value: 1
                },
                gA:
                {
                    type: "f",
                    value: .5
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
                Kd:
                {
                    type: "v3",
                    value: new THREE.Vector3(0, 0, 0)
                },
                bb:
                {
                    type: "v3",
                    value: new THREE.Vector3(0, 0, 0)
                },
                a:
                {
                    type: "v3",
                    value: new THREE.Vector3(0, 0, 0)
                },
                c:
                {
                    type: "v3",
                    value: new THREE.Vector3(0, 0, 0)
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
                },
                maxWaveDisplace:
                {
                    type: "f",
                    value: 1
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
            if(_SettingsManager.getKey('reflections'))
                this.setupRenderTargets();
            this.buildMat();
            this.near = new THREE.PlaneGeometry(1, 1, this.resolution, this.resolution);
            this.nearmesh = new THREE.Mesh(this.near, this.mat);
            this.nearmesh.InvisibleToCPUPick = true;
            this.getRoot().add(this.nearmesh);
            this.nearmesh.renderDepth = 3;
            this.nearmesh.frustumCulled = false;
            _dView.bind('prerender', this.prerender);
            if(_SettingsManager.getKey('reflections'))
                _dView.bind('postprerender', this.renderRefractions);
            window._dOcean = this;
            this.waves = this.uniforms.waves.value;
            this.generateWaves();
            this.setupPhysicalShadeConstants();

        }
        this.setResolution = function(res)
        {
            this.resolution = res;
            this.nearmesh.parent.remove(this.nearmesh);
            this.near.dispose();
            this.near = new THREE.PlaneGeometry(1, 1, this.resolution, this.resolution);
            this.nearmesh = new THREE.Mesh(this.near, this.mat);
            this.nearmesh.InvisibleToCPUPick = true;
            this.getRoot().add(this.nearmesh);
            this.nearmesh.renderDepth = 3;
            this.nearmesh.frustumCulled = false;
            this.uniforms.uHalfGrid.value = this.resolution / 2;
        }
        this.buildMat = function()
        {   
            var defines = "#define numWaves " + this.waveNum + "\n";
            if(_SettingsManager.getKey('reflections'))
            {
                defines += "#define useReflections\n#define useRefractions\n"
            }
            this.vertexShader = defines + this.getSync(this.vertShaderURL);
            this.fragmentShader = defines + this.getSync(this.fragShaderURL);
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
            this.mat.fog = true;
            if (this.nearmesh)
                this.nearmesh.material = this.mat;
        }
        this.up = new THREE.Vector3(0, 0, 1);
        this.f = 10;
        this.h = 1;
        this.b = .05;
        this.prerender = function()
        {
            if (this.disable) return;


           

            var vp = _dView.getCamera().matrixWorld.elements;
            var root = this.getRoot();
            root.position.set(0, 0, 0);
            root.updateMatrix();
            root.updateMatrixWorld();
            var now = performance.now();
            var deltaT = now - this.lastFrame || 0;
            
            for(var i =0; i < this.waveNum; i++)
            {
                this.timers[i] += deltaT;
                this.uniforms.gB.value[i] =   ((Math.sin(this.waves[i].ox +this.timers[i]/(this.waves[i].ox * 20000))+1.0)/2.0);
                if(this.uniforms.gB.value[i] < .0001)
                {
                    var amp = rnd2() * this.amplitudeVariation + this.amplitude;
                    //this.waves[i].x = amp;
                   // this.waves[i].ox = amp;
                    var amp = rnd2() * this.directionVariation + this.direction;
                    var dir = [1,0];
                    var x1 = 1 * Math.cos(amp) - 0 * Math.sin(amp);
                    var y1 = 0 * Math.cos(amp) + 1 * Math.sin(amp);
                    this.uniforms.waves.value[i].y = x1;
                    this.uniforms.waves.value[i].z = y1;
                }
            }
            var _viewProjectionMatrix = new THREE.Matrix4();
            var target = new THREE.Vector3(0, 0, -Math.abs(this.f));
            target.applyMatrix4(_dView.getCamera().matrixWorld);
            target.z = 0.0;
            
            var eye = new THREE.Vector3(0,0,this.amplitude + this.amplitudeVariation);
            eye.applyMatrix4(_dView.getCamera().matrixWorld);
            eye.z += Math.abs(this.h);


            var lookat = (new THREE.Matrix4()).lookAt(eye, target, this.up, 2);
            lookat.setPosition(eye);
            var campos = [vp[12], vp[13], vp[14]];
            var ivp = MATH.inverseMat4(this.getViewProjection());
            var cornerPoints = [];
            cornerPoints.push(this.GetWorldPickRay([1, 1, 1, 1], ivp, campos));
            cornerPoints.push(this.GetWorldPickRay([1, -1, 1, 1], ivp, campos));
            cornerPoints.push(this.GetWorldPickRay([-1, 1, 1, 1], ivp, campos));
            cornerPoints.push(this.GetWorldPickRay([-1, -1, 1, 1], ivp, campos));
            cornerPoints.push(this.GetWorldPickRay([1, 1, 0, 1], ivp, campos));
            cornerPoints.push(this.GetWorldPickRay([1, -1, 0, 1], ivp, campos));
            cornerPoints.push(this.GetWorldPickRay([-1, 1, 0, 1], ivp, campos));
            cornerPoints.push(this.GetWorldPickRay([-1, -1, 0, 1], ivp, campos));
            var intersections = [];
            var hit = this.intersectLinePlane(cornerPoints[0], cornerPoints[4]);
            if (hit) intersections.push(hit);
            hit = this.intersectLinePlane(cornerPoints[1], cornerPoints[5]);
            if (hit) intersections.push(hit);
            hit = this.intersectLinePlane(cornerPoints[2], cornerPoints[6]);
            if (hit) intersections.push(hit);
            hit = this.intersectLinePlane(cornerPoints[3], cornerPoints[7]);
            if (hit) intersections.push(hit);
            var hitFar = false;
            if (intersections.length < 4)
            {
                hitFar = true;
                var hit = this.intersectLinePlane(cornerPoints[1], cornerPoints[0]);
                if (hit) intersections.push(hit);
                var hit = this.intersectLinePlane(cornerPoints[3], cornerPoints[2]);
                if (hit) intersections.push(hit);
            }
            var lookatI = (new THREE.Matrix4()).getInverse(lookat);
            _viewProjectionMatrix.multiplyMatrices(_dView.getCamera().projectionMatrix, lookatI);
            this.uniforms.mProj.value.getInverse(_viewProjectionMatrix);
            var projSpacePoints = []
            for (var i = 0; i < intersections.length; i++)
            {
                intersections[i][2] = this.waterHeight;
                var pv = new THREE.Vector4(intersections[i][0], intersections[i][1], intersections[i][2]);
                pv.applyMatrix4(_viewProjectionMatrix)
                pv.x /= pv.w;
                pv.y /= pv.w;
                pv.z /= pv.w;
                projSpacePoints.push(pv);
            }
            var xMax = -Infinity;
            var xMin = Infinity;
            var yMax = -Infinity;
            var yMin = Infinity;
            for (var i = 0; i < projSpacePoints.length; i++)
            {
                if (projSpacePoints[i].x < xMin)
                    xMin = projSpacePoints[i].x;
                if (projSpacePoints[i].y < yMin)
                    yMin = projSpacePoints[i].y;
                if (projSpacePoints[i].x > xMax)
                    xMax = projSpacePoints[i].x;
                if (projSpacePoints[i].y > yMax)
                    yMax = projSpacePoints[i].y;
            }
          
            yMin -= this.b;
            

            if (!hitFar)
            yMax += this.b;
            this.mRange[0] = xMax - xMin;
            this.mRange[5] = yMax - yMin;
            this.mRange[12] = xMin + (xMax - xMin) / 2
            this.mRange[13] = yMin + (yMax - yMin) / 2;
            var mRangeM = (new THREE.Matrix4()).fromArray(this.mRange);
            var posfd = [this.uniforms.mProj.value.elements[3], this.uniforms.mProj.value.elements[7], this.uniforms.mProj.value.elements[14]];
            
            var temp = new THREE.Matrix4();
            this.nearmesh.matrixWorld.elements[12] = vp[12];
            this.nearmesh.matrixWorld.elements[13] = vp[13];
            temp.getInverse(this.nearmesh.matrixWorld)


            this.uniforms.mProj.value.multiplyMatrices(this.uniforms.mProj.value.clone(), mRangeM);
            this.uniforms.mProj.value.multiplyMatrices(temp, this.uniforms.mProj.value.clone());
            this.uniforms.t.value += (deltaT / 1000.0) || 0;
            this.uniforms.oCamPos.value.set(vp[12] - root.matrixWorld.elements[12], vp[13] - root.matrixWorld.elements[13], vp[14] - root.matrixWorld.elements[14]);
            this.uniforms.wPosition.value.set(0, 0, 0);
            this.lastFrame = now;
            this.uniforms.uWaterHeight.value = this.waterHeight;
        }.bind(this)
        this.mRange = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]
        this.intersectLinePlane = function(raypoint0, raypoint)
        {
            var planepoint = [0, 0, this.waterHeight];
            var planenormal = [0, 0, 1];
            var ray = MATH.subVec3(raypoint, raypoint0);
            var len = MATH.lengthVec3(ray)
            var ray = MATH.toUnitVec3(ray);
            var n = MATH.dotVec3(MATH.subVec3(planepoint, raypoint), planenormal);
            var d = MATH.dotVec3(ray, planenormal);
            if (d == 0) return null;
            if (d < 0) return null;
            if (d > len) return null;
            if (Math.abs(d) > len) return null;
            var dist = n / d;
            var alongray = MATH.scaleVec3(ray, dist);
            var intersect = MATH.addVec3(alongray, raypoint);
            return intersect;
        }.bind(this);
        this.getViewProjection = function()
        {
            var cam = _dView.getCamera();
            cam.matrixWorldInverse.getInverse(cam.matrixWorld);
            var _viewProjectionMatrix = new THREE.Matrix4();
            _viewProjectionMatrix.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
            return MATH.transposeMat4(_viewProjectionMatrix.toArray([]));
        }
        this.GetWorldPickRay = function(vec, ivp, campos)
        {
            var worldmousepos = MATH.mulMat4Vec4(ivp, vec); //@ sourceURL=threejs.subdriver.ocean()), screenmousepos);
            worldmousepos[0] /= worldmousepos[3];
            worldmousepos[1] /= worldmousepos[3];
            worldmousepos[2] /= worldmousepos[3];
            return worldmousepos;
        }.bind(this);
        this.depthOverride;
        this.setupRenderTargets = function()
        {
            this.reflectionCam = new THREE.PerspectiveCamera();
            var depthShader = THREE.ShaderLib[ "depthRGBA" ];
            var depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );

            this.depthOverride = new THREE.ShaderMaterial( { fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms } );
            this.depthOverride.blending = 9;

            var rtt = new THREE.WebGLRenderTarget(256, 256, {
                format: THREE.RGBAFormat,
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter
            });
            
            this.refractionColorRtt = rtt;

            rtt = new THREE.WebGLRenderTarget(256, 256, {
                format: THREE.RGBAFormat,
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter
            });
            
            this.refractionDepthRtt = rtt;

            rtt = new THREE.WebGLRenderTarget(512, 512, {
                format: THREE.RGBAFormat,
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter
            });
            
            this.reflectionColorRtt = rtt;
            
            this.uniforms.refractionColorRtt = {
                type:'t',
                value:this.refractionColorRtt
            }

            this.uniforms.reflectionColorRtt = {
                type:'t',
                value:this.reflectionColorRtt
            }

            this.uniforms.refractionDepthRtt = {
                type:'t',
                value:this.refractionDepthRtt
            }
        }
         this.setupProjectionMatrix = function(mirrorCamera)
        {

            
            

            var N = new THREE.Vector3(0, 0, 1);
           
            mirrorCamera.matrixWorldInverse.getInverse(mirrorCamera.matrixWorld);
            // now update projection matrix with new clip plane
            // implementing code from: http://www.terathon.com/code/oblique.html
            // paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
            var clipPlane = new THREE.Plane();
            clipPlane.setFromNormalAndCoplanarPoint(N, new THREE.Vector3(0,0,this.waterHeight));
            clipPlane.applyMatrix4(mirrorCamera.matrixWorldInverse);

            clipPlane = new THREE.Vector4(clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.constant);

            var q = new THREE.Vector4();
            var projectionMatrix = mirrorCamera.projectionMatrix;

            q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
            q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
            q.z = -1.0;
            q.w = (1.0 + projectionMatrix.elements[10]) / mirrorCamera.projectionMatrix.elements[14];

            // Calculate the scaled plane vector
            var c = new THREE.Vector4();
            c = clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

            // Replace the third row of the projection matrix
            projectionMatrix.elements[2] = c.x;
            projectionMatrix.elements[6] = c.y;
            projectionMatrix.elements[10] = c.z + 1.0;
            projectionMatrix.elements[14] = c.w;

        }
        this.renderRefractions = function()
        {
             if (this.disable) return;
            var rttcam = _dView.getCamera();
            
            var oldFogStart = _dScene.fog.vFalloffStart;
            var camZ = rttcam.matrixWorld.elements[14];
            var camHeightOverFog = camZ - oldFogStart;
            var oldShadowEnabled = _dRenderer.shadowMapEnabled;
            _dRenderer.shadowMapEnabled = false
            this.reflectionCam.near = rttcam.near;
            this.reflectionCam.far = rttcam.far;
            this.reflectionCam.fov = rttcam.fov;
            this.reflectionCam.aspect = rttcam.aspect;
            this.reflectionCam.updateProjectionMatrix();

            this.reflectionCam.matrixAutoUpdate = false;            
            this.reflectionCam.matrix.copy(rttcam.matrixWorld);
            var m = new THREE.Matrix4()
            m.fromArray([1, 0, 0, 0 ,0, 1, 0, 0, 0, 0,-1,0, 0, 0, this.waterHeight *2, 1]);
         
            this.reflectionCam.matrix.multiplyMatrices(m,this.reflectionCam.matrix.clone());
                

            var e = this.reflectionCam.matrix.elements;
            var front = [e[0],e[1],e[2]];
            var side = [e[8],e[9],e[10]];
            var up = MATH.crossVec3(front,side);
            e[4] = up[0];
            e[5] = up[1];
            e[6] = up[2];
            this.reflectionCam.updateMatrixWorld(true);

            _dScene.fog.vFalloffStart = this.reflectionCam.matrixWorld.elements[14] - camHeightOverFog;
            _dRenderer.setRenderTarget(this.reflectionColorRtt);
            _dRenderer.clear();
            _dRenderer.setBlending(THREE.CustomBlending,THREE.AddEquation,THREE.OneFactor,THREE.ZeroFactor);
            _dSky.material.blending = 9;
            _dSky.material.transparent = true;
            _RenderManager.renderObject(_dSky,_dScene,this.reflectionCam);
            _dSky.material.transparent = false;
            _dRenderer.setRenderTarget(null);
            _dSky.visible = false;
            _dSky.material.blending = 9;
            this.setupProjectionMatrix(this.reflectionCam)
             this.nearmesh.visible = false;
         
            _dRenderer.flipCulling = true;
            _dRenderer.render(_dScene, this.reflectionCam, this.reflectionColorRtt, false);
            _dRenderer.flipCulling = false;
            _dScene.fog.vFalloffStart = oldFogStart;
        
           
           


            var rtt = this.refractionColorRtt;
            _dRenderer.setRenderTarget(rtt);
            _dRenderer.clear(_dScene, rttcam, rtt);
            _dRenderer.setRenderTarget();
          
            _dRenderer.render(_dScene, rttcam, rtt);
           
            var _far = _dView.getCamera().far;
        
          _dRenderer.setBlending(THREE.CustomBlending,THREE.AddEquation,THREE.OneFactor,THREE.ZeroFactor);
            rtt = this.refractionDepthRtt;
            _dRenderer.setRenderTarget(rtt);
            _dRenderer.setClearColor(new THREE.Color(1,1,1),1);
            _dRenderer.clear(_dScene, rttcam, rtt);
            _dRenderer.setRenderTarget();
            _dScene.overrideMaterial = this.depthOverride;

            _dRenderer.render(_dScene, rttcam, rtt);
            _dScene.overrideMaterial = null;
            _dRenderer.setClearColor(new THREE.Color(0,0,1),1);
            
            this.nearmesh.visible = true;
            _dRenderer.shadowMapEnabled = oldShadowEnabled;
             _dSky.visible = true;
       

        }.bind(this)
        this.deletingNode = function(propertyName, propertyValue)
        {
            _dRenderer.unbind("prerender",this.prerender);
            _dRenderer.unbind("postprerender",this.renderRefractions);
        }
        this.settingProperty = function(propertyName, propertyValue)
        {
            if (propertyName == "uMag")
            {
                this.uniforms.uMag.value = propertyValue;
                this.setupGertsnerShadeConstants()
            }
            if (propertyName == "waterHeight")
            {
                this.waterHeight = propertyValue;
            }
            if (propertyName == "amplitude")
            {
                this.amplitude = propertyValue;
                this.generateWaves();
            }
            if (propertyName == "amplitudeVariation")
            {
                this.amplitudeVariation = propertyValue;
                this.generateWaves();
            }
            if (propertyName == "direction")
            {
                this.direction = propertyValue;
                this.generateWaves();
            }
            if (propertyName == "directionVariation")
            {
                this.directionVariation = propertyValue;
                this.generateWaves();
            }
            if (propertyName == "seed")
            {
                this.seed = propertyValue;
                this.generateWaves();
            }
            if (propertyName == "waveEffectDepth")
            {
                this.waveEffectDepth = propertyValue;
                this.uniforms.waveEffectDepth.value = propertyValue;
            }
            if (propertyName == "waterType")
            {
                this.waterType = propertyValue;
                this.setupPhysicalShadeConstants();
            }
            if (propertyName == "uNormalPower")
            {
                this.uniforms.uNormalPower.value = propertyValue;
            }
            if (propertyName == "gA")
            {
                this.uniforms.gA.value = propertyValue;
            }
            if (propertyName == "uReflectPow")
            {
                this.uniforms.uReflectPow.value = propertyValue;
            }
            if (propertyName == "uChop")
            {
                this.uniforms.uChop.value = propertyValue;
                this.setupGertsnerShadeConstants()
            }
            if (propertyName == "uFoam")
            {
                this.uniforms.uFoam.value = propertyValue;
            }
            if (propertyName == "uOceanDepth")
            {
                this.uniforms.uOceanDepth.value = propertyValue;
            }
            if (propertyName == "uSunPower")
            {
                this.uniforms.uSunPower.value = propertyValue;
            }
            if (propertyName == "uAmbientPower")
            {
                this.uniforms.uAmbientPower.value = propertyValue;
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