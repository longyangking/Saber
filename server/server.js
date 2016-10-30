var http = require("http");
var fs = require("fs");
var path = require("path");
var process = require("process");
var querystring = require("querystring");
var zlib = require("zlib");

var write404 = function(response,callback){
	var file = "./error/404.html";
	
}