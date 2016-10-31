var isInitialized = false;

function download(filename, text)
{
	var a = window.document.createElement('a');
	a.href = window.URL.createObjectURL(new Blob([text],
	{
		type: 'application/json'
	}));
	a.download = filename;
	// Append anchor to body.
	document.body.appendChild(a)
	a.click();
	// Remove anchor from body
	document.body.removeChild(a)
}
define(["./lib/ace/ace.js"],
	function()
	{
		var self = null;
		return {
			initialize: function()
			{
				self = this;
				if (isInitialized) return;
				isInitialized = true;
				$(document.body).append("<div id='JSONPrompt' style='overflow:hidden'><div id='JSONViewButtonBar'></div><div id='JSONPromptView' style='width: 100%;height: calc(100% - 2.5em);margin: -5px -5px 5px -10px;'/></div>");
				$('#JSONViewButtonBar').append('<div id="JSONViewButtonBarSave">Save</div><div id="JSONViewButtonBarOk">Ok</div><div id="JSONViewButtonBarCancel">Cancel</div><div id="JSONViewButtonBarLoad" style="width: 8em;position: relative;"><div style="position: relative;display: inline;/* left: -5em; */width: 5em;">Load</div><input id="JSONLoadInput" type="file"></div>');

				function handleFileSelect(evt)
				{
					var files = evt.target.files; // FileList object
					// Loop through the FileList and render image files as thumbnails.
					for (var i = 0, f; f = files[i]; i++)
					{
						var reader = new FileReader();
						// Closure to capture the file information.
						reader.onload = (function(theFile)
						{
							return function(e)
							{
								var text = e.target.result;
								self.itemViewer.setValue(js_beautify(text));
							};
						})(f);
						// Read in the image file as a data URL.
						reader.readAsText(f);
					}
				}
				$('#JSONLoadInput')[0].addEventListener('change', handleFileSelect, false);
				$('#JSONViewButtonBarCancel').bind('click', function()
					{
						self.hide();
					})
					$('#JSONViewButtonBarSave').bind('click', function()
					{
						download('Object.json', self.itemViewer.getValue());
					});
				this.prompt = function(item, ok)
				{
					$('#JSONViewButtonBarOk').unbind('click')
					$('#JSONViewButtonBarOk').bind('click', function()
					{
						if (ok)
							ok(self.itemViewer.getValue());
						self.hide();
					})
					
					$('#JSONPrompt').dialog('open');
					if (item instanceof Object && item.construtor !== String)
					{
						var text = JSON.stringify(item);
						this.itemViewer.setValue(js_beautify(text));
						this.itemViewer.selection.clearSelection();
						this.itemViewer.getSession().setMode("ace/mode/json");
					}
					if (item.construtor == String)
					{
						this.itemViewer.setValue(item);
						this.itemViewer.selection.clearSelection();
						this.itemViewer.getSession().setMode("ace/mode/javascript");
					}
				}.bind(this);
				this.hide = function()
				{
					$('#JSONPrompt').dialog('close');
				}
				$('#JSONPrompt').dialog(
				{
					title: 'JSON Viewer',
					modal: true,
					autoOpen: false,
					width: 600,
					height: 600,
					resizable: true,
					resize: function()
					{
						self.itemViewer.resize();
					}
				});
				this.itemViewer = ace.edit("JSONPromptView");
				this.itemViewer.setTheme("ace/theme/monokai");
				this.itemViewer.getSession().setMode("ace/mode/json");
				this.itemViewer.setPrintMarginColumn(false);
				this.itemViewer.setFontSize('15px');
			}
		}
	});