import React from 'react'
import styles from './login.module.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {login} from './authSlice'
const Login = ({email,setEmail}) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const allFieldsFilled = email.trim() !== '' && password.trim() !== '';

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:3500/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                // success - redirect to /main
                dispatch(login());
                navigate('/choose');
            } else {
                // error - stay and show message
                setError('Invalid email or password');
            }
        } catch (err) {
            setError('Server error. Try again later.');
        }
    };

    let content = (<>
        <div className={styles.logX}>
            <main className={styles.login__container}>
                <h1>SCRIBBLE ID</h1>
                <h2>Sign in</h2>
                <form onSubmit={handleLogin}>
                    <input type="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    ></input>

                    <input type="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}>

                    </input>
                    <div className={styles.container__last}>
                        <p onClick={() => navigate('/register')}>Create Account</p>
                        <span className={styles.vl}>|</span>
                        <span onClick={() => navigate('/changePassword')} >Change Password</span>
                    </div>
                    <button type="submit" 
                    disabled={!allFieldsFilled}
                        style={{
                            backgroundColor: allFieldsFilled ? 'black' : '#F5F5F5',
                            color: allFieldsFilled ? 'white' : 'rgba(0, 0, 0, 0.264)',
                            cursor: allFieldsFilled ? 'pointer' : 'not-allowed'
                        }}>
                        Sign in
                    </button>
                </form>

                {error && <p style={{ color: 'black', fontWeight: 500, marginTop: '10px', fontFamily: 'sans-serif' }}>{error}</p>}
            </main>
        </div>
    </>)
    return content
}

export default Login
