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
  //   players: { socketId: { username, score, isHost, isCurrentDrawer } },
  //   gameState: { 
  //     timer: 10, 
  //     round: 1, 
  //     originalWord: '', 
  //     maskedWord: '', 
  //     active: true,
  //     showOriginal: false,
  //     timerInterval: null,
  //     hasStarted: false,
  //     playerCount: 0,
  //     currentDrawer: null
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
    
    // Switch drawer at the start of each round
    switchDrawer(roomId);
    
    // Reset round state
    rooms[roomId].gameState.timer = 120;
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
              if (rooms[roomId].gameState.round < 6) {
                rooms[roomId].gameState.round += 1;
                io.to(roomId).emit("new_round");
                startNewRound(roomId);
              } else {
                // Game over
                rooms[roomId].gameState.active = false;
                io.to(roomId).emit("game_ended");
              }
            }
          }, 4000); // Reduced time to show word between rounds
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

// Function to switch the current drawer
const switchDrawer = (roomId) => {
  if (rooms[roomId] && rooms[roomId].players) {
    const playerIds = Object.keys(rooms[roomId].players);
    if (playerIds.length < 2) return;
    
    // Get current drawer
    const currentDrawerId = rooms[roomId].gameState.currentDrawer;
    let nextDrawerIndex = 0;
    
    if (currentDrawerId) {
      // Find the index of the current drawer
      const currentDrawerIndex = playerIds.indexOf(currentDrawerId);
      if (currentDrawerIndex !== -1) {
        // Get the next drawer (or circle back to first player)
        nextDrawerIndex = (currentDrawerIndex + 1) % playerIds.length;
      }
    }
    
    // Set all players to non-drawer
    for (const playerId of playerIds) {
      rooms[roomId].players[playerId].isCurrentDrawer = false;
    }
    
    // Set new drawer
    const nextDrawerId = playerIds[nextDrawerIndex];
    rooms[roomId].players[nextDrawerId].isCurrentDrawer = true;
    rooms[roomId].gameState.currentDrawer = nextDrawerId;
    
    console.log(`Switched drawer in room ${roomId} to ${rooms[roomId].players[nextDrawerId].username}`);
    
    // Notify clients about the new drawer
    io.to(roomId).emit("update_players", getPlayerList(roomId));
    
    // Send individual notifications to players
    for (const playerId of playerIds) {
      const isDrawer = playerId === nextDrawerId;
      io.to(playerId).emit("drawer_update", { 
        isDrawer, 
        drawerName: rooms[roomId].players[nextDrawerId].username 
      });
    }
  }
};

