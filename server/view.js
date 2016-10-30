var assert = require('assert');
var process = require('process');
var child_process = require('child_process');
var fs = require('fs');
var colors = require('colors');

var cmd = 'node';
var args = ['server.js',8000];
var changeTimeout;

var createServer = function(){
    var argString = args.join(' ').toString();
    console.log('starting: %s %s'.green,cmd,argString);

    server = child_process.spawn(cmd,args);

    server.stdout.on('data',function(data){
        var output = data.toString().trim();
        var message = 'stdout: '.blue + output;
        console.log(message);
    });

    server.stderr.on('data',function(data){
        var output = data.toString().trim();
        var message = 'stderr: '.red + output;
        console.log(message);
    });

    server.on('exit',function(code,signal){
        console.log('Server terminated: received %s'.yellow,signal);
        setTimeout(function(){
            server = createServer();
        },2000);
    });

    return server;
}

var server = createServer();

fs.watchFile('server.js',{
    persistent : true,
    interval : 2000,
}, function(curr,prev){
    if (curr.mtime > prev.mtime) {
        console.log('detected change in file'.cyan);
        server.kill('SIGTERM');
    }
});

process.on('SIGINT',function(){
    server.removeAllListeners('exit');
    server.kill('SIGTERM');
    console.log('Closing view...');
    process.exit(0);
});