var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://localhost:27017/test';
var appdb;

MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    appdb = db;
});

module.exports = {
    add: add,
    list: list,
    count: count
};

function add(stop, callback) {
    try {
        appdb.collection('stops').insertOne(stop);
        callback(null);
    } catch (error) {
        callback(error);
    }
}

function list(callback) {
    appdb.collection('stops').find({}).toArray(function (err, docs) {
        var busStopList = [];
        for (var index = 0; index < docs.length; index++) {
            var doc = docs[index];
            busStopList.push(doc);
        }
        callback(busStopList);
    });
}

function count(callback) {
    return appdb.collection('stops').count(function (err, result) {
        callback(result);
    });;
}
