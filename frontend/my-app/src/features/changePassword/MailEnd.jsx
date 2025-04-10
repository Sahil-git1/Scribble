import styles from './changePassword.module.css';
import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const MailEnd = ({email,setEmail}) => {


    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');


    const allFieldsFilled = newPassword.trim() !== '' && password.trim() !== '';

    const handleLogin = async (e) => {
        e.preventDefault();
        if(newPassword !== password){
            setError("Password don't match");
        }
        else{
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
                navigate('/choose');
            } else {
                // error - stay and show message
                setError('Invalid email or password');
            }
        } catch (err) {
            setError('Server error. Try again later.');
        }
    }
};


   let content = (
          <div className={styles.Change}>
                 <main className={styles.login__container}>
        <h1>SCRIBBLE ID</h1>
        <h2>Change Password</h2>
        <form onSubmit={handleLogin}>
            <label for="pwd">Enter Password</label>
            <input type="password" placeholder="New Password" id="pwd"
    
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            ></input>
            <label for="pwd">Confirm Password</label>
            <input type="password" placeholder="Confirm Password" id="pwd"
           
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}>
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

export default MailEnd
