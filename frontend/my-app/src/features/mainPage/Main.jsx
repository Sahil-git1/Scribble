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
  const [timer, setTimer] = useState(90);
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
  const [gameActive, setGameActive] = useState(true);
  const [wordContributed, setWordContributed] = useState(false);

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
      console.log("Socket connected");
      setIsConnected(true);
    });
    
    socket.current.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });
    
    socket.current.on("receive_message", (data) => {
      setChatMessages((prev) => [...prev, data]);
    });
    
    socket.current.on("update_players", (playersList) => {
      setPlayers(playersList);
    });
    
    // Listen for game state updates
    socket.current.on("game_state_update", (gameState) => {
      setTimer(gameState.timer);
      setRound(gameState.round);
      if (gameState.originalWord) setOriginalWord(gameState.originalWord);
      if (gameState.maskedWord) setWord(gameState.maskedWord);
      setShowOriginal(gameState.showOriginal);
      setGameActive(gameState.active);
    });
    
    socket.current.on("new_round", () => {
      setHasAnswered(false);
      setWordContributed(false);
      getWord(); // All players can potentially contribute a word
    });
    
    socket.current.on("game_ended", () => {
      alert("Game Over! Check the final scores.");
    });
    
    return () => {
      socket.current.disconnect();
    };
  }, []);

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
    // If word already contributed by this player or another player, don't get a new one
    if (wordContributed || originalWord) return;
    
    const randomNumber = Math.floor(Math.random() * 41);
    const category = scribbleWords[randomNumber];

    try {
      const response = await fetch(`https://api.datamuse.com/words?ml=${category}&max=2`);
      const data = await response.json();

      if (data.length > 0) {
        const realWord = data[0].word;
        const maskedWord = maskRandomLetters(realWord);
        
        // Mark that this player has contributed a word
        setWordContributed(true);
        
        // Emit to server so all players get the same word
        if (socket.current) {
          socket.current.emit("set_word", {
            roomId: Id,
            originalWord: realWord,
            maskedWord: maskedWord
          });
        }
      } else {
        console.warn("No words returned for category:", category);
      }
    } catch (err) {
      console.error("Failed to fetch word:", err);
    }
  };

  // Chat message sending using IO
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (timer === 0 || round > 5 || !gameActive) return;

    const trimmedInput = chatInput.trim().toLowerCase();
    const realAnswer = originalWord.toLowerCase();

    // Emit message to specific room
    socket.current.emit("send_message", {
      roomId: Id,
      username,
      message: chatInput,
    });

    if (trimmedInput === realAnswer && !hasAnswered) {
      setHasAnswered(true);
      const baseScore = 5;
      const bonusFactor = timer / 90;
      const roundScore = Math.floor(baseScore + (20 * bonusFactor));
      setScore((prev) => prev + roundScore);
      
      // Add this line to notify the server about the score update
      socket.current.emit("update_score", { roomId: Id, points: roundScore });
      
      console.log(`Correct! You scored ${roundScore} points`);
    }

    setChatInput('');
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
        console.error('Error fetching username:', err);
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

  return (
    <div className={styles.playground}>
      <nav className={styles.playNav}>
        <div className={styles.playNav__left}>
          <div></div>
          <div>Scribble Showdown</div>
        </div>
        <div className={styles.word}>{showOriginal ? originalWord : word}</div>
        
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
          {players && players.length > 0 ? (
            players.sort((a, b) => b.score - a.score).map((player, index) => (
              <div 
                key={player.username} 
                className={`${styles.player} ${index === 0 ? styles.topPlayer : ''}`}
              >
                <p>RANK: <span>{index + 1}</span></p>
                <p>{player.username}</p>
                <p>POINTS: {player.score}</p>
              </div>
            ))
          ) : (
            <div className={styles.player}>
              <p>Waiting for players...</p>
            </div>
          )}
        </div>
        <div className={styles.middle}>
          <div className={styles.middle__top}>
            <div className={styles.rounds}>
              <div>ROUND</div>
              <div style={{ whiteSpace: "nowrap" }}>{round} / 5</div>
            </div>
            <div className={styles.rounds}>
              <div>TIMER</div>
              <div style={{ whiteSpace: "nowrap" }}>{timer} s</div>
            </div>
            <div className={styles.pick}>
              <div className={styles.pencil}>
                <label htmlFor="pencil">PENCIL</label>
                <input type="number" name="pencil" id="pencil" placeholder="9" min="1" max="50" step="2" />
              </div>
              <div className={styles.color}>
                <label htmlFor="pencilColor">COLOR</label>
                <input type="color" name="pencilColor" id="pencilColor" />
              </div>
            </div>
          </div>
          <div className={styles.main__main}>
            <HandDrawingCanvas  color = {'#00ccff'} thickness = {4} eraserSize = {30} />
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.chats} ref={chatBoxRef}>
            {chatMessages.map((msg, index) => (
              <div key={index} className={styles.chat}>
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