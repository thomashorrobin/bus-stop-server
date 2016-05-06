var http = require('http');
var https = require('https');
var _ = require('underscore');
var port = process.env.port || 1337;
var busStopList = [];
function getBusStop(busStopId) {
	var url = 'https://www.metlink.org.nz/api/v1/Stop/' + busStopId;
	console.log("fetching data from " + url);
	var req = https.get(url, function (res) {
		console.log(res.statusCode + " responce from " + url);
		res.on('data', function (d) {
			if (res.statusCode == 200 && !busStopExists(busStopId)) {
				busStopList.push(JSON.parse(d.toString()));
			}
		});
	});
	req.end();
};
function busStopExists(busStopId) {
	var exists = false;
	for (var i = 0; i < busStopList.length; i++) {
		var stop = busStopList[i];
		if (stop.Sms == busStopId) {
			exists = true;
		}
	}
	return exists;
};
http.createServer(function (req, res) {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	console.log('Server recivied request: ' + req.url);
	var pathParams = req.url.toString().split('/');
	if (pathParams[1] == 'list') { // http://localhost:1337/list
		res.end(JSON.stringify(busStopList));
	} else if(pathParams[1] == 'getstop') { // http://localhost:1337/getstop/5500
		var busStopId = pathParams[2];
		if (busStopExists(busStopId)) {
			res.end("bus stop already exists");
		} else {
			getBusStop(busStopId);
			res.end("Request sent for stop:" + pathParams[2]);
		}
	} else if(pathParams[1] == 'exists') { // http://localhost:1337/exists/5500
		var exists = busStopExists(pathParams[2]);
		res.end(exists.toString());
	} else {
		res.end(JSON.stringify(pathParams));
	}
}).listen(port);