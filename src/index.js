const http = require('http');
const express = require('express');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = socketio(server);//should be called with raw http server

const publicDirPath = path.join(__dirname, '../public');

app.use(express.static(publicDirPath));

io.on('connection', (socket) => {
    console.log('New WebSocket connection received.');

    socket.on('join', ({ username, room }, callback) => {
        socket.join(room);
        const { error, user } = addUser({ id: socket.id, username, room });
        if (error) {
            return callback(error);
        }
        socket.emit('message', generateMessage(`Welcome, ${user.username}!`));
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        callback();

    });

    socket.on('sendMessage', (chatMsg, callback) => {
        const user = getUser(socket.id);

        if (!user) {
            return callback('User not available ');
        }

        const filter = new Filter();

        if (filter.isProfane(chatMsg)) {
            return callback('Profanity is not allowed!');
        }
        io.to(user.room).emit('message', generateMessage(user.username, chatMsg));
        callback();
    });

    socket.on('sendLocation', ({ longitude, latitude }, callback) => {
        const user = getUser(socket.id);

        if (!user) {
            return callback('User not available ');
        }

        const location = `https://www.google.com/maps/?q=${latitude},${longitude}`;
        //io.emit('message', location);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, location));
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    })
})

server.listen(port, () => {
    console.log('Server started at port:' + port);
})