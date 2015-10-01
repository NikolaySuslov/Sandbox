var root = global.appPath,
    fileList = [],
    routesMap = {},
    DAL = require('./DAL').DAL;
fs = require('fs'),
async = require('async'),
URL = require('url'),
avatar = false,
blog = false,
doc = false;
var logger = require('./logger');
var sessions = require('./sessions');

exports.init = function() {
    root = global.appPath,
    console.log(root);
    fs.readdir(__dirname + '/../../public' + '/adl/sandbox' + '/views/help', function(err, files) {
        var tempArr = [];

        for (var i = 0; i < files.length; i++) {
            tempArr = files[i].split('.');
            if (tempArr[1] == 'js') {
                fileList.push(tempArr[0].toLowerCase());
            }
        }
    });
}
//localization
function translate(req) {
    var currentLng = req.locale;
    var i18n = req.i18n;

		if (req.cookies.i18next == undefined)
				i18n.setLng ='ru';

 		if(req.query.lang!==undefined)
 			i18n.setLng(req.query.lang, function(t) { /* loading done */ });



    return function() {
        return function(text, render) {
            return i18n.t(text);
        }
    };
}

function getLangRu(req){

		if (req.cookies.i18next == 'ru')
				return '_ru';

		return '';
}


exports.setDAL = function(d) {
    DAL = d;
};
exports.setDocumentation = function(cs) {
    if (cs.blog)
        blog = cs.blog;

    if (cs.documentation)
        doc = cs.documentation;
};

function getRoot() {
    if (!global.version)
        return root;
    else
        return '/' + global.version + root;

}

exports.acceptedRoutes = ['about', 'features', 'demos', 'createNotLoggedIn', 'home', 'tools', 'performancetestJavascript', 'performancetestGraphics', 'examples', 'settings', 'restore', 'createNew', 'welcome', 'search', 'forgotPassword', 'editProfile', 'updatePassword', 'test', 'avatar', 'sandbox', 'index', 'create', 'signup', 'login', 'logout', 'edit', 'remove', 'history', 'user', 'worlds', 'admin', 'admin/users', 'admin/worlds', 'admin/edit', 'publish', 'index_ru'];

routesMap = {
    'sandbox': {
        template: 'template_vle'
    },
    'test': {
        layout: 'template_vle'
    },
    'tools': {
        layout: 'template_vle'
    },
    'performancetestJavascript': {
        layout: 'template_vle'
    },
    'performancetestGraphics': {
        layout: 'template_vle'
    },
    'examples': {
        layout: 'template_vle'
    },
    'settings': {
        layout: 'template_vle'
    },
    'home': {
        template: 'index'
    },
    'features': {
        layout: 'template_vle'
    },
    'demos': {
        layout: 'template_vle'
    },
    'about': {
        layout: 'template_vle'
    },
    'edit': {
        sid: true,
        requiresLogin: true,
        layout: 'template_vle'
    },
    'restore': {
        sid: true,
        requiresLogin: true,
        layout: 'template_vle'
    },
    'publish': {
        sid: true,
        requiresLogin: true,
        layout: 'template_vle'
    },
    'history': {
        sid: true,
        layout: 'template_vle'
    },
    'remove': {
        sid: true,
        title: 'Warning!',
        requiresLogin: true,
        layout: 'template_vle'
    },
    'user': {
        sid: true,
        title: 'Account',
        requiresLogin: true,
        layout: 'template_vle'
    },
    'admin': {
        sid: true,
        title: 'Admin',
        fileList: fileList,
        template: 'admin/admin',
        requiresLogin: true
    },
    'admin/edit': {
        fileList: fileList,
        requiresLogin: true
    },
    'index': {
        home: true
    },
    'avatar': {
        avatar: true,
        requiresLogin: true,
		layout: 'template_vle'
    },
    'create': {
        requiresLogin: true
    },
    'logout': {
        layout: 'template_vle',
        requiresLogin: true
    },
    'login': {
        layout: 'template_vle'
    },
    'signup': {
        layout: 'template_vle'
    },
    'updatePassword': {
        layout: 'template_vle',
        requiresLogin: true
    },
    'editProfile': {
        layout: 'template_vle',
        requiresLogin: true
    },
    'forgotPassword': {
        layout: 'template_vle'
    },
    'search': {
        layout: 'template_vle'
    },
    'welcome': {
        layout: 'template_vle'
    },
    'home': {
        layout: 'template_vle'
    },
    'createNotLoggedIn': {
        layout: 'template_vle'
    },
    'index_ru': {
        home:true
    }


};


