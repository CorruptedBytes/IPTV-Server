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

const clc = require('cli-color');
const path = require('path');
const fs = require('fs');
const index = require('./index.js');
const crc32 = require('./crc32.js');
const utils = require('./utils.js');
const channel = require('./channel');
const stream = require('./stream.js');
const api = require('./api.js');

let keys = [];

const connectMySQL = () => {
    index.sql.connect(function (err) {
        if (!err) {
            console.log(clc.green("[MySQL] Connected"));
            loadKeys();
        } else {
            console.log(clc.red("[MySQL] Not connected!"));
            process.exit(0);
        }
    });
}

const getKeys = () => {
    return keys;
}

const registerHLSRoute = (app) => {
    /* M3U8 File */
    app.get('/iptv/:key/:id/index.m3u8', (req, res) => {
        if (channel.isChannel(req.params.id)) {
            if (keys.includes(req.params.key) || channel.getConfig(req.params.id).requireKey === false) {
                res.setHeader('access-control-allow-origin', "*");
                res.setHeader('Content-type', "application/octet-stream");
                res.setHeader('Content-disposition', 'attachment; filename=index.m3u8');
                res.status(200).send(getM3U8(req.params.key, req.params.id));
                res.end();
            } else {
                res.setHeader('access-control-allow-origin', "*");
                res.setHeader('Content-type', "application/octet-stream");
                res.setHeader('Content-disposition', 'attachment; filename=index.m3u8');
                res.status(200).send(getM3U8(req.params.key, 403));
                res.end();
            }
        } else {
                res.setHeader('access-control-allow-origin', "*");
                res.setHeader('Content-type', "application/octet-stream");
                res.setHeader('Content-disposition', 'attachment; filename=index.m3u8');
                res.status(200).send(getM3U8(req.params.key, 404));
                res.end();
        }
    });

    /* Master M3U8 Playlist File */
    app.get('/iptv/:key/playlist.m3u8', (req, res) => {
        if (keys.includes(req.params.key)) {
            res.setHeader('access-control-allow-origin', "*");
            res.setHeader('Content-type', "application/octet-stream");
            res.setHeader('Content-disposition', 'attachment; filename=playlist.m3u8');
            res.status(200).send(getMasterPlaylist(req.params.key));
            res.end();
        } else {
            res.setHeader('access-control-allow-origin', "*");
            res.setHeader('Content-type', "application/octet-stream");
            res.setHeader('Content-disposition', 'attachment; filename=index.m3u8');
            res.status(200).send(getM3U8(req.params.key, 403));
            res.end();
        }
    });

    /* Icon File */
    app.get('/iptv/:key/:id/icon.png', (req, res) => {
        if (keys.includes(req.params.key)) {
            if (channel.isChannel(req.params.id)) {
                res.setHeader('access-control-allow-origin', "*");
                res.status(200).sendFile(path.resolve(index.iptv_directory + "/" + req.params.id + "/icon.png"));
            } else {
                res.status(204).send("");
            }
        } else {
            res.status(401).send("401 Unauthorized");
        }
    });

    /* TS-Segments */
    app.get('/iptv/:key/:id/:segment', (req, res) => {
        if (req.params.segment.endsWith(".ts")) {
            if (keys.includes(req.params.key) || channel.getConfig(req.params.id).requireKey === false) {
                if (req.query.hash == getHash(req.params.key, req.params.id, req.params.segment)) {
                    if (fs.existsSync(path.resolve(index.iptv_directory + "/" + req.params.id + "/segments/" + req.params.segment))) {
                        res.setHeader('access-control-allow-origin', "*");
                        res.status(200).sendFile(index.iptv_directory + "/" + req.params.id + "/segments/" + req.params.segment, { root: __dirname });
                    } else {
                        res.status(404).send("404 Not Found");
                    }
                } else {
                    res.status(403).send("403 Forbidden");
                }
            } else {
                res.status(401).send("401 Unauthorized");
            }
        } else {
            res.status(204).send("");
        }
    });

    app.use((req, res, next) => {
        res.status(404).send("404 Not Found");
    })
}

const loadKeys = () => {
    keys.length = 0;
    index.sql.query("SELECT `key` FROM `keys`", function (err, rows, fields) {

        let result = Object.values(JSON.parse(JSON.stringify(rows)));

        Object.keys(result).forEach(function (key) {
            let value = result[key];
            keys.push(value["key"]);
        });
    });
}

function getHash(key, id, segment) {
    // CRC32 => (KEY:ID:SEGMENT):SECRET
    return crc32.crc32("(" + key + ":" + id + ":" + segment + "):" + process.env.SECRET);
}

