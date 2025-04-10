import React from 'react'
import styles from './main.module.css';
import { useState } from 'react';
import axios from 'axios'
import { useEffect ,useRef} from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../login/authSlice';
import { useNavigate } from 'react-router-dom';
import { scribbleWords } from '../../assets/scribbleWords';

const Main = ({ Id, email }) => {
  const [showOriginal,setShoworiginal] = useState(false)
  const [originalWord,setOriginalWord] = useState('');
  const [word, setWord] = useState('');
  const [timer, setTimer] = useState(20);
  const [round, setRound] = useState(1);
  const wordArrayIndex = useRef(0); // persists between renders
  const [chatInput, setChatInput] = useState('');
const [chatMessages, setChatMessages] = useState([]);
const [score, setScore] = useState(0);
const [hasAnswered, setHasAnswered] = useState(false);

const handleChatSubmit = (e) => {
  e.preventDefault();
  if (timer === 0 || round > 5) return; 
  const trimmedInput = chatInput.trim().toLowerCase();
  const realAnswer = originalWord.toLowerCase();

  // Store the message
  setChatMessages(prev => [...prev, { username, message: chatInput }]);

  if (trimmedInput === realAnswer && !hasAnswered) {
    setHasAnswered(true);
    // Calculate score based on time
    const baseScore = 5;
    const bonusFactor = timer / 20; // 10 is max time
    const roundScore = Math.floor(baseScore * bonusFactor);

    setScore(prev => prev + roundScore);
    
    console.log(`Correct! You scored ${roundScore} points`);
  }

  setChatInput('');
};














  useEffect(() => {
    if (timer === 0) return;
    const intervalId = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  
    // Clean up on unmount or when timer ends
    return () => clearInterval(intervalId);
  }, [timer]);
  
  // Usage: To restart the timer (like for a new round)
  const startNewRound = async() => {
    if (round >= 5) return; // Prevent exceeding max rounds

  await getWord(); // Get the new word before starting the timer
    setTimer(20);
    setRound(prev => prev + 1);
    wordArrayIndex.current += 1;
  };
  useEffect(() => {
    if (timer === 0 && round < 5) {
      setShoworiginal(true)
      setTimeout(() => startNewRound(), 7000); // short delay before next round
      setTimeout(()=>setShoworiginal(false),6000)
    }
  }, [timer]);

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

const getWord = async () => {
  const randomNumber = Math.floor(Math.random() * 41);
  const category = scribbleWords[randomNumber];

  try {
    const response = await fetch(`https://api.datamuse.com/words?ml=${category}&max=2`);
    const data = await response.json();

 if (data.length > 0) {
  const realWord = data[0].word;
      setOriginalWord(realWord)
      const resWord = maskRandomLetters(realWord);
      setWord(resWord);
    } else {
      console.warn("No words returned for category:", category);
    }
  } catch (err) {
    console.error("Failed to fetch word:", err);
  }
};

useEffect(() => {
  getWord();
}, []);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };


  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

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


  let content = (
    <div className={styles.playground}>
      <nav className={styles.playNav}>
        <div className={styles.playNav__left}>
          <div></div>
          <div>Scribble Showdown</div>
        </div>
        <div className={styles.word}>{showOriginal ?originalWord :word}</div>
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
          <div className={`${styles.player} ${styles.topPlayer}`}>
            <p> RANK : <span>1</span></p>
            <p>{username}</p>
            <p>POINTS : {score}</p>
          </div>
          
        </div>
        <div className={styles.middle}>
          <div className={styles.middle__top}>
            <div className={styles.rounds}>
              <div>ROUND</div>
              <div style={{whiteSpace:"nowrap"}}>{round} / 5</div>
            </div>
            <div className={styles.rounds}>
              <div>TIMER</div>
              <div style={{whiteSpace:"nowrap"}}>{timer} s</div>
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

          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.chats}>
           
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
            onChange={(e) => setChatInput(e.target.value)}/>
          </form>
        </div>
      </main>
      <footer className={styles.play__footer}>
        <p>&copy; 2025 Scribble Showdown. All rights reserved.</p>
      </footer>
    </div>
  )
  return content
}

export default Main
