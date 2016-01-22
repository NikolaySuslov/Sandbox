var http = require('http'),
    httpProxy = require('http-proxy'),
    async = require('async');
var fork = require('child_process').fork;
var request = require('request');
var fs = require('fs');
var libpath = require('path');
var url = require('url');
var port = 3000;
var count = 1;
var server = null;
var proxies = null;
var DB = null;
var appPath = "/adl/sandbox";
var spdy = require("spdy");
var datapath = null;
http.globalAgent.maxSockets = 100;
var states = {};
var compile = false;
var logger = require('./logger');

function GetProxyPort(request, cb)
{

    var query = url.parse(request.url, true).query;
    //url rewrite for incomming websocket proxy
    if (!query || !query.pathname)
    {
        cb(port + 1);
    }
    query.pathname = query.pathname.replace(appPath, "/adl/sandbox");
    var id = query.pathname.replace(/\//g, "_");
    console.log(id)
    var newport = port + parseInt(1 + Math.floor(Math.random() * count));
    if (states[id])
    {
        console.log('have record for ' + id);
        newport = states[id].port;
    }
    else
    {
        console.log("random port for " + id)
        states[id] = proxies[newport - port - 1];
        console.log(proxies[newport - port - 1].port + " is expected to start " + id);
    }
    async.nextTick(function()
    {
        if (proxies[newport - port - 1].ready)
            cb(newport);
        else
        {
            console.log("child " + newport + " not ready")
            setTimeout(function()
            {
                GetProxyPortRandom(request, cb);
            }, 300)
        }
    })
}

function GetProxyPortRandom(request, cb)
{

    async.nextTick(function()
    {
        var newport = port + parseInt(1 + Math.floor(Math.random() * count));
        if (proxies[newport - port - 1].ready)
            cb(newport);
        else
        {
            console.log("child " + newport + " not ready")
            setTimeout(function()
            {
                GetProxyPortRandom(request, cb);
            }, 300)
        }
    })
}

function DecodeArgs(args)
{
    if (!args) return;
    if (args.constructor == String) return;
    for (var i in args)
    {
        if (i == '$regex')
        {
            args[i] = new RegExp(args[i], 'ig');


        }
        else
            DecodeArgs(args[i]);
    }
}

function HandleMessage(message, cb, client)
{
    if (message.type == 'DB')
    {
        var args = message.args || [];
        DecodeArgs(args)

        DB[message.action].apply(DB, args.concat([

            function(err, key, data)
            {
                message.result = [err, key, data];
                async.nextTick(function()
                {
                    cb(message);
                });
            }
        ]));
    }
    if (message.type == 'console')
    {
        console.log(message.data);
        cb(message);
    }
    if (message.type == 'ready')
    {
        client.ready = true;
        console.log("client " + client.port + " is ready");
    }
    if (message.type == 'state')
    {
        if (message.action == 'add')
        {
            if (!states[message.args[0]])
            {
                states[message.args[0]] = client;
                console.log("child " + client.port + " is handling " + message.args[0])
            }
            else if (states[message.args[0]] == client)
            {
                console.log("child " + client.port + " is handling " + message.args[0] + " as expected");
            }
            else
            {
                throw (new Error("State is already running!"));
            }
        }
        if (message.action == 'remove')
        {
            if (states[message.args[0]])
            {
                delete states[message.args[0]];
                console.log('delisting ' + message.args[0]);
            }
            else
            {
                throw (new Error("State is not running!"));
            }
        }
    }

}

console.log('start');
var configSettings = {};
//startup
async.series([

    function readConfigFile(cb)
    {
        try
        {

            var p = process.argv.indexOf('-config');

            //This is a bit ugly, but it does beat putting a ton of if/else statements everywhere
            var config = p >= 0 ? (process.argv[p + 1]) : './config.json';

            configSettings = JSON.parse(fs.readFileSync(config).toString());


        }
        catch (e)
        {
            configSettings = {};
            console.log('config error');
        }
        //save configuration into global scope so other modules can use.
        global.configuration = configSettings;
        cb();

    },
    function readCommandLine(cb)
    {
        console.log('readCommandLine');


        var p = process.argv.indexOf('-p');
        port = p >= 0 ? parseInt(process.argv[p + 1]) : (configSettings.port ? configSettings.port : 3000);

        p = process.argv.indexOf('-c');
        count = p >= 0 ? parseInt(process.argv[p + 1]) : (configSettings.clusterCount ? configSettings.clusterCount : 1);

        p = process.argv.indexOf('-d');
        datapath = p >= 0 ? process.argv[p + 1] : (configSettings.datapath ? libpath.normalize(configSettings.datapath) : libpath.join(__dirname, "../../data"));

        //set the default URL for the site
        p = process.argv.indexOf('-ap');
        appPath = global.appPath = p >= 0 ? (process.argv[p + 1]) : (global.configuration.appPath ? global.configuration.appPath : '/adl/sandbox');
        if (appPath.length < 3)
        {
            logger.error('appPath too short. Use at least 2 characters plus the slash');
            process.exit();
        }
        //treat build and compile as the same.
        compile = Math.max(process.argv.indexOf('-compile'), process.argv.indexOf('-build')) >= 0 ? true : !!global.configuration.compile;
        if (compile)
        {
            console.log('Starting compilation process...');
        }


        cb();
    },
    function buildIfRequired(cb)
    {
        if (compile)
        {
            //remove these from the command line, so when spawning children, they don't rebuild
            var buildopts = ['-build','-exit'];
            if (process.argv.indexOf('-build') > -1)
                process.argv.splice(process.argv.indexOf('-build'), 1);
            if (process.argv.indexOf('-compile') > -1)
                process.argv.splice(process.argv.indexOf('-compile'), 1);
            if (process.argv.indexOf('-clean') > -1)
            {
                process.argv.splice(process.argv.indexOf('-clean'), 1);
                buildopts.push('-clean');
            }
            
            var p1 = fork('./app.js', buildopts.concat(process.argv),
            {});
            p1.on('close', function()
            {
                cb();
            });
        }
        else
            cb();
    },
    function startupDB(cb)
    {
        console.log('startupDB');

        console.log(datapath + libpath.sep + 'users.nedb')
        require('./DB_nedb.js').new(datapath + libpath.sep + 'users.nedb', function(proxy)
        {
            DB = proxy;
            var message = {};
            cb();
        });
    },
    function forkChildren(cb)
    {
        console.log('forkChildren');
        proxies = [];
        for (var i = 1; i < count + 1; i++)
        {
            var p1 = fork('./app.js', ['-p', port + i, '-cluster', '-DB', './DB_cluster.js'].concat(process.argv),
            {
                silent: true
            });
            proxies.push(p1);
            p1.port = port + i;
            p1.stdout.on('data', function(data) {

            }),
            p1.stdin.on('data', function(data) {

            }),
            p1.stderr.on('data', function(data) {

            })
        }

        cb();
    },
    function hookUpMessaging(cb)
    {
        console.log('hookUpMessaging');

        for (var i = 0; i < proxies.length; i++)
        {

            var child = proxies[i];

            function hookupChild(child)
            {
                child.on('message', function(message)
                {
                    message.result = null;
                    //console.log("message  from child" + child.port);
                    //console.log(message);
                    message = HandleMessage(message, function(message)
                    {
                        if (message.result)
                        {
                            //console.log("respond  to child" + child.port)
                            child.send(message);
                        }
                    }, child);
                });
                child.on('close', function()
                {

                    console.log('CRASH in child ' + child.port);
                    var p1 = fork('./app.js', ['-p', child.port, '-cluster', '-DB', './DB_cluster.js'].concat(process.argv),
                    {
                        silent: true
                    });

                    p1.stdout.on('data', function(data) {

                    }),
                    p1.stdin.on('data', function(data) {

                    }),
                    p1.stderr.on('data', function(data) {

                    })

                    proxies.splice(proxies.indexOf(child), 1);
                    proxies.push(p1);
                    p1.port = child.port;
                    hookupChild(p1);
                    console.log("spawned new child for port " + p1.port)
                    for (var i in states)
                    {
                        if (states[i] == child)
                        {
                            console.log('removing entries from crashed child ' + i + ' ' + child.port);
                            delete states[i];
                        }
                    }

                })
            }

            hookupChild(child);
        }
        cb();
    },
    function startProxyServer(cb)
    {
        console.log('startProxyServer');

        //   var proxyServers = {};
        //   for (var i = 1; i < count + 1; i++) {
        var proxy = httpProxy.createProxyServer(
        {
            ws: true,
            agent: new http.Agent()
        });
        proxy.on('error', function(e, req, res)
        {
            console.log(JSON.stringify(e));
            res.end();
        })
        //      proxyServers[port + i] = proxy;
        //  }

        // Create your custom server and just call `proxy.web()` to proxy
        // a web request to the target passed in the options
        // also you can use `proxy.ws()` to proxy a websockets request
        //

        var opts = {}

        if (global.configuration.pfx)
        {
            opts = {
                pfx: fs.readFileSync(global.configuration.pfx),
                passphrase: global.configuration.pfxPassphrase,
                ca: [fs.readFileSync(global.configuration.sslCA[0]), fs.readFileSync(global.configuration.sslCA[1])]
            }


        }
        var proxyFunc = function(req, res)
            {
                // You can define here your custom logic to handle the request
                // and then proxy the request.

                GetProxyPortRandom(req, function(proxyPort)
                {

                    console.log('proxy request to ' + 'http://localhost:' + proxyPort);
                    proxy.web(req, res,
                    {
                        target: 'http://localhost:' + proxyPort
                    });
                });
            }
            //create a regular http server
        if (!global.configuration.pfx)
        {
            server = http.createServer(proxyFunc);
            server.listen(port);
        }
        else
        {
            //do ssl resolution in proxy
            server = spdy.createServer(opts, proxyFunc);
            server.listen(global.configuration.sslPort);
            //setup a simple server to redirct all requests to the SSL port
            var redirect = http.createServer(function(req, res)
            {
                var requrl = 'http://' + req.headers.host + req.url;
                requrl = url.parse(requrl);

                delete requrl.host;
                requrl.port = global.configuration.sslPort;
                requrl.protocol = "https:";
                requrl = url.format(requrl);
                res.writeHead(302,
                {
                    "Location": requrl
                });
                res.end();
            }).listen(port);
        }
        server.on('connection', function(socket)
        {
            socket.setNoDelay(true);
        });
        server.on('upgrade', function(request, socket, head)
        {

            GetProxyPort(request, function(proxyPort)
            {
                console.log('proxy request to ' + 'http://localhost:' + proxyPort);
                proxy.ws(request, socket, head,
                {
                    target: 'http://localhost:' + proxyPort
                });
            });
        });


        console.log("listening on port " + port)

        cb();


    },
    function registerWithLB(cb)
    {

        if (global.configuration.loadBalancerAddress &&
            global.configuration.host &&
            global.configuration.loadBalancerKey)
        {
            //send to the load balancer to let it know that this server is available
            require('request').get(
                {
                    url: global.configuration.loadBalancerAddress + '/register',
                    json:
                    {
                        host: global.configuration.host,
                        key: global.configuration.loadBalancerKey
                    }
                },
                function(error, response, body)
                {
                    if (!error && response.statusCode == 200)
                    {
                        logger.info("LoadBalancer registration complete", 0);
                        logger.info(body, 0);
                        cb();
                    }
                    else
                    {
                        logger.error("LoadBalancer registration failed!", 0);
                        logger.error(body, 0);
                        delete global.configuration.loadBalancerAddress;
                        cb();
                    }
                });
        }
    }
],
function(e)
{
    console.log(e);
})