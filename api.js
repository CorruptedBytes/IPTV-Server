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

const path = require('path');
const fs = require('fs');
const clc = require('cli-color');
const index = require('./index.js');
const stream = require('./stream.js');
const channel = require('./channel.js');
const server = require('./server.js');

const apiHandler = (req, res) => {
    if (req.params.key == process.env.API_KEY) {
        switch (req.params.action) {
            case "reload":
                reload(res);
                break;

            case "restart":
                restart(res);
                break;

            case "channel":
                channelUtils(req, res);
                break;

            case "key":
                keyUtils(res);
                break;

            default:
                res.status(400).send("400 Bad Request");
                break;
        }
    } else {
        res.status(401).send("401 Unauthorized");
    }
}

function reload(res) {
    server.loadKeys();
    res.status(200).send("OK");
}

function restart(res) {
    console.log(clc.yellow("Restarting..."))
    for (let i = 0; i < channel.getAllChannels().length; i++) {
        if (stream.getStream(channel.getAllChannels()[i]) != undefined)
            stream.getStream(channel.getAllChannels()[i]).kill();

        channel.cleanupChannel(channel.getAllChannels()[i]);
    }

    setTimeout(() => {
        server.loadKeys();
        channel.startChannels();
        res.status(200).send("OK");
    }, 100);
}

function keyUtils(res) {
    res.status(200).send(server.getKeys());
}

function channelUtils(req, res) {
    switch (req.query.action) {
        case "add":
            let id = req.query.id;
            let name = req.query.name;
            let group = req.query.group;
            res.status(200).send((channel.createChannel(id, name, group)) ? "OK" : "FAILED");
            break;

        case "cleanup":
            if (req.query.id == undefined) {
                for (let i = 0; i < channel.getAllChannels().length; i++) {
                    channel.cleanupChannel(channel.getAllChannels()[i]);
                }
            } else {
                channel.cleanupChannel(req.query.id);
            }
            res.status(200).send("OK");
            break;

        case "list":
            res.status(200).send(channel.getAllChannels());
            break;

        default:
            res.status(400).send("400 Bad Request");
            break;
    }
}


module.exports = {
    apiHandler
}