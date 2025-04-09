import styles from './changePassword.module.css';
import React from 'react'

const Mail = () => {
   let content = (
          <div className={styles.Change}>
              <main className={styles.login__container}>
        <h1>SCRIBBLE ID</h1>
        <h2>Change Password</h2>
        <form action="">
            <label htmlFor="otp">Enter OTP</label>
            <input type="password" placeholder="OTP" id="otp"></input>
        </form>
     
        <button>
            Submit
        </button>
    </main>
          </div>
      )
    return content
}

export default Mail