exports.statsHandler = function(req, res, next) {


    sessions.GetSessionData(req, function(sessionData) {

        var instances = global.instances.instances;
        var allConnections = 0;
        for (var i in instances) {
            allConnections += Object.keys(instances[i].clients).length;
        }
        DAL.getStats(function(states, users) {
            var instanceCount = Object.keys(instances || {});
            res.locals = {
                instanceCount: instanceCount,
                states: states,
                users: users,
                allConnections: allConnections,

                instances: instances || [],
                sessionData: sessionData,
                url: req.url,
                root: getRoot(),
                federal_analytics: global.configuration.federal_analytics,
                    branding: global.configuration.branding
            };
            res.render('stats', {
                layout: 'template_vle'
            });


        })

    })
}
exports.redirectPasswordEmail = function(req, res, next) {
    next();
    return;
    if (req.query && req.query.return) {
        req.session.redirectUrl = req.query.return;
    }

    sessions.GetSessionData(req, function(sessionData) {
        //if no user is logged in, just forget all this
        if (!sessionData) {
            next();
            return;
        }

        DAL.getUser(sessionData.UID, function(user) {
            var currentAcceptedRoute = req.params.page;
            if ((/[\.]/).test(currentAcceptedRoute)) {
                next();
                return;
            }
            //if someone has a temp pass, they must reset it


            if (currentAcceptedRoute == 'editProfile' || currentAcceptedRoute == 'updatePassword') {
                next();
                return;
            }
            var newroute = null;
            if (user && !user.Email) {
                newroute = 'editProfile';
            }
            if (sessionData && sessionData.PasswordIsTemp) {
                newroute = 'updatePassword';
            }

            //if the user needs to reset the pass|| they use a temp passwrod
            if (newroute) {
                res.locals = {
                    user: user,
                    sessionData: sessionData,
                    root: getRoot(req),
                    title: newroute,
                    fileList: null,
                    home: null,
                    avatar: false,
                    blog: true,
                    doc: true,
                    translate: translate(req),
                    federal_analytics: global.configuration.federal_analytics,
                    branding: global.configuration.branding
                };
                if (user && !user.Email) {
                    res.locals.message = "We've updated our database, and now require email address for users. Please update your email address below.";
                }
                res.render(newroute, {
                    layout: 'template_vle'
                });

            } else {
                next();
            }
        });


    });

}

exports.generalHandler = function(req, res, next) {


    sessions.GetSessionData(req, function(sessionData) {
        var postGetUser = function(user) {
            if (!req.params.page)
                req.params.page = 'index';

            if (req.params.page.indexOf('admin') > -1 && (!sessionData || sessionData.UID != global.adminUID)) {
                next();
                return;
            }

            var routeIndex = exports.acceptedRoutes.indexOf(req.params.page);

            if (routeIndex >= 0) {

                var currentAcceptedRoute = exports.acceptedRoutes[routeIndex],
                    title = '',
                    sid = '',
                    template = currentAcceptedRoute,
                    fileList = [],
                    home = false;

                if (routesMap[currentAcceptedRoute]) {

                    title = routesMap[currentAcceptedRoute].title ? routesMap[currentAcceptedRoute].title : '';
                    sid = routesMap[currentAcceptedRoute].sid ? root + '/' + (req.query.id ? req.query.id : '') + '/' : '';
                    template = routesMap[currentAcceptedRoute].template ? routesMap[currentAcceptedRoute].template : currentAcceptedRoute;

                    if (template == 'index') {
                        template = template + getLangRu(req);
                    }

                    fileList = routesMap[currentAcceptedRoute].fileList ? routesMap[currentAcceptedRoute].fileList : [];
                    home = routesMap[currentAcceptedRoute].home ? routesMap[currentAcceptedRoute].home : false;
                    avatar = routesMap[currentAcceptedRoute].avatar ? routesMap[currentAcceptedRoute].avatar : false;
                }

                var layout = (routesMap[currentAcceptedRoute] && routesMap[currentAcceptedRoute].layout) || 'template_vle';

                //note the must come before the redirect to login below
                if (req.params.page == 'logout') {
                    if (!sessionData) {
                        //prevent the state where you hit the login page with a redirect back only to logout
                        res.redirect('/');
                        return;
                    }
                }

                //if the page requires login, force a redirect to the login page
                if (!sessionData && routesMap[currentAcceptedRoute] && routesMap[currentAcceptedRoute].requiresLogin) {
                    res.redirect(root + '/login?return=' + currentAcceptedRoute);
                    return;
                }


                res.locals = {
                    sessionData: sessionData,
                    sid: sid,
                    root: getRoot(req),
                    title: title,
                    fileList: fileList,
                    home: home,
                    avatar: avatar,
                    blog: blog,
                    doc: doc,
                    user: user,
                    translate: translate(req),
                    federal_analytics: global.configuration.federal_analytics,
                    branding: global.configuration.branding
                };

                //hook up the buttons to show the social media logins
                if (req.params.page == 'login') {
                    res.locals.twitterLogin = global.configuration.twitter_consumer_key ? true : false;
                    res.locals.googleLogin = global.configuration.google_client_id ? true : false;
                    res.locals.facebookLogin = global.configuration.facebook_app_id ? true : false;
                    if (sessionData) {
                        //don't allow on the login page if logged in
                        res.redirect('/');
                    }
                }

                res.render(template, {
                    layout: layout
                });


            } else {
                logger.error("Not found");
                //res.status(404).end('Error');

                next();
            }
        };

        if (sessionData) {
            DAL.getUser(sessionData.UID, postGetUser);
        } else {
            postGetUser(null);
        }
    });

};


