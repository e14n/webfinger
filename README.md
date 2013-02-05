# Webfinger

Webfinger and host-meta client library for Node.js.

It supports:

* XRD documents
* JRD documents
* host-meta
* host-meta.json
* http and https

## License

Copyright 2012, StatusNet Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## API

### webfinger(address, callback)

Gets link data for the address `address` and returns it to function `callback`.

`callback` should take two arguments: `err` for an error, and `jrd`
for a JRD representation of the Webfinger data.

Note that the data is returned in JRD format even if it's in XRD
format on the server.

### webfinger(address, rel, callback)

Gets link data for the address `address` and with link relation type
`rel` and returns it to function `callback`.

`callback` should take two arguments: `err` for an error, and `jrd`
for a JRD representation of the Webfinger data.

Note that the data is returned in JRD format even if it's in XRD
format on the server.

### hostmeta(address, callback)

Gets link data for the host at `address` and returns it to function `callback`.

`callback` works just like with `webfinger()`.

### discover(address, callback)

Gets link data for `address` and returns it to function `callback`.

If you've got an address and you don't want to bother figuring out if it's a 
webfinger or a hostname, call this and we'll do it for you.

`callback` works just like with `webfinger()`.

## Testing

The tests set up servers that listen on ports 80 and 443. On most
Unix-like systems, you have to be root to listen on ports below 1024 or whatever.

So, to run the unit tests, you have to go:

    sudo npm test

It's probably not a good idea to sudo any script without thinking
about it pretty hard. I suggest that if you're doing development, you
do it in a virtual machine so you're not sudo'ing dangerous stuff on
your main computer.

# Bugs

Bugs welcome, see:

 https://github.com/evanp/webfinger/issues
