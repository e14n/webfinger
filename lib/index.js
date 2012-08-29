// index.js
//
// main module for Webfinger
// 
// Copyright 2012, StatusNet Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var Step = require("step"),
    http = require("http"),
    https = require("https"),
    xml2js = require("xml2js"),
    url = require("url");

var xrd2jrd = function(str, callback) {
    Step(
        function() {
            var parser = new xml2js.Parser();
            parser.parseString(str, this);
        },
        function(err, doc) {
            var Link, jrd = {}, i, prop, l;
            if (err) {
                callback(err, null);
            } else {
                if (doc.hasOwnProperty("Link")) {
                    Link = doc.Link;
                    jrd.links = [];
                    if (Array.isArray(Link)) {
                        for (i = 0; i < Link.length; i++) {
                            l = {};
                            for (prop in Link[i]["@"]) {
                                if (Link[i]["@"].hasOwnProperty(prop)) {
                                    l[prop] = Link[i]["@"][prop];
                                }
                            }
                            jrd.links.push(l);
                        }
                    } else {
                        l = {};
                        for (prop in Link["@"]) {
                            if (Link["@"].hasOwnProperty(prop)) {
                                l[prop] = Link["@"][prop];
                            }
                        }
                        jrd.links.push(l);
                    }
                }
                callback(null, jrd);
            }
        }
    );
};

var jrd = function(body, callback) {
    var result;
    try {
        result = JSON.parse(body);
        callback(null, result);
    } catch (err) {
        callback(err, null);
    }
};

var request = function(module, options, mimeType, parse, callback) {

    var req = module.request(options, function(res) {

        var body = "";

        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            body = body + chunk;
        });

        res.on("error", function(err) {
            callback(err, null);
        });

        res.on("end", function() {

            if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {

                options = url.parse(res.headers.location);
                request(((options.protocol == "https:") ? https : http), options, mimeType, parse, callback);
                return;

            } else if (res.statusCode !== 200) {
                callback(new Error("Bad response code: " + res.statusCode + ":" + body), null);
                return;

            }

            if (!res.headers["content-type"] || res.headers["content-type"].substr(0, mimeType.length) != mimeType) {
                callback(new Error("Bad content type: " + res.headers["content-type"]), null);
                return;
            }

            parse(body, callback);
        });
    });

    req.on('error', function(err) {
        callback(err, null);
    });

    req.end();    
};

var httpHostMeta = function(address, callback) {

    var options = {
        hostname: address,
        port: 80,
        path: "/.well-known/host-meta",
        method: "GET"
    };

    request(http, options, "application/xrd+xml", xrd2jrd, callback);
};

var httpHostMetaJSON = function(address, callback) {

    var options = {
        hostname: address,
        port: 80,
        path: "/.well-known/host-meta.json",
        method: "GET"
    };

    request(http, options, "application/json", jrd, callback);
};

var httpsHostMeta = function(address, callback) {
    var options = {
        hostname: address,
        port: 443,
        path: "/.well-known/host-meta",
        method: "GET"
    };

    request(https, options, "application/xrd+xml", xrd2jrd, callback);
};

var httpsHostMetaJSON = function(address, callback) {

    var options = {
        hostname: address,
        port: 443,
        path: "/.well-known/host-meta.json",
        method: "GET"
    };

    request(https, options, "application/json", jrd, callback);
};

var hostmeta = function(address, callback) {
    Step(
        function() {
            httpsHostMetaJSON(address, this);
        },
        function(err, jrd) {
            if (!err) {
                callback(null, jrd);
            } else {
                httpsHostMeta(address, this);
            }
        },
        function(err, jrd) {
            if (!err) {
                callback(null, jrd);
            } else {
                httpHostMetaJSON(address, this);
            }
        },
        function(err, jrd) {
            if (!err) {
                callback(null, jrd);
            } else {
                httpHostMeta(address, this);
            }
        },
        function(err, jrd) {
            if (!err) {
                callback(null, jrd);
            } else {
                callback(new Error("Unable to get host-meta or host-meta.json"), null);
            }
        }
    );
};

var template = function(tmpl, address, mimeType, parse, callback) {
    var getme = tmpl.replace("{uri}", encodeURIComponent(address)),
        options = url.parse(getme);

    request(((options.protocol == "https:") ? https : http), options, mimeType, parse, callback);
};

var webfinger = function(address, callback) {
    var parts, username, hostname;

    if (address.indexOf("@") === -1) {
        callback(new Error(address + " doesn't look like a webfinger address"), null);
        return;
    }

    parts = address.split("@", 2);

    if (parts.length !== 2) {
        callback(new Error(address + " doesn't look like a webfinger address"), null);
        return;
    }

    username = parts[0];
    hostname = parts[1];

    Step(
        function() {
            hostmeta(hostname, this);
        },
        function(err, hm) {
            var lrdds, json, xrd;
            if (err) throw err;
            if (!hm.hasOwnProperty("links")) {
                throw new Error("No links in host-meta");
            }
            // First, get the lrdd ones
            lrdds = hm.links.filter(function(link) {
                return (link.hasOwnProperty("rel") && 
                        link.rel == "lrdd" &&
                        link.hasOwnProperty("template"));
            });
            if (!lrdds || lrdds.length === 0) {
                throw new Error("No lrdd links with templates in host-meta");
            }
            // Try JSON ones first
            json = lrdds.filter(function(link) {
                return (link.hasOwnProperty("type") &&
                        link.type == "application/json");
            });
            if (json && json.length > 0) {
                template(json[0].template, address, "application/json", jrd, this);
                return;
            }
            // Try explicitly XRD ones second
            xrd = lrdds.filter(function(link) {
                return (link.hasOwnProperty("type") &&
                        link.type == "application/xrd+xml");
            });
            if (xrd && xrd.length > 0) {
                template(xrd[0].template, address, "application/xrd+xml", xrd2jrd, this);
                return;
            }
            // Try implicitly XRD ones third
            xrd = lrdds.filter(function(link) {
                return (!link.hasOwnProperty("type"));
            });
            if (xrd && xrd.length > 0) {
                template(xrd[0].template, address, "application/xrd+xml", xrd2jrd, this);
                return;
            }
            // Otherwise, give up
            throw new Error("No lrdd links with templates and acceptable type in host-meta");
        },
        callback
    );
};

var discover = function(address, callback) {
    if (address.indexOf("@") !== -1) {
        webfinger(address, callback);
    } else {
        hostmeta(address, callback);
    }
};

exports.xrd2jrd = xrd2jrd;
exports.webfinger = webfinger;
exports.hostmeta = hostmeta;
exports.discover = discover;
