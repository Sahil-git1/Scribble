import styles from './changePassword.module.css';
import React from 'react'

const ChangePassword = () => {
    let content = (
        <div className={styles.Change}>
              <main className={styles.login__container}>
        <h1>SCRIBBLE ID</h1>
        <h2>Change Password</h2>
        <form action="">
            <label htmlFor="mail">Email</label>
            <input type="email" placeholder="player@mail.com" id="mail"></input>
        </form>
     
        <button>
            Next
        </button>
    </main>
        </div>
    )
  return content
}

export default ChangePassword
