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
    xml2js = require("xml2js");

var xrd2jrd = function(str) {
    throw new Error("Not yet implemented");
};

var webfinger = function(address, callback) {
    callback(new Error("Not yet implemented"), null);
};

var hostmeta = function(address, callback) {
    callback(new Error("Not yet implemented"), null);
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
