const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let stopwatchTime = 0;
let isRunning = false;
let chatHistory = [];  // Store chat messages

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Socket.io communication
io.on('connection', (socket) => {
    console.log('A user connected');
    
    // Send the current stopwatch status and chat history when a new user connects
    socket.emit('updateTime', { stopwatchTime, isRunning });
    socket.emit('chatHistory', chatHistory);

    // Handle toggle stopwatch action
    socket.on('toggleStopwatch', () => {
        isRunning = !isRunning;
        if (isRunning) {
            startStopwatch();
        } else {
            clearInterval(stopwatchInterval);
        }
    });

    // Handle reset stopwatch action
    socket.on('resetStopwatch', () => {
        stopwatchTime = 0;
        io.emit('updateTime', { stopwatchTime, isRunning });
    });

    // Handle chat message
    socket.on('sendMessage', (message) => {
        const chatMessage = { user: socket.id, message };
        chatHistory.push(chatMessage);
        io.emit('newMessage', chatMessage);  // Broadcast the new message to all users
    });

    // Reset all memory (stopwatch + chat history)
    socket.on('resetMemory', () => {
        stopwatchTime = 0; // Reset stopwatch time
        isRunning = false; // Stop the stopwatch
        chatHistory = [];  // Clear chat history
        io.emit('updateTime', { stopwatchTime, isRunning });
        io.emit('chatHistory', chatHistory);  // Broadcast cleared chat history to all users
    });

    // Clean up when a user disconnects
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Stopwatch functionality
let stopwatchInterval;
function startStopwatch() {
    stopwatchInterval = setInterval(() => {
        if (isRunning) {
            stopwatchTime++;
            io.emit('updateTime', { stopwatchTime, isRunning });
        }
    }, 1000);
}

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
