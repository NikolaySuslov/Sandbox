(function()
{
	//draw a 2D quad, let the user place text on it.
	function toRGBA(array)
	{
		return "rgba(" + parseInt(array[0] * 255) + "," + parseInt(array[1] * 255) + "," + parseInt(array[2] * 255) + "," + parseInt(array[3] * 255) + ")";
	}

	function text2D(childID, childSource, childName)
	{
		this._length = 1;
		this.width = 1;
		this.outputType = "Primitive";
		this.inputType = null;
		this.___ready = false;
		this.mesh = null;
		this.mat = null;
		this.text = "hey";
		this.resolutionX = 100;
		this.resolutionY = 100;
		this.forecolor = [1, 1, 1, 1];
		this.backcolor = [0, 0, 0, 1];
		this.startX = 10;
		this.startY = 50;
		this.font = "Arial";
		this.fontSize = 40;
		this.bold = true;
		this.justified = "left";
		this.italic = false;
		this.fontURL = null;
		this.lineSpacing = 0;
		this.inherits = ['vwf/model/threejs/transformable.js', 'vwf/model/threejs/visible.js'];
		this.transparent = true;
		//the node constructor
		this.settingProperty = function(propertyName, propertyValue)
		{
			if (propertyName == '_length' || propertyName == 'width')
			{
				this[propertyName] = propertyValue;
				this.build();
			}
			else if (propertyName == 'resolutionX' || propertyName == 'resolutionY')
			{
				this.destroyMat();
				this.build();
			}
			else if (propertyName == "transparent")
			{
				this[propertyName] = propertyValue;
				this.destroyMat();
				this.build();
			}
			else if (propertyName == "fontURL")
			{
				this[propertyName] = propertyValue;
				this.loadFont();
			}
			else if (propertyName == "text")
			{
				this.text = propertyValue.toString();
				if (this.___ready && this.mesh)
					this.updateCanvas();
				else
					this.build();
			}
			else if (
				(propertyName == "forecolor") ||
				(propertyName == "backcolor") ||
				(propertyName == "startX") ||
				(propertyName == "startY") ||
				(propertyName == "fontSize") ||
				(propertyName == "bold") ||
				(propertyName == "italic") ||
				(propertyName == "lineSpacing") ||
				(propertyName == "font") ||
				(propertyName == "justified")
			)
			{
				this[propertyName] = propertyValue;
				if (this.___ready && this.mesh)
					this.updateCanvas();
				else
					this.build();
			}
		}
		this.initializingNode = function()
		{
			this.___ready = true;
			this.build();
		}
		this.gettingProperty = function(propertyName)
		{
			if (propertyName == '_length' || propertyName == 'width' || propertyName == 'EditorData' || propertyName == 'text')
				return this[propertyName];
		}
		this.destroyMat = function()
		{
			this.mat = null;
		}
		this.buildFontStyle = function()
		{
			var fontface = this.font;
			if (!!this.fontURL)
			{
				fontface = this.ID;
			}
			var style = "" + this.fontSize + "px " + "\"" + fontface + "\" ";
			if (this.bold)
			{
				style = "bold " + style;
			}
			if (this.italic)
			{
				style = "italic " + style;
			}
			return style;
		}
		this.updateCanvas = function()
		{
			var context1 = this.canvas1.getContext('2d');
			context1.clearRect(0, 0, this.resolutionX, this.resolutionY);
			context1.fillStyle = toRGBA(this.backcolor);
			context1.fillRect(0, 0, this.resolutionX, this.resolutionY);
			context1.font = this.buildFontStyle();
			context1.fillStyle = toRGBA(this.forecolor);
			var lines = this.text.split("\\n");
			var start = this.startY / 100 * this.resolutionY;
			for (var i = 0; i < lines.length; i++)
			{
				var startX = this.startX / 100 * this.resolutionX;
				var textWidth = context1.measureText(lines[i]).width;
				if(this.justified == "right")
				{
					startX = this.resolutionX - startX - textWidth;
				}
				if(this.justified == "center")
				{
					startX = this.resolutionX/2 - textWidth/2 + startX;
				}

				context1.fillText(lines[i], startX , start + (i * this.fontSize) + (i * this.lineSpacing));
			}
			this.mat.map.needsUpdate = true;
		}
		this.loadFont = function()
		{
			if (this.style)
				$(this.style).remove();
			if (!!this.fontURL)
			{
				var str =
					'<style type="text/css" media="screen, print">' +
					'	@font-face {' +
					'		font-family: "{{ID}}";' +
					'		src: url("{{URL}}");' +
					'	}' +
					'</style>';
				str = str.replace("{{ID}}", this.ID).replace("{{URL}}", this.fontURL);
				this.style = $(str).appendTo($(document.head));
				
				
			}
			var self = this;
			window.setTimeout(function()
				{
					self.updateCanvas()
				}, 2000)
		}
		this.buildMat = function()
		{
			this.canvas1 = document.createElement('canvas');
			this.canvas1.width = this.resolutionX;
			this.canvas1.height = this.resolutionY;
			// canvas contents will be used for a texture
			var texture1 = new THREE.Texture(this.canvas1)
			texture1.needsUpdate = true;
			var material1 = new THREE.MeshBasicMaterial(
			{
				map: texture1,
				side: THREE.DoubleSide
			});
			this.mat = material1;
			this.mat.transparent = this.transparent;
			this.updateCanvas();
		}
		this.build = debounce(function()
		{
			if (!this.___ready) return;
			if (!this.mat)
			{
				this.buildMat();
			}
			if (this.mesh)
			{
				if (this.mesh.parent)
					this.mesh.parent.remove(this.mesh);
				this.mesh.geometry.dispose();
			}
			this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(this._length, this.width, 1, 1), this.mat);
			this.rootnode.add(this.mesh);
		}, 200);
		//must be defined by the object
		this.getRoot = function()
		{
			return this.rootnode;
		}
		this.rootnode = new THREE.Object3D();
		//this.Build();
	}
	//default factory code
	return function(childID, childSource, childName)
	{
		//name of the node constructor
		return new text2D(childID, childSource, childName);
	}
})();
//@ sourceURL=threejs.subdriver.text2d