var http = require('http');
var https = require('https');
var logging = require('./console-config');
var hard_coded_data = require('./busstops-hardcoded');
logging.add_local_logging();
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var port = process.env.port || 1337;
var busStopList = [];
var stopsToAddToDb = [];
const StringDecoder = require('string_decoder').StringDecoder;
const decoder = new StringDecoder('utf8');
var url = 'mongodb://localhost:27017/test';
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  var collection = db.collection('stops');
  collection.find({}).toArray(function (err, docs) {
	  for (var index = 0; index < docs.length; index++) {
		  var doc = docs[index];
  	  	  busStopList.push(doc);
	  }
		console.log("finished adding stops to web server from mongodb");
      db.close();
  });
});
function addStopToDb(stop) {
	MongoClient.connect(url, function(err, db) {
	assert.equal(null, err);
	db.collection('stops').insertOne(stop);
	db.close();
	});
}
function addStopsToDb(stops) {
	MongoClient.connect(url, function(err, db) {
	assert.equal(null, err);
	db.collection('stops').insertMany(stops);
	db.close();
	});
}
function getBusStop(busStopId) {
	if (busStopExists(busStopId)) {
		console.log("Bus stop:" + busStopId + " already exists localally. The http request will not be sent as to save on 429s");
		return;
	}
	var url = 'https://www.metlink.org.nz/api/v1/Stop/' + busStopId;
	console.log("fetching data from " + url);
	var req = https.get(url, function (res) {
		console.log(res.statusCode + " responce from " + url);
		res.on('data', function (d) {
			if (res.statusCode == 200 && !busStopExists(busStopId)) {
				var stop = JSON.parse(d.toString());
				busStopList.push(stop);
				stopsToAddToDb.push(stop);
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
function getBusRoute(routeId) {
	var url = 'https://www.metlink.org.nz/timetables/bus/' + routeId + '/inbound/mapdatajson';
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
					getBusStop(point.name);
				}
			}
		});
	});
	req.end();
}
function getAllBusRoutes() {
	var routeIds = hard_coded_data.busRoutes();
	for (var index = 0; index < routeIds.length; index++) {
		var routeId = routeIds[index];
		try {
			getBusRoute(routeId);
		} catch (error) {
			console.log(error);	
		}
	}
}
function searchBySubString(substr) {
	var results = [];
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
	} else if(pathParams[1] == 'getroute') { // http://localhost:1337/getroute/3
		getBusRoute(pathParams[2]);
		res.end("Request sent for route:" + pathParams[2]);
	} else if(pathParams[1] == 'getallroutes') { // http://localhost:1337/getallroutes
		getAllBusRoutes();
		res.end("Request has been sent to scan all routes");
	} else if(pathParams[1] == 'grep') { // http://localhost:1337/grep/lampton
		res.end(JSON.stringify(searchBySubString(pathParams[2])));
	} else if(pathParams[1] == 'count') { // http://localhost:1337/count
		res.end(busStopList.length.toString());
	} else if(pathParams[1] == 'addstopstomongodb') { // http://localhost:1337/addstopstomongodb
		addStopsToDb(stopsToAddToDb);
		stopsToAddToDb = [];
		res.end("attempt to add stops to mongodb");
	} else {
		res.end(JSON.stringify(pathParams));
	}
}).listen(port);