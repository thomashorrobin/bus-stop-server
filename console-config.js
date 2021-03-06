var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

module.exports = {
    add_local_logging: logLocally
}
function logLocally() {
    console.log = function(d) {
        log_file.write(util.format(d) + '\n');
        log_stdout.write(util.format(d) + '\n');
    };
    console.info = function(d) {
        log_file.write(util.format(d) + '\n');
    };
}
