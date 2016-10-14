var disableCompress = false;
var f = String.fromCharCode;
var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
var baseReverseDic = {};

function getBaseValue(alphabet, character)
{
    if (!baseReverseDic[alphabet])
    {
        baseReverseDic[alphabet] = {};
        for (var i = 0; i < alphabet.length; i++)
        {
            baseReverseDic[alphabet][alphabet.charAt(i)] = i;
        }
    }
    return baseReverseDic[alphabet][character];
}

function messageCompress()
{
    var messageCompress_body = {
        encode: function(message, key)
        {
            if (key && this.specialCaseEncode[key])
                return this.specialCaseEncode[key](message);
            if (typeof message == "number")
            {
                return Math.floor(message * 1000000) / 1000000;
            }
            if (typeof message == "string")
            {
                if (this.enc_mappings[message])
                    return this.enc_mappings[message]
                else
                {
                    if (message.length > 5 && message.length < 25 && message.indexOf('\n') == -1)
                    {
                        this.learnedMappings[message] = '';
                       // console.log('learning mapping for ' + message);
                    }
                    return message;
                }
            }
            if (typeof message == "boolean" || typeof message == "string" || typeof message == "number" || message === null || message === undefined)
                return message;
            var newmessage = {};
            if (message.constructor === Array)
            {
                var newmessage = [];
                for (var i = 0; i < message.length; i++)
                    newmessage[i] = this.encode(message[i])
                return newmessage;
            }
            else
            {
                for (var i in message)
                {
                    var key = this.enc_mappings[i];
                    if (key)
                    {
                        newmessage[key] = this.encode(message[i], i);
                    }
                    else
                        newmessage[i] = this.encode(message[i], i);
                }
                return newmessage;
            }
        },
        decode: function(message, key)
        {
            if (key && this.specialCaseDecode[key])
                return this.specialCaseDecode[key](message);
            if (typeof message == "string")
            {
                return this.dnc_mappings[message] || message
            }
            if (typeof message == "boolean" || typeof message == "string" || typeof message == "number" || message === null || message === undefined)
                return message;
            if (message.constructor === Array)
            {
                var newmessage = [];
                for (var i = 0; i < message.length; i++)
                    newmessage[i] = this.decode(message[i], i)
                return newmessage;
            }
            else
            {
                var newmessage = {};
                for (var i in message)
                {
                    var key = this.dnc_mappings[i];
                    if (key)
                    {
                        newmessage[key] = this.decode(message[i], key);
                    }
                    else
                        newmessage[i] = this.decode(message[i], i);
                }
                return newmessage;
            }
        },
        pack: function(message)
        {
            if (disableCompress) return message;
            if (message.constructor == String)
                return message;
            if (!this.initialized)
                this.initialize();
            this.learnedMappings = {};
            message = this.encode(message);
            this.postLearnedMappings(this.learnedMappings);
            this.learnedMappings = {};
            packed = JSON.stringify(message);
            //packed = packed.replace(/\\\"/g,String.fromCharCode(1))
            return packed;
        },
        unpack: function(message)
        {
            if (disableCompress) return message;
            if (message.constructor != String)
                return message;
            if (!this.initialized)
                this.initialize();
            //message = message.replace(new RegExp(String.fromCharCode(1),'g'),"\"")
            message = JSON.parse(message);
            message = this.decode(message);
            return message;
        },
        isServer: false,
        setServer: function(world)
        {
            this.world = world;
            this.isServer = true;
        },
        applyLearnedMappings: function(mapping)
        {
            if (!this.initialized)
                this.initialize();
            for (var i in mapping)
            {
                this.addMapping(i, mapping[i]);
            }
        },
        learnedMappingsTotal:
        {},
        postLearnedMappings: function(mapping)
        {
            if (!this.isServer) return;
            if (Object.keys(mapping).length == 0) return;
            for (var i in mapping)
            {
                mapping[i] = this.addMapping(i);
                if (this.learnedMappingsTotal[i])
                {
                    //   console.log('*** compression table duplicate ***')
                    //  console.log(i)
                }
                this.learnedMappingsTotal[i] = mapping[i];
                // console.log("mapping " + mapping[i] + " to " + i)
            }
            for (var i in this.world.clients)
            {
                this.world.clients[i].emit('compress', mapping);
            }
        },
        sendFullLearnedTable: function(client)
        {
            //  console.log(this.learnedMappingsTotal);
            client.emit('compress', this.learnedMappingsTotal);
        },
        initialized: false,
        initialize: function()
        {
            var self = this;
            /*   this.addSpecialCase("transform", function(val)
                   {
                       var t = new Float32Array(16);
                       for (var i = 0; i < 16; i++)
                           t[i] = val[i]
                       var data = self.compress(String.fromCharCode.apply(null, new Uint8Array(t.buffer)));

                       return data
                   },
                   function(val)
                   {
                       var t = new Uint8Array(16*4);
                       val = self.decompress(val);

                       for(var i = 0; i < val.length; i++)
                           t[i] = val.charCodeAt(i);

                       t = new Float32Array(t.buffer);
                       var ret = [];
                       for (var i = 0; i < 16; i++)
                           ret[i] = t[i];

                       return ret;
                   });
               
               this.addSpecialCase("scripts", function(val)
                   {
                       var data = self.compress(JSON.stringify(val));
                       return data
                   },
                   function(val)
                   {
                       val = self.decompress(val);
                       return val;
                   });
               //this.addSpecialCase("character-vwf-cosmos3d", function(val)
               //    {
               //        var data = self.compress(JSON.stringify(val));
               //        return data
               //    },
               //    function(val)
               //    {
               //        val = self.decompress(val);
               //        return val;
               //    });*/
            this.addMapping("tick");
            this.addMapping("eventData");
            this.addMapping("eventNodeData");
            this.addMapping("eventMessageData");
            this.addMapping("node");
            this.addMapping("time");
            this.addMapping("action");
            this.addMapping("member");
            this.addMapping("parameters");
            this.addMapping("button");
            this.addMapping("buttons");
            this.addMapping("clicks");
            this.addMapping("left");
            this.addMapping("right");
            this.addMapping("middle");
            this.addMapping("modifiers");
            this.addMapping("globalNormal");
            this.addMapping("globalSource");
            this.addMapping("globalPosition");
            this.addMapping("screenPosition");
            this.addMapping("pointerEnter");
            this.addMapping("pointerOut");
            this.addMapping("pointerIn");
            this.addMapping("pointerMove");
            this.addMapping("pointerOver");
            this.addMapping("pointerDown");
            this.addMapping("pointerUp");
            this.addMapping("pointerLeave");
            this.addMapping("pointerHover");
            this.addMapping("pointerWheel");
            this.addMapping("dispatchEvent");
            this.addMapping("keyDown");
            this.addMapping("keyUp");
            this.addMapping("shift");
            this.addMapping("ctrl");
            this.addMapping("meta");
            this.addMapping("alt");
            this.addMapping("distance");
            this.addMapping("transform");
            this.addMapping("false");
            this.addMapping("true");
            this.addMapping('false');
            this.addMapping('true');
            this.addMapping("position");
            this.addMapping("scene-c3d");
            this.addMapping("getProperty");
            this.addMapping("setProperty");
            this.addMapping("key");
            this.addMapping("code");
            this.addMapping("char");
            this.addMapping("keysUp");
            this.addMapping("keysDown");
            this.addMapping("mods");
            this.addMapping("space");
            this.addMapping('null');
            this.addMapping("deltaY");
            this.addMapping("client");
            this.addMapping("activeResync");
            this.addMapping("result");
            this.addMapping("properties");
            this.addMapping("___physics_activation_state");
            this.addMapping("___physics_deactivation_time");
            this.addMapping("___physics_velocity_linear");
            this.addMapping("___physics_velocity_angular");
            this.addMapping("DisplayName");
            this.addMapping("___physics_enabled");
            this.addMapping("isSelectable");
            this.addMapping("materialDef");
            this.addMapping("alpha");
            this.addMapping("ambient");
            this.addMapping("color");
            this.addMapping("emit");
            this.addMapping("layers");
            this.addMapping("blendMode");
            this.addMapping("mapInput");
            this.addMapping("mapTo");
            this.addMapping("offsetx");
            this.addMapping("offsety");
            this.addMapping("rot");
            this.addMapping("scalex");
            this.addMapping("scaley");
            this.addMapping("morphTargets");
            this.addMapping("reflect");
            this.addMapping("shadeless");
            this.addMapping("morphTargets");
            this.addMapping("shadow");
            this.addMapping("shininess");
            this.addMapping("skinning");
            this.addMapping("specularColor");
            this.addMapping("specularLevel");
            this.addMapping("type");
            this.addMapping("phong");
            this.addMapping("owner");
            this.addMapping("radius");
            this.addMapping("size");
            this.addMapping("tempid");
            this.addMapping("texture");
            this.addMapping("Primitive");
            this.addMapping("count");
            this.addMapping("translation");
            this.addMapping("3DR Object");
            this.addMapping("___physics_mass");
            this.addMapping("resyncNode");
            this.addMapping("___physics_angular_velocity");
            this.addMapping("___physics_collision_height");
            this.addMapping("___physics_collision_type");
            this.addMapping("___physics_collision_radius");
            this.addMapping("___physics_linear_velocity");
            this.addMapping("depthtest");
            this.addMapping("depthwrite");
            this.addMapping("castShadows");
            this.addMapping("_length");
            this.addMapping("castShadows");
            this.addMapping("receiveShadows");
            this.addMapping("animationFrame");
            this.addMapping("animationStart");
            this.addMapping("animationEnd");
            this.addMapping("subDriver/threejs/asset/vnd.collada+xml");
            this.addMapping("link_existing/threejs");
            this.addMapping("sequence");
            this.addMapping("random");
            this.addMapping("children");
            this.addMapping("extends");
            this.addMapping("source");
            this.addMapping("simulationStateUpdate");
            this.addMapping("cycles");
            this.addMapping("stand");
            this.addMapping("start");
            this.addMapping("length");
            this.addMapping("speed");
            this.addMapping("current");
            this.addMapping("loop");
            this.addMapping("walk");
            this.addMapping("handlerIndex");
            this.addMapping("handlerLength");
            this.addMapping("jump");
            this.addMapping("runningjump");
            this.addMapping("strafeleft");
            this.addMapping("straferight");
            this.addMapping("walkback");
            this.addMapping("motionStack");
            this.addMapping("activeCycle");
            this.addMapping("oldRotZ");
            this.addMapping("origin");
            this.addMapping("reflector");
            this.addMapping("callMethod");
            this.addMapping("lookat");
            this.addMapping("worldPickRay");
            this.addMapping("keyPress");
            this.addMapping(":false");
            this.addMapping(":true");
            this.addMapping("status");
            this.addMapping("upgrades");
            this.addMapping("pingInterval");
            this.addMapping("pingTimeout");
            this.addMapping("Loading state from database");
            this.addMapping("State loaded, sending...");
            this.addMapping("createNode");
            this.addMapping("http://vwf.example.com/navscene.vwf");
            this.addMapping("clients");
            this.addMapping("glyphURL");
            this.addMapping("../vwf/view/editorview/images/icons/scene.png");
            this.addMapping("simTime");
            this.addMapping("placemarks");
            this.addMapping("Origin");
            this.addMapping("navmode");
            this.addMapping("none");
            this.addMapping("sunColor");
            this.addMapping("sunDirection");
            this.addMapping("sunIntensity");
            this.addMapping("shadowDarkness");
            this.addMapping("ambientColor");
            this.addMapping("fogColor");
            this.addMapping("fogNear");
            this.addMapping("fogFar");
            this.addMapping("fogType");
            this.addMapping("fogDensity");
            this.addMapping("fogVFalloff");
            this.addMapping("fogVFalloffStart");
            this.addMapping("skyColorBlend");
            this.addMapping("skyFogBlend");
            this.addMapping("skyApexColor");
            this.addMapping("skyHorizonColor");
            this.addMapping("___physics_gravity");
            this.addMapping("___physics_accuracy");
            this.addMapping("___physics_active");
            this.addMapping("vAtmosphereDensity");
            this.addMapping("playMode");
            this.addMapping("play");
            this.addMapping("octreeObjects");
            this.addMapping("octreeDepth");
            this.addMapping("octreeExtents");
            this.addMapping("skyTexture");
            this.addMapping("cosmos3d");
            this.addMapping("scene");
            this.addMapping("EditorData");
            this.addMapping("displayname");
            this.addMapping("sectionTitle");
            this.addMapping("Fog Near");
            this.addMapping("property");
            this.addMapping("slider");
            this.addMapping("min");
            this.addMapping("max");
            this.addMapping("step");
            this.addMapping("Fog Falloff");
            this.addMapping("Sun Intensity");
            this.addMapping("Fog Type");
            this.addMapping("choice");
            this.addMapping("values");
            this.addMapping("sunambientColor");
            this.addMapping("Sun Color");
            this.addMapping("sunRot");
            this.addMapping("Sun Direction");
            this.addMapping("sunShadowDarkness");
            this.addMapping("Sun Shadow Density");
            this.addMapping("vector");
            this.addMapping("Octree Max Depth");
            this.addMapping("OctreeDepth");
            this.addMapping("Octree Accelerator");
            this.addMapping("Octree");
            this.addMapping("Sky Horizon Color");
            this.addMapping("Octree Size (m)");
            this.addMapping("OctreeObjects");
            this.addMapping("Max Objects per Octree Cell");
            this.addMapping("worldSize");
            this.addMapping("maxUser");
            this.addMapping("worldType");
            this.addMapping("created");
            this.addMapping("permission");
            this.addMapping("Everyone");
            this.addMapping("clientConnected");
            this.addMapping("avatarCreated");
            this.addMapping("disconnected");
            this.addMapping("clientDisconnected");
            this.addMapping("pointerClick");
            this.addMapping("Fog Density");
            this.addMapping("Fog Color");
            this.addMapping("fogColorR");
            this.addMapping("Sky Texture Presets");
            this.addMapping("labels");
            this.addMapping("Alpine");
            this.addMapping("alpine");
            this.addMapping("Blue_Sky");
            this.addMapping("blue_Sky");
            this.addMapping("Bright");
            this.addMapping("bright");
            this.addMapping("Clouds");
            this.addMapping("clouds");
            this.addMapping("Delirious");
            this.addMapping("delirious");
            this.addMapping("Mars");
            this.addMapping("mars");
            this.addMapping("Night");
            this.addMapping("night");
            this.addMapping("Nebula");
            this.addMapping("nebula");
            this.addMapping("Orange");
            this.addMapping("orange");
            this.addMapping("Plain Sky");
            this.addMapping("plain_sky");
            this.addMapping("Sea Day");
            this.addMapping("seaday");
            this.addMapping("Stars");
            this.addMapping("stars");
            this.addMapping("Sun Down");
            this.addMapping("sundown");
            this.addMapping("Sunset");
            this.addMapping("sunset");
            this.addMapping("Skyfy");
            this.addMapping("skyfy");
            this.addMapping("Tropical");
            this.addMapping("tropical");
            this.addMapping("White");
            this.addMapping("white");
            this.addMapping("Black");
            this.addMapping("skyTexture");
            this.addMapping("Select Sky Cubemap");
            this.addMapping("Sky Color Blend");
            this.addMapping("Sky Fog Amount");
            this.addMapping("skyAtmosphereDensity");
            this.addMapping("Atmosphere Density");
            this.addMapping("Sky Apex Color");
            this.addMapping("OctreeDepth");
            this.addMapping("OctreeExtents");
            this.addMapping("OctreeObjects");
            this.addMapping("scene.c3d");
            this.addMapping("activteOculusBridge");
            this.addMapping("___physics_world_reset");
            this.addMapping("setMusic");
            this.addMapping("cameraBroadcastEnd");
            this.addMapping("playSound");
            this.addMapping("getBroadcasting");
            this.addMapping("broadcastCameraPosition");
            this.addMapping("loaded");
            this.addMapping(":null,");
            this.addMapping(":null");
            this.addMapping(":true,");
            this.addMapping("cameraBroadcastStart");
            this.addMapping("getSkyMat");
            this.addMapping("latencyTest");
            this.addMapping("updateOnlineUsers");
            this.addMapping("Teleport");
            this.addMapping("ItemTransfer");
            this.addMapping("FriendRequest");
            this.addMapping("GetPM");
            this.addMapping("PMGlobal");
            this.addMapping("CreatePlane");
            this.addMapping("receiveChat");
            this.addMapping("initialize");
            this.addMapping("deleteplayer");
            this.addMapping("newplayer");
            this.addMapping("AmLocal");
            this.addMapping("methods");
            this.addMapping("clientCameraChanged");
            this.addMapping("events");
            this.addMapping("virtual");
            this.addMapping("zOctreeObjects");
            this.addMapping("zOctreeExtents");
            this.addMapping("zOctreeDepth");
            this.addMapping("black");
            this.addMapping("skyTexture2");
            this.addMapping("fireEvent");
            this.addMapping(":[1,1,1],");
            this.addMapping(":[0,0,0],");
            this.addMapping("[0,0,0]");
            this.addMapping("[1,1,1]");
            this.addMapping("PeerSelection");
            this.addMapping("createChild");
            this.addMapping("phantomAsset.vwf");
            this.addMapping("creator");
            this.addMapping("isDynamic");
            this.addMapping("isStatic");
            this.addMapping("nextPermissions");
            this.addMapping("passable");
            this.addMapping("permissions");
            this.addMapping("clothings");
            this.addMapping("subDriver/threejs/asset/vnd.gltf+json");
            this.addMapping("setClientCamera");
            this.addMapping("patches");
            this.addMapping("getGroundPlane");
            this.addMapping("Linear");
            this.addMapping("None");
            this.addMapping("Quad");
            this.addMapping("Fog Falloff Start");
            this.addMapping("fogvFAlloffStart");
            this.addMapping("fogvFAlloff");
            this.addMapping("Fog Far");
            this.addMapping("message");
            this.initialized = true;
        },
        enc_mappings:
        {},
        dnc_mappings:
        {},
        tableSize: 0,
        specialCaseEncode:
        {},
        specialCaseDecode:
        {},
        addSpecialCase: function(key, encode, decode)
        {
            this.specialCaseEncode[key] = encode;
            this.specialCaseDecode[key] = decode;
        },
        addMapping: function(from, forcekey)
        {
            var key = forcekey || String.fromCharCode(this.tableSize + 128)
            this.dnc_mappings[key] = from
            this.enc_mappings[from] = key
            this.tableSize++;
            return key;
        },
        compressToBase64: function(input)
        {
            if (input == null) return "";
            var res = this._compress(input, 6, function(a)
            {
                return keyStrBase64.charAt(a);
            });
            switch (res.length % 4)
            { // To produce valid Base64
                default: // When could this happen ?
                    case 0:
                    return res;
                case 1:
                        return res + "===";
                case 2:
                        return res + "==";
                case 3:
                        return res + "=";
            }
        },
        decompressFromBase64: function(input)
        {
            if (input == null) return "";
            if (input == "") return null;
            return this._decompress(input.length, 32, function(index)
            {
                return getBaseValue(keyStrBase64, input.charAt(index));
            });
        },
        compressToUTF16: function(input)
        {
            if (input == null) return "";
            return this._compress(input, 15, function(a)
            {
                return f(a + 32);
            }) + " ";
        },
        decompressFromUTF16: function(compressed)
        {
            if (compressed == null) return "";
            if (compressed == "") return null;
            return this._decompress(compressed.length, 16384, function(index)
            {
                return compressed.charCodeAt(index) - 32;
            });
        },
        //compress into uint8array (UCS-2 big endian format)
        compressToUint8Array: function(uncompressed)
        {
            var compressed = this.compress(uncompressed);
            var buf = new Uint8Array(compressed.length * 2); // 2 bytes per character
            for (var i = 0, TotalLen = compressed.length; i < TotalLen; i++)
            {
                var current_value = compressed.charCodeAt(i);
                buf[i * 2] = current_value >>> 8;
                buf[i * 2 + 1] = current_value % 256;
            }
            return buf;
        },
        //decompress from uint8array (UCS-2 big endian format)
        decompressFromUint8Array: function(compressed)
        {
            if (compressed === null || compressed === undefined)
            {
                return this.decompress(compressed);
            }
            else
            {
                var buf = new Array(compressed.length / 2); // 2 bytes per character
                for (var i = 0, TotalLen = buf.length; i < TotalLen; i++)
                {
                    buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
                }
                var result = [];
                buf.forEach(function(c)
                {
                    result.push(f(c));
                });
                return this.decompress(result.join(''));
            }
        },
        //compress into a string that is already URI encoded
        compressToEncodedURIComponent: function(input)
        {
            if (input == null) return "";
            return this._compress(input, 6, function(a)
            {
                return keyStrUriSafe.charAt(a);
            });
        },
        //decompress from an output of compressToEncodedURIComponent
        decompressFromEncodedURIComponent: function(input)
        {
            if (input == null) return "";
            if (input == "") return null;
            input = input.replace(/ /g, "+");
            return this._decompress(input.length, 32, function(index)
            {
                return getBaseValue(keyStrUriSafe, input.charAt(index));
            });
        },
        compress: function(uncompressed)
        {
            return this._compress(uncompressed, 16, function(a)
            {
                return f(a);
            });
        },
        _compress: function(uncompressed, bitsPerChar, getCharFromInt)
        {
            if (uncompressed == null) return "";
            var i, value,
                context_dictionary = {},
                context_dictionaryToCreate = {},
                context_c = "",
                context_wc = "",
                context_w = "",
                context_enlargeIn = 2, // Compensate for the first entry which should not count
                context_dictSize = 3,
                context_numBits = 2,
                context_data = [],
                context_data_val = 0,
                context_data_position = 0,
                ii;
            for (ii = 0; ii < uncompressed.length; ii += 1)
            {
                context_c = uncompressed.charAt(ii);
                if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c))
                {
                    context_dictionary[context_c] = context_dictSize++;
                    context_dictionaryToCreate[context_c] = true;
                }
                context_wc = context_w + context_c;
                if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc))
                {
                    context_w = context_wc;
                }
                else
                {
                    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w))
                    {
                        if (context_w.charCodeAt(0) < 256)
                        {
                            for (i = 0; i < context_numBits; i++)
                            {
                                context_data_val = (context_data_val << 1);
                                if (context_data_position == bitsPerChar - 1)
                                {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else
                                {
                                    context_data_position++;
                                }
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 8; i++)
                            {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1)
                                {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else
                                {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        else
                        {
                            value = 1;
                            for (i = 0; i < context_numBits; i++)
                            {
                                context_data_val = (context_data_val << 1) | value;
                                if (context_data_position == bitsPerChar - 1)
                                {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else
                                {
                                    context_data_position++;
                                }
                                value = 0;
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 16; i++)
                            {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1)
                                {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else
                                {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        context_enlargeIn--;
                        if (context_enlargeIn == 0)
                        {
                            context_enlargeIn = Math.pow(2, context_numBits);
                            context_numBits++;
                        }
                        delete context_dictionaryToCreate[context_w];
                    }
                    else
                    {
                        value = context_dictionary[context_w];
                        for (i = 0; i < context_numBits; i++)
                        {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1)
                            {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else
                            {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0)
                    {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    // Add wc to the dictionary.
                    context_dictionary[context_wc] = context_dictSize++;
                    context_w = String(context_c);
                }
            }
            // Output the code for w.
            if (context_w !== "")
            {
                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w))
                {
                    if (context_w.charCodeAt(0) < 256)
                    {
                        for (i = 0; i < context_numBits; i++)
                        {
                            context_data_val = (context_data_val << 1);
                            if (context_data_position == bitsPerChar - 1)
                            {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else
                            {
                                context_data_position++;
                            }
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 8; i++)
                        {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1)
                            {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else
                            {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    else
                    {
                        value = 1;
                        for (i = 0; i < context_numBits; i++)
                        {
                            context_data_val = (context_data_val << 1) | value;
                            if (context_data_position == bitsPerChar - 1)
                            {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else
                            {
                                context_data_position++;
                            }
                            value = 0;
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 16; i++)
                        {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1)
                            {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else
                            {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0)
                    {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    delete context_dictionaryToCreate[context_w];
                }
                else
                {
                    value = context_dictionary[context_w];
                    for (i = 0; i < context_numBits; i++)
                    {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1)
                        {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        }
                        else
                        {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0)
                {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                }
            }
            // Mark the end of the stream
            value = 2;
            for (i = 0; i < context_numBits; i++)
            {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == bitsPerChar - 1)
                {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                }
                else
                {
                    context_data_position++;
                }
                value = value >> 1;
            }
            // Flush the last char
            while (true)
            {
                context_data_val = (context_data_val << 1);
                if (context_data_position == bitsPerChar - 1)
                {
                    context_data.push(getCharFromInt(context_data_val));
                    break;
                }
                else context_data_position++;
            }
            return context_data.join('');
        },
        decompress: function(compressed)
        {
            if (compressed == null) return "";
            if (compressed == "") return null;
            return this._decompress(compressed.length, 32768, function(index)
            {
                return compressed.charCodeAt(index);
            });
        },
        _decompress: function(length, resetValue, getNextValue)
        {
            var dictionary = [],
                next,
                enlargeIn = 4,
                dictSize = 4,
                numBits = 3,
                entry = "",
                result = [],
                i,
                w,
                bits, resb, maxpower, power,
                c,
                data = {
                    val: getNextValue(0),
                    position: resetValue,
                    index: 1
                };
            for (i = 0; i < 3; i += 1)
            {
                dictionary[i] = i;
            }
            bits = 0;
            maxpower = Math.pow(2, 2);
            power = 1;
            while (power != maxpower)
            {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0)
                {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
            }
            switch (next = bits)
            {
                case 0:
                    bits = 0;
                    maxpower = Math.pow(2, 8);
                    power = 1;
                    while (power != maxpower)
                    {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0)
                        {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = f(bits);
                    break;
                case 1:
                    bits = 0;
                    maxpower = Math.pow(2, 16);
                    power = 1;
                    while (power != maxpower)
                    {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0)
                        {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = f(bits);
                    break;
                case 2:
                    return "";
            }
            dictionary[3] = c;
            w = c;
            result.push(c);
            while (true)
            {
                if (data.index > length)
                {
                    return "";
                }
                bits = 0;
                maxpower = Math.pow(2, numBits);
                power = 1;
                while (power != maxpower)
                {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0)
                    {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }
                switch (c = bits)
                {
                    case 0:
                        bits = 0;
                        maxpower = Math.pow(2, 8);
                        power = 1;
                        while (power != maxpower)
                        {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0)
                            {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        dictionary[dictSize++] = f(bits);
                        c = dictSize - 1;
                        enlargeIn--;
                        break;
                    case 1:
                        bits = 0;
                        maxpower = Math.pow(2, 16);
                        power = 1;
                        while (power != maxpower)
                        {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0)
                            {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        dictionary[dictSize++] = f(bits);
                        c = dictSize - 1;
                        enlargeIn--;
                        break;
                    case 2:
                        return result.join('');
                }
                if (enlargeIn == 0)
                {
                    enlargeIn = Math.pow(2, numBits);
                    numBits++;
                }
                if (dictionary[c])
                {
                    entry = dictionary[c];
                }
                else
                {
                    if (c === dictSize)
                    {
                        entry = w + w.charAt(0);
                    }
                    else
                    {
                        return null;
                    }
                }
                result.push(entry);
                // Add w+entry[0] to the dictionary.
                dictionary[dictSize++] = w + entry.charAt(0);
                enlargeIn--;
                w = entry;
                if (enlargeIn == 0)
                {
                    enlargeIn = Math.pow(2, numBits);
                    numBits++;
                }
            }
        }
    };
    return messageCompress_body;
}
try
{
    // on client via requrie we just return a new instance
    window && define("messageCompress", messageCompress());
}
catch (e)
{}
try
{
    //server side we export the constructor, since each world will need one
    exports.messageCompress = messageCompress;
    try
    {   //this can be very tricky, becasuse an exception with these modules looks like we're in the browser 
        global.btoa = require("btoa");
        global.atob = require("atob");
    }
    catch (e)
    {
        console.log(e)
    }
}
catch (e)
{
    //on client in worker we define a new instance globally
    this.messageCompress = messageCompress();
}