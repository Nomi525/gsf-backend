import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { sessions } from '../controllers/users/userAuth.js';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });


io.on('connection', (socket) => {
    socket.on('checkAuth', async (data) => {
        let check = jwt.verify(data.token, process.env.JWT_SECRET)
        let status;
        if (sessions[check.id] === data.token) {
            status = true
        } else {
            status = false

        }
        socket.emit('checkAuth', { isActive: status })
    })
})

export { app, server as Server, io as Socket };
