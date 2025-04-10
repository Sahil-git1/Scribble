import React from 'react'
import styles from './register.module.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
const Register = () => {

const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username,setUsername] = useState('');
    const [error, setError] = useState('');

    const allFieldsFilled = email.trim() !== '' && password.trim() !== '' && username.trim() !== '';

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password ,username})
            });

            if (response.ok) {
                // success - redirect to /main
                navigate('/choose');
            } else {
                // error - stay and show message
                setError('Invalid email or password or username');
            }
        } catch (err) {
            setError('Server error. Try again later.');
        }
    };



    const content = (
        <div className={styles.Register}>
            <main className={styles.login__container}>
                <h1>SCRIBBLE ID</h1>
                <h2>Enter Required Info</h2>
                <form onSubmit={handleLogin}>
                    <label htmlFor="mail">Email</label>
                    <input type="email" placeholder="player@mail.com" id="mail" 
                        
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}>
                    </input>
                    <label htmlFor="name">Name</label>
                    <input type="text" placeholder="player name" id="name" 
                        
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}>
                    </input>
                    <label htmlFor="pwd">Password</label>
                    <input type="password" placeholder="password"
                    
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    >
                    </input>
                  <button type="submit" 
                    disabled={!allFieldsFilled}
                        style={{
                            backgroundColor: allFieldsFilled ? 'black' : '#F5F5F5',
                            color: allFieldsFilled ? 'white' : 'rgba(0, 0, 0, 0.264)',
                            cursor: allFieldsFilled ? 'pointer' : 'not-allowed'
                        }}>
                    Create Account
                </button>
                </form>
                {error && <p style={{ color: 'black', fontWeight: 500, marginTop: '10px', fontFamily: 'sans-serif' }}>{error}</p>}
             
            </main>
        </div>
    )
    return content
}

export default Register
