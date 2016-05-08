const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');
var hard_coded_data = require('./busstops-hardcoded');
var https = require('https');
var db = require('./db');
var cashe = require('./db-cashe');
var baseUrl = 'https://www.metlink.org.nz';
module.exports = {
    addBusStop: addBusStop,
    addBusRoute: addBusRoute,
    addAllBusRoutes: addAllBusRoutes
}
function addBusStop(busStopId) {
	if (cashe.exists(busStopId)) {
		console.log("Bus stop:" + busStopId + " already exists localally. The http request will not be sent as to save on 429s");
		return;
	}
	var url = baseUrl + '/api/v1/Stop/' + busStopId;
	console.log("fetching data from " + url);
	var req = https.get(url, function (res) {
		console.log(res.statusCode + " responce from " + url);
		res.on('data', function (d) {
			if (res.statusCode == 200 && !cashe.exists(busStopId)) {
				var stop = JSON.parse(d.toString());
				db.add(stop, function (error) {
                    if (error) {
                        console.log(error);
                    }
                });
			}
		});
	});
	req.end();
};
function addBusRoute(routeId) {
	var url = baseUrl + '/timetables/bus/' + routeId + '/inbound/mapdatajson';
	console.log("fetching data from " + url);
	var req = https.get(url, function (res) {
		console.log(res.statusCode + " responce from " + url);
		res.on('data', function (d) {
			if (res.statusCode == 200) {
				var routeData;
				try {
					routeData = JSON.parse(decoder.write(d));
				} catch (error) {
					console.log("The returned json was unable to be parsed by JSON.parse");
					return;
				}
				for (var index = 0; index < routeData.points.length; index++) {
					var point = routeData.points[index];
					addBusStop(point.name);
				}
			}
		});
	});
	req.end();
}
function addAllBusRoutes() {
	var routeIds = hard_coded_data.busRoutes();
	for (var index = 0; index < routeIds.length; index++) {
		var routeId = routeIds[index];
		try {
			addBusRoute(routeId);
		} catch (error) {
			console.log(error);	
		}
	}
}
