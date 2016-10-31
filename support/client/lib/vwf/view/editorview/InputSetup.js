define({
	initialize:function()
	{
		//hook up the editor object
		$('#index-vwf').mousedown(function(e){_Editor.mousedown(e)});
		
		$('#index-vwf').mouseup(function(e){_Editor.mouseup(e)});
		$('#index-vwf').click(function(e){_Editor.click(e)});
		$('#index-vwf').mouseleave(function(e){_Editor.mouseleave(e)});
		$('#index-vwf').mousemove(function(e){_Editor.mousemove(e)});

		$('#index-vwf').on('dblclick',function(e){_Editor.dblclick(e)});

		$('#index-vwf').attr('tabindex',0);
		$('#index-vwf').on('touchstart',function(e){
			e.preventDefault();
			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			_Editor.mousedown(touch)
		});
		
		// $('#index-vwf')[0].requestPointerLock = $('#index-vwf')[0].requestPointerLock ||
			     // $('#index-vwf')[0].mozRequestPointerLock ||
			     // $('#index-vwf')[0].webkitRequestPointerLock;
		

		//Ask the browser to release the pointer
		// document.exitPointerLock = document.exitPointerLock ||
					   // document.mozExitPointerLock ||
					   // document.webkitExitPointerLock;
		
		
		$('#index-vwf').on('touchmove',function(e){
		e.preventDefault();
			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			_Editor.mousemove(touch)
		});
		$('#index-vwf').on('touchend',function(e){
		e.preventDefault();
			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			_Editor.mouseup(touch)
		});
		//deal with deactivating actions that should only work when a key is held,but the focus has left so the editor won't get the keyup
		$('#index-vwf').blur(function()
		{
			_Editor.blur();
		});
		$('#index-vwf').keydown(function(e){
			
			if(window._Editor && _Editor.disableDueToWorldState() ) return;
			try{
			_Editor.keydown(e)
			if(e.keyCode == 32 && e.shiftKey)
				focusSelected();
			}catch(e)
			{
				
			}
		});
		$('#index-vwf').keypress(function(e) {
			
            if (e.charCode == 92) {
                if (!_EditorView.needTools()) return;
                if (toolsOpen()){
                    hideTools();
            		alertify.alert('Press the \\ (backslash) key to unhide the editor tools.');
				}
                else
                    showTools();
            }
        });
		$(window).keypress(function(e)
		{
			
		});
		
		
		
		
		
		$('#index-vwf').keyup(function(e){

			_Editor.keyup(e)
			
		});
		
	}
});
