function toolBarButton(src, handler, tooltip, name, requiresSelection) {
    if (!name) name = GUID();
    var translatedTooltip = i18n.t(tooltip);

    var iconname = name + "icon";


    $('#toolbar').append('<div src="' + src + '" id="' + iconname + '" class="icon ' + src + '" />');
    $('#' + iconname).click(function() {
        handler();
    });
    $('#' + iconname).tooltip({
        content: translatedTooltip,
        items: "div",
        show: {
            delay: 500
        }
    });
    this.handler = handler;
    this.tooltip = tooltip;
    this.requiresSelection = requiresSelection;
    this.hide = function() {
        $('#' + iconname).hide();
    }
    this.show = function() {
        $('#' + iconname).show();
    }
    this.trigger = function() {
        this.handler();
    }
    this.select = function() {
        $('#' + iconname).addClass('iconselected');
    }
    this.deselect = function() {
        $('#' + iconname).removeClass('iconselected');
    }
    this.enable = function() {
        $('#' + iconname).removeClass('icondisabled');
    }
    this.disable = function() {
        $('#' + iconname).addClass('icondisabled');
    }
}
var toolbarButtons = {};
define({
    initialize: function() {


        (function($) {
            $.fn.dragScroll = function(options) {
                /* Mouse dragg scroll */
                var x, y, top, left, down, moved;
                var $scrollArea = $(this);

                $($scrollArea).attr("onselectstart", "return false;"); // Disable text selection in IE8

                $($scrollArea).mousedown(function(e) {
                    e.preventDefault();
                    down = true;
                    x = e.pageX;
                    y = e.pageY;
                    top = $(this).scrollTop();
                    left = $(this).scrollLeft();
                });
                $($scrollArea).mouseleave(function(e) {
                    down = false;
                });
                $("body").mousemove(function(e) {
                    if (down) {
                        var newX = e.pageX;
                        var newY = e.pageY;
                        $($scrollArea).scrollTop(top - newY + y);
                        $($scrollArea).scrollLeft(left - newX + x);
                    }
                });
                $("body").mouseup(function(e) {
                    if (down) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        down = false;
                        return false;
                    }
                });
            };
        })(jQuery);


        window._Toolbar = this;

        $(document).on('selectionChanged', function(e, node) {
            if (node) {
                for (var i in toolbarButtons) {
                    if (toolbarButtons[i].requiresSelection)
                        toolbarButtons[i].enable();
                }

            } else {
                for (var i in toolbarButtons) {
                    if (toolbarButtons[i].requiresSelection)
                        toolbarButtons[i].disable();
                }
            }
        });

        $('#toolbar').dragScroll();

        function createIcon(src, menuitemname, tooltip, requiresSelection) {

            var handler = function() {
                $('#' + menuitemname).click();

                $(".ddsmoothmenu").find('li').trigger('mouseleave');
            };
            toolbarButtons[menuitemname] = new toolBarButton(src, handler, tooltip, menuitemname, requiresSelection);
        }


        function createSeperator() {
            $('#toolbar').append('<div class="seperator" />');
        }
        createIcon('logout', 'MenuLogIn', 'Log In');
        createIcon('login', 'MenuLogOut', 'Log Out');
        createSeperator();
        createIcon('undo', 'MenuUndo', 'Undo (ctrl-z)');
        createIcon('redo', 'MenuRedo', 'Redo (ctrl-y)');
        createSeperator();
        createIcon('move', 'MenuMove', 'Move Tool', true);
        createIcon('rotate', 'MenuRotate', 'Rotate Tool', true);
        createIcon('scale', 'MenuScale', 'Scale Tool', true);
        createSeperator();
        createIcon('worldspace', 'MenuWorld', 'Use World Coordinates', true);
        createIcon('localspace', 'MenuLocal', 'Use Local Coordinates', true);
        createSeperator();
        createIcon('pick', 'MenuSelectPick', 'Select by clicking');
        createIcon('selectnone', 'MenuSelectNone', 'Select None');
        createIcon('up', 'MenuSelectParent', 'Select Parent', true);
        createIcon('target', 'MenuFocusSelected', 'Focus to selected object', true);
        createSeperator();
        createIcon('copy', 'MenuCopy', 'Copy', true);
        createIcon('paste', 'MenuPaste', 'Paste');
        createIcon('duplicate', 'MenuDuplicate', 'Duplicate', true);
        createIcon('delete', 'MenuDelete', 'Delete', true);
        createSeperator();
        createIcon('link', 'MenuSetParent', 'Link', true);
        createIcon('unlink', 'MenuRemoveParent', 'Unlink', true);
        createSeperator();
        createIcon('camera', 'MenuCameraOrbit', 'Orbit Camera');
        createIcon('firstperson', 'MenuCamera3RDPerson', 'First Person Camera');
        createIcon('navigate', 'MenuCameraNavigate', 'Navigation Camera');
        createIcon('free', 'MenuCameraFree', 'Free Camera');
        createSeperator();
        createIcon('sphere', 'MenuCreateSphere', 'Create Sphere');
        createIcon('cube', 'MenuCreateBox', 'Create Box');
        createIcon('cylinder', 'MenuCreateCylinder', 'Create Cylinder');
        createIcon('cone', 'MenuCreateCone', 'Create Cone');
        createIcon('plane', 'MenuCreatePlane', 'Create Plane');
        createSeperator();

        createIcon('chat', 'MenuChat', 'Show Chat Window');

        createIcon('script', 'MenuScriptEditor', 'Show Script Editor Window', true);

        createIcon('models', 'MenuModels', 'Show Model Library Window');

        for (var i in toolbarButtons) {
            if (toolbarButtons[i].requiresSelection)
                toolbarButtons[i].disable();
        }

        $('#MenuCameraOrbiticon').addClass('iconselected');
        $('#MenuMoveicon').addClass('iconselected');
        $('#MenuWorldicon').addClass('iconselected');
        $('#MenuLogOuticon').addClass('icondisabled');
        this.addButton = function(name, cssname, handler, toolip) {
            toolbarButtons[name] = new toolBarButton(cssname, handler, tooltip);
        }
        this.getButton = function(name) {
            return toolbarButtons[name];
        }
        this.getButtons = function() {
            return toolbarButtons;
        }
    }

});