io.on("connection", (socket) => {
  console.log("New user connected: " + socket.id);

  // Join room
  socket.on("join_room", ({ roomId, username }) => {
    // Check if room exists and has 2 players already
    if (rooms[roomId] && Object.keys(rooms[roomId].players).length >= 2) {
      console.log(`Room ${roomId} is full, rejecting player ${username}`);
      socket.emit("room_full", { message: "This room already has 2 players." });
      return;
    }
    
    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: {},
        gameState: { 
          timer: 120, 
          round: 1, 
          originalWord: '', // Empty - will be set by drawer
          maskedWord: '', // Empty - will be set by drawer 
          active: true,
          showOriginal: false,
          timerInterval: null,
          hasStarted: false,
          playerCount: 0,
          currentDrawer: null
        }
      };
    }
    
    // Add player to room
    if (!rooms[roomId].players) {
      rooms[roomId].players = {};
    }
    
    // Check if this is the first player (host)
    const isHost = Object.keys(rooms[roomId].players).length === 0;
    const isCurrentDrawer = isHost; // First player is also the first drawer
    
    rooms[roomId].players[socket.id] = { 
      username, 
      score: 0, 
      isHost,
      isCurrentDrawer
    };
    
    if (isCurrentDrawer) {
      rooms[roomId].gameState.currentDrawer = socket.id;
    }
    
    rooms[roomId].gameState.playerCount = Object.keys(rooms[roomId].players).length;

    console.log(`Player count in room ${roomId}: ${rooms[roomId].gameState.playerCount}`);
    console.log(`Players in room ${roomId}:`, Object.keys(rooms[roomId].players).map(id => 
      `${rooms[roomId].players[id].username} (${rooms[roomId].players[id].isHost ? 'Host' : 'Guest'})`
    ));

    // Send current game state to the joining player
    const gameStateForClient = { ...rooms[roomId].gameState };
    delete gameStateForClient.timerInterval;
    socket.emit("game_state_update", gameStateForClient);
    
    // Notify the player if they are the drawer
    if (isCurrentDrawer) {
      socket.emit("drawer_update", { 
        isDrawer: true,
        drawerName: username 
      });
    }

    // Notify room of updated player list
    io.to(roomId).emit("update_players", getPlayerList(roomId));

    console.log(`User ${username} joined room ${roomId}, isHost: ${isHost}`);
  });

  // Handle sending a message
  socket.on("send_message", ({ roomId, username, message }) => {
    io.to(roomId).emit("receive_message", { username, message });
    
    // Check if message matches the answer and game is active
    if (rooms[roomId]?.gameState?.active && 
        rooms[roomId]?.gameState?.originalWord?.toLowerCase() === message.trim().toLowerCase()) {
      console.log(`${username} guessed correctly: ${message}`);
      
      // Add announcement message about correct guess
      io.to(roomId).emit("receive_message", { 
        username: "System", 
        message: `${username} guessed the word correctly: ${rooms[roomId].gameState.originalWord}!`
      });
      
      // Clear the current timer interval
      if (rooms[roomId].gameState.timerInterval) {
        clearInterval(rooms[roomId].gameState.timerInterval);
        rooms[roomId].gameState.timerInterval = null;
      }
      
      // Show the original word to everyone briefly
      rooms[roomId].gameState.showOriginal = true;
      updateRoomState(roomId);
      
      // Wait a moment, then advance to next round
      setTimeout(() => {
        if (rooms[roomId]) {
          if (rooms[roomId].gameState.round < 6) {
            console.log(`Advancing to next round after correct guess by ${username}`);
            
            // Move to next round
            rooms[roomId].gameState.round += 1;
            io.to(roomId).emit("new_round");
            io.to(roomId).emit("receive_message", { 
              username: "System", 
              message: `Starting round ${rooms[roomId].gameState.round}...`
            });
            
            startNewRound(roomId);
          } else {
            // Game over
            rooms[roomId].gameState.active = false;
            io.to(roomId).emit("game_ended");
          }
        }
      }, 2000); // Show correct word for 2 seconds before advancing
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

  // Set new word for the round - only the drawer can contribute words
  socket.on("set_word", ({ roomId, originalWord, maskedWord }) => {
    if (rooms[roomId]) {
      console.log(`Received set_word event for room ${roomId}, word: ${originalWord}, masked: ${maskedWord}`);
      
      // More permissive check: accept word if it's from current drawer OR if no word is set yet
      const isCurrentDrawer = rooms[roomId].players[socket.id]?.isCurrentDrawer;
      const noWordSet = !rooms[roomId].gameState.originalWord || rooms[roomId].gameState.originalWord === '';
      
      if (isCurrentDrawer || noWordSet) {
        rooms[roomId].gameState.originalWord = originalWord;
        rooms[roomId].gameState.maskedWord = maskedWord;
        
        console.log(`Set word for room ${roomId}: original=${originalWord}, masked=${maskedWord}`);
        
        // Always broadcast word to all players immediately
        updateRoomState(roomId);
        
        // If the game has started and timer isn't running, start it
        if (rooms[roomId].gameState.hasStarted && !rooms[roomId].gameState.timerInterval) {
          startNewRound(roomId);
        }
      } else {
        console.log(`Word contribution rejected. isCurrentDrawer: ${isCurrentDrawer}, existingWord: ${rooms[roomId].gameState.originalWord}`);
      }
    }
  });

  // Handle drawing events
  socket.on("send_drawing", (data) => {
    // Broadcast drawing data to all other clients in the room
    socket.to(data.roomId).emit("receive_drawing", data);
  });

  // Add new game start event
  socket.on("start_game", ({ roomId }) => {
    console.log(`Received start_game event for room ${roomId}`);
    
    if (!rooms[roomId]) {
      console.log(`Room ${roomId} not found`);
      socket.emit("start_game_error", { message: "Room not found." });
      return;
    }
    
    if (!rooms[roomId].players || !rooms[roomId].players[socket.id]) {
      console.log(`Player not found in room ${roomId}`);
      socket.emit("start_game_error", { message: "You are not in this room." });
      return;
    }
    
    if (!rooms[roomId].players[socket.id].isHost) {
      console.log(`Non-host player tried to start the game in room ${roomId}`);
      socket.emit("start_game_error", { message: "Only the host can start the game." });
      return;
    }
    
    const playerCount = Object.keys(rooms[roomId].players).length;
    console.log(`Player count check for room ${roomId}: ${playerCount}`);
    
    if (playerCount < 2) {
      console.log(`Not enough players in room ${roomId}: ${playerCount}`);
      socket.emit("start_game_error", { message: "Need at least 2 players to start the game." });
      return;
    }
    
    console.log(`Starting game in room ${roomId}`);
    
    // Set default temporary words to ensure players always see something
    const defaultWords = ["cat", "dog", "sun", "moon", "star"];
    const defaultWord = defaultWords[Math.floor(Math.random() * defaultWords.length)];
    const defaultMasked = defaultWord.replace(/[a-z]/g, (c, i) => i % 2 === 0 ? c : '_');
    
    // Set initial game state with default word
    rooms[roomId].gameState.originalWord = defaultWord;
    rooms[roomId].gameState.maskedWord = defaultMasked;
    rooms[roomId].gameState.hasStarted = true;
    rooms[roomId].gameState.active = true;
    
    // Start the first round
    io.to(roomId).emit("game_started");
    updateRoomState(roomId); // Send game state immediately
    startNewRound(roomId);
  });

  // Add restart game event
  socket.on("restart_game", ({ roomId }) => {
    console.log(`Received restart_game event for room ${roomId}`);
    
    if (!rooms[roomId]) {
      console.log(`Room ${roomId} not found for restart`);
      socket.emit("restart_game_error", { message: "Room not found." });
      return;
    }
    
    if (!rooms[roomId].players || !rooms[roomId].players[socket.id]) {
      console.log(`Player not found in room ${roomId} for restart`);
      socket.emit("restart_game_error", { message: "You are not in this room." });
      return;
    }
    
    if (!rooms[roomId].players[socket.id].isHost) {
      console.log(`Non-host player tried to restart the game in room ${roomId}`);
      socket.emit("restart_game_error", { message: "Only the host can restart the game." });
      return;
    }
    
    console.log(`Restarting game in room ${roomId}`);
    
    // Set default temporary words to ensure players always see something
    const defaultWords = ["house", "tree", "flower", "car", "boat"];
    const defaultWord = defaultWords[Math.floor(Math.random() * defaultWords.length)];
    const defaultMasked = defaultWord.replace(/[a-z]/g, (c, i) => i % 2 === 0 ? c : '_');
    
    // Reset game state but keep players
    rooms[roomId].gameState = { 
      timer: 120, 
      round: 1, 
      originalWord: defaultWord, // Set a default word 
      maskedWord: defaultMasked, // And masked version
      active: true,
      showOriginal: false,
      timerInterval: null,
      hasStarted: true, // Start immediately on restart
      playerCount: Object.keys(rooms[roomId].players).length,
      currentDrawer: null
    };
    
    // Reset scores for all players and select first drawer
    const playerIds = Object.keys(rooms[roomId].players);
    for (const playerId of playerIds) {
      rooms[roomId].players[playerId].score = 0;
      rooms[roomId].players[playerId].isCurrentDrawer = false;
    }
    
    // Set first player as drawer
    if (playerIds.length > 0) {
      const firstDrawerId = playerIds[0];
      rooms[roomId].players[firstDrawerId].isCurrentDrawer = true;
      rooms[roomId].gameState.currentDrawer = firstDrawerId;
    }
    
    // Notify clients about player updates
    io.to(roomId).emit("update_players", getPlayerList(roomId));
    
    // Start the game again
    io.to(roomId).emit("game_restarted");
    updateRoomState(roomId);
    startNewRound(roomId);
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