function getM3U8(key, id) {
    if (!fs.existsSync(path.resolve(index.iptv_directory + '/' + id + '/segments/index.m3u8')))
        return undefined;

    let protocol = (process.env.IPTV_PORT == 443) ? "https://" : "http://";
    let host = (process.env.IPTV_PORT == 80 || process.env.IPTV_PORT == 443) ? process.env.HOST : process.env.HOST + ":" + process.env.IPTV_PORT;
    let start_segment = getStartSegment(id);

    let m3u8 = "";
    m3u8 += "#EXTM3U\n";
    m3u8 += "#EXT-X-VERSION:3\n";
    m3u8 += "#EXT-X-MEDIA-SEQUENCE:" + getM3U8Value(id, "#EXT-X-MEDIA-SEQUENCE") + "\n";
    m3u8 += "#EXT-X-TARGETDURATION:" + getM3U8Value(id, "#EXT-X-TARGETDURATION") + "\n";

    let j = parseInt(utils.optimizeNumber((start_segment.toString() || '0000000000000.ts').replace(".ts", "").toString()));
    for (let i = 0; i < getEndSegments(id); i++) {
        let segment = utils.pad(j, 13) + ".ts";
        m3u8 += "#EXTINF:" + getM3U8EXTINF(id, segment) + "\n";
        m3u8 += protocol + host + "/iptv/" + key + "/" + id + "/" + segment + "?hash=" + getHash(key, id, segment) + "\n";
        j++;
    }

    (channel.getConfig(id).inputType === stream.InputType.STATIC) ? m3u8 += "#EXT-X-ENDLIST" : "";

    return m3u8;
}

function getMasterPlaylist(key) {
    let m3u8 = "";
    m3u8 += "#EXTM3U\n";

    let protocol = (process.env.IPTV_PORT == 443) ? "https://" : "http://";
    let host = (process.env.IPTV_PORT == 80 || process.env.IPTV_PORT == 443) ? process.env.HOST : process.env.HOST + ":" + process.env.IPTV_PORT;

    let dirs = utils.getDirectories(index.iptv_directory);
    for (let i = 0; i < dirs.length; i++) {
        if (channel.isChannel(dirs[i]) && channel.getConfig(dirs[i]).listed === true) {
            let icon_url = (fs.existsSync(path.resolve(index.iptv_directory + "/" + dirs[i] + "/icon.png"))) ? "tvg-logo=\"" + protocol + host + "/iptv/" + key + "/" + dirs[i] + "/icon.png\"" : "";
            m3u8 += "#EXTINF:-1 tvg-name=\"" + channel.getConfig(dirs[i]).name + "\" " + icon_url + "," + channel.getConfig(dirs[i]).name + "\n";
            m3u8 += "#EXTGRP:" + channel.getConfig(dirs[i]).group + "\n";
            m3u8 += protocol + host + "/iptv/" + key + "/" + dirs[i] + "/index.m3u8";
        }
    }
    return m3u8;
}

function getStartSegment(id) {
    const data = fs.readFileSync(path.resolve(index.iptv_directory + '/' + id + '/segments/index.m3u8'), 'utf-8');
    let line = data.toString().split("\n");

    for (let i = 0; i < line.length; i++) {
        if (line[i].trim().endsWith(".ts")) {
            return line[i];
        }
    }
}

function getEndSegments(id) {
    let segments = 0;
    const data = fs.readFileSync(path.resolve(index.iptv_directory + '/' + id + '/segments/index.m3u8'), 'utf-8');
    let line = data.toString().split("\n");

    for (let i = 0; i < line.length; i++) {
        if (line[i].trim().endsWith(".ts")) {
            segments++;
        }
    }
    return segments;
}

function getM3U8Value(id, content) {
    const data = fs.readFileSync(path.resolve(index.iptv_directory + '/' + id + '/segments/index.m3u8'), 'utf-8');
    let line = data.toString().split("\n");

    for (let i = 0; i < line.length; i++) {
        if (line[i].trim().startsWith(content)) {
            return line[i].trim().split(":")[1].toString();
        }
    }
    return undefined;
}

function getM3U8EXTINF(id, segment) {
    const data = fs.readFileSync(path.resolve(index.iptv_directory + '/' + id + '/segments/index.m3u8'), 'utf-8');
    let line = data.toString().split("\n");

    for (let i = 0; i < line.length; i++) {
        if (line[i].trim().startsWith("#EXTINF") && line[i + 1].trim().startsWith(segment)) {
            return line[i].trim().split(":")[1].toString();
        }
    }
    return undefined;
}

module.exports = {
    connectMySQL, registerHLSRoute, loadKeys, getKeys
}
