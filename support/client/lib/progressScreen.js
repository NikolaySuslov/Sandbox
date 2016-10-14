define(["./vwf/view/editorview/lib/jquery-2.0.3.min.js","./vwf/view/editorview/lib/jquery-ui-1.10.3.custom.min.js"],function()
{
    var names = {};
    function progressScreen(){
    	var self = this;

        
        this.startProgressGui = function(total)
        {
            //$(document.body).append('<div id = "preloadGUIBack" class=""><span id="fullscreenlink">Please enter full screen mode. Click here or hit F11.</span><img id="loadingSplash" /><div id = "preloadGUI" class=""><div class="preloadCenter"><div id="preloadprogress"><p class="progress-label">Loading...</p></div></div><div class=""><div class="" id="preloadguiText">Loading...</div></div></div></div>');
            $('#preloadGUIBack').css('display', 'block');
            $('#preloadprogress').css('width','95%');

            $('#preloadprogress').progressbar();
            $('#preloadprogress').progressbar("value", 0);
            $('#preloadprogress .progress-label').text("Loading Assets: 0%");
            var regExp = new RegExp(window.appPath + ".*\/");
            var sid = regExp.exec(window.location.pathname.toString()).toString();
           // $('#loadingSplash').attr('src', "../vwfdatamanager.svc/thumbnail?SID=" + sid);
           // $('#loadingSplash').attr('onerror', " this.src = '/adl/sandbox/img/thumbnotfound.png'");
            $('#fullscreenlink').click(function()
            {
                RunPrefixMethod(document.body, "RequestFullScreen", 1);
            });
        },
        this.updateProgressGui = function(count, data)
        {

             $('#preloadprogress').css('width','95%');
            $('#preloadprogress').progressbar("value", count * 100);
            $('#preloadguiText').text((data.name ? data.name + ": " : "") + data.url);
            $('#preloadprogress .progress-label').text("Loading Assets: " + parseInt(count * 100) + "%");
        },
        this.closeProgressGui = function()
        {
            $('#preloadGUIBack').fadeOut();
        }
        this.stateLoadTotalSteps = 0;
        this.stateLoadSteps = 0;
        this.startSetState = function(state)
        {
        	$('#preloadprogress').css('width','95%');
        	var count = 1;
        	function walk(node,j)
        	{
        		
        		if(!node.extends && !node.continues && !node.properties && !node.source && !node.type)
        			return;
        		count++;
                names[j] = true;
                if(!node || !node.children)
        			return;
        		for(var i in node.children)
        			walk(node.children[i],i)
        	}
        	walk(state.nodes[0]);
        	this.stateLoadTotalSteps = count;
        	var progress = (this.stateLoadSteps/this.stateLoadTotalSteps);
        	$('#preloadprogress').progressbar("value", progress * 100);
            $('#preloadprogress .progress-label').text("Creating World: " + this.stateLoadSteps + ' of ' +this.stateLoadTotalSteps);
        }
        this.startContinuesNode = function(node)
        {
        	
        	var count = 0;
        	function walk(node,j)
        	{
        		
        		if(!node.extends && !node.continues && !node.properties && !node.source && !node.type)
        			return;
        		count++;
                names[j] = true;
        		if(!node || !node.children)
        			return;
        		for(var i in node.children)
        			walk(node.children[i],i)
        	}
        	walk(node);
        	
        	this.stateLoadTotalSteps += count;
           // $('#preloadprogress .progress-label').text("Creating State: " + parseInt(0) + "%");
        }
        this.increaseLoadSteps = function()
        {
        	//called when the engine discovers that there are prototypes to be loaded;
        	this.stateLoadTotalSteps++;
        }
        this.startCreateNode = function(node)
        {
			$('#preloadguiText').text(node);
        }
        this.stepForward = function()
        {
            $('#preloadprogress').progressbar("value", $('#preloadprogress').progressbar("value") + 1);
        }
        this.stopCreateNode = function(node)
        {
        	this.stateLoadSteps++;
            this.stateLoadTotalSteps = Object.keys(names).length;
        	var progress = (this.stateLoadSteps/this.stateLoadTotalSteps);
        	$('#preloadprogress').progressbar("value", progress * 100);
        	$('#preloadprogress .progress-label').text("Creating World" );
        }
        this.endSetState = function(node)
        {
            $('#preloadprogress').progressbar("value", 1 * 100);
            $('#preloadprogress .progress-label').text("Creating World" );
        	window.setTimeout(function(){

                this.closeProgressGui();    
            }.bind(this),500)
            
        }
    }
    window._dProgressScreen=  new progressScreen();
    return window._dProgressScreen;
});