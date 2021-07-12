let sio = require('socket.io');
let io = null;

exports.io = function () {
    return io;
};

exports.initialize = function(server) {
    return io = sio(server);
};