var transformTool = function()
{
    var Move = 0;
    var Rotate = 1;
    var Scale = 2;
    var Multi = 3;
    var TESTING = false;
    this.movegizbody = null;
    this.mode = null;
    this.coordSystem = new THREE.Matrix4();
    this.mouseDownOffsets = {};
    this.coordSystemInv = new THREE.Matrix4();
    this.transformOffsets = true;
    this.init = function()
    {
        var _angularapp = require("vwf/view/editorview/angular-app");
        _angularapp.root.fields.useObjectCenters = true;

        this.movegizbody = new THREE.Object3D();
        this.movegizbody.matrixAutoUpdate = false;
        this.axisSelected = -1;
        var red = [1, 0, 0, 1];
        var green = [0, 1, .0, 1];
        var blue = [0, 0, 1, 1];
        //temp mesh for all geometry to test
        var cubeX = new THREE.Mesh(new THREE.BoxGeometry(10.00, .40, .40), new THREE.MeshLambertMaterial(
        {
            color: 0xFF0000,
            emissive: 0xFF0000,
            ambient: 0xFF0000
        }));
        cubeX.position.set(5.00, .15, .15);
        var cubeY = new THREE.Mesh(new THREE.BoxGeometry(.40, 10.00, .40), new THREE.MeshLambertMaterial(
        {
            color: 0x00FF00,
            emissive: 0x00FF00,
            ambient: 0x00FF00
        }));
        cubeY.position.set(.15, 5.00, .15);
        var cubeZ = new THREE.Mesh(new THREE.BoxGeometry(.40, .40, 10.00), new THREE.MeshLambertMaterial(
        {
            color: 0x0000FF,
            emissive: 0x0000FF,
            ambient: 0x0000FF
        }));
        cubeZ.position.set(.15, .15, 5.00);
        this.allChildren = [];
        this.allChildren.push(cubeX);
        this.allChildren.push(cubeY);
        this.allChildren.push(cubeZ);
        cubeX.geometry.setPickGeometry(new THREE.BoxGeometry(10.00, 1.80, 1.80));
        cubeY.geometry.setPickGeometry(new THREE.BoxGeometry(1.80, 10.00, 1.80));
        cubeZ.geometry.setPickGeometry(new THREE.BoxGeometry(1.80, 1.80, 10.00));
        var arrowX = new THREE.Mesh(new THREE.CylinderGeometry(0, 1, 2, 10, 0), cubeX.material);
        cubeX.add(arrowX, true);
        arrowX.rotation.z = -90 * 0.0174532925;
        arrowX.position.x = 5
        var arrowY = new THREE.Mesh(new THREE.CylinderGeometry(0, 1, 2, 10, 0), cubeY.material);
        cubeY.add(arrowY, true);
        //arrowX.rotation.z = -90 * 0.0174532925;
        arrowY.position.y = 5
        var arrowZ = new THREE.Mesh(new THREE.CylinderGeometry(0, 1, 2, 10, 0), cubeZ.material);
        cubeZ.add(arrowZ, true);
        arrowZ.rotation.y = -90 * 0.0174532925;
        arrowZ.rotation.z = -90 * 0.0174532925
        arrowZ.position.z = 5
        var rotx = new THREE.Mesh(new THREE.TorusGeometry(7, .50, 4, 20), new THREE.MeshLambertMaterial(
        {
            color: 0xFF0000,
            emissive: 0xFF0000,
            ambient: 0xFF0000
        }));
        var roty = new THREE.Mesh(new THREE.TorusGeometry(7, .50, 4, 20), new THREE.MeshLambertMaterial(
        {
            color: 0x00FF00,
            emissive: 0x00FF00,
            ambient: 0x00FF00
        }));
        var rotz = new THREE.Mesh(new THREE.TorusGeometry(7, .50, 4, 20), new THREE.MeshLambertMaterial(
        {
            color: 0x0000FF,
            emissive: 0x0000FF,
            ambient: 0x0000FF
        }));
        this.allChildren.push(rotx);
        roty.rotation.x = Math.PI / 2;
        this.allChildren.push(roty);
        rotx.rotation.y = Math.PI / 2;
        this.allChildren.push(rotz);
        rotz.rotation.z = 90;
        this.allChildren.push(this.BuildBox([.5, .5, .5], [11.25, 0, 0], red)); //scale x       
        this.allChildren.push(this.BuildBox([.5, .5, .5], [0, 11.25, 0], green)); //scale y
        this.allChildren.push(this.BuildBox([.5, .5, .5], [0, 0, 11.25], blue)); //scale z
        this.allChildren.push(this.BuildBox([.85, .85, .85], [12.25, 0, 0], red)); //scale xyz
        this.allChildren.push(this.BuildBox([.85, .85, .85], [0, 12.25, 0], green)); //scale xyz
        this.allChildren.push(this.BuildBox([.85, .85, .85], [0, 0, 12.25], blue)); //scale xyz
        this.allChildren.push(this.BuildBox([6, 6, .1], [3, 3, -.2], [75, 75, .1, 1], .5)); //movexy
        //MoveGizmo.allChildren[MoveGizmo.allChildren.length -1].geometry.setPickGeometry(new THREE.BoxGeometry( 8, 8, .30 ));
        this.allChildren.push(this.BuildBox([6, .1, 6], [3.2, -.2, 3], [75, 0, 75, 1], .5)); //movexz
        //MoveGizmo.allChildren[MoveGizmo.allChildren.length -1].geometry.setPickGeometry(new THREE.BoxGeometry( 8, .30, 8 ));
        this.allChildren.push(this.BuildBox([.1, 6, 6], [-.2, 3.2, 3], [0, 75, 75, 1], .5)); //moveyz
        //MoveGizmo.allChildren[MoveGizmo.allChildren.length -1].geometry.setPickGeometry(new THREE.BoxGeometry( .30, 8, 8 ));
        this.allChildren.push(this.BuildRing(14, .2, [0, 0, 1], 30, [.5, .5, .5, 1], 90, 450)); //rotate z
        var xRotation = this.BuildRing(7, 0.5, [1, 0, 0], 37, red, 0, 370);
        xRotation.add(this.BuildBox([.5, .5, 13], [0, 0, 0], red), true);
        xRotation.children[0].material = xRotation.material;
        this.allChildren.push(xRotation); //rotate x
        var yRotation = this.BuildRing(7, 0.5, [0, 1, 0], 37, green, 0, 370);
        yRotation.add(this.BuildBox([.5, .5, 13], [0, 0, 0], green), true);
        yRotation.children[0].material = yRotation.material;
        this.allChildren.push(yRotation); //rotate y
        var zRotation = this.BuildRing(7, 0.5, [0, 0, 1], 37, blue, 0, 370);
        zRotation.add(this.BuildBox([.5, .5, 13], [0, 0, 0], blue), true);
        zRotation.children[0].material = zRotation.material;
        this.allChildren.push(zRotation); //rotate z
        //MoveGizmo.allChildren.push(this.BuildBox([5, 5, 5], [0, 0, 0], [1, 1, 1, 1])); //scale uniform
        this.allChildren.push(this.BuildScaleUniform()); //scale uniform
        this.allChildren.push(this.BuildBox([0.30, 5, 5], [5, 0, 0], red)); //scale uniform
        this.allChildren.push(this.BuildBox([5, .30, 5], [0, 5, 0], green)); //scale uniform
        this.allChildren.push(this.BuildBox([5, 5, .30], [0, 0, 5], blue)); //scale uniform
        this.allChildren.push(this.BuildBox([.30, 5, 5], [-5, 0, 0], red)); //scale uniform
        this.allChildren.push(this.BuildBox([5, .30, 5], [0, -5, 0], green)); //scale uniform
        this.allChildren.push(this.BuildBox([5, 5, .30], [0, 0, -5], blue)); //scale uniform        
        this.allChildren[0].name = 'XMovement';
        this.allChildren[1].name = 'YMovement';
        this.allChildren[2].name = 'ZMovement';
        this.allChildren[3].name = 'XMovement';
        this.allChildren[4].name = 'YMovement';
        this.allChildren[5].name = 'ZMovement';
        this.allChildren[6].name = 'XScale';
        this.allChildren[7].name = 'YScale';
        this.allChildren[8].name = 'ZScale';
        this.allChildren[9].name = 'XYScale';
        this.allChildren[10].name = 'YZScale';
        this.allChildren[11].name = 'ZXScale';
        this.allChildren[12].name = 'XYMove';
        this.allChildren[13].name = 'YZMove';
        this.allChildren[14].name = 'ZXMove';
        this.allChildren[15].name = 'SwapCoords';
        this.allChildren[16].name = 'XRotate';
        this.allChildren[17].name = 'YRotate';
        this.allChildren[18].name = 'ZRotate';
        this.allChildren[19].name = 'ScaleUniform';
        this.allChildren[20].name = 'XScale1';
        this.allChildren[21].name = 'YScale1';
        this.allChildren[22].name = 'ZScale1';
        this.allChildren[23].name = 'XScale2';
        this.allChildren[24].name = 'YScale2';
        this.allChildren[25].name = 'ZScale2';
        this.name = "MoveGizmo";
        this.movegizhead = new THREE.Object3D();
        this.movegizhead.name = "MoveGizmoRoot";
        this.movegizhead.matrixAutoUpdate = false;
        this.movegizhead.add(this.movegizbody, true);
        //since the picking system will use the scenemanager, must add.
        //but use special add because there is no point in constantly re organizing the
        //graph based on the gizmo
        this.matrixAutoUpdate = false;
        for (var i = 0; i < this.allChildren.length; i++)
        {
            this.allChildren[i].material.originalColor = new THREE.Color();
            var c = this.allChildren[i].material.color;
            this.allChildren[i].material.originalColor.setRGB(c.r, c.g, c.b);
            //this.allChildren[i].renderDepth = -10000 - i;
            // this.allChildren[i].material.depthTest = false;
            // this.allChildren[i].material.depthWrite = false;
            //this.allChildren[i].material.transparent = true;
            this.allChildren[i].material.fog = false;
            this.allChildren[i].PickPriority = 10;
        }
        this.SetGizmoMode(Move);
        this.getGizmoBody().InvisibleToCPUPick = false;
    }
    this.getGizmoHead = function()
    {
        return this.movegizhead;
    }
    this.getGizmoBody = function()
    {
        return this.movegizbody;
    }
    this.show = function()
    {
        this.hidden = false;
        this.SetGizmoMode(this.GizmoMode)
    }
    this.hidden = false;
    this.hide = function()
    {
        this.hidden = true;
        while (this.getGizmoBody().children.length)
        {
            this.getGizmoBody().remove(this.getGizmoBody().children[this.getGizmoBody().children.length - 1])
        }
    }
    this.SetGizmoMode = function(type)
    {

        this.GizmoMode = type;
        if(this.hidden) return;
        if (type == Move)
        {
            $('#StatusTransform').text('Move');
            for (var i = 0; i < this.allChildren.length; i++)
            {
                if ((i >= 0 && i <= 2) || (i >= 12 && i <= 14))
                {
                    this.movegizbody.add(this.allChildren[i], true);
                }
                else
                {
                    this.movegizbody.remove(this.allChildren[i], true);
                }
                this.GizmoMode = Move;
            }
        }
        if (type == Rotate)
        {
            $('#StatusTransform').text('Rotate');
            for (var i = 0; i < this.allChildren.length; i++)
            {
                if (i >= 16 && i <= 18)
                {
                    this.movegizbody.add(this.allChildren[i], true);
                }
                else
                {
                    this.movegizbody.remove(this.allChildren[i], true);
                }
                this.GizmoMode = Rotate;
            }
        }
        if (type == Scale)
        {
            $('#StatusTransform').text('Scale');
            //SetCoordSystem(LocalCoords);          
            for (var i = 0; i < this.allChildren.length; i++)
            {
                if (i == 19)
                {
                    this.movegizbody.add(this.allChildren[i], true);
                }
                else
                {
                    this.movegizbody.remove(this.allChildren[i], true);
                }
                this.GizmoMode = Scale;
            }
        }
        if (type == Multi)
        {
            $('#StatusTransform').text('Multi');
            for (var i = 0; i < this.allChildren.length; i++)
            {
                if ([0, 1, 2, 3, 4, 5, 12, 13, 14, 15, 19].indexOf(i) > -1)
                {
                    this.movegizbody.add(this.allChildren[i], true);
                }
                else
                {
                    this.movegizbody.remove(this.allChildren[i], true);
                }
                this.GizmoMode = Multi;
            }
        }
    }.bind(this);
    this.BuildRing = function(radius1, radius2, axis, steps, color, startdeg, enddeg)
    {
        var mesh = new THREE.Mesh(new THREE.TorusGeometry(radius1, radius2, 6, steps), new THREE.MeshLambertMaterial());
        mesh.material.color.r = color[0];
        mesh.material.color.g = color[1];
        mesh.material.color.b = color[2];
        mesh.material.emissive.r = color[0];
        mesh.material.emissive.g = color[1];
        mesh.material.emissive.b = color[2];
        mesh.rotation.x = axis[1] * Math.PI / 2;
        mesh.rotation.y = axis[0] * Math.PI / 2;
        mesh.rotation.z = axis[2] * Math.PI / 2;
        mesh.updateMatrixWorld(true);
        return mesh;
    }
    this.BuildBox = function(size, offset, color, alpha)
    {
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), new THREE.MeshLambertMaterial());
        mesh.material.color.r = color[0];
        mesh.material.color.g = color[1];
        mesh.material.color.b = color[2];
        mesh.material.ambient.r = color[0];
        mesh.material.ambient.g = color[1];
        mesh.material.ambient.b = color[2];
        mesh.material.emissive.r = color[0];
        mesh.material.emissive.g = color[1];
        mesh.material.emissive.b = color[2];
        mesh.material.shading = false;
        mesh.material.transparent = true;
        mesh.material.opacity = alpha || 1;
        //mesh.matrix.setPosition(new THREE.Vector3(offset[0],offset[1],offset[2]));
        for (var i = 0; i < mesh.geometry.vertices.length; i++)
        {
            mesh.geometry.vertices[i].x += offset[0];
            mesh.geometry.vertices[i].y += offset[1];
            mesh.geometry.vertices[i].z += offset[2];
        }
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrixWorld(true);
        return mesh;
    }
    this.BuildScaleUniform = function()
    {
        var mesh = new THREE.Mesh(new THREE.SphereGeometry(3, 4, 2), new THREE.MeshPhongMaterial());
        mesh.material.color.r = .5;
        mesh.material.color.g = .5;
        mesh.material.color.b = 1;
        mesh.material.emissive.r = .051;
        mesh.material.emissive.g = .051;
        mesh.material.emissive.b = .051;
        mesh.material.ambient.r = 0;
        mesh.material.ambient.g = 0;
        mesh.material.shading = true;
        //mesh.matrix.setPosition(new THREE.Vector3(offset[0],offset[1],offset[2]));
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrixWorld(true);
        return mesh;
    }
    this.hilightAxis = function(axis)
    {
        for (var i = 0; i < this.allChildren.length; i++)
        {
            if (this.allChildren[i].material)
            {
                var c = this.allChildren[i].material.originalColor;
                this.allChildren[i].material.color.setRGB(c.r, c.g, c.b);
                this.allChildren[i].material.emissive.setRGB(c.r, c.g, c.b);
            }
        }
        if (axis >= 0)
        {
            //this.saveTransforms();
            if (this.allChildren[axis].material)
            {
                this.allChildren[axis].material.color.setRGB(.5, .5, .5);
                this.allChildren[axis].material.emissive.setRGB(.5, .5, .5);
            }
        }
    }
    this.updateOrientation = function(transform)
    {
        this.coordSystem.elements.set(transform);
        this.coordSystem.orthogonalize();
        this.coordSystem.setPosition(new THREE.Vector3(0, 0, 0));
        this.coordSystemInv.getInverse(this.coordSystem)
        this.getGizmoHead().matrix.elements[0] = this.coordSystem.elements[0];
        this.getGizmoHead().matrix.elements[1] = this.coordSystem.elements[1];
        this.getGizmoHead().matrix.elements[2] = this.coordSystem.elements[2];
        this.getGizmoHead().matrix.elements[4] = this.coordSystem.elements[4];
        this.getGizmoHead().matrix.elements[5] = this.coordSystem.elements[5];
        this.getGizmoHead().matrix.elements[6] = this.coordSystem.elements[6];
        this.getGizmoHead().matrix.elements[8] = this.coordSystem.elements[8];
        this.getGizmoHead().matrix.elements[9] = this.coordSystem.elements[9];
        this.getGizmoHead().matrix.elements[10] = this.coordSystem.elements[10];
        this.getGizmoHead().updateMatrixWorld(true);
    }
    this.updateLocation = function(transforms)
    {
        var pos = [0, 0, 0];
        for (var i in transforms)
        {
            pos[0] += transforms[i][12] / transforms.length
            pos[1] += transforms[i][13] / transforms.length
            pos[2] += transforms[i][14] / transforms.length
        }
        this.getGizmoHead().matrix.elements[12] = pos[0]
        this.getGizmoHead().matrix.elements[13] = pos[1]
        this.getGizmoHead().matrix.elements[14] = pos[2]
        this.getGizmoHead().updateMatrixWorld(true);
    }
    this.updateSize = function()
    {
        if(isNaN(this.getGizmoBody().matrix.elements[0]))
        {
            this.getGizmoBody().matrix.copy(new THREE.Matrix4());
        }
        var pixelRatio = window.devicePixelRatio || 1;
        var tgizpos = [0, 0, 0];
        var tgizpos2 = [0, 0, 0];
        var transposeTemp = [];
        var tempcammatinverse = new THREE.Matrix4();
        var tcamposGizSpace = [];
        tgizpos[0] = this.getGizmoHead().matrixWorld.elements[12];
        tgizpos[1] = this.getGizmoHead().matrixWorld.elements[13];
        tgizpos[2] = this.getGizmoHead().matrixWorld.elements[14];
        var campos = _Editor.getCameraPosition();
        var dist = MATH.lengthVec3(Vec3.subtract(tgizpos, campos, tempvec1));
        dist = Math.max(dist,.0001); //prevent 0 dist thus 0 scale thus NANs in matrix
        var cam = _Editor.findcamera();
        cam.updateMatrixWorld(true);

        if(cam instanceof THREE.OrthographicCamera)
        {
            dist = Math.min(Math.abs(cam.top-cam.bottom),Math.abs(cam.left-cam.right));
            var oldscale = [this.getGizmoBody().matrix.elements[0], this.getGizmoBody().matrix.elements[5], this.getGizmoBody().matrix.elements[10]];
            this.getGizmoBody().matrix.scale(new THREE.Vector3(1 / oldscale[0], 1 / oldscale[1], 1 / oldscale[2]));

            var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
            var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

            var windowXadj = 16.0 / (w*pixelRatio);
            var windowYadj = 12.0 / (h*pixelRatio);
            var winadj = Math.max(windowXadj, windowYadj);
            this.getGizmoBody().matrix.scale(new THREE.Vector3(dist * winadj , dist * winadj , dist * winadj ));
            //document.title = tcamposGizSpace[0];
            //this.getGizmoBody().matrix.scale(new THREE.Vector3(tcamposGizSpace[0] > 0 ? 1 : -1, tcamposGizSpace[1] > 0 ? 1 : -1, tcamposGizSpace[2] > 0 ? 1 : -1));
            this.updateHandleVisiblity(_Editor.GetWorldPickRay({clientX:0,clientY:0}));

        } else
        {
            var fovadj = cam.fov / 75;
            cam.matrixWorldInverse.getInverse(cam.matrixWorld);
            tgizpos2 = MATH.mulMat4Vec3(MATH.transposeMat4(cam.matrixWorldInverse.elements, transposeTemp), tgizpos, tgizpos2);
            dist = -tgizpos2[2] / 65;
            var oldscale = [this.getGizmoBody().matrix.elements[0], this.getGizmoBody().matrix.elements[5], this.getGizmoBody().matrix.elements[10]];
            this.getGizmoBody().matrix.scale(new THREE.Vector3(1 / oldscale[0], 1 / oldscale[1], 1 / oldscale[2]));

            var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
            var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

            var windowXadj = 1600.0 / (w*pixelRatio);
            var windowYadj = 1200.0 / (h*pixelRatio);
            var winadj = Math.max(windowXadj, windowYadj);
            this.getGizmoBody().matrix.scale(new THREE.Vector3(dist * winadj * fovadj, dist * winadj * fovadj, dist * winadj * fovadj));
            tempcammatinverse.getInverse(this.getGizmoHead().matrixWorld);
            tcamposGizSpace = MATH.mulMat4Vec3(MATH.transposeMat4(tempcammatinverse.elements, transposeTemp), campos, tcamposGizSpace);
            //document.title = tcamposGizSpace[0];
            this.getGizmoBody().matrix.scale(new THREE.Vector3(tcamposGizSpace[0] > 0 ? 1 : -1, tcamposGizSpace[1] > 0 ? 1 : -1, tcamposGizSpace[2] > 0 ? 1 : -1));
              this.updateHandleVisiblity(MATH.toUnitVec3( MATH.subVec3(tgizpos,campos)));
        }
       
        this.getGizmoBody().updateMatrixWorld(true);

      
    }
   
    this.updateHandleVisiblity = function(camvec)
    {
         function testDot(vec,vec1)
        {
            if(Math.abs(MATH.dotVec3(vec,vec1)) < .995)
                return true;
            return false;
        }
        function hide(obj)
        {
            obj.visible = false;
            obj.InvisibleToCPUPick = true;
            for(var i =0; i < obj.children.length; i++)
                hide(obj.children[i])
        }
        function show(obj)
        {
            obj.visible = true;
            obj.InvisibleToCPUPick = false;
            for(var i =0; i < obj.children.length; i++)
                show(obj.children[i])
        }

        var gizmoHead = this.getGizmoBody();
        var camRay = camvec;
        var elements = gizmoHead.matrixWorld.elements;
        var gizWorldX = MATH.toUnitVec3([elements[0],elements[1],elements[2]]);
        var gizWorldY = MATH.toUnitVec3([elements[4],elements[5],elements[6]]);
        var gizWorldZ = MATH.toUnitVec3([elements[8],elements[9],elements[10]]);

        var objects = this.getGizmoBody().children;
        for(var i =0; i < objects.length; i++ )
        {
            if(objects[i].name == "XMovement")
            {
                if(testDot(gizWorldX,camRay))
                    show(objects[i])
                else
                    hide(objects[i])
            }
            else if(objects[i].name == "YMovement")
            {
                if(testDot(gizWorldY,camRay))
                    show(objects[i])
                else
                    hide(objects[i]);
            }
            else if(objects[i].name == "ZMovement")
            {
                if(testDot(gizWorldZ,camRay))
                    show(objects[i])
                else
                    hide(objects[i])
            }
            else if(objects[i].name == "XYMove")
            {
                if(testDot(gizWorldX,camRay) && testDot(gizWorldY,camRay))
                    show(objects[i])
                else
                    hide(objects[i])
            }
            else if(objects[i].name == "ZXMove")
            {
                if(testDot(gizWorldY,camRay) && testDot(gizWorldZ,camRay))
                    show(objects[i])
                else
                    hide(objects[i])
            }
            else if(objects[i].name == "YZMove")
            {
                if(testDot(gizWorldX,camRay) && testDot(gizWorldZ,camRay))
                    show(objects[i])
                else
                    hide(objects[i])
            }
            else if(objects[i].name == "XRotate")
            {
                if(Math.abs(MATH.dotVec3(gizWorldX,camRay)) < .15) 
                    hide(objects[i])
                else
                    show(objects[i])
            }
            else if(objects[i].name == "YRotate")
            {
                if(Math.abs(MATH.dotVec3(gizWorldY,camRay)) < .15) 
                    hide(objects[i])
                else
                    show(objects[i])
            }
            else if(objects[i].name == "ZRotate")
            {
                if(Math.abs(MATH.dotVec3(gizWorldZ,camRay)) < .15) 
                    hide(objects[i])
                else
                    show(objects[i])
            }

        }
    }
    this.mouseLeave = function(e)
    {
        if (this.axisSelected !== -1)
        {
            this.axisSelected = -1;
            this.hilightAxis(-1)
        }
        for (var i = 0; i < _Editor.getSelectionCount(); i++)
        {
            _dView.setViewTransformOverride(_Editor.GetSelectedVWFID(i), null);
        }
    }
    this.mouseUp = function(e)
    {
        if (this.axisSelected !== -1)
        {
            this.axisSelected = -1;
            this.hilightAxis(-1)
        }
        if (this.masterUndoRecord)
        {
            for (var i = 0; i < _Editor.getSelectionCount(); i++)
            {
                var undo = new _UndoManager.SetPropertyEvent(_Editor.GetSelectedVWFID(i), 'transform', Engine.getProperty(_Editor.GetSelectedVWFID(i), 'transform'));
                undo.oldval = this.mouseDownRawTransforms[_Editor.GetSelectedVWFID(i)];
                this.masterUndoRecord.push(undo);
            }
            _UndoManager.pushEvent(this.masterUndoRecord);
            this.masterUndoRecord = null;
        }
        for (var i = 0; i < _Editor.getSelectionCount(); i++)
        {
            _dView.setViewTransformOverride(_Editor.GetSelectedVWFID(i), null);
        }
    }
    this.mouseDown = function(e)
    {
        var axis = -1;
        for (var i = 0; i < this.getGizmoBody().children.length; i++)
        {
            if (Engine.views[0].lastPick)
                if (Engine.views[0].lastPick.object)
                    if (Engine.views[0].lastPick.object == this.getGizmoBody().children[i]) axis = this.allChildren.indexOf(this.getGizmoBody().children[i]);
        }
        if (axis !== -1)
        {
            this.masterUndoRecord = new _UndoManager.CompoundEvent();
            this.mouseDownCoordSystem = this.coordSystem.clone();
            this.mouseDownTransforms = {};
            this.mouseDownRawTransforms = {};
            this.mouseDownWorldTransforms = {};
            this.mouseDownGizScale = MATH.lengthVec3([this.getGizmoBody().matrix.elements[0], this.getGizmoBody().matrix.elements[1], this.getGizmoBody().matrix.elements[2]])
            for (var i = 0; i < _Editor.getSelectionCount(); i++)
            {
                var ID = _Editor.GetSelectedVWFID(i);
                var transform = _Editor.getWorldTransformCallback(ID)
                var translation = [transform[12], transform[13], transform[14]]
                this.mouseDownOffsets[ID] = MATH.subVec3(this.getPosition(), translation)
                this.mouseDownTransforms[ID] = _Editor.getTransformCallback(ID)
                this.mouseDownRawTransforms[ID] = Engine.getProperty(ID, 'transform');
                this.mouseDownWorldTransforms[ID] = Engine.getProperty(ID, 'worldTransform');
                this.mouseDownWorldTransforms[findviewnode(ID).parent.uuid] = matCpy(findviewnode(ID).parent.matrixWorld.elements)
            }
            var worldRay = _Editor.GetWorldPickRay(e);
            this.mouseDownOrigin = this.getPosition();
            this.mouseDownIntersects = this.intersectPlanes(worldRay, _Editor.GetWorldPickOrigin(e));
            this.mouseDownIntersects.xy = MATH.subVec3(this.mouseDownIntersects.xy, this.getPosition())
            this.mouseDownIntersects.yz = MATH.subVec3(this.mouseDownIntersects.yz, this.getPosition())
            this.mouseDownIntersects.zx = MATH.subVec3(this.mouseDownIntersects.zx, this.getPosition())
        }
        this.axisSelected = axis;
        this.hilightAxis(axis);
    }
    this.mouseOverAxis = function()
    {
        var axis = -1;
        for (var i = 0; i < this.getGizmoBody().children.length; i++)
        {
            if (Engine.views[0].lastPick && Engine.views[0].lastPick.object && Engine.views[0].lastPick.object == this.getGizmoBody().children[i]) axis = i;
        }
        for (var i = 0; i < this.getGizmoBody().children.length; i++)
        {
            if (i != document.AxisSelected)
                if (this.getGizmoBody().children[i].material)
                {
                    var c = this.getGizmoBody().children[i].material.originalColor;
                    this.getGizmoBody().children[i].material.color.setRGB(c.r, c.g, c.b);
                    this.getGizmoBody().children[i].material.emissive.setRGB(c.r, c.g, c.b);
                }
        }
        if (axis >= 0)
            if (this.getGizmoBody().children[axis].material)
            {
                this.getGizmoBody().children[axis].material.color.setRGB(1, 1, 1);
                this.getGizmoBody().children[axis].material.emissive.setRGB(1, 1, 1);
            }
    }
    this.setPlane = function(plane) {}
    this.getPosition = function()
    {
        return [this.getGizmoHead().matrixWorld.elements[12], this.getGizmoHead().matrixWorld.elements[13], this.getGizmoHead().matrixWorld.elements[14]]
    }
    this.getPlaneNormals = function()
    {
        var coordSystem = this.coordSystem;
        var z = [coordSystem.elements[8], coordSystem.elements[9], coordSystem.elements[10]]
        var y = [coordSystem.elements[4], coordSystem.elements[5], coordSystem.elements[6]]
        var x = [coordSystem.elements[0], coordSystem.elements[1], coordSystem.elements[2]]
        var cam = _Editor.findcamera().matrixWorld.elements;
        var e = [cam[8], cam[9], cam[10]];
        return {
            xy: z,
            yz: x,
            zx: y,
            e: e
        }
    }
    this.intersectPlanes = function(worldRay, campos)
    {
        var planeNormals = this.getPlaneNormals();
        var origin = this.getPosition();
        var xy = _Editor.intersectLinePlane(worldRay, campos, this.mouseDownOrigin, planeNormals.xy);
        var zx = _Editor.intersectLinePlane(worldRay, campos, this.mouseDownOrigin, planeNormals.zx);
        var yz = _Editor.intersectLinePlane(worldRay, campos, this.mouseDownOrigin, planeNormals.yz);
        var e = _Editor.intersectLinePlane(worldRay, campos, MATH.addVec3(campos, planeNormals.e), planeNormals.e);
        return {
            xy: MATH.addVec3(MATH.scaleVec3(worldRay, xy), campos),
            yz: MATH.addVec3(MATH.scaleVec3(worldRay, yz), campos),
            zx: MATH.addVec3(MATH.scaleVec3(worldRay, zx), campos),
            e: MATH.addVec3(MATH.scaleVec3(worldRay, e), campos)
        }
    }
    this.subIntersects = function(i1, i2)
    {
        return {
            xy: MATH.subVec3(i1.xy, i2.xy),
            yz: MATH.subVec3(i1.yz, i2.yz),
            zx: MATH.subVec3(i1.zx, i2.zx),
            e: MATH.subVec3(i1.e, i2.e),
        }
    }
    this.bestPlane = function(axis, eyepos)
    {
        if (axis == 'xy') return 'xy';
        if (axis == 'zx') return 'zx';
        if (axis == 'yz') return 'yz';
        if (axis == 'e') return 'e';
        var tempMatrix = new THREE.Matrix4();
        var eye = new THREE.Vector3(eyepos[0], eyepos[1], eyepos[2])
        eye.applyMatrix4(tempMatrix.getInverse(tempMatrix.extractRotation(this.coordSystem)));
        if (axis == "x")
        {
            if (Math.abs(eye.y) > Math.abs(eye.z)) return 'zx'
            else return 'xy'
        }
        if (axis == "y")
        {
            if (Math.abs(eye.x) > Math.abs(eye.z)) return 'yz'
            else return 'xy'
        }
        if (axis == "z")
        {
            if (Math.abs(eye.x) > Math.abs(eye.y)) return 'yz'
            else return 'zx'
        }
    }
    this.applyMove = function(wtmat, offset, mouseDownOffset, ID)
    {
        var worldTranslation = [wtmat.elements[12], wtmat.elements[13], wtmat.elements[14]]
        var thisOff = MATH.subVec3(offset, mouseDownOffset);
        thisOff = MATH.subVec3(thisOff, worldTranslation)
        thisOff = this.maskOffset(this.axisToPlane(this.axisSelected), thisOff);
        _Editor.snapPosition(thisOff);
        var snapped = [worldTranslation[0] + thisOff[0], worldTranslation[1] + thisOff[1], worldTranslation[2] + thisOff[2]]
    
        var finalpos = new THREE.Vector3(snapped[0], snapped[1], snapped[2]);
        if (finalpos.length() < .0001) return false;
        wtmat.setPosition(finalpos);
        return true;
    }
    this.applyScale = function(wtmat, offset, mouseDownOffset, ID, deltas)
    {
        var worldTranslation = [wtmat.elements[12], wtmat.elements[13], wtmat.elements[14]]
        var thisOff = MATH.subVec3(offset, mouseDownOffset);
        thisOff = MATH.subVec3(thisOff, this.getPosition())
        var amt = 1 - (deltas.e[2] * 5);
        var scale = new THREE.Matrix4();
        scale.makeScale(amt, amt, amt);
        var mouseDownTransform = new THREE.Matrix4();
        mouseDownTransform.elements.set(this.mouseDownWorldTransforms[ID])
        var x = mouseDownTransform.elements[12];
        var y = mouseDownTransform.elements[13];
        var z = mouseDownTransform.elements[14];
        mouseDownTransform.elements[12] = 0;
        mouseDownTransform.elements[13] = 0;
        mouseDownTransform.elements[14] = 0;
        wtmat.multiplyMatrices(scale, mouseDownTransform);
        var worldOffset = MATH.subVec3([x, y, z], this.mouseDownOrigin);
        var tmd = new THREE.Vector3(worldOffset[0], worldOffset[1], worldOffset[2]);
        if (this.transformOffsets)
            tmd.applyMatrix4(scale);
        wtmat.elements[12] = this.mouseDownOrigin[0] + tmd.x;
        wtmat.elements[13] = this.mouseDownOrigin[1] + tmd.y;
        wtmat.elements[14] = this.mouseDownOrigin[2] + tmd.z;
        return true;
    }
    this.applyRotate = function(wtmat, offset, mouseDownOffset, ID, deltas)
    {
        var worldTranslation = [wtmat.elements[12], wtmat.elements[13], wtmat.elements[14]]
        var thisOff = MATH.subVec3(offset, mouseDownOffset);
        thisOff = MATH.subVec3(thisOff, this.getPosition())
        var rot = new THREE.Matrix4();
        var axis;
        var mat = this.coordSystem.elements;
        if (this.axisToPlane(this.axisSelected) == 'xy')
            axis = (new THREE.Vector3(0, 0, 1)).applyMatrix4(this.mouseDownCoordSystem);
        if (this.axisToPlane(this.axisSelected) == 'yz')
            axis = (new THREE.Vector3(1, 0, 0)).applyMatrix4(this.mouseDownCoordSystem);
        if (this.axisToPlane(this.axisSelected) == 'zx')
            axis = (new THREE.Vector3(0, 1, 0)).applyMatrix4(this.mouseDownCoordSystem);
        var plane = [this.bestPlane(this.axisToPlane(this.axisSelected), _Editor.getCameraPosition())];
        var intersect = this.mouseDownIntersects[plane];
        var c1 = MATH.toUnitVec3(intersect);
        var c2 = [axis.x, axis.y, axis.z]
        var c3 = MATH.crossVec3(c1, c2);
        var tanMat = [c1[0], c1[1], c1[2], 0,
            c2[0], c2[1], c2[2], 0,
            c3[0], c3[1], c3[2], 0,
            0, 0, 0, 1
        ];
        var tan = MATH.mulMat4Vec3(tanMat, MATH.subVec3(offset, this.mouseDownOrigin));
        rot.makeRotationAxis(axis, -tan[2] / (this.mouseDownGizScale * 10));
        var mouseDownTransform = new THREE.Matrix4();
        mouseDownTransform.elements.set(this.mouseDownWorldTransforms[ID])
        var x = mouseDownTransform.elements[12];
        var y = mouseDownTransform.elements[13];
        var z = mouseDownTransform.elements[14];
        mouseDownTransform.elements[12] = 0;
        mouseDownTransform.elements[13] = 0;
        mouseDownTransform.elements[14] = 0;
        wtmat.multiplyMatrices(rot, mouseDownTransform);
        var worldOffset = MATH.subVec3([x, y, z], this.mouseDownOrigin);
        var tmd = new THREE.Vector3(worldOffset[0], worldOffset[1], worldOffset[2]);
        if (this.transformOffsets)
            tmd.applyMatrix4(rot);
        wtmat.elements[12] = this.mouseDownOrigin[0] + tmd.x;
        wtmat.elements[13] = this.mouseDownOrigin[1] + tmd.y;
        wtmat.elements[14] = this.mouseDownOrigin[2] + tmd.z;
        return true;
    }
    this.applyTransform = function(offset, deltas)
    {

        for (var i = 0; i < _Editor.getSelectionCount(); i++)
        {
            var ID = _Editor.GetSelectedVWFID(i)
            var mouseDownOffset = this.mouseDownOffsets[ID];
            var t = _Editor.getTransformCallback(ID);
            var pt = this.mouseDownWorldTransforms[findviewnode(ID).parent.uuid];
            var wt = this.mouseDownWorldTransforms[ID]
            var tmat = new THREE.Matrix4();
            tmat.elements.set(t);
            var ptmat = new THREE.Matrix4();
            ptmat.elements.set(pt);
            var ptmatInv = new THREE.Matrix4();
            ptmatInv.getInverse(ptmat);
            var wtmat = new THREE.Matrix4();
            wtmat.elements.set(wt);
            var changed = false;
            
            if (this.axisToTransformType(this.axisSelected) == 'move')
                changed = this.applyMove(wtmat, offset, mouseDownOffset, ID);
            if (this.axisToTransformType(this.axisSelected) == 'rotate')
                changed = this.applyRotate(wtmat, offset, mouseDownOffset, ID, deltas);
            if (this.axisToTransformType(this.axisSelected) == 'scale')
                changed = this.applyScale(wtmat, offset, mouseDownOffset, ID, deltas);
            if (changed)
            {
                var newLocalmat = new THREE.Matrix4();
                newLocalmat.multiplyMatrices(ptmatInv, wtmat);
                var newt = newLocalmat.elements;
                //really need to swap this from float32array to js array
                var newta = [];
                for(var j =0; j<16; j++)
                    newta[j] = newt[j];

                if (TESTING)
                    Engine.setProperty(_Editor.GetSelectedVWFID(i), 'transform', newt);
                else
                    var ok = _Editor.setTransformCallback(_Editor.GetSelectedVWFID(i), newta);
               // _dView.setViewTransformOverride(_Editor.GetSelectedVWFID(i), newt);
            }
        }
    }
    this.maskOffset = function(axis, offset)
    {
        var coordSystemInv = new THREE.Matrix4();
        coordSystemInv.getInverse(this.coordSystem);
        var tv = new THREE.Vector3();
        tv.x = offset[0];
        tv.y = offset[1];
        tv.z = offset[2];
        tv.applyMatrix4(coordSystemInv);
        offset = [tv.x, tv.y, tv.z];
        if (axis == 'xy')
        {
            offset[2] = 0;
        }
        if (axis == 'yz')
        {
            offset[0] = 0;
        }
        if (axis == 'zx')
        {
            offset[1] = 0;
        }
        if (axis == 'x')
        {
            offset[1] = 0;
            offset[2] = 0;
        }
        if (axis == 'y')
        {
            offset[0] = 0;
            offset[2] = 0;
        }
        if (axis == 'z')
        {
            offset[0] = 0;
            offset[1] = 0;
        }
        tv.x = offset[0];
        tv.y = offset[1];
        tv.z = offset[2];
        tv.applyMatrix4(this.coordSystem);
        offset = [tv.x, tv.y, tv.z];
        return offset;
    }
    this.mouseMoved = function(e)
    {
        if (this.axisSelected == -1)
        {
            this.mouseOverAxis();
            return;
        }
        var worldRay = _Editor.GetWorldPickRay(e);
        var intersections = this.intersectPlanes(worldRay, _Editor.GetWorldPickOrigin(e));
        var deltas = this.subIntersects(intersections, this.mouseDownIntersects);
        var offset = deltas[this.bestPlane(this.axisToPlane(this.axisSelected), _Editor.GetWorldPickOrigin(e))]
        this.applyTransform(offset, deltas);
    }
    this.axisToPlane = function(axis)
    {
        if (this.axisSelected == 0)
            return 'x'
        if (this.axisSelected == 1)
            return 'y'
        if (this.axisSelected == 2)
            return 'z'
        if (this.axisSelected == 12)
            return 'xy'
        if (this.axisSelected == 13)
            return 'zx'
        if (this.axisSelected == 14)
            return 'yz'
        if (this.axisSelected == 16)
            return 'yz'
        if (this.axisSelected == 17)
            return 'zx'
        if (this.axisSelected == 18)
            return 'xy'
        if (this.axisSelected == 19)
            return 'e'
        if (this.axisSelected == 5)
            return 'xy'
        if (this.axisSelected == 4)
            return 'zx'
        if (this.axisSelected == 3)
            return 'yz'
    }
    this.axisToTransformType = function(axis)
    {
        if (this.axisSelected == 0)
            return 'move'
        if (this.axisSelected == 1)
            return 'move'
        if (this.axisSelected == 2)
            return 'move'
        if (this.axisSelected == 12)
            return 'move'
        if (this.axisSelected == 13)
            return 'move'
        if (this.axisSelected == 14)
            return 'move'
        if (this.axisSelected == 16)
            return 'rotate'
        if (this.axisSelected == 17)
            return 'rotate'
        if (this.axisSelected == 18)
            return 'rotate'
        if (this.axisSelected == 19)
            return 'scale'
        if (this.axisSelected == 3)
            return 'rotate'
        if (this.axisSelected == 4)
            return 'rotate'
        if (this.axisSelected == 5)
            return 'rotate'
    }
    this.getAxis = function()
    {
        return this.axisSelected;
    }
    this.setAxis = function(axis)
    {
        this.axisSelected = axis;
    }
    this.setApplyOffset = function(o)
    {
        this.transformOffsets = o;
        var _angularapp = require("vwf/view/editorview/angular-app");
        _angularapp.root.fields.useObjectCenters = o;
    }
}
define([], function()
{
    return transformTool;
});