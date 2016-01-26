define([], function() {
    var Performance = {};
    var isInitialized = false;
    return {
        getSingleton: function() {
            if (!isInitialized) {
                initialize.call(Performance);
                isInitialized = true;
            }
            return Performance;
        }
    }
    function TimeCounter(maxSamples)
    {
    	this.samples = [];
    	this.startTime = 0;
    	this.averageTime = 0;
    	this.maxSamples = maxSamples;
    	this.startSample = function()
    	{
    		this.startTime = performance.now();

    	}
    	this.endSample = function()
    	{

    		var sampleTime = performance.now() - this.startTime;
            this.samples.unshift(sampleTime);
            if (this.samples.length > this.maxSamples)
                this.samples.pop();
            this.averageTime = 0;
            for (var i = 0; i < this.samples.length; i++)
                this.averageTime += this.samples[i];
            this.averageTime /= this.samples.length;
    	}
        this.value = function()
        {
            return this.averageTime;
        }
    }
    function TriggerTimer(maxSamples,symbol,startTrigger,endTrigger)
    {
        
       TimeCounter.call(this,maxSamples);
       eventSource.live(symbol,startTrigger,this.startSample.bind(this));
       eventSource.live(symbol,endTrigger,this.endSample.bind(this));
    }
    function FuncCounter(maxSamples,func)
    {
        this.samples = [];
        this.startTime = 0;
        this.averageTime = 0;
        this.maxSamples = maxSamples;
        this.func = func;
        this.startSample = function()
        {
            this.startTime = performance.now();

        }
        this.endSample = function()
        {

            var sampleTime = func.call(this);
            this.samples.unshift(sampleTime);
            if (this.samples.length > this.maxSamples)
                this.samples.pop();
            this.averageTime = 0;
            for (var i = 0; i < this.samples.length; i++)
                this.averageTime += this.samples[i];
            this.averageTime /= this.samples.length;
        }
        this.value = function()
        {
            return this.averageTime;
        }
    }
    function QuantityCounter(maxSamples)
    {
    	this.samples = [];
    	this.currentVal = 0;
    	this.average = 0;
    	this.maxSamples = maxSamples;
    	this.startSample = function()
    	{
    		this.currentVal = 0;
    	}
    	this.addQuantity = function(val)
    	{
    		this.currentVal += val;
    	}
    	this.endSample = function()
    	{

    		var sampleTime = this.currentVal;

            this.samples.unshift(sampleTime);
            if (this.samples.length > this.maxSamples)
                this.samples.pop();
            this.average = 0;
            for (var i = 0; i < this.samples.length; i++)
                this.average += this.samples[i];
            this.average /= this.samples.length;
    	}
        this.value = function()
        {
            return this.average;
        }
    }
    function recordTrack(counter,label)
    {
        this.counter = counter;
        this.track = [];
        this.min = 0;
        this.max = 1;
        this.label = label;
        this.active = true;
        
        this.randomColor = function()
        {
            return Math.floor(Math.random() * 155 + 100);
        }
        this.color = 'rgb(' + this.randomColor() +','+ this.randomColor() +','+ this.randomColor() +')';
        this.scale = function(val)
        {
            return 300- ( val / (this.max - this.min) * 300);
        }
        this.draw = function(context,i)
        {
            if(!this.active) return;
            var current = this.counter.value();
            if(current > this.max - 1)
                this.max = current + 1;
            if(current < this.min +1)
                this.min = current -1;
            this.track.push(current);
            context.fillStyle = this.color;
            context.strokeStyle = this.color;
            if(this.track.length > 300)
                this.track.shift();
            context.fillText(this.label + ":" + this.min.toFixed(2) + "-" +this.max.toFixed(2),10,290-i*10);
            for(var j =1; j < this.track.length; j++)
            {
                context.beginPath();

                context.moveTo(j-1,this.scale(this.track[j-1]));
                context.lineTo(j,this.scale(this.track[j]));
                context.stroke();
            }
            i++;
            context.fillText(this.track[this.track.length-1].toFixed(2),300-(15*i),this.scale(this.track[this.track.length-1]));
        }
    }
    function initialize() {
        var FRAME_ROLLING_AVERAGE_LENGTH = 20;
        var TICK_ROLLING_AVERAGE_LENGTH = 20;
        var FPS_GOAL_NUMBER = 20;
        var TICK_TIME_THRESHOLD = 60;

        this.currentFrameStart = 0;
        this.lastTickTime = 0;
        this.frameTimes = [];
        this.frameTimeAverage = 0;
        this.tickTimes = [];
        this.tickTimeAverage = 0;
        this.FPSStart = 0;
        this.FPSTimes = [];
        this.FPSTimeAverage = 0;
        this.FPS = 0;
        this.FPSPID_I = 0;
        this.resizeCounter = 0;
        this.counters = {};

        this.originalResScale = _SettingsManager.getKey('resolutionScale');;

        this.counters.RenderTime = new TimeCounter(FRAME_ROLLING_AVERAGE_LENGTH);
        this.counters.FPS = new TimeCounter(FRAME_ROLLING_AVERAGE_LENGTH);
        this.counters.TickTime = new TriggerTimer(TICK_ROLLING_AVERAGE_LENGTH,'Engine','tickStart','tickEnd');
        this.counters.DrawCalls = new FuncCounter(TICK_ROLLING_AVERAGE_LENGTH,function(){return _dRenderer.info.render.calls});
        this.counters.Cull = new TriggerTimer(TICK_ROLLING_AVERAGE_LENGTH,'SceneManager','cullStart','cullEnd');
        this.counters.Interp = new TriggerTimer(TICK_ROLLING_AVERAGE_LENGTH,'View','interpStart','interpEnd');
        this.counters.InterpRestore = new TriggerTimer(TICK_ROLLING_AVERAGE_LENGTH,'View','interpRestoreStart','interpRestoreEnd');

        this.counters.FPS.value=function()
        {
            return 1000/this.averageTime;
        }

        this.tracks = {};
        this.tracks["Render"] = new recordTrack(this.counters.RenderTime,"Render");
        this.tracks["FPS"] = new recordTrack(this.counters.FPS,"FPS");
        this.tracks["Tick"] = new recordTrack(this.counters.TickTime,"Tick");
        this.tracks["Calls"] = new recordTrack(this.counters.DrawCalls,"Calls");
        this.tracks["Cull"] = new recordTrack(this.counters.Cull,"Cull");
        this.tracks["Interp"] = new recordTrack(this.counters.Interp,"Interp");
        this.show = function()
        {
            $(document.body).append("<canvas id='statsViewer' />");
            $('#statsViewer').attr("width",300);
            $('#statsViewer').attr("height",300);
            $('#statsViewer').css("height",300);
            $('#statsViewer').css("width",300);
            $('#statsViewer').css("position",'absolute');
            $('#statsViewer').css("z-index",999);
            $('#statsViewer').css("top","0px");
            $('#statsViewer').css("left","0px");
            $('#statsViewer').css("background",'black');
            this.context  = document.getElementById('statsViewer').getContext("2d");

        }
        this.draw = function()
        {
            this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height)
            var j = 0;
            for(var i in this.tracks)
            {
                this.tracks[i].draw(this.context,j);
                j++;
            }
        }
        this.preFrame = function() {
            
            this.counters.RenderTime.startSample();
            if(this.context)
                this.draw();


            this.counters.DrawCalls.endSample();

            //loop back around, for total time between frames
            this.counters.FPS.endSample();
            this.counters.FPS.startSample();

            this.FPS = 1000/this.counters.FPS.averageTime;
            this.resizeCounter++;
            //if the fps is low, but the ticktime is fast enough, then we should be able to go faster
            if(this.originalResScale == 1 ) //only do this if the user did not set the frame scale. otherwise use the user setting
            if ((this.resizeCounter > FRAME_ROLLING_AVERAGE_LENGTH && Engine.getProperty(Engine.application(),'playMode') != 'playing') ||
            	(this.resizeCounter > FRAME_ROLLING_AVERAGE_LENGTH && Engine.getProperty(Engine.application(),'playMode') == 'playing' && this.FPSTimeAverage < TICK_TIME_THRESHOLD )) {
                this.resizeCounter = 0;
                var p = FPS_GOAL_NUMBER - this.FPS;
                this.FPSPID_I += p;
                if(this.FPSPID_I < 0)
                    this.FPSPID_I = 0;
                p *= .05;
                p += this.FPSPID_I * .005;
                var newResScale = 1 + p*Math.abs(p);
                if (newResScale > 16)
                    newResScale = 16;
                if (newResScale < 1)
                    newResScale = 1;

                newResScale = (Math.floor(newResScale * 1000))/1000;
                if (_SettingsManager.settings.resolutionScale != newResScale) {
                    _SettingsManager.settings.resolutionScale = newResScale;

                    if (_SettingsManager.settings.resolutionScale == 16)
                        alertify.error('Graphics performance problem detected!')
                    //this.scaleDisplayResolution();
                }
            }

        }
        this.scaleDisplayResolution = function()
        {
			window._resizeCanvas();

        	/*var resolutionScale = _SettingsManager.getKey('resolutionScale')  ;


            var oldwidth = parseInt($('#index-vwf').css('width'));
            var oldheight = parseInt($('#index-vwf').css('height'));

            //if ((origWidth != self.width) || (origHeight != self.height)) {
            $('#index-vwf')[0].height = self.height / resolutionScale;
            $('#index-vwf')[0].width = self.width / resolutionScale;
            if(window._dRenderer)
                _dRenderer.setViewport(0, 0, window.innerWidth / resolutionScale, window.innerHeight / resolutionScale)

            //note, this changes some renderer internals that need to be set, but also resizes the canvas which we don't want.
            //much of the resize code is in WindowResize.js
            if(window._dRenderer)
                _dRenderer.setSize(parseInt($('#index-vwf').css('width')) / resolutionScale, parseInt($('#index-vwf').css('height')) / resolutionScale);
            _dView.getCamera().aspect = $('#index-vwf')[0].width / $('#index-vwf')[0].height;
            $('#index-vwf').css('height', oldheight);
            $('#index-vwf').css('width', oldwidth);
            _dView.getCamera().updateProjectionMatrix()
            _dView.windowResized();*/

        }
        this.postFrame = function() {
            this.counters.RenderTime.endSample();
        }
        this.ticked = function() {

        
        }
    }
});
