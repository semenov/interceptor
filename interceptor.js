var http = require('http');
var request = require('request');
var config = require('./config');
var querystring = require('querystring');
var url = require('url');

var dispatcher = {
    '/advanced': function(params, object) {
        if (object.criteria.what == "отель") {
            var firms = object.results.firm.results; 
            extendFirm(firms[0], {
                office: "1 этаж",
                hotel_class: 3,
                rooms_count: 100,
                price: {
                    min: 100,
                    max: 2000
                },
                hotel_internet: "paid",
                room_internet: "paid",
                smoking: "allowed",
                currency: "RUB"
            });

            extendFirm(firms[1], {
                office: "1 этаж",
                hotel_class: 2,
                rooms_count: 1000,
                price: {
                    min: 150,
                    max: 2000
                },
                hotel_internet: "free",
                room_internet: "paid",
                smoking: "allowed",
                currency: "RUB"
            });
        }


        function extendFirm(firm, data) {
            firm.additional_info = data;
        }

        return object;
    }
};

http.createServer(function (req, res) {
    var originalUrl = req.url;
    var parsedUrl = url.parse(originalUrl, true);
    var action = parsedUrl.pathname;
    var params = parsedUrl.query;
    var format = params.output;
    var callbackName = params.callback;
    var processor = dispatcher[action];

    var modifiedUrl;

    if (processor) {
        params.output = 'json';
        modifiedUrl = config.host + action + '?' + querystring.stringify(params)
    } else {
        modifiedUrl = config.host + originalUrl;
    }
    
    request(modifiedUrl, function (error, response, body) {
        if (!error) {
            var responseType, 
                responseBody;
            // application/javascript
            if (processor) {
                var object = JSON.parse(body);
                var modifiedObject = processor(params, object);
                var responseType, responseBody;
                var responseJson = JSON.stringify(modifiedObject);
                if (format == 'json') {
                    responseType = 'application/json';
                    responseBody = responseJson;
                } else if (format == 'jsonp') {
                    responseType = 'application/javascript';
                    responseBody = callbackName + '(' + responseJson + ')';
                }


            } else {
                responseType = response.headers['content-type'];
                responseBody = body;
            }

            res.writeHead(200, {'Content-Type': responseType});
            res.write(responseBody);
        }
        res.end();
    });
    
}).listen(1337);

console.log('Server running at http://127.0.0.1:1337/');