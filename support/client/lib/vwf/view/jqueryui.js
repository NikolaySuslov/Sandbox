/*
 * WebRTC.js : Behaves as a wrapper for vwf/view/rtcObject
 * Maps simple 1:1 signal model to a broadcast model using target and sender ids
 */
define(["module", "vwf/view"], function(module, view)
{
    //the driver
    return view.load(module,
    {
        initialize: function()
        {
            this.guiNodes = {};
            this.activeCamera = '';
            window._GUIView = this;
            var self = this;
            $(document).on('setstatecomplete', function()
            {
                var camera = _dView.cameraID;
                self.activeCamera = camera;
                self.updateVisibility();
            })
        },
        createDialog: function(title)
        {
            var parent = this.getCreateParentNode();
            vwf_view.kernel.createChild(parent, GUID(),
            {
                extends: "http://vwf.example.com/dialog.vwf",
                properties:
                {
                    title: title,
                    transform: this.getScreenCenter(),
                    owner: _UserManager.GetCurrentUserName(),
                    DisplayName: _Editor.GetUniqueName('Dialog'),
                    visible: true
                }
            });
        },
        createSlider: function(title)
        {
            var parent = this.getCreateParentNode();
            vwf_view.kernel.createChild(parent, GUID(),
            {
                extends: "http://vwf.example.com/slider.vwf",
                properties:
                {
                    value: 0,
                    min: 0,
                    max: 100,
                    step: 1,
                    left: 0,
                    top: 0,
                    width: 100,
                    orientation: "horizontal",
                    transform: this.getScreenCenter(),
                    owner: _UserManager.GetCurrentUserName(),
                    DisplayName: _Editor.GetUniqueName('Slider'),
                    visible: true
                }
            });
        },
        createButton: function(title)
        {
            var parent = this.getCreateParentNode();
            vwf_view.kernel.createChild(parent, GUID(),
            {
                extends: "http://vwf.example.com/button.vwf",
                properties:
                {
                    width: 100,
                    height: 100,
                    text: "Button",
                    left: 0,
                    top: 0,
                    transform: this.getScreenCenter(),
                    owner: _UserManager.GetCurrentUserName(),
                    DisplayName: _Editor.GetUniqueName('Button'),
                    visible: true
                }
            });
        },
        createLabel: function(title)
        {
            var parent = this.getCreateParentNode();
            vwf_view.kernel.createChild(parent, GUID(),
            {
                extends: "http://vwf.example.com/label.vwf",
                properties:
                {
                    width: 100,
                    height: 100,
                    text: "Label",
                    left: 0,
                    top: 0,
                    transform: this.getScreenCenter(),
                    owner: _UserManager.GetCurrentUserName(),
                    DisplayName: _Editor.GetUniqueName('Label'),
                    visible: true,
                    font_color: [0,0,0]
                }
            });
        },
        createPanel: function(title)
        {
            var parent = this.getCreateParentNode();
            vwf_view.kernel.createChild(parent, GUID(),
            {
                extends: "http://vwf.example.com/panel.vwf",
                properties:
                {
                    width: 100,
                    height: 100,
                    left: 0,
                    top: 0,
                    background_color: [1, 0, 0],
                    background_visible: true,
                    border_color: [1, 1, 1],
                    transform: this.getScreenCenter(),
                    owner: _UserManager.GetCurrentUserName(),
                    DisplayName: _Editor.GetUniqueName('Panel'),
                    visible: true
                }
            });
        },
        createImage: function(title)
        {
            var parent = this.getCreateParentNode();
            vwf_view.kernel.createChild(parent, GUID(),
            {
                extends: "http://vwf.example.com/image.vwf",
                properties:
                {
                    width: 100,
                    height: 100,
                    left: 0,
                    top: 0,
                    transform: this.getScreenCenter(),
                    owner: _UserManager.GetCurrentUserName(),
                    DisplayName: _Editor.GetUniqueName('Image'),
                    visible: true
                }
            });
        },
        createCheckbox: function(title)
        {
            var parent = this.getCreateParentNode();
            vwf_view.kernel.createChild(parent, GUID(),
            {
                extends: "http://vwf.example.com/checkbox.vwf",
                properties:
                {
                    width: 100,
                    height: 100,
                    left: 0,
                    top: 0,
                    transform: this.getScreenCenter(),
                    owner: _UserManager.GetCurrentUserName(),
                    DisplayName: _Editor.GetUniqueName('Checkbox'),
                    visible: true
                }
            });
        },
        createHtml: function()
        {
            alertify.prompt('Input a URL to the document. Please note: this must serve from a CORS capable host!', function(ok, val) {
                if(ok){
                    var parent = this.getCreateParentNode();
                    vwf_view.kernel.createChild(parent, GUID(),
                    {
                        extends: "http://vwf.example.com/html.vwf",
                        source: val,
                        properties: {
                            width: 100,
                            height: 100,
                            background_color: [1, 0, 0],
                            background_visible: true,
                            border_color: [1, 1, 1],
                            transform: this.getScreenCenter(),
                            owner: _UserManager.GetCurrentUserName(),
                            DisplayName: _Editor.GetUniqueName('Html'),
                            visible: true
                        }
                    });
                }
            }.bind(this), 'http://');
        },
        getScreenCenter: function()
        {
            if (this.isGUINode(Engine.prototype(this.getCreateParentNode())))
                return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
            return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 50, 50, 0, 1]; //when creating on a 3D asset, default to center of screen
        },
        //when creating a gui node - if the parent is a 3D object, create normally. if it's a guinode, and that guiNode is not a panel or a dialog, create as child of world
        getCreateParentNode: function()
        {
            var parent = _Editor.GetSelectedVWFID();
            if (this.isGUINode(parent) && !(this.isPanel(parent) || this.isDialog(parent)))
                parent = "index-vwf";
            return parent || "index-vwf";
        },
        isGUINode: function(childExtendsID)
        {
            if (!childExtendsID) return false;
            if (childExtendsID == 'http-vwf-example-com-uielement-vwf') return true;
            return this.isGUINode(Engine.prototype(childExtendsID));
        },
        isDialog: function(childExtendsID)
        {
            if (!childExtendsID) return false;
            if (childExtendsID == 'http-vwf-example-com-dialog-vwf') return true;
            return this.isDialog(Engine.prototype(childExtendsID));
        },
        isSlider: function(childExtendsID)
        {
            if (!childExtendsID) return false;
            if (childExtendsID == 'http-vwf-example-com-slider-vwf') return true;
            return this.isSlider(Engine.prototype(childExtendsID));
        },
        isButton: function(childExtendsID)
        {
            if (!childExtendsID) return false;
            if (childExtendsID == 'http-vwf-example-com-button-vwf') return true;
            return this.isButton(Engine.prototype(childExtendsID));
        },
        isCheckbox: function(childExtendsID)
        {
            if (!childExtendsID) return false;
            if (childExtendsID == 'http-vwf-example-com-checkbox-vwf') return true;
            return this.isCheckbox(Engine.prototype(childExtendsID));
        },
        isLabel: function(childExtendsID)
        {
            if (!childExtendsID) return false;
            if (childExtendsID == 'http-vwf-example-com-label-vwf') return true;
            return this.isLabel(Engine.prototype(childExtendsID));
        },
        isPanel: function(childExtendsID)
        {
            if (!childExtendsID) return false;
            if (childExtendsID == 'http-vwf-example-com-panel-vwf') return true;
            return this.isPanel(Engine.prototype(childExtendsID));
        },
        isImage: function(childExtendsID)
        {
            if (!childExtendsID) return false;
            if (childExtendsID == 'http-vwf-example-com-image-vwf') return true;
            return this.isImage(Engine.prototype(childExtendsID));
        },
        isHtml: function (childExtendsID)
        {
            if (childExtendsID == 'http-vwf-example-com-html-vwf') return true;
            else if (!childExtendsID) return false;
            else return this.isHtml(Engine.prototype(childExtendsID));
        },
        createdNode: function(nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childURI, childName, callback /* ( ready ) */ )
        {
            if (this.isGUINode(childExtendsID) && nodeID !== 0)
            {
                var node = this.guiNodes[childID] = {};
                node.id = childID;
                node.parentid = nodeID;
                node.type = childExtendsID;
                node.name = childName;
                node.parentnode = this.guiNodes[nodeID];
                node.parentdiv = $('#guioverlay_' + node.parentid)[0];
                //don't need to do anything for the root node
                if (!node.parentid) return
                    //because it only makes sense to make children on dialogs, panels, or the root
                if ( !node.parentnode || (!this.isDialog(node.parentnode.type) && !(this.isPanel(node.parentnode.type) && !this.isHtml(node.parentnode.type))) )
                    node.parentdiv = $('#guioverlay_' + 'index-vwf')[0];
                if (this.isDialog(node.type))
                {
                    $(node.parentdiv).append('<div id="guioverlay_' + node.id + '"/>')
                    node.div = $('#guioverlay_' + node.id)[0];
                    $(node.div).dialog();
                    $(node.div).dialog('open');
                    $(node.div).on("dialogclose", function(event, ui)
                    {
                        if (this.inSetter) return;
                        vwf_view.kernel.setProperty(this.vwfID, 'visible', false);
                    });
                    $(node.div).on("dialogopen", function(event, ui)
                    {
                        if (this.inSetter) return;
                        vwf_view.kernel.setProperty(this.vwfID, 'visible', true);
                    });
                    $(node.div).on("dialogdragstop", function(event, ui)
                    {
                        if (this.inSetter) return;
                        var pos = goog.vec.Mat4.createIdentity();
                        pos[12] = ui.position.left / ($('#guioverlay_' + Engine.parent(this.vwfID)).width());
                        pos[13] = ui.position.top / ($('#guioverlay_' + Engine.parent(this.vwfID)).height());
                        pos[12] *= 100;
                        pos[13] *= 100;
                        vwf_view.kernel.setProperty(this.vwfID, 'transform', matCpy(pos));
                    });
                    $(node.div).on("dialogresizestop", function(event, ui)
                    {
                        if (this.inSetter) return;
                        vwf_view.kernel.setProperty(this.vwfID, 'width', ui.size.width);
                        vwf_view.kernel.setProperty(this.vwfID, 'height', ui.size.height);
                    });
                }
                if (this.isSlider(node.type))
                {
                    $(node.parentdiv).append('<div id="guioverlay_' + node.id + '"/>')
                    node.div = $('#guioverlay_' + node.id)[0];
                    $(node.div).slider();
                    $(node.div).on("slidechange", function(event, ui)
                    {
                        if (this.inSetter) return;
                        if ($(this).hasClass('guiselected')) return false;
                        vwf_view.kernel.setProperty(this.vwfID, 'value', ui.value);
                        vwf_view.kernel.fireEvent(this.vwfID, 'change');
                    });
                    $(node.div).on("slide", function(event, ui)
                    {
                        if (this.inSetter) return;
                        if ($(this).hasClass('guiselected')) return false;
                        vwf_view.kernel.setProperty(this.vwfID, 'value', ui.value);
                        vwf_view.kernel.fireEvent(this.vwfID, 'change');
                    });
                    $(node.div).on("slidestart", function(event, ui)
                    {
                        if ($(this).hasClass('guiselected')) return false;
                        if (_Editor.GetSelectMode() == 'Pick' || _Editor.GetSelectMode() == 'TempPick') return false;
                    });                                         
                }
                if (this.isButton(node.type))
                {
                    $(node.parentdiv).append('<div id="guioverlay_' + node.id + '"/>')
                    node.div = $('#guioverlay_' + node.id)[0];
                    $(node.div).html(('').escape());
                    $(node.div).button();
                    $(node.div).on("click", function(event, ui)
                    {
                        if ($(this).hasClass('guiselected')) return false;
                        vwf_view.kernel.fireEvent(this.vwfID, 'pointerClick');
                    });
                }
                if (this.isLabel(node.type))
                {
                    $(node.parentdiv).append('<div id="guioverlay_' + node.id + '"/>')
                    node.div = $('#guioverlay_' + node.id)[0];
                    $(node.div).html(('').escape());
                    $(node.div).css('position', 'absolute');
                    $(node.div).css('font-family', 'Verdana, Arial, sans-serif')
                }
                if (this.isPanel(node.type))
                {
                    $(node.parentdiv).append('<div id="guioverlay_' + node.id + '"/>')
                    node.div = $('#guioverlay_' + node.id)[0];
                    //$(node.div).html(('').escape());
                    $(node.div).css('position', 'absolute');                  
                }
                if (this.isImage(node.type))
                {
                    $(node.parentdiv).append('<div id="guioverlay_' + node.id + '"/>')
                    node.div = $('#guioverlay_' + node.id)[0];
                    $(node.div).html(('').escape());
                    $(node.div).css('position', 'absolute');
                    $(node.div).append('<img src="" />');
                    $('#guioverlay_' + node.id + ' img').css('position', 'absolute');
                    $('#guioverlay_' + node.id + ' img').css('width', '100%');
                    $('#guioverlay_' + node.id + ' img').css('height', '100%');
                    $('#guioverlay_' + node.id + ' img').attr('src', '');
                    node.img = $('#guioverlay_' + node.id + ' img')[0];
                }
                if (this.isCheckbox(node.type))
                {
                    $(node.parentdiv).append('<input type="checkbox" id="guioverlay_' + node.id + '"/>')
                    node.div = $('#guioverlay_' + node.id)[0];
                    $(node.div).html(('').escape());
                    $(node.div).css('position', 'absolute');
                    $(node.div).on("click", function(event, ui)
                    {
                        if ($(this).hasClass('guiselected')) return false;
                        if (this.inSetter) return;
                        if ($(this).is(':checked'))
                        {
                            vwf_view.kernel.setProperty(this.vwfID, 'isChecked', true);
                            vwf_view.kernel.fireEvent(this.vwfID, 'checked');
                        }
                        else
                        {
                            vwf_view.kernel.setProperty(this.vwfID, 'isChecked', false);
                            vwf_view.kernel.fireEvent(this.vwfID, 'unchecked');
                        }
                    });
                }
                if (node.div)
                {
                    node.div.vwfID = childID;
                    $(node.div).addClass('guinode');
                    $(node.div).css('pointer-events', 'all');
                }
            }
        },
        deletedNode: function(childID)
        {
            var node = this.guiNodes[childID];
            if (!node) return;
            $(node.div).remove();
            delete this.guiNodes[childID];
        },
        createdProperty: function(childID, propertyName, propertyValue)
        {
            this.satProperty(childID, propertyName, propertyValue);
        },
        initializedProperty: function(childID, propertyName, propertyValue)
        {
            this.satProperty(childID, propertyName, propertyValue);
        },
        setNodeVisibility: function(node, show)
        {
            node.div.inSetter = true;
            if (this.isDialog(node.type))
            {
                if (show)
                    $(node.div).dialog('open');
                else
                    $(node.div).dialog('close');
            }
            else
            {
                if (show)
                    $(node.div).show();
                else
                    $(node.div).hide();
            }
            node.div.inSetter = false;
        },
        satProperty: function(childID, propertyName, propertyValue)
        {
            var node = this.guiNodes[childID];
            if (!node) return;
            /*
             * by property
             */
            if (propertyName == 'transform')
            {
                var x = propertyValue[12] + '%';
                var y = propertyValue[13] + '%';
                var z = propertyValue[14];
                node.div.inSetter = true;
                if (this.isDialog(node.type))
                {
                    $(node.div).parent().css('left', x);
                    $(node.div).parent().css('top', y);
                }
                else
                {
                    if ((!node.style || !node.style.transform) && propertyValue.slice(0, 12).reduce(function(x, y)
                        {
                            return x || !!y;
                        }, false))
                        $(node.div).css('transform', 'matrix3d(' + propertyValue.slice(0, 12).concat([0, 0, 0, 1]).join(',') + ')');
                    if (!node.style || !node.style.left) $(node.div).css('left', x);
                    if (!node.style || !node.style.top) $(node.div).css('top', y);
                    if (!node.style || !node.style['z-index']) $(node.div).css('z-index', z);
                }
                node.div.inSetter = false;
            }
            else if (propertyName == 'visible')
            {
                if (
                    propertyValue
                    && (
                        !node.visibleToAncestor && !node.visibleToCamera
                        || node.visibleToAncestor && this.getAncestorCamera(childID) === this.activeCamera
                        || node.visibleToCamera && node.visibleToCamera === this.activeCamera
                    )
                )
                    this.setNodeVisibility(node, true);
                else
                    this.setNodeVisibility(node, false);
            }
            else if (propertyName == 'width')
            {
                node.div.inSetter = true;
                if (this.isDialog(node.type))
                    $(node.div).dialog('option', 'width', propertyValue);
                else if (!node.style || !node.style.width)
                    $(node.div).css('width', propertyValue);
                node.div.inSetter = false;
            }
            else if (propertyName == 'height')
            {
                node.div.inSetter = true;
                if (this.isDialog(node.type))
                    $(node.div).dialog('option', 'height', propertyValue);
                else if (!node.style || !node.style.height)
                    $(node.div).css('height', propertyValue);
                node.div.inSetter = false;
            }
            else if (propertyName == 'visibleToCamera')
            {
                node.visibleToCamera = propertyValue;
                if ((!propertyValue || propertyValue === this.activeCamera) && Engine.getProperty(node.id, 'visible'))
                    this.setNodeVisibility(node, true);
                else
                    this.setNodeVisibility(node, false);
            }
            else if (propertyName == 'visibleToAncestor')
            {
                node.visibleToAncestor = propertyValue;
                if ((!propertyValue || this.getAncestorCamera(node.id) === this.activeCamera) && Engine.getProperty(node.id, 'visible'))
                    this.setNodeVisibility(node, true);
                else
                    this.setNodeVisibility(node, false);
            }
            else if (propertyName == 'style')
            {
                node.div.inSetter = true;
                node.style = propertyValue;
                $(node.div).css(propertyValue);
                node.div.inSetter = false;
            }
            /*
             * by type
             */
            else if (this.isDialog(node.type))
            {
                if (propertyName == 'title')
                {
                    node.div.inSetter = true;
                    $(node.div).dialog('option', 'title', propertyValue);
                    node.div.inSetter = false;
                }
            }
            else if (this.isSlider(node.type))
            {
                if (propertyName == 'min')
                {
                    node.div.inSetter = true;
                    $(node.div).slider('option', 'min', propertyValue);
                    node.div.inSetter = false;
                }
                else if (propertyName == 'max')
                {
                    node.div.inSetter = true;
                    $(node.div).slider('option', 'max', propertyValue);
                    node.div.inSetter = false;
                }
                else if (propertyName == 'step')
                {
                    node.div.inSetter = true;
                    $(node.div).slider('option', 'step', propertyValue);
                    node.div.inSetter = false;
                }
                else if (propertyName == 'value')
                {
                    node.div.inSetter = true;
                    $(node.div).slider('option', 'value', propertyValue);
                    node.div.inSetter = false;
                }
                else if (propertyName == 'orientation')
                {
                    node.div.inSetter = true;
                    $(node.div).slider('option', 'orientation', propertyValue);
                    node.div.inSetter = false;
                }
            }
            else if (this.isButton(node.type))
            {
                if (propertyName == 'text')
                {
                    $('#guioverlay_' + node.id ).html((propertyValue + '').escape());
                }
            }
            else if (this.isLabel(node.type))
            {
                if (propertyName == 'text')
                {
                    $(node.div).html((propertyValue + '').escape());
                }
                else if (propertyName == 'font_color')
                {
                    $(node.div).css('color', toCSSColor(propertyValue));
                }
                else if (propertyName == 'font_size')
                {
                    $(node.div).css('font-size', propertyValue + 'px');
                }
                else if (propertyName == 'text_align')
                {
                    $(node.div).css('text-align', propertyValue);
                }
            }
            else if (this.isCheckbox(node.type))
            {
                if (propertyName == 'isChecked')
                {
                    node.div.inSetter = true;
                    if (propertyValue)
                        $(node.div).attr('checked', 'checked');
                    else
                        $(node.div).removeAttr('checked');
                    node.div.inSetter = false;
                }
            }
            else if (this.isImage(node.type))
            {
                if (propertyName == 'src')
                {
                    $(node.img).attr('src', propertyValue);
                }
            }
            else if (this.isPanel(node.type))
            {
                if (propertyName == 'background_visible')
                {
                    if (!propertyValue)
                    {
                        propertyName = 'background_color';
                        propertyValue = '';
                    }
                    else
                    {
                        propertyName = 'background_color';
                        propertyValue = Engine.getProperty(node.id, 'background_color');
                    }
                }
                if (propertyName == 'background_color' && !(node.style && node.style['background-color']))
                {
                    $(node.div).css('background-color', toCSSColor(propertyValue));
                }
				else if (propertyName == 'border_style' && !(node.style && node.style['border-style']))
				{
					$(node.div).css('border-style', propertyValue);
				}
                else if (propertyName == 'border_width' && !(node.style && node.style['border-width']))
                {
                    $(node.div).css('border-width', propertyValue);
                }
                else if (propertyName == 'border_radius' && !(node.style && node.style['border-radius']))
                {
                    $(node.div).css('border-radius', propertyValue);
                }
                else if (propertyName == 'border_color' && !(node.style && node.style['border-color']))
                {
                    $(node.div).css('border-color', toCSSColor(propertyValue));
                }
                else if( propertyName == '__innerHTML' && this.isHtml(node.type))
                {
                    $(node.div).html(propertyValue);
                }
            }
        },
        getAncestorCamera: function(nodeid)
        {
            if( !nodeid )
                return;
            else if( nodeid === 'index-vwf' )
                return '';
            else if( Engine.prototype(nodeid) === 'SandboxCamera-vwf' )
                return nodeid;
            else
                return this.getAncestorCamera(Engine.parent(nodeid));
        },
        updateVisibility: function()
        {
            for (var i in this.guiNodes)
            {
                var node = this.guiNodes[i];
                if (
                    Engine.getProperty(node.id, 'visible')
                    && (
                        !node.visibleToAncestor && !node.visibleToCamera
                        || node.visibleToAncestor && this.getAncestorCamera(i) === this.activeCamera
                        || node.visibleToCamera && node.visibleToCamera === this.activeCamera
                    )
                )
                    this.setNodeVisibility(node, true);
                else
                    this.setNodeVisibility(node, false);
            }
        },
        calledMethod: function(id, name, params)
        {
            if (id === 'index-vwf' && name === 'setClientCamera' && params[0] === Engine.moniker())
            {
                this.activeCamera = params[1];
                this.updateVisibility();
            }
        },
        //Update the sound volume based on the position of the camera and the position of the object
        ticked: function() {},
    })

    function toCSSColor(array)
    {
        if (!array)
            array = [0, 0, 0, 0];
        else if(array[3] === undefined)
            array = array.concat([1,1,1,1]).slice(0,4);

        array = [Math.round(array[0] * 255), Math.round(array[1] * 255), Math.round(array[2] * 255), array[3]];
        return 'rgba(' + array.join(',') + ')';
    }
});
