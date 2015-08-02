var GUID = require('node-uuid').v4;
var avatarDef = {
    "children": {
        "N76263180": {
            "extends": "box2.vwf",
            "properties": {
                "DisplayName": "CharacterCollision",
                "___physics_activation_state": 1,
                "___physics_deactivation_time": 0,
                "___physics_enabled": true,
                "___physics_velocity_angular": [0, 0, 0],
                "___physics_velocity_linear": [0, 0, 0],
                "_length": 0.8,
                "height": 1.54,
                "isSelectable": false,
                "owner": "Rob",
                "transform": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0.8009999394416809, 1],
                "type": "Primitive",
                "visible": false,
                "width": 0.62
            },
            "random": {
                "c": 1,
                "s0": 0.0696421356406063,
                "s1": 0.684400561265647,
                "s2": 0.819418301805854
            },
            "sequence": 0,
            "source": "vwf/model/threejs/box.js",
            "type": "subDriver/threejs"
        },
        "N6581f10c": {
            "extends": "phantomAsset.vwf",
            "properties": {
                "DisplayName": "./avatars/Male_Jeans.DAE1",
                "___physics_activation_state": 1,
                "___physics_deactivation_time": 0,
                "___physics_velocity_angular": [0, 0, 0],
                "___physics_velocity_linear": [0, 0, 0],
                "materialDef": {
                    "alpha": 1,
                    "ambient": {
                        "b": 1,
                        "g": 1,
                        "r": 1
                    },
                    "color": {
                        "b": 1,
                        "g": 1,
                        "r": 1
                    },
                    "emit": {
                        "b": 0,
                        "g": 0,
                        "r": 0
                    },
                    "layers": [{
                            "alpha": 1,
                            "mapInput": 0,
                            "mapTo": 1,
                            "offsetx": 0,
                            "offsety": 0,
                            "scalex": 1,
                            "scaley": 1,
                            "src": "./avatars/Male_Jeans_Color.jpg"
                        }, {
                            "alpha": 1,
                            "blendMode": 0,
                            "mapInput": 0,
                            "mapTo": "4",
                            "offsetx": 0,
                            "offsety": 0,
                            "rot": 0,
                            "scalex": 1,
                            "scaley": 1,
                            "src": "./avatars/Male_Jeans_Normal.jpg"
                        }
                    ],
                    "reflect": 0.001,
                    "shininess": 0.000002,
                    "side": 0,
                    "specularColor": {
                        "b": 0.007,
                        "g": 0.007,
                        "r": 0.007
                    },
                    "specularLevel": 1,
                    "type": "phong"
                },
                "owner": "Rob",
                "transform": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, -0.25, 0.75, 1]
            },
            "random": {
                "c": 1,
                "s0": 0.219412999460474,
                "s1": 0.29347495152615,
                "s2": 0.135632110526785
            },
            "sequence": 0,
            "source": "./avatars/Male_Jeans.json",
            "type": "subDriver/threejs/asset/vnd.gltf+json"
        },
        "Nf714e4e8": {
            "extends": "phantomAsset.vwf",
            "properties": {
                "DisplayName": "./avatars/Male_Tennis_Shoes.DAE1",
                "___physics_activation_state": 1,
                "___physics_deactivation_time": 0,
                "___physics_velocity_angular": [0, 0, 0],
                "___physics_velocity_linear": [0, 0, 0],
                "animationFrame": 0,
                "materialDef": {
                    "alpha": 1,
                    "ambient": {
                        "b": 1,
                        "g": 1,
                        "r": 1
                    },
                    "color": {
                        "b": 1,
                        "g": 1,
                        "r": 1
                    },
                    "emit": {
                        "b": 0,
                        "g": 0,
                        "r": 0
                    },
                    "layers": [{
                            "alpha": 1,
                            "mapInput": 0,
                            "mapTo": 1,
                            "offsetx": 0,
                            "offsety": 0,
                            "scalex": 1,
                            "scaley": 1,
                            "src": "./avatars/Male_TShoes_Color.jpg"
                        }, {
                            "alpha": 1,
                            "blendMode": 0,
                            "mapInput": 0,
                            "mapTo": "4",
                            "offsetx": 0,
                            "offsety": 0,
                            "rot": 0,
                            "scalex": 1,
                            "scaley": 1,
                            "src": "./avatars/Male_TShoes_Normal.jpg"
                        }
                    ],
                    "reflect": 0.001,
                    "shininess": 0.000002,
                    "side": 0,
                    "specularColor": {
                        "b": 0.007,
                        "g": 0.007,
                        "r": 0.007
                    },
                    "specularLevel": 1,
                    "type": "phong"
                },
                "owner": "Rob",
                "transform": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, -0.5, 0, 1]
            },
            "random": {
                "c": 1,
                "s0": 0.845734530361369,
                "s1": 0.849862790899351,
                "s2": 0.988476545317098
            },
            "sequence": 0,
            "source": "./avatars/Male_Tennis_Shoes.json",
            "type": "subDriver/threejs/asset/vnd.gltf+json"
        },
        "Nfa92f98": {
            "extends": "phantomAsset.vwf",
            "properties": {
                "DisplayName": "./avatars/Male_T_Shirt.DAE1",
                "___physics_activation_state": 1,
                "___physics_deactivation_time": 0,
                "___physics_velocity_angular": [0, 0, 0],
                "___physics_velocity_linear": [0, 0, 0],
                "materialDef": {
                    "alpha": 1,
                    "ambient": {
                        "b": 1,
                        "g": 1,
                        "r": 1
                    },
                    "color": {
                        "b": 1,
                        "g": 1,
                        "r": 1
                    },
                    "emit": {
                        "b": 0,
                        "g": 0,
                        "r": 0
                    },
                    "layers": [{
                            "alpha": 1,
                            "mapInput": 0,
                            "mapTo": 1,
                            "offsetx": 0,
                            "offsety": 0,
                            "scalex": 1,
                            "scaley": 1,
                            "src": "./avatars/Male_Tshirt_Color.jpg"
                        }, {
                            "alpha": 1,
                            "blendMode": 0,
                            "mapInput": 0,
                            "mapTo": "4",
                            "offsetx": 0,
                            "offsety": 0,
                            "rot": 0,
                            "scalex": 1,
                            "scaley": 1,
                            "src": "./avatars/Male_Tshirt_Normal.jpg"
                        }
                    ],
                    "reflect": 0.001,
                    "shininess": 0.000002,
                    "side": 0,
                    "specularColor": {
                        "b": 0.007,
                        "g": 0.007,
                        "r": 0.007
                    },
                    "specularLevel": 1,
                    "type": "phong"
                },
                "owner": "Rob",
                "transform": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0.75, 1]
            },
            "random": {
                "c": 1,
                "s0": 0.784492643317208,
                "s1": 0.409024096792564,
                "s2": 0.720442588208243
            },
            "sequence": 0,
            "source": "./avatars/Male_T_Shirt.json",
            "type": "subDriver/threejs/asset/vnd.gltf+json"
        }
    },
    "events": {
        "Message": {
            "body": "if(vwf.client() != vwf.moniker()) return; setupPmWindow(this.ownerClientID[0])    ",
            "parameters": [""]
        },
        "ShowProfile": {
            "body": "if(vwf.client() != vwf.moniker()) return; _UserManager.showProfile(this.ownerClientID[0])    ",
            "parameters": [""]
        }
    },
    "extends": "character.vwf",
    "properties": {
        "PlayerNumber": "Rob",
        "___physics_activation_state": 4,
        "___physics_angular_velocity": [0, 0, 0],
        "___physics_deactivation_time": 0,
        "___physics_enabled": true,
        "___physics_factor_angular": [0, 0, 0],
        "___physics_factor_linear": [0, 0, 0],
        "___physics_linear_velocity": [0, 0, 0],
        "___physics_mass": 100,
        "___physics_velocity_angular": [0, 0, 0],
        "___physics_velocity_linear": [0, 0, 0],
        "activeCycle": [],
        "animationFrame": 60.22,
        "castShadows": true,
        "cycles": {
            "jump": {
                "current": 0,
                "length": 66,
                "loop": false,
                "speed": 1.25,
                "start": 194
            },
            "run": {
                "current": 0,
                "length": 22,
                "loop": true,
                "speed": 1.25,
                "start": 38
            },
            "runningjump": {
                "current": 0,
                "length": 48,
                "loop": false,
                "speed": 1.25,
                "start": 109
            },
            "stand": {
                "current": 0,
                "length": 0,
                "loop": true,
                "speed": 1.25,
                "start": 1
            },
            "strafeleft": {
                "current": 0,
                "length": 16,
                "loop": true,
                "speed": -1.5,
                "start": 124
            },
            "straferight": {
                "current": 0,
                "length": 16,
                "loop": true,
                "speed": 1.5,
                "start": 108
            },
            "walk": {
                "current": 0,
                "length": 32,
                "loop": true,
                "speed": 1.45,
                "start": 6
            },
            "walkback": {
                "current": 0,
                "length": 32,
                "loop": true,
                "speed": -1.45,
                "start": 6
            }
        },
        "isDynamic": false,
        "materialDef": {
            "alpha": 1,
            "ambient": {
                "b": 1,
                "g": 1,
                "r": 1
            },
            "color": {
                "b": 1,
                "g": 1,
                "r": 1
            },
            "emit": {
                "b": 0,
                "g": 0,
                "r": 0
            },
            "layers": [{
                    "alpha": 1,
                    "mapInput": 0,
                    "mapTo": 1,
                    "offsetx": 0,
                    "offsety": 0,
                    "scalex": 1,
                    "scaley": 1,
                    "src": "./avatars/Male_Body_Color.jpg"
                }, {
                    "alpha": 1,
                    "blendMode": 0,
                    "mapInput": 0,
                    "mapTo": "4",
                    "offsetx": 0,
                    "offsety": 0,
                    "rot": 0,
                    "scalex": 1,
                    "scaley": 1,
                    "src": "./avatars/Male_Body_Normal.jpg"
                }
            ],
            "reflect": 0.00001,
            "shininess": 0.0000022,
            "side": 0,
            "specularColor": {
                "b": 0.001,
                "g": 0.001,
                "r": 0.001
            },
            "specularLevel": 1,
            "type": "phong"
        },
        "motionStack": [],
        "oldRotZ": 0,
        "owner": "Rob",
        "ownerClientID": ["92wkBBITMxgMnRRSAAAA"],
        "receiveShadows": true,
        "scale": [1, 1, 1],
        "standing": 0,
        "standingOnID": null,
        "standingOnOffset": null,
        "transform": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    },
    "random": {
        "c": 1,
        "s0": 0.991981585742906,
        "s1": 0.344837741926312,
        "s2": 0.428785639815032
    },
    "sequence": 0,
    "source": "./avatars/Male_Avatar_Base.json",
    "type": "subDriver/threejs/asset/vnd.gltf+json"
}

function randomNames(node)
{
    if(!node || !node.children) return;
    var keys = Object.keys(node.children);
    console.log(keys)
    for(var i =0 ; i <  keys.length; i++)
    {
        node.children[GUID()] = node.children[keys[i]];
        delete node.children[keys[i]]
    }
    for ( var i in node.children)
        randomNames(node.children[i])
    return node;
}
exports.getDefaultAvatarDef = function(){return randomNames(JSON.parse(JSON.stringify(avatarDef)));}