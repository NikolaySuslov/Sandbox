define([],
    function() {
        function panelEditor(obj, name, title, icon, requiresSelection, buildOnSelect, parentSelector) {
            obj.name = name;
            obj.title = title;
            obj.icon = icon;
            obj.requiresSelection = requiresSelection;
            obj.buildOnSelect = buildOnSelect;
            obj.rootID = 'editorPanel' + name;
            obj.titleID = obj.rootID + 'title';
            obj.contentID = obj.rootID + 'content';
            obj.parentSelector = parentSelector;
            obj.iconID = obj.titleID + 'icon'
            obj.titleTextID = obj.titleID + 'text'
            obj.open = false;
            obj.init = function() {
                $(this.parentSelector).append("<div id='" + this.rootID + "''></div");
                $('#' + this.rootID).attr('style', 'border-radius: 10px;width: 100%;margin: 0px;padding: 0px;height: auto;')
                //$('#' + this.rootID).attr('class', 'sidetab-editor-title ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix')
                $('#' + this.rootID).append("<div id='" + this.titleID + "''></div");
                $('#' + this.titleID).append("<div id='" + this.iconID + "''></div");
                $('#' + this.titleID).attr('style', 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;')
                $('#' + this.titleID).addClass('sidetab-editor-title ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix')
                $('#' + this.titleID).append("<span id='" + this.titleTextID + "''></span");
                $('#' + this.titleTextID).text(this.title);
                $('#' + this.titleTextID).addClass('ui-dialog-title');
                $('#' + this.iconID).addClass('headericon');
                $('#' + this.iconID).addClass(this.icon);
                $('#' + this.rootID).append("<div id='" + this.contentID + "''></div");
                $('#' + this.contentID).attr('style', '  color: white;background: url(vwf/view/editorview/css//images/ui-bg_hexagon_5_111111_12x10.png) 50% 50% repeat rgb(36, 32, 32);');
                var self = this;
                $('#' + this.titleID).click(function() {
                    if (self.isOpen())
                        self.hide()
                    else
                        self.show();
                })
                this.show = function() {
                    $('#' + this.titleID).addClass('sidetab-editor-title-active')
                    _SidePanel.showPanel();
                    $('#' + this.contentID).hide();
                    if (!this.isDisabled() && this.BuildGUI)
                        this.BuildGUI();
                  
                    $('#' + this.contentID).show('blind', function() {
                        if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
                    });
                    this.open = true;
                }
                this.hide = function() {
                    //$('#PhysicsEditor').dialog('close');
                    if (this.isOpen()) {
                        $('#' + this.contentID).hide('blind', function() {
                            if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
                            //if (!$('#sidepanel').children('.jspContainer').children('.jspPane').children().is(':visible')) _SidePanel.hidePanel();
                            $('#' + this.titleID).removeClass('sidetab-editor-title-active')
                        });
                        if(this.onHide)
                        	this.onHide()
                    }
                    this.open = false;
                }
                this.disable = function() {
                    if (this.isDisabled()) return;
                    $('#' + this.contentID).addClass('editorPanelDisable');
                    $('#' + this.contentID).find('*').addClass('editorPanelDisable');
                    if(this.onHide)
                        this.onHide()
                }
                this.isDisabled = function() {
                    return $('#' + this.contentID).hasClass('editorPanelDisable');
                }
                this.enable = function() {
                    if (!this.isDisabled()) return;
                    $('#' + this.contentID).removeClass('editorPanelDisable');
                    $('#' + this.contentID).find('*').removeClass('editorPanelDisable');
                }
                this.isOpen = function() {
                    //$("#PhysicsEditor").dialog( "isOpen" )
                    //return $('#' + this.contentID).is(':visible');
                    return this.open;
                }
                this.SelectionChanged = function(e, node) {
                    if (this.requiresSelection) {
                        try {
                        	if(node)
                            	this.selectedID = node.id;
                            if (this.isOpen()) {
                                if (node) {
                                    this.enable();
                                    if (this.BuildGUI)
                                        this.BuildGUI();
                                } else {
                                    this.selectedID = null;
                                    this.disable();
                                }
                            } else {
                                if (!node)
                                    this.disable();
                                else
                                    this.enable();
                            }
                        } catch (e) {
                            console.log(e);
                        }
                    } else if (this.buildOnSelect) {
                        if (this.isOpen() && this.BuildGUI)
                            this.BuildGUI();
                    }

                }
                this.bind = function() {
                    $(document).bind('selectionChanged', this.SelectionChanged.bind(this));
                };
                $('#' + this.contentID).hide(); //start hidden
            }
        }
        return panelEditor;
    })
