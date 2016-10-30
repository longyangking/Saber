var http = require("http");
var fs = require("fs");
var path = require("path");
var process = require("process");
var querystring = require("querystring");
var zlib = require("zlib");

var writeFile = function(fd,response,callback){
	var output = fs.createReadStream('',{
		fd : fd,
		flags : 'r',
		autoClose : true,
	});

	output.pipe(zlib.createGzip()).pipe(response);

	if (callback !== undefined){
		callback();
	}
}

var write404 = function(response,callback){
	var file = "./error/404.html";
	getHeader(file,function(header){
		response.writeHead(404,header);
		fs.open(file,'r',function(err,fd){
			writeFile(fd,response,function(err){
				if (callback !== undefined){
					if (err) {
						callback(503);
					} else {
						callback(404);
					}
				}
			});
		});
	});
}

var write500 = function(response,callback){
	var file = './error/500.html';
	getHeader(file,function(header){
		response.writeHead(500,header);
		fs.open(file,'r',function(err,fd){
			writeFile(fd,response,function(err){
				if (err){
					callback(503);
				} else {
					callback(500);
				}
			})
		})
	})
}

var getHeader = function(filename,callback){
	var header = {};
	console.log(filename);

	var ext = path.extname(filename);
	if (ext == '.html') {
		header["Content-Type"] = "text/html";
	} else if (ext == '.js'){
		header["Content-Type"] = "text/js";
	} else if (ext == '.css'){
		header["Content-Type"] = "text/css";
	} else if (ext == '.ico'){
		header["Content-Type"] = "image/ico";
	} else {
		header["Content-Type"] = "text/plain";
	}
	header["Content-Enconding"] = "gzip";

	if (callback !== undefined){
		callback(header);
	}
}

var sendHeader = function(request,response,callback){
	var page = request.url.split('?');
	var filename = ('./html' + page[0]).trim();

	fs.stat(filename,function(stat_err,stats){
		if (stat_err){
			write404(response,callback);
			callback(404);
		} else {
			if (stats.isDirectory()){
				filename += 'index.html';
			}
			fs.open(filename,'r',function(file_err,fd){
				if (file_err) {
					write500(repsone,callback);
					callback(500,fd);
				} else {
					getHeader(filename,function(header){
						response.writeHeader(200,header);
						callback(200,fd);
					});
				}
			});
		}
	});
}

var serverHead = function(request,response,callback){
	sendHeader(request,response,function(code,fd){
		fs.close(fd);
		response.end();
		if (callback !== undefined){
			callback(code);
		}
	});
}

var serverGet = function(request,response,callback){
	sendHeader(request,response,function(code,fd){
		writeFile(fd,response,function(write_err){
			if (write_err){
				callback(503);
			} else {
				callback(code);
			}
		});
	});
}

var serverPost = function(request,response,callback){
	var body = '';

	request.on('data',function(chunk){
		body += chunk.toString();
	});

	request.on('end',function(){
		response.writeHead(200,'OK',{'Content-Type':'text/html; charset=utf-8'});
		var tokens = querystring.parse(body);
		response.write('<p>'+body+'</p>');
		response.end();
	});

	if (callback !== undefined){
		callback(200);
	}
}

var notAllowed = function(request,response,callback){
	response.writeHead(405,{'Content-Type':'text/html'});
	response.write('<html><head><title>405 - Method Not Allowed</title></head><body><h1>Method Not Allowed</h1></body></html>');
	response.end();

	if (callback !== undefined){
		callback(405);
	}
}

var logMessage = function(code,method,url,err){
	if (err){
		console.log('Deal with Errors');
	} else {
		console.log('['+code+'] '+method+' response sent to '+url);
	}
}

var routeRequest = function(request,response){
	var method = request.method;
	var url = request.url;
	console.log(method + 'request to' + url);

	if (method == 'GET'){
		serverGet(request,response,function(code,err){
			logMessage(code,method,url,err);
		});
	} else if (method == 'HEAD'){
		serverHead(request,response,function(code,err){
			logMessage(code,method,url,err);
		});
	} else if (method == 'POST'){
		serverPost(request,response,function(code,err){
			logMessage(code,method,url,err);
		});
	} else {
		notAllowed(request,response,function(code,err){
			logMessage(code,method,url,err);
		});
	}
}

var init = function(){
	if(process.argv[2]){
		var port = process.argv[2];
	} else {
		var port = 8000;
	}

	process.on('uncaughtException',function(err){
		if (err.errno = "EADDRINUSE"){
			console.error('Port already in use');
		} else {
			console.error(err.stack);
		}
		process.exit(1);
	});

	server.listen(port);
	console.log("Server is listening on port: %s",port);
}

var server = http.createServer(routeRequest);
init();