import React from 'react'
import styles from './main.module.css';
import { useState } from 'react';
import axios from 'axios'
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../login/authSlice';
import { useNavigate } from 'react-router-dom';
import { scribbleWords } from '../../assets/scribbleWords';
import { io } from "socket.io-client";
import HandDrawingCanvas from './HandDrawingCanvas';

const Main = ({ Id, email }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [originalWord, setOriginalWord] = useState('');
  const [word, setWord] = useState('');
  const [timer, setTimer] = useState(120);
  const [round, setRound] = useState(1);
  const [chatInput, setChatInput] = useState('');
  const [score, setScore] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const chatBoxRef = useRef();
  const [players, setPlayers] = useState([]);
  const socket = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isDrawer, setIsDrawer] = useState(false);
  const [currentDrawer, setCurrentDrawer] = useState('');
  const [roomFull, setRoomFull] = useState(false);
  const [wordContributed, setWordContributed] = useState(false);
  const [pencilSize, setPencilSize] = useState(4);
  const [pencilColor, setPencilColor] = useState('#00ccff');

  // Chat Message scroll
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Socket Initiation and event handlers
  useEffect(() => {
    socket.current = io("http://localhost:3500");
    
    socket.current.on("connect", () => {
      setIsConnected(true);
    });
    
    socket.current.on("disconnect", () => {
      setIsConnected(false);
    });
    
    socket.current.on("receive_message", (data) => {
      setChatMessages((prev) => [...prev, data]);
    });
    
    socket.current.on("update_players", (playersList) => {
      setPlayers(playersList);
      
      // Check if user is host and/or drawer
      const currentPlayer = playersList.find(player => player.username === username);
      if(currentPlayer) {
        setIsHost(currentPlayer.isHost);
        setIsDrawer(currentPlayer.isCurrentDrawer);
      }
      
      // Find the current drawer's name
      const drawer = playersList.find(player => player.isCurrentDrawer);
      if (drawer) {
        setCurrentDrawer(drawer.username);
      }
    });
    
    socket.current.on("drawer_update", (data) => {
      setIsDrawer(data.isDrawer);
      setCurrentDrawer(data.drawerName);
      
      if (data.isDrawer) {
        setError("You are the drawer! Others will try to guess your word.");
        setTimeout(() => setError(''), 5000);
        
        // Reset word state for new drawer
        setWordContributed(false);
        
        // Set a temporary immediate word via API
        fetchTemporaryWord();
        
        // Also get a better word with more time
        setTimeout(() => {
          getWord();
        }, 500);
      } else {
        // Reset word contributed state since we're not the drawer
        setWordContributed(false);
        setError(`${data.drawerName} is drawing now. Try to guess the word!`);
        setTimeout(() => setError(''), 5000);
      }
    });
    
    // Function to fetch a quick temporary word while loading
    const fetchTemporaryWord = async () => {
      try {
        // Use a simple reliable category
        const simpleCategory = "thing";
        const tempResponse = await fetch(`https://api.datamuse.com/words?ml=${simpleCategory}&max=10`);
        const tempData = await tempResponse.json();
        
        if (tempData && tempData.length > 0) {
          // Get a simple word from the results
          const filteredWords = tempData.filter(item => {
            const word = item.word;
            return word.length >= 3 && 
                   word.length <= 8 && 
                   !word.includes(' ') && 
                   /^[a-zA-Z]+$/.test(word);
          });
          
          if (filteredWords.length > 0) {
            const randomIndex = Math.floor(Math.random() * filteredWords.length);
            const tempWord = filteredWords[randomIndex].word;
            const tempMasked = maskRandomLetters(tempWord);
            
            // Set locally 
            setOriginalWord(tempWord);
            setWord(tempMasked);
            
            // Also send to all players
            if (socket.current) {
              socket.current.emit("set_word", {
                roomId: Id,
                originalWord: tempWord,
                maskedWord: tempMasked
              });
            }
          }
        }
      } catch (err) {
        // Will rely on getWord() call instead
      }
    };
    
    // Listen for game state updates with more robust handling
    socket.current.on("game_state_update", (gameState) => {
      setTimer(gameState.timer);
      setRound(gameState.round);
      
      // Only update words if they actually exist in the game state
      if (gameState.originalWord && gameState.originalWord.trim() !== '') {
        setOriginalWord(gameState.originalWord);
      }
      
      if (gameState.maskedWord && gameState.maskedWord.trim() !== '') {
        setWord(gameState.maskedWord);
      }
      
      setShowOriginal(gameState.showOriginal);
      setGameActive(gameState.active);
      setGameStarted(gameState.hasStarted);
      
      // If we're the drawer, there's no word set, and the game has started, get a word
      if (gameState.hasStarted && 
          isDrawer && 
          (!gameState.originalWord || gameState.originalWord.trim() === '') && 
          !wordContributed) {
        setTimeout(() => getWord(), 300);
      }
    });

    socket.current.on("room_full", (data) => {
      setRoomFull(true);
      setError(data.message);
    });
    
    socket.current.on("game_started", () => {
      setGameStarted(true);
      setHasAnswered(false);
      setWordContributed(false);
      
      // Add a forced word get for drawer
      if (isDrawer) {
        // Get word immediately
        getWord();
        
        // And also try again shortly after
        setTimeout(() => {
          getWord();
        }, 500);
      }
    });
    
    socket.current.on("start_game_error", (data) => {
      setError(data.message);
      setTimeout(() => setError(''), 3000);
    });
    
    socket.current.on("restart_game_error", (data) => {
      setError(data.message);
      setTimeout(() => setError(''), 3000);
    });
    
    socket.current.on("game_restarted", () => {
      setGameStarted(true);
      setGameActive(true);
      setHasAnswered(false);
      setWordContributed(false);
      setScore(0);
      setRound(1);
      setTimer(120);
      setWord('');
      setOriginalWord('');
      setShowOriginal(false);
      setError('');
      setChatMessages([]);
      getWord();
    });
    
    socket.current.on("new_round", () => {
      setHasAnswered(false);
      setWordContributed(false);
      
      // Only the drawer should get a new word, and with a delay to ensure state is updated
      if (isDrawer) {
        setTimeout(() => {
          getWord();
        }, 500);
      }
    });
    
    socket.current.on("game_ended", () => {
      // Ask for confirmation before logging out
      const confirmLogout = window.confirm("Game Over! Would you like to logout?");
      if (confirmLogout) {
        handleLogout();
      } else {
        // Just stay on the page if user doesn't want to logout
        setError("Game has ended. You can continue chatting or logout when ready.");
        setTimeout(() => setError(''), 5000);
      }
    });
    
    return () => {
      socket.current.disconnect();
    };
  }, [username]);

  // Join room once we have username
  useEffect(() => {
    if (Id && username && socket.current) {
      socket.current.emit("join_room", { roomId: Id, username });
    }
  }, [Id, username]);

  // Encryption of word   
  function maskRandomLetters(str) {
    const count = Math.floor(str.length / 2);
    const indexes = new Set();

    while (indexes.size < count) {
      const randIndex = Math.floor(Math.random() * str.length);
      indexes.add(randIndex);
    }

    let masked = str
      .split('')
      .map((char, idx) => (indexes.has(idx) ? '_' : char))
      .join('');

    return masked;
  }

  // Getting word from datamuse  
  const getWord = async () => {
    // Only the drawer should set words
    if (!isDrawer) {
      return;
    }
    
    if (wordContributed && originalWord) {
      return;
    }
    
    try {
      // Try to get a word from the API
      const randomNumber = Math.floor(Math.random() * 41);
      const category = scribbleWords[randomNumber];
      
      // Try with higher max to ensure we get results
      const response = await fetch(`https://api.datamuse.com/words?ml=${category}&max=30`);
      const data = await response.json();

      if (data && data.length > 0) {
        // Filter to ensure good drawing words (single word, reasonable length, only letters)
        const filteredWords = data.filter(item => {
          const word = item.word;
          return word.length >= 3 && 
                 word.length <= 10 && 
                 !word.includes(' ') && 
                 /^[a-zA-Z]+$/.test(word);
        });
        
        // If we have filtered words, use one
        if (filteredWords.length > 0) {
          // Use a random word from the filtered results
          const randomIndex = Math.floor(Math.random() * filteredWords.length);
          const chosenWord = filteredWords[randomIndex].word;
          
          // Mask the word
          const maskedWord = maskRandomLetters(chosenWord);
          
          // Mark that this player has contributed a word
          setWordContributed(true);
          
          // Emit to server so all players get the same word
          if (socket.current) {
            socket.current.emit("set_word", {
              roomId: Id,
              originalWord: chosenWord,
              maskedWord: maskedWord
            });
          }
        } else {
          // If filtering left no words, try a backup category
          tryBackupCategory();
        }
      } else {
        // If API returns no data, try a backup category
        tryBackupCategory();
      }
    } catch (err) {
      tryBackupCategory();
    }
  };
  
  // Helper function to try a backup category
  const tryBackupCategory = async () => {
    try {
      // Use a different category for backup
      const backupCategories = ["animal", "food", "vehicle", "furniture", "clothing"];
      const backupCategory = backupCategories[Math.floor(Math.random() * backupCategories.length)];
      
      const backupResponse = await fetch(`https://api.datamuse.com/words?ml=${backupCategory}&max=30`);
      const backupData = await backupResponse.json();
      
      if (backupData && backupData.length > 0) {
        // Filter to ensure good drawing words
        const filteredWords = backupData.filter(item => {
          const word = item.word;
          return word.length >= 3 && 
                 word.length <= 10 && 
                 !word.includes(' ') && 
                 /^[a-zA-Z]+$/.test(word);
        });
        
        if (filteredWords.length > 0) {
          // Use a random word from the filtered results
          const randomIndex = Math.floor(Math.random() * filteredWords.length);
          const chosenWord = filteredWords[randomIndex].word;
          
          // Mask the word
          const maskedWord = maskRandomLetters(chosenWord);
          
          // Mark that this player has contributed a word
          setWordContributed(true);
          
          // Emit to server so all players get the same word
          if (socket.current) {
            socket.current.emit("set_word", {
              roomId: Id,
              originalWord: chosenWord,
              maskedWord: maskedWord
            });
          }
        } else {
          setError("Failed to get a suitable word. Please try again.");
          setTimeout(() => setError(''), 3000);
        }
      } else {
        setError("Failed to get a word from API. Please try again.");
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError("Error fetching word. Please try again.");
      setTimeout(() => setError(''), 3000);
    }
  };

  // Chat message sending using IO
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!gameActive || !gameStarted) return;

    const trimmedInput = chatInput.trim();
    if (!trimmedInput) return; // Don't send empty messages
    
    // Always send the message to all players
    socket.current.emit("send_message", {
      roomId: Id,
      username,
      message: chatInput,
    });

    // Only check for correct answer if not the drawer and haven't answered yet
    if (!isDrawer && !hasAnswered) {
      const userGuess = trimmedInput.toLowerCase();
      const realAnswer = originalWord.toLowerCase();
      
      // If correct guess, show visual feedback in the UI
      if (userGuess === realAnswer) {
        setHasAnswered(true);
        
        // Calculate score - more time left = higher score
        const baseScore = 5;
        const bonusFactor = timer / 120; // Since max time is 120 seconds
        const roundScore = Math.floor(baseScore + (15 * bonusFactor));
        
        // Update local score
        setScore((prev) => prev + roundScore);
        
        // Notify server about score update
        socket.current.emit("update_score", { roomId: Id, points: roundScore });
        
        // Add visual feedback
        setError(`Correct! You scored ${roundScore} points.`);
        setTimeout(() => setError(''), 2000);
      }
    }

    // Clear input field
    setChatInput('');
  };

  // Handle pencil size change
  const handlePencilSizeChange = (e) => {
    setPencilSize(parseInt(e.target.value) || 4);
  };

  // Handle color change
  const handleColorChange = (e) => {
    setPencilColor(e.target.value);
  };

  // Initial word fetch
  useEffect(() => {
    if (isConnected && username) {
      getWord();
    }
  }, [isConnected, username]);

  // Fetching username
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const res = await axios.post('http://localhost:3500/users/username', {
          email: email,
        });
        setUsername(res.data.username);
      } catch (err) {
        setError('Failed to fetch username');
      }
    };

    if (email) {
      fetchUsername();
    }
  }, [email]);

  // Logout Handling  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Function to handle game start
  const handleStartGame = () => {
    if(socket.current && isHost) {
      socket.current.emit("start_game", { roomId: Id });
    }
  };

  return (
    <div className={styles.playground}>
      <nav className={styles.playNav}>
        <div className={styles.playNav__left}>
          <div></div>
          <div>Scribble Showdown</div>
        </div>
        <div className={styles.word}>
          {(() => {
            // For drawer
            if (isDrawer) {
              return originalWord || "Getting word...";
            }
            // For non-drawer when word is revealed
            else if (showOriginal) {
              return originalWord || "Word should be shown";
            }
            // For non-drawer during guessing
            else {
              return word || "Waiting for drawer to pick a word";
            }
          })()}
        </div>
        
        <div className={styles.playNav__right}>
          <ul>
            <li className={styles.username}>{`${username} / ${Id}`}</li>
            <li><button onClick={handleLogout}> Logout </button></li>
          </ul>
        </div>
      </nav>
      <main>
        <div className={styles.left}>
          <h1>PLAYERS</h1>
          {roomFull && <div className={styles.error}>{error}</div>}
          {error && !roomFull && error.includes('Correct!') ? (
            <div className={styles.correctGuess}>{error}</div>
          ) : (
            error && !roomFull && <div className={styles.error}>{error}</div>
          )}
          {players && players.length > 0 ? (
            players.sort((a, b) => b.score - a.score).map((player, index) => (
              <div 
                key={player.username} 
                className={`${styles.player} ${index === 0 ? styles.topPlayer : ''} ${player.isHost ? styles.hostPlayer : ''}`}
              >
                <p>RANK: <span>{index + 1}</span></p>
                <p>{player.username} {player.isHost ? '(Host)' : ''}</p>
                <p>POINTS: {player.score}</p>
              </div>
            ))
          ) : (
            <div className={styles.player}>
              <p>Waiting for players...</p>
            </div>
          )}
          
          {/* Game controls and status messages */}
          <div className={styles.gameControls}>
            {isHost && !gameStarted && players.length === 2 && (
              <button className={styles.startButton} onClick={handleStartGame}>
                Start Game
              </button>
            )}
            
            {isHost && !gameStarted && players.length < 2 && (
              <div className={styles.waitingMessage}>
                Waiting for another player to join...
              </div>
            )}
            
            {!isHost && !gameStarted && players.length === 2 && (
              <div className={styles.waitingMessage}>
                Waiting for host to start the game...
              </div>
            )}
            
            {gameStarted && (
              <div className={styles.gameStatus}>
                {isDrawer ? "You are drawing!" : `${currentDrawer} is drawing`}
              </div>
            )}
          </div>
        </div>
        <div className={styles.middle}>
          <div className={styles.middle__top}>
            <div className={styles.rounds}>
              <div>ROUND</div>
              <div style={{ whiteSpace: "nowrap" }}>{round} / 6</div>
            </div>
            <div className={styles.rounds}>
              <div>TIMER</div>
              <div style={{ whiteSpace: "nowrap" }}>{timer} s</div>
            </div>
            <div className={styles.pick}></div>
          </div>
          <div className={styles.main__main}>
            <HandDrawingCanvas 
              color={'blue'} 
              thickness={pencilSize} 
              eraserSize={30} 
              socket={socket.current}
              roomId={Id}
              isReadOnly={!isDrawer && gameStarted}
            />
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.chats} ref={chatBoxRef}>
            {chatMessages.map((msg, index) => (
              <div 
                key={index} 
                className={`${styles.chat} ${msg.username === 'System' ? styles.systemMessage : ''}`}
              >
                <p>{msg.username}</p>
                <p>{msg.message}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleChatSubmit}>
            <input type="text" placeholder="Enter word"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)} />
          </form>
        </div>
      </main>
      <footer className={styles.play__footer}>
        <p>&copy; 2025 Scribble Showdown. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Main;


// Version 0