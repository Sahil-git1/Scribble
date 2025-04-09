import React from 'react'
import styles from './login.module.css';
let content = (<>
<div className={styles.logX}>
 <main className={styles.login__container}>
    <h1>SCRIBBLE ID</h1>
    <h2>Sign in</h2>
    <form action="">
        <input type="email" placeholder="Email"></input>
        <input type="password" placeholder="Password"></input>
    </form>
    <div className={styles.container__last}>
        <p>Create Account</p>
        <span className={styles.vl}>|</span>
        <span>Change Password</span>
    </div>
    <button>
        Sign in
    </button>
</main>
</div>
</>)
const Login = () => {
  return content
}

export default Login
