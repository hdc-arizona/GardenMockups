//var http = require('http');
//var fs = require('fs');
//var url = require('url');
//const PORT = 3000;

//var server = http.createServer(function (request, response) {
//    var path = url.parse(request.url).pathname;
//    console.log(__dirname + path);
//    fs.readFile(__dirname + path, function (error, data) {
//        if (error) {
//            response.writeHead(404);
//            response.write(error);
//            response.end();
//        }
//        else {
//            response.writeHead(200, {
//                'Content-Type': 'text/html'
//            });
//            response.write(data);
//            response.end();
//        }
//    });
//});
//server.listen(PORT);



var fs = require('fs');

var path = "/index.html";
console.log(__dirname + path);

fs.readFile(__dirname + path, function (error, data) {
    if (error) {
        console.log("Cannot open file");
    }
    else {
        console.log(data);
    }
});