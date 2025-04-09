import React from 'react'
import styles from './register.module.css';
const Register = () => {
    const content = (
        <div className={styles.Register}>
            <main className={styles.login__container}>
                <h1>SCRIBBLE ID</h1>
                <h2>Enter Required Info</h2>
                <form action="">
                    <label htmlFor="mail">Email</label>
                    <input type="email" placeholder="player@mail.com" id="mail"></input>
                    <label htmlFor="name">Name</label>
                    <input type="text" placeholder="player name" id="name"></input>
                    <label htmlFor="pwd">Password</label>
                    <input type="password" placeholder="password"></input>
                </form>

                <button>
                    Create Account
                </button>
            </main>
        </div>
    )
    return content
}

export default Register