exports._404 = function(req, res, next) {

    console.log('here');
    sessions.GetSessionData(req, function(sessionData) {
        res.locals = {
            sessionData: sessionData,
            url: req.url,
            root: getRoot(),
            federal_analytics: global.configuration.federal_analytics,
            branding: global.configuration.branding
        };

        res.status(404).render('template_vle');
        next();

    })

};

exports.help = function(req, res) {

    var currentIndex = fileList.indexOf(req.params.page);
    var displayPage = currentIndex >= 0 ? fileList[currentIndex] : 'index';


    res.locals = {
        sid: root + '/' + (req.query.id ? req.query.id : '') + '/',
        root: getRoot(req),
        script: displayPage + ".js",
        federal_analytics: global.configuration.federal_analytics,
         branding: global.configuration.branding
    };
    res.render('help/template');

};

/*
 * JavaScript Pretty Date
 * Copyright (c) 2011 John Resig (ejohn.org)
 * Licensed under the MIT and GPL licenses.
 */

// Takes an ISO time and returns a string representing how
// long ago the date represents.
function prettyDate(time) {
    var date = new Date((time || "").replace(/-/g, "/").replace(/[TZ]/g, " ")),
        diff = (((new Date()).getTime() - date.getTime()) / 1000),
        day_diff = Math.floor(diff / 86400);

    if (isNaN(day_diff) || day_diff < 0 || day_diff >= 31)
        return;

    return day_diff == 0 && (
            diff < 60 && "just now" ||
            diff < 120 && "1 minute ago" ||
            diff < 3600 && Math.floor(diff / 60) + " minutes ago" ||
            diff < 7200 && "1 hour ago" ||
            diff < 86400 && Math.floor(diff / 3600) + " hours ago") ||
        day_diff == 1 && "Yesterday" ||
        day_diff < 7 && day_diff + " days ago" ||
        day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago";
}


