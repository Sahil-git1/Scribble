import React from 'react'
import styles from './enter.module.css';
const Enter = () => {
    const content = (
    <div className={styles.Enter}>
         <main>
    <p>ID_</p>
    <div className={styles.choose}>
        <input type="text" placeholder="Enter ID"/>
        <button type="submit">ENTER</button>
    </div>
    </main>
    </div>
    )
  return content
}

export default Enter
