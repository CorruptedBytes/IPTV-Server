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
const ffmpeg = require('fluent-ffmpeg');
const clc = require('cli-color');
const index = require('./index.js');

let streams = new Array();

const InputType = {
    FILE: "FILE",
    DEVICE: "DEVICE",
    OTHER: "OTHER",
    STATIC: "STATIC"
}

const stream = (id, input_type, input) => {

    const threads = 5;

    if (input_type === InputType.STATIC)
        return false;

    let command = ffmpeg(input);

    if (input_type === InputType.FILE) {
        input = path.resolve(input);
    } else if (input_type === InputType.DEVICE) {
        input = 'video=' + input;
        command = ffmpeg(input);

        switch (process.platform) {
            case "win32":
                command.inputOptions(['-f dshow']); // DirectShow on Windows
                break;

            case "linux":
                command.inputOptions(['-f v4l2']); // v4l2 on Linux
                break;

            case "darwin":
                command.inputOptions(['-f avfoundation']); // avfoundation on MacOS
                break;
        }
    }

    command
        .output(path.resolve(index.iptv_directory + "\\" + id + "\\segments\\index.m3u8"))
        .format('hls')
        .audioCodec('libmp3lame')
        .audioBitrate('16000k')
        .videoCodec('libx264')
        .videoBitrate('16000k')
        .outputOptions([
            '-hls_segment_type mpegts',
            '-hls_segment_filename ' + path.resolve(index.iptv_directory + '\\' + id) + '\\segments\\%13d.ts', // The file names of the segments should start with a 13-digit number (0000000000000.ts)
            '-hls_flags delete_segments', '-hls_delete_threshold 1', // Unnecessary segments should be deleted from the stream and the directory
        ]).on('start', (cmdline) => {
            console.log(clc.green("[IPTV] Streaming Channel on ID: " + id));
        }).on('error', (err) => {
            // Error Event
        }).on('progress', (progress) => {
            // Progress Event
        });

    if (input_type === InputType.FILE) {
        command.addInputOptions("-stream_loop", "-1");
        command.addOutputOptions("-threads", threads.toString());
        command.addOutputOptions("-c", "copy");
        command.addOutputOptions("-hls_time", "30");
    } else if (input_type === InputType.DEVICE) {
        command.addOutputOptions("-threads", threads.toString());
        command.addOutputOptions("-hls_time", "3");
    }

    streams[id] = command;
    command.run();
}

const getStream = (id) => {
    return streams[id];
}

module.exports = {
    stream, InputType, getStream
}
