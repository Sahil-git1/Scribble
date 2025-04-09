import React from 'react'
import styles from './choose.module.css';
const Choose = () => {
    const content = (
        <div className={styles.ChooseX}>
        <main>
        <p>\ Play . Win . Repeat \</p>
        <div className={styles.choose}>
            <button type="submit">Create Playground</button>
            <button type="submit">Join Playground</button>
        </div>
        </main>
        </div>
    )
  return content
}

export default Choose
