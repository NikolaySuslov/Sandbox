define([],
	function()
	{
		function panelEditor(name,title,icon,requiresSelection,parentSelector)
		{
			this.name = name;
			this.title = title;
			this.icon = icon;
			this.requiresSelection = requiresSelection;

			this.rootID = 'editorPanel' + name; 
			this.titleID = this.rootID + 'title';
			this.contentID = this.rootID + 'content';
			this.parentSelector = parentSelector;
			this.iconID = this.titleID + 'icon'
			this.titleTextID = this.titleID + 'text'
		}
		panelEditor.prototype.init = function()
		{
			$(this.parentSelector).append("<div id='"+this.rootID+"''></div");
			$('#'+this.rootID).attr('style','border-radius: 10px;width: 100%;margin: 0px;padding: 0px;border-bottom-width: 5px;border-bottom-style: solid;border-bottom-color: rgb(68, 68, 68);border-left-width: 2px;border-left-style: solid;border-left-color: rgb(68, 68, 68);height: auto;')
			$('#'+this.rootID).attr('class','sidetab-editor-title ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix')
			$('#'+this.rootID).append("<div id='"+this.titleID+"''></div");
			$('#'+this.titleID).append("<div id='"+this.iconID+"''></div");

			$('#'+this.titleID).attr('style','padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;')
			$('#'+this.titleID).addClass('sidetab-editor-title ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix')

			$('#'+this.titleID).append("<span id='"+this.titleTextID+"''></span");
			$('#'+this.titleTextID).text(this.title);
			$('#'+this.titleTextID).addClass('ui-dialog-title');
			$('#'+this.iconID).addClass('headericon');
			$('#'+this.iconID).addClass(this.icon);


			$('#'+this.rootID).append("<div id='"+this.contentID+"''></div");
		}
		return panelEditor;
	
})