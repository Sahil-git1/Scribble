import React from 'react'
import styles from './main.module.css';
import { useState } from 'react';
import axios from 'axios'
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../login/authSlice';
import { useNavigate } from 'react-router-dom';


const Main = ({ Id, email }) => {

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
        <div className={styles.word}>W__O__R__D</div>
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
            <p>PLAYER1</p>
            <p>POINTS : 10</p>
          </div>
          <div className={styles.player}>
            <p> RANK : <span>1</span></p>
            <p>PLAYER1</p>
            <p>POINTS : 10</p>
          </div>
          <div className={styles.player}>
            <p> RANK : <span>1</span></p>
            <p>PLAYER1</p>
            <p>POINTS : 10</p>
          </div>
          <div className={styles.player}>
            <p> RANK : <span>1</span></p>
            <p>PLAYER1</p>
            <p>POINTS : 10</p>
          </div>
          <div className={styles.player}>
            <p> RANK : <span>1</span></p>
            <p>PLAYER1</p>
            <p>POINTS : 10</p>
          </div>
          <div className={styles.player}>
            <p> RANK : <span>1</span></p>
            <p>PLAYER1</p>
            <p>POINTS : 10</p>
          </div>
        </div>
        <div className={styles.middle}>
          <div className={styles.middle__top}>
            <div className={styles.rounds}>
              <div>ROUND</div>
              <div>1 / 5</div>
            </div>
            <div className={styles.rounds}>
              <div>TIMER</div>
              <div>1 s</div>
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
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAME</p>
              <p>Word</p>
            </div>
            <div className={styles.chat}>
              <p>USERNAMELast</p>
              <p>Word</p>
            </div>
          </div>
          <form action="">
            <input type="text" placeholder="Enter word" />
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
