import styles from './changePassword.module.css';
import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Mail = () => {


    const navigate = useNavigate();
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const allFieldsFilled = otp.trim() !== '' ;

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                // success - redirect to /main
                navigate('/mailEnd');
            } else {
                // error - stay and show message
                setError('Invalid email or password');
            }
        } catch (err) {
            setError('Server error. Try again later.');
        }
    };

   let content = (
          <div className={styles.Change}>
              <main className={styles.login__container}>
        <h1>SCRIBBLE ID</h1>
        <h2>Change Password</h2>
        <form onSubmit={handleLogin}>
            <label htmlFor="otp">Enter OTP</label>
            <input type="password" placeholder="OTP" id="otp"
           
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}>

            </input>

            <button type="submit" 
                    disabled={!allFieldsFilled}
                        style={{
                            backgroundColor: allFieldsFilled ? 'black' : '#F5F5F5',
                            color: allFieldsFilled ? 'white' : 'rgba(0, 0, 0, 0.264)',
                            cursor: allFieldsFilled ? 'pointer' : 'not-allowed'
                        }}>
            Submit
        </button>
        </form>
        {error && <p style={{ color: 'black', fontWeight: 500, marginTop: '10px', fontFamily: 'sans-serif' }}>{error}</p>}
      
    </main>
          </div>
      )
    return content
}

export default Mail
