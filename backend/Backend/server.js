require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const PORT = process.env.PORT || 3500
const cookieParser = require('cookie-parser');
const {logEvents,logger} = require('./middleware/logger')
const {errorHandler} = require('./middleware/errorHandler')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')
const http = require('http');
const { Server } = require('socket.io');

connectDB()
app.use(logger)
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser());
app.use('/',express.static(path.join(__dirname,'public')))

app.use('/',require('./routes/root'))
app.use('/users',require('./routes/userRoutes'))
// app.use('/notes', require('./routes/noteRoutes'))

app.all('*',(rq,rs)=>{
    rs.status(404)
    if(rq.accepts('html')){
    rs.sendFile(path.join(__dirname,'views','404.html'))
    }
    else if(rq.accepts('json')){
        rs.json({message : '404 Not Found'})
    }
    else{
        rs.type('text').send('404 Not Found')
    }
})

app.use(errorHandler)

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Replace with your frontend origin
    methods: ["GET", "POST"]
  }
});

// Enhanced in-memory structure to hold room data
const rooms = {
  // roomId: {
  //   players: { socketId: { username, score } },
  //   gameState: { 
  //     timer: 90, 
  //     round: 1, 
  //     originalWord: '', 
  //     maskedWord: '', 
  //     active: true,
  //     showOriginal: false,
  //     timerInterval: null
  //   }
  // }
};

// Function to update all clients in a room with the current game state
const updateRoomState = (roomId) => {
  if (rooms[roomId]) {
    const gameStateForClients = { ...rooms[roomId].gameState };
    // Don't send the timerInterval to clients
    delete gameStateForClients.timerInterval;
    
    io.to(roomId).emit("game_state_update", gameStateForClients);
  }
};

// Function to get player list for a room
const getPlayerList = (roomId) => {
  if (!rooms[roomId] || !rooms[roomId].players) return [];
  return Object.values(rooms[roomId].players);
};

// Function to start a new round
const startNewRound = (roomId) => {
  if (rooms[roomId]) {
    // Clear existing timer if any
    if (rooms[roomId].gameState.timerInterval) {
      clearInterval(rooms[roomId].gameState.timerInterval);
    }
    
    // Reset round state
    rooms[roomId].gameState.timer = 90;
    rooms[roomId].gameState.showOriginal = false;
    
    // Start timer
    const timerInterval = setInterval(() => {
      if (rooms[roomId]) {
        rooms[roomId].gameState.timer -= 1;
        
        if (rooms[roomId].gameState.timer <= 0) {
          clearInterval(timerInterval);
          rooms[roomId].gameState.timer = 0;
          rooms[roomId].gameState.showOriginal = true;
          updateRoomState(roomId);
          
          // After showing original word, proceed to next round
          setTimeout(() => {
            if (rooms[roomId]) {
              if (rooms[roomId].gameState.round < 5) {
                rooms[roomId].gameState.round += 1;
                io.to(roomId).emit("new_round");
                startNewRound(roomId);
              } else {
                // Game over
                rooms[roomId].gameState.active = false;
                io.to(roomId).emit("game_ended");
              }
            }
          }, 7000);
        } else {
          updateRoomState(roomId);
        }
      } else {
        clearInterval(timerInterval);
      }
    }, 1000);
    
    rooms[roomId].gameState.timerInterval = timerInterval;
  }
};

io.on("connection", (socket) => {
  console.log("New user connected: " + socket.id);

  // Join room
  socket.on("join_room", ({ roomId, username }) => {
    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: {},
        gameState: { 
          timer: 90, 
          round: 1, 
          originalWord: '', 
          maskedWord: '', 
          active: true,
          showOriginal: false,
          timerInterval: null
        }
      };
    }
    
    // Add player to room
    if (!rooms[roomId].players) {
      rooms[roomId].players = {};
    }
    rooms[roomId].players[socket.id] = { username, score: 0 };

    // Send current game state to the joining player
    const gameStateForClient = { ...rooms[roomId].gameState };
    delete gameStateForClient.timerInterval;
    socket.emit("game_state_update", gameStateForClient);

    // Notify room of updated player list
    io.to(roomId).emit("update_players", getPlayerList(roomId));

    console.log(`User ${username} joined room ${roomId}`);
    
    // If this is the first player and the game isn't active, start it
    if (Object.keys(rooms[roomId].players).length === 1 && !rooms[roomId].gameState.active) {
      rooms[roomId].gameState.active = true;
      // We'll get a new word when the client emits 'set_word'
    }
  });

  // Handle sending a message
  socket.on("send_message", ({ roomId, username, message }) => {
    io.to(roomId).emit("receive_message", { username, message });
    
    // Check if message matches the answer
    if (rooms[roomId]?.gameState?.originalWord?.toLowerCase() === message.trim().toLowerCase()) {
      console.log(`${username} guessed correctly: ${message}`);
    }
  });

  // Update player score
  socket.on("update_score", ({ roomId, points }) => {
    if (rooms[roomId] && rooms[roomId].players && rooms[roomId].players[socket.id]) {
      rooms[roomId].players[socket.id].score += points;
      
      // Notify room of updated player list
      io.to(roomId).emit("update_players", getPlayerList(roomId));
    }
  });

  // Set new word for the round - any player can contribute words
  socket.on("set_word", ({ roomId, originalWord, maskedWord }) => {
    if (rooms[roomId]) {
      // Only accept new words if we're at the start of a round or don't have a word yet
      if (rooms[roomId].gameState.timer === 90 || !rooms[roomId].gameState.originalWord) {
        rooms[roomId].gameState.originalWord = originalWord;
        rooms[roomId].gameState.maskedWord = maskedWord;
        
        // Broadcast word to all players
        updateRoomState(roomId);
        
        // If timer isn't running, start it
        if (!rooms[roomId].gameState.timerInterval) {
          startNewRound(roomId);
        }
      }
    }
  });

  // Handle drawing events
  socket.on("send_drawing", (data) => {
    // Broadcast drawing data to all other clients in the room
    socket.to(data.roomId).emit("receive_drawing", data);
  });

 // Handle disconnect
 socket.on("disconnect", () => {
  for (const roomId in rooms) {
    if (rooms[roomId].players && rooms[roomId].players[socket.id]) {
      delete rooms[roomId].players[socket.id];

      // Notify room of updated player list
      io.to(roomId).emit("update_players", getPlayerList(roomId));

      // Clean up empty room
      if (Object.keys(rooms[roomId].players).length === 0) {
        // Clear any intervals
        if (rooms[roomId].gameState.timerInterval) {
          clearInterval(rooms[roomId].gameState.timerInterval);
        }
        delete rooms[roomId];
      }

      break;
    }
  }

  console.log("User disconnected: " + socket.id);
});
});

mongoose.connection.once("open", () => {
console.log("Connected to MongoDB");
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
});

mongoose.connection.on('error',err=>{
  console.log(err)
  logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
      'mongoErrLog.log'
  )
})


// Version 0