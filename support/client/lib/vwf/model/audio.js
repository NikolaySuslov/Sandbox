"use strict";
/*
 * WebRTC.js : Behaves as a wrapper for vwf/view/rtcObject
 * Maps simple 1:1 signal model to a broadcast model using target and sender ids
 */
define(["module", "vwf/model", "vwf/model/buzz/buzz.min","vwf/utility/eventSource"], function(module, model, buzz,eventSource)
{
    //a simple structure to hold the BUZZ sound reference and position data
    function SoundSource()
    {
        this.id = null;
        this.sound = null;
        this.position = null;
        this.volume = 1;
        this.endrange = 100;
        this.startrange = 1;
        this.looping = false;
        this.playing = false;
        this.play = function()
        {
            if (!this.playing)
                this.sound.play();
            if (this.playing && this.sound.getPercent() == 100)
            {
                this.sound.stop();
                this.sound.play();
            }
            this.playing = true;
        }
        this.pause = function()
        {
            if (this.playing)
                this.sound.pause();
            this.playing = false;
        }
        this.stop = function()
        {
            if (this.playing)
                this.sound.stop();
            this.playing = false;
        }
        this.isPlaying = function()
        {
            if (this.looping) return this.playing;
            return (this.playing && this.sound.getPercent() < 100);

        }
    }
    SoundSource.prototype.loop = function()
    {
        if (!this.looping)
        {
            this.looping = true;
            this.sound.loop();
        }
    }
    SoundSource.prototype.unloop = function()
    {
        if (this.looping)
        {
            this.looping = false;
            this.sound.unloop();
        }
    }
    //Get the position of your source object
    //note: the 3D driver must keep track of this
    SoundSource.prototype.updateSourcePosition = function()
    {
        this.position = Engine.getPropertyFast(this.id, 'worldPosition');
    }
    //use inverse falloff, adjust the range parameters of the falloff curve by the "volume"
    //since HTML cant actually play it louder, but we can make it 'carry' farther
    SoundSource.prototype.updateVolume = function(camerapos)
    {
        var x = Vec3.distance(camerapos, this.position);
        x = Math.max(0, x);
        var v = this.volume;
        var vol = ((-x + v) / v) * ((-x + v) / v);
        if (x > v) vol = 0;
        this.sound.setVolume(Math.max(Math.min(vol, 1), 0) * 100);
    }
    //the driver
    return model.load(module,
    {
        initialize: function()
        {
            eventSource.call(this,"Audio");
            this.buzz = buzz;
            window._buzz = this.buzz;
            this.sounds = {};
            this.soundSources = {};
            //set this up as a global, so that we can play a click to indicate GUI actions
            window._SoundManager = this;
        },

        _playMode: false,
        settingProperty: function(id, propertyName, propertyValue)
        {
            if(id === 'index-vwf' && propertyName === 'playMode'){
                this._playMode = propertyValue === 'play';
                if(!this._playMode)
                {
                    for(var i in this.sounds){
                        this.sounds[i].stop();
                    }
                    for(var i in this.soundSources){
                        this.soundSources[i].stop();
                    }
                }
            }
        },

        //simple function for gui elements to play sounds
        playSound: function(url, volume)
        {
            this.callingMethod('index-vwf', 'playSound', [url, false, volume]);
        },
        callingMethod: function(always_application, name, params)
        {

           
            //if the scene played the sound, it has no position and just plays at full volume
            if (name == 'playSound' && params[0] == 'index-vwf' && this._playMode)
            {
                 var id = params.shift();
                var url = params[0];
                var loop = params[1] || false;
                var restart = params[3];
                if(restart === undefined)
                    restart = true;
                //cache the sound - can only be played simultainously by different nodes
                if (this.sounds[url])
                {

                    
                    var vol = params[2] || 100;
                    if (this.sounds[url].getPercent() == 100)
                    {
                        this.sounds[url].stop();
                        this.sounds[url].setPercent(0);
                    }
                    if(restart)
                        this.sounds[url].setPercent(0);
                    this.sounds[url].play();
                    if (loop)
                        this.sounds[url].loop();
                    else
                        this.sounds[url].unloop();
                    this.sounds[url].volume = vol/100;
                }
                else
                {
                    var mySound = new this.buzz.sound(url,
                    {
                        autoplay: false,
                        loop: loop
                    });
                    this.sounds[url] = mySound;
                    mySound.play();
                }
            }
            //Nodes that are not the scene use their position to adjust the volume
            else if (name == 'playSound' && this._playMode)
            {
                 var id = params.shift();
                var url = params[0];
                var loop = params[1] || false;
                var vol = params[2] || 1;
                var restart = params[3];
                if(restart === undefined)
                    restart = true;
                var soundid = id + url;
                var Sound = this.soundSources[soundid];
                var campos = [_dView.getCamera().matrixWorld.elements[12], _dView.getCamera().matrixWorld.elements[13], _dView.getCamera().matrixWorld.elements[14]];
                var sourcepos = Engine.getPropertyFast(id, "worldPosition");
                if(!sourcepos) return;
                var dist = MATH.distanceVec3(campos, sourcepos);
                if(loop) //no speed of sound sim for looping sounds
                    dist = 0;
              //  window.setTimeout(function()
               // {

                    //cache the sound - can only be played simultainously by different nodes
                    if (!Sound)
                    {
                        var Sound = this.soundSources[soundid] = new SoundSource()
                        Sound.id = id;
                        Sound.url = url;
                        Sound.volume = vol;
                        Sound.sound = new this.buzz.sound(url,
                        {
                            autoplay: true,
                            loop: loop
                        });
                        Sound.playing = true;
                        Sound.looping = loop;
                        Sound.position = [0, 0, 0];
                        window._dSound = Sound;
                    }
                    else
                    {
                        if (Sound.sound.getPercent() == 100 && !Sound.looping)
                        {
                            Sound.stop();
                            Sound.sound.setPercent(0);
                        }
                        if(restart)
                            Sound.sound.setPercent(0);
                        if(!Sound.isPlaying())
                        Sound.play();
                        if (loop)
                            if(!Sound.looping)
                                Sound.loop();
                        else
                            Sound.unloop();
                        Sound.volume = vol;
                    }
                    this.soundSources[soundid].updateSourcePosition();
                    this.soundSources[soundid].updateVolume(campos);

               // }.bind(this), dist * 2.941); // 1 meter in 2.941 milliseconds. 340 meters per second, so 2.941 seconds per 1000m
            }
            if (name == 'getSounds')
            {
                 var id = params.shift();
                var list = [];
                for (var i in this.soundSources)
                {
                    if (i.indexOf(id) == 0)
                        list.push(i);
                }
                return i;
            }
            if (name == 'getSound')
            {
                 var id = params.shift();
                for (var i in this.soundSources)
                {
                    if (i == id + params[0])
                        return this.soundSources[i]
                }
            }
            if (name == 'isPlaying')
            {
                 var id = params.shift();
                for (var i in this.soundSources)
                {
                    if (i == id + params[0])
                    {
                        var sound = this.soundSources[i];
                        return sound.playing
                    }
                }
            }
            //pause the sound
            if (name == 'pauseSound')
            {
                 var id = params.shift();
                var url = params[0];
                var soundid = id + url;
                var Sound = this.soundSources[soundid];
                if (Sound)
                    Sound.pause();
            }
            //stop the sound
            if (name == 'stopSound')
            {
                 var id = params.shift();
                var url = params[0];
                var soundid = id + url;
                var Sound = this.soundSources[soundid];
                if (Sound)
                    Sound.stop();
                if (this.sounds[url])
                {
                    this.sounds[url].stop();
                }
            }
            //delete the sound completely - only use this if you sure the sound will not play again anytime soon.
            if (name == 'deleteSound')
            {
                 var id = params.shift();
                var url = params[0];
                var soundid = id + url;
                var Sound = this.soundSources[soundid];
                if (Sound)
                {
                    Sound.stop();
                    Sound.sound = null;
                }
                delete this.soundSources[soundid];
            }
        },
        //Update the sound volume based on the position of the camera and the position of the object
        ticking: function()
        {
            this.trigger("tickStart")
            try
            {
                var campos = [_dView.getCamera().matrixWorld.elements[12], _dView.getCamera().matrixWorld.elements[13], _dView.getCamera().matrixWorld.elements[14]];
                for (var i in this.soundSources)
                {
                    this.soundSources[i].updateSourcePosition();
                    this.soundSources[i].updateVolume(campos);
                }
            }
            catch (e)
            {}
            this.trigger("tickEnd");
        },
        deletingNode: function(id)
        {
            for (var i in this.soundSources)
            {
                if (this.soundSources[i].id == id){
                    this.soundSources[i].stop();
                    this.soundSources[i].sound = null;
                    delete this.soundSources[i];
                }
            }
        }
    })
});
