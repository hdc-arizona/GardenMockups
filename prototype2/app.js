var http = require('http');
var fs = require('fs');
var url = require('url');
const PORT = 3000;

var server = http.createServer(function (request, response) {
    var path = url.parse(request.url).pathname;
    console.log(__dirname + path);
    //switch (path) {
    //case '/index.html':
    fs.readFile(__dirname + path, function (error, data) {
        if (error) {
            response.writeHead(404);
            response.write(error);
            response.end();
        }
        else {
            response.writeHead(200, {
                'Content-Type': 'text/html'
            });
            response.write(data);
            response.end();
        }
    });
    //break;
    //default:
    //response.writeHead(404);
    //response.write("opps this doesn't exist - 404");
    //response.end();
    //break;
    //}
});

server.listen(PORT);