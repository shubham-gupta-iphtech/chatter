const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const app = express();
const server = http.createServer(app);
const path = require('path');
const router = require("./routes/routes.js");
const cookieParser = require("cookie-parser");
const io = new Server(server);
const dbconnect = require("./database/dbconnect.js");
const Message = require('./models/Message');
const authMiddleware = require("./middlewares/auth");

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Authentication token is missing."));
  }
  console.log("testing errors");

  // try {
  const user = jwt.verify(token, 'zxcvb');
  socket.user = user; // Attach user data to socket
  next();
  // } catch (err) {
  //   next(new Error('Authentication failed'));
  // }
});

dbconnect().then(() => {
  console.log("successfully executed db connection");
})
  .catch((err) => {
    console.log("some error occured.", err);
  })

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'front.html'));
});

app.get('/api/messages/:partner', authMiddleware, async (req, res) => {
  const currentUser = req.user.name;
  const partner = req.params.partner;
  console.log("api ki information -----> ", currentUser, partner);
  try {
    const messages = await Message.find({
      $or: [
        { from: currentUser, to: partner },
        { from: partner, to: currentUser }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});


app.use(express.static('public'));

// username -> socketId map
const users = {};

app.use(express.json());
app.use(cookieParser());

let onlineUsers = [];
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Save username with socket ID
  socket.on('register', (username) => {
    users[username] = socket.id;
    console.log(`${username} registered with socket ID ${socket.id}`);

    onlineUsers[socket.id] = username; // associate socket ID with username
    io.emit('online users', Object.values(onlineUsers));

  });

  // Handle private message
  // socket.on('private message', async ({ to, message, from }) => {

  //   try {
  //     const newMessage = new Message({ from, to, message });
  //     console.log(newMessage);
  //     await newMessage.save();
  //   } catch (err) {
  //     console.error('Error saving message:', err);
  //   }
  //   const targetSocketId = users[to];

  //   if (targetSocketId) {
  //     io.to(targetSocketId).emit('private message', { message, from, createdAt: newMessage.createdAt });
  //   }
  // });
  socket.on('private message', async ({ to, message, from }) => {
    let newMessage;

    try {
      newMessage = new Message({ from, to, message });
      await newMessage.save();
    } catch (err) {
      console.error('Error saving message:', err);
    }

    const targetSocketId = users[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('private message', {
        from,
        message,
        createdAt: newMessage?.createdAt?.toISOString() || new Date().toISOString()
      });
    }
  });



  // Cleanup on disconnect
  socket.on('disconnect', () => {
    for (const username in users) {
      if (users[username] === socket.id) {
        delete users[username];
        console.log(`${username} disconnected`);
        break;
      }
    }
    delete onlineUsers[socket.id];
    io.emit('online users', Object.values(onlineUsers));
  });
});
app.use("/api", router);

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
