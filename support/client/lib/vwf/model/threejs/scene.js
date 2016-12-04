(function()
{
	function findscene()
	{
		return vwf.views[0].state.scenes["index-vwf"].threeScene;
	}

	function findcamera()
	{
		return _Editor.findcamera();
	}

	function rebuildAllMaterials(start)
	{
		//update 2/15 - walk all objects registered with renderer, not just objects currently in scence
		//previous code missed objects cached in engine in various places.
		//This probably misses some cached materials, however
		if (!window._dScene) return;
		for (var i in _dScene.__webglObjects)
			for (var j in _dScene.__webglObjects[i])
				if (_dScene.__webglObjects[i][j].material) _dScene.__webglObjects[i][j].material.needsUpdate = true;
		if (window._dTerrain)
			_dTerrain.TileCache.rebuildAllMaterials();
	}
	//necessary when settign the amibent color to match MATH behavior
	//Three js mults scene ambient by material ambient
	function SetMaterialAmbients(start)
	{
		if (!start)
		{
			for (var i in this.state.scenes)
			{
				SetMaterialAmbients(this.state.scenes[i].threeScene);
			}
		}
		else
		{
			if (start && start.material)
			{
				//.005 chosen to make the 255 range for the ambient light mult to values that look like MATH values.
				//this will override any ambient colors set in materials.
				if (start.material.ambient)
					start.material.ambient.setRGB(1, 1, 1);
			}
			if (start && start.children)
			{
				for (var i in start.children)
					SetMaterialAmbients(start.children[i]);
			}
		}
	}

	function scene(childID, childSource, childName)
	{
		//the node constructor
		this.getFog = function()
		{
			if(!this.properties['fogType'])
				return null;
			if(this.properties['fogType'] == 'linear')
				return new THREE.Fog();
			if(this.properties['fogType'] == 'exp')
				return new THREE.FogExp2();
		}
		this.settingProperty = function(propertyName, propertyValue)
		{
			this.properties[propertyName] = propertyValue;
			var value = propertyValue;
			if (propertyName == 'skyColorBlend')
			{
				if (window._dSky && _dSky.material)
				{
					_dSky.material.uniforms.colorBlend.value = propertyValue;
				}
			}
			if (propertyName == 'skyFogBlend')
			{
				if (window._dSky && _dSky.material)
					_dSky.material.uniforms.fogBlend.value = propertyValue;
			}
			if (propertyName == 'skyApexColor')
			{
				if (window._dSky && _dSky.material)
				{
					_dSky.material.uniforms.ApexColor.value.r = propertyValue[0];
					_dSky.material.uniforms.ApexColor.value.g = propertyValue[1];
					_dSky.material.uniforms.ApexColor.value.b = propertyValue[2];
				}
			}
			if (propertyName == 'skyHorizonColor')
			{
				if (window._dSky && _dSky.material)
				{
					_dSky.material.uniforms.HorizonColor.value.r = propertyValue[0];
					_dSky.material.uniforms.HorizonColor.value.g = propertyValue[1];
					_dSky.material.uniforms.HorizonColor.value.b = propertyValue[2];
				}
			}
			if (propertyName == 'skyApexColor')
			{
				if (!this.getRoot().fog)
					this.getRoot().fog = this.getFog()
				if (!this.getRoot().fog) return;

				if (!this.getRoot().fog.vApexColor)
					this.getRoot().fog.vApexColor = new THREE.Color();
				this.getRoot().fog.vApexColor.r = propertyValue[0];
				this.getRoot().fog.vApexColor.g = propertyValue[1];
				this.getRoot().fog.vApexColor.b = propertyValue[2];
			}
			if (propertyName == 'skyHorizonColor')
			{
				if (!this.getRoot().fog)
					this.getRoot().fog = this.getFog()
				if (!this.getRoot().fog) return;

				if (!this.getRoot().fog.vHorizonColor)
					this.getRoot().fog.vHorizonColor = new THREE.Color();
				this.getRoot().fog.vHorizonColor.r = propertyValue[0];
				this.getRoot().fog.vHorizonColor.g = propertyValue[1];
				this.getRoot().fog.vHorizonColor.b = propertyValue[2];
			}
			if (propertyName == 'skyAtmosphereDensity')
			{
				if (!this.getRoot().fog)
					this.getRoot().fog = this.getFog()
				if (!this.getRoot().fog) return;

				this.getRoot().fog.vAtmosphereDensity = propertyValue / 500;
			}
			if (propertyName == 'fogType')
			{
				var newfog;
				if (propertyValue == 'exp')
				{
					newfog = new THREE.FogExp2();
				}
				if (propertyValue == 'linear')
				{
					newfog = new THREE.Fog();
				}
				if (propertyValue == 'none' || propertyValue == '' || propertyValue == null || propertyValue == 0)
				{
					newfog = null;
				}
				if (newfog)
				{
					//get all the fog values from the stored property values
					newfog.color.r = this.properties["fogColor"] ? this.properties["fogColor"][0] : 1;
					newfog.color.g = this.properties["fogColor"] ? this.properties["fogColor"][1] : 1;
					newfog.color.b = this.properties["fogColor"] ? this.properties["fogColor"][2] : 1;
					newfog.near = this.properties["fogNear"] || 0;
					newfog.far = this.properties["fogFar"] || 1000;
					newfog.density = this.properties["fogDensity"] || 0;
					newfog.vFalloff = this.properties["fogVFalloff"] || 1;
					newfog.vFalloffStart = this.properties["fogVFalloffStart"] || 0;
					newfog.vAtmosphereDensity = (this.properties["skyAtmosphereDensity"] || 0) / 500;
					this.getRoot().fog = newfog;
					this.getRoot().fog.vHorizonColor = new THREE.Color();
					this.getRoot().fog.vHorizonColor.r = this.properties["skyApexColor"] ? this.properties["skyHorizonColor"][0] : 1;
					this.getRoot().fog.vHorizonColor.g = this.properties["skyApexColor"] ? this.properties["skyHorizonColor"][1] : 1;
					this.getRoot().fog.vHorizonColor.b = this.properties["skyApexColor"] ? this.properties["skyHorizonColor"][2] : 1;
					this.getRoot().fog.vApexColor = new THREE.Color();
					this.getRoot().fog.vApexColor.r = this.properties["skyHorizonColor"] ? this.properties["skyHorizonColor"][0] : 1;
					this.getRoot().fog.vApexColor.g = this.properties["skyHorizonColor"] ? this.properties["skyHorizonColor"][1] : 1;
					this.getRoot().fog.vApexColor.b = this.properties["skyHorizonColor"] ? this.properties["skyHorizonColor"][2] : 1;
				}
				this.getRoot().fog = newfog;
				rebuildAllMaterials.call(this, this.getRoot());
			}
			if (propertyName == 'fogColor')
			{
				if (!this.getRoot().fog)
					this.getRoot().fog = this.getFog();
				if(!this.getRoot().fog) return;

				this.getRoot().fog.color.r = propertyValue[0];
				this.getRoot().fog.color.g = propertyValue[1];
				this.getRoot().fog.color.b = propertyValue[2];
				rebuildAllMaterials.call(this, this.getRoot());
			}
			if (propertyName == 'fogNear')
			{
				if (!this.getRoot().fog)
					this.getRoot().fog = this.getFog();
				if(!this.getRoot().fog) return;

				this.getRoot().fog.near = propertyValue;
				rebuildAllMaterials.call(this, this.getRoot());
			}
			if (propertyName == 'fogDensity')
			{
				if (!this.getRoot().fog)
					this.getRoot().fog = this.getFog();
				if(!this.getRoot().fog) return;

				this.getRoot().fog.density = propertyValue;
				rebuildAllMaterials.call(this, this.getRoot());
			}
			if (propertyName == 'fogVFalloff')
			{
				if (!this.getRoot().fog)
					this.getRoot().fog = this.getFog();
				if(!this.getRoot().fog) return;

				this.getRoot().fog.vFalloff = propertyValue;
				rebuildAllMaterials.call(this, this.getRoot());
			}
			if (propertyName == 'fogVFalloffStart')
			{
				if (!this.getRoot().fog)
					this.getRoot().fog = this.getFog();
				if(!this.getRoot().fog) return;

				this.getRoot().fog.vFalloffStart = propertyValue;
				rebuildAllMaterials.call(this, this.getRoot());
			}
			if (propertyName == 'fogFar')
			{
				if (!this.getRoot().fog)
					this.getRoot().fog = this.getFog();
				if(!this.getRoot().fog) return;

				this.getRoot().fog.far = propertyValue;
				rebuildAllMaterials.call(this, this.getRoot());
			}
			if (propertyName == 'skyTexture')
			{
				this.skyTexture = value;
				if (!this.sun) return;
				this.CreateSky(value);
			}
			if (propertyName == 'materialDef')
			{
				this.materialDef = value;
				return this.setTexture(value);
			}
			if (propertyName == 'sunIntensity')
			{
				if (!this.sun) return;
				this.sun.intensity = value;
			}
			if (propertyName == 'shadowDarkness')
			{
				if (!this.sun) return;
				this.sun.shadowDarkness = value;
			}
			if (propertyName == 'sunDirection')
			{
				if (!this.sun) return;
				var x = value[2] * Math.sin(value[0]) * Math.cos(value[1]);
				var y = value[2] * Math.sin(value[0]) * Math.sin(value[1]);
				var z = value[2] * Math.cos(value[0]);
				this.sun.position.x = x;
				this.sun.position.y = y;
				this.sun.position.z = z;
				this.sun.position.normalize();
				this.sun.position.multiplyScalar(100);
				this.sun.updateMatrixWorld(true);
			}
			if (propertyName == 'sunColor')
			{
				if (!this.sun) return;
				this.sun.color.r = value[0];
				this.sun.color.g = value[1];
				this.sun.color.b = value[2];
			}
			if (propertyName == 'ambientColor')
			{
				var lightsFound = 0;
				//this prop really should be a color array
				if (propertyValue.constructor != Array) return;
				if (propertyValue[0] > 1 && propertyValue[1] > 1 && propertyValue[2] > 1)
				{
					propertyValue[0] /= 255;
					propertyValue[1] /= 255;
					propertyValue[2] /= 255;
				}
				for (var i = 0; i < this.getRoot().__lights.length; i++)
				{
					if (this.getRoot().__lights[i] instanceof THREE.AmbientLight)
					{
						this.getRoot().__lights[i].color.setRGB(propertyValue[0], propertyValue[1], propertyValue[2]);
						//SetMaterialAmbients.call(this);
						lightsFound++;
					}
					else
					{
						//this.getRoot().__lights[i].shadowDarkness = MATH.lengthVec3(propertyValue)/2.7320508075688772;
					}
				}
				if (lightsFound == 0)
				{
					var ambientlight = new THREE.AmbientLight('#000000');
					ambientlight.color.setRGB(propertyValue[0], propertyValue[1], propertyValue[2]);
					node.threeScene.add(ambientlight);
					//SetMaterialAmbients.call(this);                            
				}
			}
		}
		this.getTexture = function()
		{
			if (this.materialDef) return this.materialDef;
			return {
				shininess: 15,
				alpha: 1,
				ambient:
				{
					r: .8,
					g: .8,
					b: .8
				},
				color:
				{
					r: 1,
					g: 1,
					b: 1,
					a: 1
				},
				emit:
				{
					r: 0,
					g: 0,
					b: 0
				},
				reflect: 0.8,
				shadeless: false,
				shadow: _SettingsManager.getKey('shadows'),
				specularColor:
				{
					r: 0.5773502691896258,
					g: 0.5773502691896258,
					b: 0.5773502691896258
				},
				specularLevel: 1,
				wireframe: true,
				layers: [
				{
					alpha: 1,
					blendMode: 0,
					mapInput: 0,
					mapTo: 1,
					offsetx: .11,
					offsety: .11,
					rot: 0,
					scalex: 250 / 9,
					scaley: 250 / 9,
					src: "textures/grid2.gif"
				}]
			}
		}
		this.setTexture = function(value)
		{
			if (this.groundplane)
			{
				_MaterialCache.setMaterial(this.groundplane, value)
				if (value && value.wireframe)
				{
					this.groundplane.visible = false;
					this.grid.visible = true;
				}
				else
				{
					this.groundplane.visible = true;
					this.grid.visible = false;
				}
			}
		}
		this.initializingNode = function()
		{
			this.OwnedPrims = [];
			var ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 10, 10), new THREE.MeshPhongMaterial());
			var g1 = new THREE.GridHelper(100, 1);
			_dScene.add(g1);
			g1.rotation.x = Math.PI / 2;
			g1.position.z = -.01;
			window._gGrid = g1;
			g1.updateMatrixWorld();
			this.grid = g1;
			g1.visible = true;
			ground.receiveShadow = _SettingsManager.getKey('shadows');
			ground.PickPriority = -1;
			this.grid.InvisibleToCPUPick = true;
			var grassTex = THREE.ImageUtils.loadTexture('textures/gridnew.png');
			ground.visible = false;
			ground.material.map = grassTex;
			grassTex.wrapS = THREE.RepeatWrapping;
			grassTex.wrapT = THREE.RepeatWrapping;
			grassTex.repeat.x = 64;
			grassTex.repeat.y = 64;
			grassTex.anisotropy = 0;
			this.groundplane = ground;
			this.getRoot().add(ground);
			if (this.properties.materialDef)
				this.setTexture(this.properties.materialDef);
			var l = new THREE.DirectionalLight();
			this.sun = l;
			this.sun.name = 'Sun';
			this.sun.castShadow = _SettingsManager.getKey('shadows');
			this.sun.shadowCameraNear = 1;
			this.sun.shadowCameraFar = 100;
			//this.sun.shadowCameraVisible = true;
			this.sun.shadowCameraBottom = -10;
			this.sun.shadowCameraLeft = -10;
			this.sun.shadowMapWidth = 1024;
			this.sun.shadowMapHeight = 1024;
			this.sun.shadowCameraTop = 10;
			this.sun.shadowCameraRight = 10;
			this.getRoot().add(l);
			rebuildAllMaterials();
			this.sun.position.x = this.sunDirection[0];
			this.sun.position.y = this.sunDirection[1];
			this.sun.position.z = this.sunDirection[2];
			this.sun.position.normalize();
			this.sun.position.multiplyScalar(100);
			this.sun.intensity = this.properties.sunIntensity;
			this.sun.shadowBias = -.005;
			this.sun.shadowDarkness = this.properties.shadowDarkness;
			window._dGround = this.groundplane;
			this.groundplane.name = 'GroundPlane';
			//this.groundplane.visible = false;
			window._dSun = this.sun;
			this.sun.updateMatrixWorld(true);
			this.CreateSky(vwf.getProperty(this.id, 'skyTexture') || 'white');
			this.postprerendercallback = this.postprerender.bind(this);
			_dView.bind('postprerender', this.postprerendercallback);
		}
		this.tempmatrix = (new THREE.Matrix4());
		this.lightvec = new THREE.Vector3(0, 0, -3);
		this.postprerender = function(e, viewprojection, wh, ww)
		{
			if (this.skycube && this.skycube.geometry.boundingSphere)
				this.skycube.geometry.boundingSphere.radius = Infinity;
			//focus the shadow camera projection matrix around the camera tha views the scene.
			if (this.sun && this.sun.shadowCamera)
			{
				this.lightvec.x = 0;
				this.lightvec.y = 0;
				this.lightvec.z = -3;
				var campos = findcamera().localToWorld(this.lightvec);
				this.sun.shadowCamera.updateMatrixWorld(true)
				var lm = this.sun.shadowCamera.matrixWorld.clone();
				lm = this.tempmatrix.getInverse(lm);
				var camposLS = campos.applyMatrix4(lm);
				this.sun.shadowCamera.projectionMatrix.makeOrthographic(camposLS.x - 15, camposLS.x + 15, camposLS.y - 15, camposLS.y + 15, -camposLS.z - 15, -camposLS.z + 15);
			}
		}
		this.CreateSky = function(sky_name)
		{
			////console.log('set sky ' + sky_name);
			//var sky_name = 'cloudy_noon';
			var urls = [];
			urls.push('skys/' + sky_name + '_FR.jpg');
			urls.push('skys/' + sky_name + '_BK.jpg');
			urls.push('skys/' + sky_name + '_RT.jpg');
			urls.push('skys/' + sky_name + '_LF.jpg');
			urls.push('skys/' + sky_name + '_UP.jpg');
			urls.push('skys/' + sky_name + '_DN.jpg');
			var loaded = function()
			{
				this.skymaterial.uniforms.texture.value.image = skyCubeTexture.image;
				this.skymaterial.uniforms.texture.value.needsUpdate = true;
				this.skymaterial.uniforms.texture.value.wrapS = this.skymaterial.uniforms.texture.value.wrapT = THREE.RepeatWrapping;
			}.bind(this);
			var skyCubeTexture = THREE.ImageUtils.loadTextureCube(urls, undefined, loaded);
			// skyCubeTexture.format = THREE.RGBFormat;
			skyCubeTexture.generateMipmaps = true;
			skyCubeTexture.minFilter = THREE.LinearFilter;
			skyCubeTexture.magFilter = THREE.LinearFilter;
			skyCubeTexture.wrapS = THREE.ClampToEdgeWrapping;
			skyCubeTexture.wrapT = THREE.ClampToEdgeWrapping;
			if (!this.skymaterial)
			{
				this.skymaterial = new THREE.ShaderMaterial(
				{
					uniforms: THREE.ShaderLib.sky.uniforms,
					attributes: THREE.ShaderLib.sky.attributes,
					vertexShader: THREE.ShaderLib.sky.vertexShader,
					fragmentShader: THREE.ShaderLib.sky.fragmentShader
				});
				this.skymaterial.uniforms.texture.value = skyCubeTexture;
				this.skymaterial.depthWrite = false;
				this.skymaterial.depthTest = false;
				this.skymaterial.fog = true;
				this.skymaterial.lights = true;
				this.skymaterial.transparent = false;
				this.skymaterial.uniforms.texture.value = skyCubeTexture;
			}
			this.skymaterial.side = 1;
			if (!this.skycube)
			{
				this.skycube = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 20), this.skymaterial);
				this.skycube.frustumCulled = false;
				this.skycube.name = "SkyCube";
				this.skycube.renderDepth = -Infinity;
				this.skycube.InvisibleToCPUPick = true;
				this.skycube.PickPriority = -1;
				this.skycube.depthWrite = false;
				this.skycube.depthCheck = false;
				this.skycube.castShadow = false;
				this.skycube.receiveShadow = false;
				this.getRoot().add(this.skycube);
				window._dSky = this.skycube;
			}
		}
		this.gettingProperty = function(propertyName)
		{
			if (propertyName == "materialDef")
			{
				return this.getTexture();
			}
			if (propertyName == "skyTexture")
			{
				return this.skyTexture;
			}
			if (propertyName == "getGroundPlane")
			{
				return this.groundplane;
			}
		}
		this.callingMethod = function(methodName, methodArgs)
		{
			if (methodName == "getGroundPlane")
			{
				return this.groundplane;
			}
			else if (methodName == "getSkyMat")
			{
				return this.skymaterial;
			}
		}
		this.getRoot = function()
		{
			return this.rootnode;
		}
		this.properties = {};
		this.rootnode = new THREE.Scene();
		this.rootnode.fog = null;
		
		this.camera = {};
		this.camera.ID = undefined;
		this.camera.defaultCamID = "http-vwf-example-com-camera-vwf-camera";
		this.camera.threeJScameras = {};
		this.ID = childID;
		this.viewInited = false;
		this.modelInited = false;
		this.threeScene = this.rootnode;
		this.threeScene.autoUpdate = false;
		this.pendingLoads = 0;
		this.srcAssetObjects = [];
		this.delayedProperties = {};
		var ambient = new THREE.AmbientLight();
		ambient.color.r = .5;
		ambient.color.g = .5;
		ambient.color.b = .5;
		this.threeScene.add(ambient);
	}
	//default factory code
	return function(childID, childSource, childName)
	{
		//name of the node constructor
		return new scene(childID, childSource, childName);
	}
})();
//@ sourceURL=threejs.subdriver.scene