exports.world = function(req, res, next) {


    sessions.GetSessionData(req, function(sessionData) {

        //account for either supplying only the 16 digit code, or the full database key
        //also account for appPath if full key provided
        var worldID = req.params.page;
        if(worldID.indexOf(global.configuration.appPath.replace(/\//g,"_")) == -1)
        {
            worldID = "_adl_sandbox_"+ worldID + "_";
        }
        worldID = worldID.replace(global.configuration.appPath.replace(/\//g,"_"),"_adl_sandbox")
        console.log(worldID);
        DAL.getInstance(worldID, function(doc) {
            if (!doc) {
                res.locals = {
                    sessionData: sessionData,
                    url: req.url,
                    root: getRoot(),
                    federal_analytics: global.configuration.federal_analytics,
                    branding: global.configuration.branding
                };
                //res.status(404).render('_404');
                res.redirect(global.appPath);
                return;
            }
            var instance = global.instances ? global.instances.get("/adl/sandbox" + "/" + req.params.page + "/") : false;
            var anonymous = [];
            var users = [];

            if (instance) {
                for (var i in instance.clients) {
                    if (instance.clients[i].loginData && instance.clients[i].loginData.UID) {
                        users.push(instance.clients[i].loginData.UID);
                    } else {
                        anonymous.push(i);
                    }
                }
            }
            var totalusers = anonymous.length + users.length;


            var owner = (sessionData || {}).UID == doc.owner;
            doc.prettyDate = prettyDate(doc.created);
            doc.prettyUpdated = prettyDate(doc.lastUpdate);
            res.locals = {
                root: getRoot(req),
                worldid: req.params.page,
                sessionData: sessionData,
                worldData: doc,
                translate: translate(req),
                totalusers: totalusers,
                users: users,
                anonymous: anonymous,
                owner: owner,
                federal_analytics: global.configuration.federal_analytics,
                    branding: global.configuration.branding
            };
            res.render('worldTemplate', {
                layout: 'template_vle'
            });

        });
    });

};

function ShowSearchPage(mode, req, res, next) {

    sessions.GetSessionData(req, function(sessionData) {
        function foundStates(allinstances) {


            var results = [];

            //clean up and make sure that the data is not null
            for (var i in allinstances) {
                if (!allinstances[i])
                    continue;
                if (!allinstances[i].title)
                    allinstances[i].title = 'No Title';
                if (!allinstances[i].description)
                    allinstances[i].description = 'No Description';

            }
            if (mode == 'active') {
                for (var i in allinstances) {
                    var inst = allinstances[i];
                    if (!inst) continue;
                    inst.id = i;
                    inst.shortid = i.substr("/adl/sandbox".length + 1, 16);
                    if (global.instances) {
                        if (global.instances.get(i.replace(/_/g, "/")))
                            results.push(inst);
                    }
                }
                results.sort(function(a, b) {
                    return Date.parse(b.created || b.lastUpdate) - Date.parse(a.created || a.lastUpdate);
                });
            }


            if (mode == 'search') {
                for (var i in allinstances) {
                    var inst = allinstances[i];
                    if (!inst) continue;
                    inst.id = i;
                    inst.shortid = i.substr("/adl/sandbox".length + 1, 16);
                    if (inst.title.toLowerCase().indexOf(search) != -1 || inst.description.toLowerCase().indexOf(search) != -1 || inst.owner.toLowerCase().indexOf(search) != -1 || inst.shortid.toLowerCase().indexOf(search) != -1)
                        results.push(inst);
                }
                results.sort(function(a, b) {
                    return Date.parse(b.created || b.lastUpdate) - Date.parse(a.created || a.lastUpdate);
                });
            }

            if (mode == 'my' && sessionData) {
                for (var i in allinstances) {
                    var inst = allinstances[i];
                    if (!inst) continue;
                    inst.id = i;
                    inst.shortid = i.substr("/adl/sandbox".length + 1, 16)
                    if (inst.owner == sessionData.UID)
                        results.push(inst);
                }
                results.sort(function(a, b) {
                    return Date.parse(b.created || b.lastUpdate) - Date.parse(a.created || a.lastUpdate);
                });
            }
            if (mode == 'featured') {
                for (var i in allinstances) {
                    var inst = allinstances[i];
                    if (!inst) continue;
                    inst.id = i;
                    inst.shortid = i.substr("/adl/sandbox".length + 1, 16)
                    if (inst.featured)
                        results.push(inst);
                }
                results.sort(function(a, b) {
                    return Date.parse(b.created || b.lastUpdate) - Date.parse(a.created || a.lastUpdate);
                });
            }

            if (mode == 'all') {
                for (var i in allinstances) {
                    var inst = allinstances[i];
                    if (!inst) continue;
                    inst.id = i;
                    inst.shortid = i.substr("/adl/sandbox".length + 1, 16)
                    results.push(inst);
                }
                results.sort(function(a, b) {
                    return Date.parse(b.created || b.lastUpdate) - Date.parse(a.created || a.lastUpdate);
                });
            }
            if (mode == 'new') {
                for (var i in allinstances) {
                    var inst = allinstances[i];
                    if (!inst) continue;
                    inst.id = i;
                    inst.shortid = i.substr("/adl/sandbox".length + 1, 16)
                    results.push(inst);
                }
                results.sort(function(a, b) {
                    return Date.parse(b.created || b.lastUpdate) - Date.parse(a.created || a.lastUpdate);
                });
                results.splice(10);
            }


            var total = results.length;
            var next = page + 1;

            if (Math.ceil(results.length / 10) == next || results.length == 0)
                next = false;
            var previous = page - 1;


            for (var i = 0; i < 10 * page; i++)
                results.shift();

            if (results.length > 10) {
                results.splice(10);
            }
            var start = 10 * page;
            var end = start + results.length;
            res.locals = {
                start: start,
                end: end,
                total: total,
                sessionData: sessionData,
                perpage: perpage,
                page: page,
                root: getRoot(),
                searchterm: search,
                results: results,
                next: next,
                previous: previous,
                hadprev: (previous >= 0),
                translate: translate(req),
                federal_analytics: global.configuration.federal_analytics,
                    branding: global.configuration.branding
            };
            res.locals[mode] = true;
            res.render('searchResults', {
                layout: 'template_vle'
            });


        }


        var search = decodeURIComponent(req.params.term).toLowerCase();
        var perpage = req.params.perpage;
        var page = parseInt(req.params.page);

        var searchFunc = "";


        if (mode == "featured")
            DAL.searchStatesByFeatured(foundStates)
        if (mode == "all" || mode == "new" || mode == "active")
            DAL.getStates(foundStates)
        if (mode == "my")
            DAL.searchStatesByUser(sessionData.UID, foundStates)
        if (mode == "search")
            DAL.searchStates(search, foundStates)
    })


}

exports.searchResults = function(req, res, next) {
    ShowSearchPage('search', req, res, next);
};

exports.newWorlds = function(req, res, next) {
    ShowSearchPage('new', req, res, next);
};

exports.allWorlds = function(req, res, next) {
    ShowSearchPage('all', req, res, next);
};
exports.myWorlds = function(req, res, next) {
    ShowSearchPage('my', req, res, next);
};
exports.featuredWorlds = function(req, res, next) {
    ShowSearchPage('featured', req, res, next);
}
exports.activeWorlds = function(req, res, next) {
    ShowSearchPage('active', req, res, next);
}
exports.createNew2 = function(req, res, next) {

    sessions.GetSessionData(req, function(sessionData) {

        if (!sessionData) {
            res.redirect(root + '/login?return=createNew/0')
        }
        var template = req.params.template;
        var normalizedSID = "/adl/sandbox".replace(/\//g, "_") + "_" + template + "_";
        logger.debug(normalizedSID);
        DAL.getInstance(normalizedSID, function(worlddata) {

            function postWorldData() {
                res.locals = {
                    worlddata: worlddata,
                    template: (template == 'noTemplate' ? false : template),
                    root: getRoot(),
                    translate: translate(req),
                    federal_analytics: global.configuration.federal_analytics,
                    branding: global.configuration.branding
                };
                res.render('createNew2', {
                    layout: 'template_vle'
                });
            }
            logger.debug(worlddata);
            if (!worlddata) {
                require('./examples.js').getExampleMetadata(normalizedSID, function(data) {
                    worlddata = data;
                    if (worlddata) postWorldData();
                });
            } else
                postWorldData();



        });

    });
}

var self = exports;
var cachedVWFCore = null;
exports.getVWFCore = function() {
    if (!cachedVWFCore) {
        cachedVWFCore = fs.readFileSync('./support/client/lib/vwf.js', 'utf8');
        if (global.configuration.host && global.configuration.loadBalancer) //if the config contains an address for a load balancer, have the client
        //look up what host to use
        {
            cachedVWFCore = cachedVWFCore.replace('{{host}}', "this.getInstanceHost()");
            cachedVWFCore = cachedVWFCore.replace('{{loadBalancerAddress}}', "'" + global.configuration.loadBalancer + "'");
        } else if (global.configuration.host) //if there is no load balancer, the host is this host from the config. Note this is necessary since the CDN might
        //not have our "real" hostname as the dns name, and might not proxy sockets
        {
            cachedVWFCore = cachedVWFCore.replace('{{host}}', "'" + global.configuration.host + "'");
            cachedVWFCore = cachedVWFCore.replace('{{loadBalancerAddress}}', "'" + global.configuration.loadBalancer + "'"); //otherwise, script syntax is invalid
        } else {
            //otherwise, this is a single, simple server. Look up the host from the url.
            cachedVWFCore = cachedVWFCore.replace('{{host}}', "window.location.protocol +'//'+ window.location.host");
            cachedVWFCore = cachedVWFCore.replace('{{loadBalancerAddress}}', "'" + global.configuration.loadBalancer + "'"); //otherwise, script syntax is invalid
        }
    }
    return cachedVWFCore;


}
exports.serveVWFcore = function(req, res, next) {


    self.getVWFCore();
    res.writeHead(200, {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=36000"
    });
    res.write(cachedVWFCore, 'utf8');
    res.end();
}

exports.createNew = function(req, res, next) {

    var search = decodeURIComponent(req.params.term).toLowerCase();
    var perpage = req.params.perpage;
    var page = parseInt(req.params.page);

    sessions.GetSessionData(req, function(sessionData) {

        if (!sessionData) {
            res.redirect(root + '/login?return=createNew/0')
        }

        DAL.searchStatesByFeatured(function(allinstances) {

            var results = [];


            for (var i in allinstances) {
                var inst = allinstances[i];
                if (!inst) continue;
                inst.id = i;
                inst.shortid = i.substr("/adl/sandbox".length + 1, 16)
                if (inst.featured)
                    results.push(inst);
            }
            results.sort(function(a, b) {
                return Date.parse(b.created || b.lastUpdate) - Date.parse(a.created || a.lastUpdate);
            });


            var total = results.length;
            var next = page + 1;

            if (Math.ceil(results.length / 10) == next || results.length == 0)
                next = false;
            var previous = page - 1;


            for (var i = 0; i < 10 * page; i++)
                results.shift();

            if (results.length > 10) {
                results.splice(10);
            }
            var start = 10 * page;
            var end = start + results.length;
            res.locals = {
                start: start,
                end: end,
                total: total,
                sessionData: sessionData,
                perpage: perpage,
                page: page,
                root: getRoot(),
                searchterm: search,
                results: results,
                next: next,
                previous: previous,
                hadprev: (previous >= 0),
                translate: translate(req),
                federal_analytics: global.configuration.federal_analytics,
                    branding: global.configuration.branding
            };

            res.render('createNew', {
                layout: 'template_vle'
            });

        })
    })

}

exports.handlePostRequest = function(req, res, next) {
    //JSON.parse(req.body)
    var data = req.body ? req.body : '';

    sessions.GetSessionData(req, function(sessionData) {

        //Temporarily commenting out authorization
        if (!sessionData || sessionData.UID != global.adminUID) {
            next();
            return;
        }

        switch (req.params.action) {


            case "dal_test":
                break;

            case "delete_users":
                DAL.deleteUsers(data, function() {
                    res.end("done");
                });
                break;

            case "delete_worlds":
                DAL.deleteInstances(data, function() {
                    res.end("done");
                });
                break;

            case "get_users":
                DAL.getAllUsersInfo(function(docs) {

                    for (var i in docs) {
                        if (docs[i] && docs[i].Username == '__Global__') {
                            docs.splice(i);
                        }
                    }

                    res.end(JSON.stringify(docs));
                });
                break;

            case "get_user_info":

                async.series([

                        function(cb) {
                            DAL.find({
                                owner: data.Username
                            }, function(err, results) {
                                cb(null, results);
                            });

                        },

                        function(cb) {
                            DAL.getInstances(function(state) {
                                cb(null, state);

                            });
                        },

                        function(cb) {
                            DAL.getInventoryDisplayData(data.Username, function(inventoryInfo) {
                                cb(null, inventoryInfo);
                            });
                        }
                    ],

                    function(err, results) {

                        var serveObj = [{}, {}];
                        logger.debug(results);
                        for (var key in results[0]) {
                            if (results[1][key]) {
                                serveObj[0][key] = results[1][key];
                            }
                        }
                        serveObj[1] = results[2];
                        res.end(JSON.stringify(serveObj));
                    });


                break;

            case "update_user":
                var userId = data.Username;
                logger.debug(data);
                delete data.Salt;
                delete data.Username;
                //delete data.inventoryKey;

                //delete data.inventoryKey;
                //DAL.updateUser(userId, data, function(e){


                //});


                //res.end();
                break;

            case "update_world":
                var worldId = global.appPath.replace(/\//g, "_") + "_" + data.id + "_";
                delete data.id;
                delete data.hotState;
                delete data.editVisible;
                delete data.isVisible;

                DAL.updateInstance(worldId, data, function(e) {
                    res.end(e ? "done" : "error");
                });
                break;

            default:
                next();
                break;
        }
    });
};

function getFrontEndRoot(req) {
    var pathname = URL.parse(req.url).pathname,
        currentIndex = pathname.indexOf(global.appPath),
        frontEndRoot = '',
        numSlashes = 0;

    if (currentIndex >= 0) {

        numSlashes = (pathname.substr(pathname.indexOf(global.appPath) + global.appPath.length).match(/\//g) || []).length;
        if (numSlashes == 0) {
            frontEndRoot = '.';
        } else {
            for (var i = 0; i < numSlashes; i++) {
                frontEndRoot += i > 0 ? "/.." : "..";
            }
        }
    } else {
        frontEndRoot = './sandbox';
    }

    return frontEndRoot;
}
