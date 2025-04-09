import React from 'react'
import styles from './landing.module.css';
import { useNavigate } from 'react-router-dom';
const Landing = () => {
    const navigate = useNavigate();
    const handleLoginClick = () => {
      navigate('/login');
    };
    const content = (<><div className={styles.lpB}>
        <nav className={styles.lpNav}>
        <div className={styles.lpNav__left}>
     <div></div>
     <div>Scribble Showdown</div>
        </div>
        <div className={styles.lpNav__right}>
         <ul>
             <li><a href="">CONTACT</a></li>
             <li><a href="">ABOUT</a></li>
         </ul>
         <button onClick={handleLoginClick}>PLAY NOW</button>
        </div>
         </nav>
         <main>
             <div className={styles.lpHero}>
             <p>Your hands hold the power to shape imagination.</p>
             <button onClick={handleLoginClick}><p>LOGIN</p></button>
         </div>
         </main>
         <div className={styles.lpEnd}>
             <h1>How to Play</h1>
             <div className={styles.lpList}>
                         <div className={styles.lpcontainer}>
                           <div className={styles.lppic} style={{backgroundImage: "url('/innovation.png')"}}></div>
                           <div className={styles.lptext}>
                             <h2>Start Drawing in the Air</h2>
                             <h3>Use your webcam to draw using hand gestures.</h3>
                           </div>
                         </div>
                    
                         <div className={styles.lpcontainer}>
                           <div className={styles.lppic}style={{backgroundImage: "url('/search.png')"}}></div>
                           <div className={styles.lptext}>
                             <h2>Guess the Word</h2>
                             <h3>Friends try to guess what you're drawing – live!</h3>
                           </div>
                         </div>
                    
                         <div className={styles.lpcontainer}>
                           <div className={styles.lppic}style={{backgroundImage: "url('/rating.png')"}}></div>
                           <div className={styles.lptext}>
                             <h2>Score Points</h2>
                             <h3>The faster they guess, the more points you get!</h3>
                           </div>
                         </div>
                  
             </div>
         </div>
         <footer className={styles.lp__footer}>
             <p >&copy; 2025 Scribble Showdown. All rights reserved.</p>
         </footer>
         </div>
         </>
    )
  return content
}

export default Landing
