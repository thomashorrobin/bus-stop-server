var http = require('http');
var https = require('https');
var _ = require('underscore');
var port = process.env.port || 1337;
var busStopList = [];
function getBusStop(busStopId) {
	var url = 'https://www.metlink.org.nz/api/v1/Stop/' + busStopId;
	var req = https.get(url, function (res) {
		res.on('data', function (d) {
			busStopList.push(JSON.parse(d.toString()));
		});
	});
	req.end();
};
function busStopExists(busStopId) {
	return _.some(busStopList, function (bs) { 
		console.log(bs);
		return bs.sms == busStopId;
	});
};
http.createServer(function (req, res) {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	var pathParams = req.url.toString().split('/');
	if (pathParams[1] == 'list') { // http://localhost:1337/list
		res.end(JSON.stringify(busStopList));
	} else if(pathParams[1] == 'getstop') { // http://localhost:1337/getstop/5500
		getBusStop(pathParams[2]);
	} else if(pathParams[1] == 'exists') { // http://localhost:1337/exists/5500
		busStopExists(pathParams[2]);
	}
	res.end(JSON.stringify(pathParams));
}).listen(port);