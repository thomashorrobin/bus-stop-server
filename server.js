var http = require('http');
var db = require('./db');
var cashe = require('./db-cashe');
var metlink = require('./metlink');
var logging = require('./console-config');
logging.add_local_logging();
var port = process.env.port || 1337;
function searchBySubString(substr) {
	var results = [];
	var busStopList = db.list();
	for (var index = 0; index < busStopList.length; index++) {
		var stop = busStopList[index];
		if (stop.Name.includes(substr)) {
			results.push(stop);
		}
	}
	return results;
}
http.createServer(function (req, res) {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	console.log('Server recivied request: ' + req.url);
	var pathParams = req.url.toString().split('/');
	if (pathParams[1] == 'list') { // http://localhost:1337/list
		db.list(function (data) {
			res.end(JSON.stringify(data));
		});
	} else if(pathParams[1] == 'getstop') { // http://localhost:1337/getstop/5500
		var busStopId = pathParams[2];
		if (cashe.exists(busStopId)) {
			res.end("bus stop already exists");
		} else {
			metlink.addBusStop(busStopId);
			res.end("Request sent for stop:" + pathParams[2]);
		}
	} else if(pathParams[1] == 'exists') { // http://localhost:1337/exists/5500
		var exists = cashe.exists(pathParams[2]);
		res.end(exists.toString());
	} else if(pathParams[1] == 'getroute') { // http://localhost:1337/getroute/3
		metlink.addBusRoute(pathParams[2]);
		res.end("Request sent for route:" + pathParams[2]);
	} else if(pathParams[1] == 'getallroutes') { // http://localhost:1337/getallroutes
		metlink.addAllBusRoutes();
		res.end("Request has been sent to scan all routes");
	} else if(pathParams[1] == 'grep') { // http://localhost:1337/grep/lampton
		res.end(JSON.stringify(searchBySubString(pathParams[2])));
	} else if(pathParams[1] == 'count') { // http://localhost:1337/count
		db.count(function (c) {
			res.end(c.toString());
		});
	} else {
		res.end(JSON.stringify(pathParams));
	}
}).listen(port);