 function getHeight(id,_default)
    {
        if(!_default) _default = 0;
        if($('#' + id).is(':visible'))
            return parseInt($('#' + id).height());
        else return _default;    
    }
    function getLeft(id,_default)
    {
        if(!_default) _default = 0;
        if($('#' + id).is(':visible'))
            return parseInt($('#' + id).css('left'));
        else return _default;    
    }
    function getTop(id,_default)
    {
        if(!_default) _default = 0;
        if($('#' + id).is(':visible'))
            return parseInt($('#' + id).css('top'));
        else return _default;    
    }
    function getWidth(id,_default)
    {
        if(!_default) _default = 0;
        if($('#' + id).is(':visible'))
            return parseInt($('#' + id).width());
        else return _default;    
    }

    var statusbarEnabled = true;
    var toolbarEnabled = true;
    var menubarEnabled = true;
    var libraryEnabled = true;
    var sidepanelEnabled = true;
    function hideStatusbar()
    {
        statusbarEnabled = false;
        $('#statusbar').hide();
        $(window).resize();
    }
    function hideSidepanel()
    {
        sidepanelEnabled = false;
        $('#sidepanel').hide();
        $(window).resize();
    }
    function hideLibrary()
    {
        libraryEnabled = false;
        $('#EntityLibrary').hide();
        $(window).resize();
    }
    function hideMenubar()
    {
        menubarEnabled = false;
        $('#smoothmenu1').hide();
        $(window).resize();
    }
    function hideToolbar()
    {
        toolbarEnabled = false;
        $('#toolbar').hide();
        $(window).resize();
    }
    function showStatusbar()
    {
        statusbarEnabled = true;
        $('#statusbar').show();
        $(window).resize();
    }
    function showMenubar()
    {
        menubarEnabled = true;
        $('#smoothmenu1').show();
        $(window).resize();
    }
    function showToolbar()
    {
        toolbarEnabled = true;
        $('#toolbar').show();
        $(window).resize();
    }
    function showSidepanel()
    {
        sidepanelEnabled = true;
        $('#sidepanel').show();
        $(window).resize();
    }
    function showLibrary()
    {
        libraryEnabled = true;
        $('#EntityLibrary').show();
        $(window).resize();
    }

define({
   
    showToolbar:showToolbar,
    showMenubar:showMenubar,
    showStatusbar:showStatusbar,
    hideMenubar:hideMenubar,
    hideToolbar:hideToolbar,
    hideStatusbar:hideStatusbar,
    hideSidepanel:hideSidepanel,
    hideLibrary:hideLibrary,
    showSidepanel:showSidepanel,
    showLibrary:showLibrary, 
    initialize: function() {
        var toolsHidden = false;
        var toolsLoaded = true;
        toolsLoaded = _EditorView.needTools();

		var timeout;
		window._resizeCanvas = function(evt)
		{
			if(timeout) clearTimeout(timeout);
			timeout = setTimeout(function()
			{

				var viewport = $('#vwf-root');
				var canvas = $('#index-vwf', viewport);
				var resolutionScale = _SettingsManager.getKey('resolutionScale');
				var w = parseInt(viewport.css('width')), h = parseInt(viewport.css('height'));
                if(window._dRenderer)
                {
			        canvas.attr('width', (w / resolutionScale)*_dRenderer.devicePixelRatio);
                    canvas.attr('height', (h / resolutionScale)*_dRenderer.devicePixelRatio);
					_dRenderer.setViewport(0, 0, w / resolutionScale, h / resolutionScale);
				}else{

                    canvas.attr('width', (w / resolutionScale));
                    canvas.attr('height', (h / resolutionScale));
                }
	            _dView.getCamera().aspect = w/h;
	            _dView.getCamera().updateProjectionMatrix()
	            _dView.windowResized();
                try{
                    var evt = new Event('viewportresize');
                    document.dispatchEvent(evt);    
                }catch(e)
                {
                    $(document).trigger('viewportresize');
                }
				

			}, 80);
		};
        if($('#vwf-root > #resizer').length > 0 && $('#vwf-root > #resizer')[0].contentDocument)
		$('#vwf-root > #resizer')[0].contentDocument.defaultView.addEventListener('resize', window._resizeCanvas);
        if(toolsLoaded) //don't show the blue focus border on worlds that don't have editor tools
        {
    		$('#vwf-root > canvas').on('focusin', function(e){
    			$(this).css({border: '4px ridge #82b8ff'});
    		});
    		$('#vwf-root > canvas').on('focusout', function(e){
    			$(this).css({border: 'none'});
    		});
        }
        _resizeCanvas();
        window.hideTools = function() {
            if (!toolsLoaded) return;
            toolsHidden = true;
            $('#smoothmenu1').hide();
            $('#toolbar').hide();
            $('#statusbar').hide();
            $('#sidepanel').hide();
            $('#EntityLibrary').hide();
            $('#ScriptEditor').hide();
            /*$('#index-vwf').css('height', $(window).height());
            $('#index-vwf').css('width', $(window).width());
            $('#index-vwf').attr('height', $(window).height());
            $('#index-vwf').attr('width', $(window).width());
            $('#index-vwf').css('top', 0 + 'px');
            $('#index-vwf').css('left', 0 + 'px');
             $('#index-vwf').css('border','none');*/
            //_Editor.findcamera().aspect = (parseInt($('#index-vwf').css('width')) / parseInt($('#index-vwf').css('height')));
            $('#index-vwf').focus()
            //_Editor.findcamera().updateProjectionMatrix();
            _Editor.SelectObject(null);
            _Editor.SetSelectMode('none');
            _Editor.hidePeerSelections();
            //$(window).resize();
        }
        window.showTools = function() {
            if (!toolsLoaded) return;
            toolsHidden = false;
            if(menubarEnabled)
                $('#smoothmenu1').show();
            if(toolbarEnabled)
                $('#toolbar').show();
            if(sidepanelEnabled)
                $('#sidepanel').show();
            if(statusbarEnabled)
                $('#statusbar').show();
            $('#index-vwf').focus();
            if(libraryEnabled)
                $('#EntityLibrary').show();
			$('#ScriptEditor').show();

            /*$('#index-vwf').css('height', $(window).height() + 'px');
            $('#index-vwf').css('width', $(window).width() + 'px');
            $('#index-vwf').css('top', $('#smoothmenu1').height() + $('#toolbar').height() + 'px');
            $('#index-vwf').css('height', $(window).height() - ($('#smoothmenu1').height() + $('#toolbar').height() + $('#statusbar').height()) + 'px');
            $('#index-vwf').css('left', parseInt($('#EntityLibrary').css('left')) + $('#EntityLibrary').width());*/
            //_Editor.findcamera().aspect = (parseInt($('#index-vwf').css('width')) / parseInt($('#index-vwf').css('height')));
            //_Editor.findcamera().updateProjectionMatrix();
            _Editor.SetSelectMode('Pick');
            //$('#index-vwf').css('border','');
            //$(window).resize();


        }
        window.toolsOpen = function() {
            if (!toolsLoaded) return false;
            return !toolsHidden;
        }
        

    }
   

});
