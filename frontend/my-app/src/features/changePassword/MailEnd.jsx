import styles from './changePassword.module.css';
import React from 'react'

const MailEnd = () => {
   let content = (
          <div className={styles.Change}>
                 <main className={styles.login__container}>
        <h1>SCRIBBLE ID</h1>
        <h2>Change Password</h2>
        <form action="">
            <label for="pwd">Enter Password</label>
            <input type="password" placeholder="New Password" id="pwd"></input>
            <label for="pwd">Confirm Password</label>
            <input type="password" placeholder="Confirm Password" id="pwd"></input>
        </form>

        <button>
            Submit
        </button>
    </main>
          </div>
      )
    return content
}

export default MailEnd
