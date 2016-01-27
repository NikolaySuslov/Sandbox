define(["vwf/utility/eventSource"], function(eventSource)
{
    var Performance = {};
    var isInitialized = false;
    return {
        getSingleton: function()
        {
            if (!isInitialized)
            {
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

    function TriggerTimer(maxSamples, symbol, startTrigger, endTrigger)
    {
        TimeCounter.call(this, maxSamples);
        eventSource.live(symbol, startTrigger, this.startSample.bind(this));
        eventSource.live(symbol, endTrigger, this.endSample.bind(this));
    }

    function FuncCounter(maxSamples, func)
    {
        this.samples = [];
        this.startTime = 0;
        this.averageTime = 0;
        this.maxSamples = 2;
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

    function EventsPerSecondTimer(symbol, eventTrigger)
    {
        QuantityCounter.call(this, 2);
        this.oneSample = function()
        {
            this.addQuantity(1);
        }
        this.oneSecond = function()
        {
            this.endSample();
            this.startSample();
        }
        eventSource.live(symbol, eventTrigger, this.oneSample.bind(this));
        eventSource.live("PerformanceManager", "oneSecond", this.oneSecond.bind(this));
    }

    function recordTrack(counter, label, active)
    {
        this.counter = counter;
        this.track = [];
        this.min = 0;
        this.max = 1;
        this.label = label;
        this.active = active;
        this.randomColor = function()
        {
            return Math.floor(Math.random() * 200 + 55);
        }
        this.color = 'rgb(' + this.randomColor() + ',' + this.randomColor() + ',' + this.randomColor() + ')';
        this.scale = function(val)
        {
            return 280 - (val / (this.max - this.min) * 280) + 10;
        }
        this.setActive = function(val)
        {
            this.min = 0;
            this.max = 1;
            this.active = val;
            this.color = 'rgb(' + this.randomColor() + ',' + this.randomColor() + ',' + this.randomColor() + ')';
        }
        this.draw = function(context, i)
        {
            if (!this.active) return;
            var current = this.counter.value();
            if (current > this.max)
                this.max = current;
            if (current < this.min)
                this.min = current;
            this.track.push(current);
            context.fillStyle = this.color;
            context.strokeStyle = this.color;
            if (this.track.length > 300)
                this.track.shift();
            context.fillText(this.track[this.track.length - 1].toFixed(2), 10, 290 - i * 10);
            context.fillText(this.label + ":" + this.min.toFixed(2) + "-" + this.max.toFixed(2), 50, 290 - i * 10);
            for (var j = 1; j < this.track.length; j++)
            {
                context.beginPath();
                context.moveTo(j - 1, this.scale(this.track[j - 1]));
                context.lineTo(j, this.scale(this.track[j]));
                context.stroke();
            }
            i++;
            context.fillText(this.track[this.track.length - 1].toFixed(2), 300 - (15 * i), this.scale(this.track[this.track.length - 1]));
        }
    }

    function initialize()
    {
        eventSource.call(this, "PerformanceManager");
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
        var TRL = TICK_ROLLING_AVERAGE_LENGTH;
        this.counters.RenderTime = new TimeCounter(TRL);
        this.counters.FPS = new TimeCounter(TRL);
        this.counters.TickTime = new TriggerTimer(TRL, 'Engine', 'tickStart', 'tickEnd');
        this.counters.DrawCalls = new FuncCounter(TRL, function()
        {
            if (!window._dRenderer) return 0;
            return _dRenderer.info.render.calls
        });
        this.counters.Cull = new TriggerTimer(TRL, 'SceneManager', 'cullStart', 'cullEnd');
        this.counters.Interp = new TriggerTimer(TRL, 'View', 'interpStart', 'interpEnd');
        this.counters.InterpRestore = new TriggerTimer(TRL, 'View', 'interpRestoreStart', 'interpRestoreEnd');
        this.counters.Perf = new TriggerTimer(TRL, 'PerformanceManager', 'drawGraphStart', 'drawGraphEnd');
        this.counters.SceneManager = new TriggerTimer(TRL, 'SceneManager', 'updateStart', 'updateEnd');
        this.counters.Script = new TriggerTimer(TRL, 'JavaScript', 'tickStart', 'tickEnd');
        this.counters.Physics = new TriggerTimer(TRL, 'Physics', 'tickStart', 'tickEnd');
        this.counters.Audio = new TriggerTimer(TRL, 'Audio', 'tickStart', 'tickEnd');
        this.counters.Pick = new TriggerTimer(TRL, 'View', 'pickStart', 'pickEnd');
        this.counters.MessageReceive = new EventsPerSecondTimer("Engine", "messageReceived");
        this.counters.MessageProcessed = new EventsPerSecondTimer("Engine", "messageProcessed");
        this.counters.MessageSent = new EventsPerSecondTimer("Engine", "messageSent");
        this.counters.MessageLoopback = new EventsPerSecondTimer("Engine", "messageLoopback");
        this.counters.MessageQueued = new FuncCounter(TRL, function()
        {
            return Engine.private.queue.queue.length
        });
        this.counters.Geometry = new FuncCounter(TRL, function()
        {
            if (!window._dRenderer) return 0;
            return _dRenderer.info.memory.geometries;
        });
        this.counters.Textures = new FuncCounter(TRL, function()
        {
            if (!window._dRenderer) return 0;
            return _dRenderer.info.memory.textures;
        });
        this.counters.Verts = new FuncCounter(TRL, function()
        {
            if (!window._dRenderer) return 0;
            return _dRenderer.info.render.vertices;
        });
        this.counters.Memory = new FuncCounter(TRL, function()
        {
            if (!window._dRenderer) return 0;
            return performance.memory.usedJSHeapSize;
        });
        this.counters.Nodes = new FuncCounter(TRL, function()
        {
            return Object.keys(Engine.models.object.objects).length;
        });
        this.counters.FPS.value = function()
        {
            return 1000 / this.averageTime;
        }
        this.tracks = {};
        this.tracks["Render"] = new recordTrack(this.counters.RenderTime, "Render", false);
        this.tracks["FPS"] = new recordTrack(this.counters.FPS, "FPS", true);
        this.tracks["Tick"] = new recordTrack(this.counters.TickTime, "Tick", true);
        this.tracks["Calls"] = new recordTrack(this.counters.DrawCalls, "Calls", false);
        this.tracks["Cull"] = new recordTrack(this.counters.Cull, "Cull", false);
        this.tracks["Interp"] = new recordTrack(this.counters.Interp, "Interp", false);
        this.tracks["Perf"] = new recordTrack(this.counters.Perf, "Perf", false);
        this.tracks["SceneManager"] = new recordTrack(this.counters.SceneManager, "SceneManager", false);
        this.tracks["Script"] = new recordTrack(this.counters.Script, "Script", false);
        this.tracks["Physics"] = new recordTrack(this.counters.Physics, "Physics", false);
        this.tracks["Audio"] = new recordTrack(this.counters.Audio, "Audio", false);
        this.tracks["Pick"] = new recordTrack(this.counters.Pick, "Pick", false);
        this.tracks["MessageReceive"] = new recordTrack(this.counters.MessageReceive, "Message Received /s", false);
        this.tracks["MessageProcessed"] = new recordTrack(this.counters.MessageProcessed, "Message Processed /s", false);
        this.tracks["MessageSent"] = new recordTrack(this.counters.MessageSent, "Message Sent /s", false);
        this.tracks["MessageLoopback"] = new recordTrack(this.counters.MessageLoopback, "Message Loopback /s", false);
        this.tracks["MessageQueued"] = new recordTrack(this.counters.MessageQueued, "Message Queued /s", false);
        this.tracks["Geometry"] = new recordTrack(this.counters.Geometry, "Geometries", false);
        this.tracks["Textures"] = new recordTrack(this.counters.Textures, "Textures", false);
        this.tracks["Verts"] = new recordTrack(this.counters.Verts, "Verticies", false);
        this.tracks["Memory"] = new recordTrack(this.counters.Memory, "Memory", false);
        this.tracks["Nodes"] = new recordTrack(this.counters.Nodes, "Nodes", false);
        window.setInterval(function()
        {
            this.trigger('oneSecond');
        }.bind(this), 1000);
        window.setInterval(function()
        {
            for (var i in this.counters)
                if (this.counters[i] instanceof FuncCounter)
                    this.counters[i].endSample();
            this.trigger('oneHundredMilliSecond');
        }.bind(this), 100);
        this.show = function()
        {
            $(document.body).append("<div id='statsPanel' />");
            $("#statsPanel").append("<canvas id='statsViewer' />");
            $('#statsViewer').attr("width", 300);
            $('#statsViewer').attr("height", 300);
            $('#statsViewer').css("height", 300);
            $('#statsViewer').css("width", 300);
            $('#statsViewer').css("position", 'absolute');
            $('#statsViewer').css("z-index", 999);
            $('#statsViewer').css("top", "0px");
            $('#statsViewer').css("left", "0px");
            $('#statsViewer').css("background", 'black');
            $('#statsPanel').css("position", 'absolute');
            $('#statsPanel').css("z-index", 999);
            $('#statsPanel').css("top", "0px");
            $('#statsPanel').css("left", "0px");
            this.context = document.getElementById('statsViewer').getContext("2d");
            $('#statsPanel').draggable();
            $("#statsPanel").append("<div id='statsTracks' />");
            $('#statsTracks').css("height", 300);
            $('#statsTracks').css("width", 150);
            $('#statsTracks').css("position", "absolute");
            $('#statsTracks').css("left", "300px");
            $('#statsTracks').css("background", "black");
            $('#statsTracks').css("color", "#999");
            $('#statsTracks').css("border-left", "5px solid black");
            $('#statsTracks').css("overflow", "auto");
            for (var i in this.tracks)
            {
                (function(track)
                {
                    var div = $('<div></div').appendTo('#statsTracks');
                    var check = $("<input type=checkbox>" + track.label + "</input>").appendTo(div);
                    check.css('color', track.color);
                    if (track.active)
                    {
                        $(check).attr('checked', true);
                    }
                    $(check).click(function()
                    {
                        track.setActive(!track.active);
                    });
                })(this.tracks[i]);
            }
            requestAnimationFrame(this.draw);
        }
        this.hide = function()
        {
            $('#statsPanel').remove();
            this.context = null;
        }
        this.isOpen = function()
        {
            return !!this.context;
        }
        this.draw = function()
        {
            if (this.context)
            {
                requestAnimationFrame(this.draw);
                this.trigger('drawGraphStart');
                this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height)
                var j = 0;
                for (var i in this.tracks)
                {
                    this.tracks[i].draw(this.context, j);
                    if (this.tracks[i].active)
                        j++;
                }
                this.trigger('drawGraphEnd');
            }
        }.bind(this);
        this.preFrame = function()
        {
            this.counters.RenderTime.startSample();
            //loop back around, for total time between frames
            this.counters.FPS.endSample();
            this.counters.FPS.startSample();
            this.FPS = 1000 / this.counters.FPS.averageTime;
            this.resizeCounter++;
            //if the fps is low, but the ticktime is fast enough, then we should be able to go faster
            if (this.originalResScale == 1) //only do this if the user did not set the frame scale. otherwise use the user setting
                if ((this.resizeCounter > FRAME_ROLLING_AVERAGE_LENGTH && Engine.getProperty(Engine.application(), 'playMode') != 'playing') ||
                (this.resizeCounter > FRAME_ROLLING_AVERAGE_LENGTH && Engine.getProperty(Engine.application(), 'playMode') == 'playing' && this.FPSTimeAverage < TICK_TIME_THRESHOLD))
            {
                this.resizeCounter = 0;
                var p = FPS_GOAL_NUMBER - this.FPS;
                this.FPSPID_I += p;
                if (this.FPSPID_I < 0)
                    this.FPSPID_I = 0;
                p *= .05;
                p += this.FPSPID_I * .005;
                var newResScale = 1 + p * Math.abs(p);
                if (newResScale > 16)
                    newResScale = 16;
                if (newResScale < 1)
                    newResScale = 1;
                newResScale = (Math.floor(newResScale * 1000)) / 1000;
                if (_SettingsManager.settings.resolutionScale != newResScale)
                {
                    _SettingsManager.settings.resolutionScale = newResScale;
                    if (_SettingsManager.settings.resolutionScale == 16)
                        alertify.error('Graphics performance problem detected!')
                        //this.scaleDisplayResolution();
                }
            }
        }.bind(this);
        eventSource.live("View", "preFrame", this.preFrame);
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
        this.postFrame = function()
        {
            this.counters.RenderTime.endSample();
        }.bind(this);
        eventSource.live("View", "postFrame", this.postFrame);
        this.ticked = function() {}
    }
});