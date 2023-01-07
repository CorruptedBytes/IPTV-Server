/*

MIT License

Copyright (c) 2023 CorruptedBytes

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

require('dotenv').config();

const express = require('express');
const mysql = require('mysql');
const http = require('http');
const clc = require('cli-color');
const fs = require('fs');
const api = require('./api.js');
const server = require('./server.js');
const channel = require('./channel.js');

const iptv_directory = "./iptv";
const hls_port = process.env.IPTV_PORT;

if (!fs.existsSync(iptv_directory))
    fs.mkdirSync(iptv_directory);

hls = express();

hls.disable('x-powered-by');

var sql = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

module.exports.iptv_directory = iptv_directory;
module.exports.sql = sql;

server.connectMySQL();
hls.route('/api/:key/:action').get(api.apiHandler).post(api.apiHandler);
server.registerHLSRoute(hls);
channel.startChannels();

var hls_server = http.createServer(hls);

hls_server.listen(hls_port, () => {
    console.log(clc.green("[IPTV] Running on port: " + hls_port));
});