var db = require('./db');
var busStopCashedList = [];

module.exports = {
    exists: exists,
    refresh: refresh
}

function exists(stopId) {
    console.info("Cashe contains " + busStopCashedList.length.toString() + " records");
    if (busStopCashedList.length == 0) {
        refresh();
    }
	var exists = false;
	for (var i = 0; i < busStopCashedList.length; i++) {
		var stop = busStopCashedList[i];
		if (stop.Sms == stopId) {
			exists = true;
		}
	}
	return exists;
}

function refresh() {
    db.list(function (data) {
        busStopCashedList = data;
    });
}
