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

const path = require('path');
const fs = require('fs');
const index = require('./index.js');
const stream = require('./stream.js');
const utils = require('./utils.js');

const getConfig = (id) => {
    return JSON.parse(fs.readFileSync(path.resolve(index.iptv_directory + '/' + id + '/channel.json'), 'utf-8'));
}

const isChannel = (id) => {
    const config_file = path.resolve(index.iptv_directory + '/' + id + '/channel.json');
    return fs.existsSync(config_file);
}

const isSystemChannel = (id) => {
    return (isChannel(id) && getConfig(id).group.trim() == "SYSTEM");
}

const createChannel = (id, name, group, requireKey = true, listed = true, inputType = "DEVICE", input = "OBS Virtual Camera") => {
    if (!isChannel(id) && id != undefined && name != undefined && group != undefined) {
        fs.mkdirSync(path.resolve(index.iptv_directory + "/" + id));
        let jsonObj = JSON.stringify({ name: name, group: group, requireKey: requireKey, listed: listed, inputType: inputType, input: input });
        fs.writeFileSync(path.resolve(index.iptv_directory + "/" + id + "/channel.json"), jsonObj.toString());
        return true;
    } else {
        return false;
    }
}

const cleanupChannel = (id) => {
    let dir = path.resolve(index.iptv_directory + "/" + id);
    if (getConfig(id).inputType !== stream.InputType.STATIC) {
        if (fs.existsSync(dir + "/segments"))
            fs.rmSync(dir + "/segments", { recursive: true });

        fs.mkdirSync(dir + "/segments");
    }
}

const getAllChannels = () => {
    let channels = [];
    let dirs = utils.getDirectories(index.iptv_directory);
    for (let i = 0; i < dirs.length; i++) {
        let current_path = index.iptv_directory + '/' + dirs[i];
        if (fs.existsSync(path.resolve(current_path + "/channel.json"))) {
            channels.push(dirs[i]);
        }
    }
    return channels;
}

const startChannels = () => {
    for (let i = 0; i < getAllChannels().length; i++) {
        if (getConfig(getAllChannels()[i]).inputType !== stream.InputType.STATIC) {
            streamChannel(getAllChannels()[i]);
        }
    }
}

function streamChannel(id) {
    const dir = path.resolve(index.iptv_directory + '/' + id);

    cleanupChannel(id);

    stream.stream(id, getConfig(id).inputType, getConfig(id).input);
}

module.exports = {
    getConfig, isChannel, startChannels, createChannel, cleanupChannel, isSystemChannel, getAllChannels
}
