import React from 'react'
import styles from './enter.module.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
const Enter = () => {

    const navigate = useNavigate();
    const [error, setError] = useState('');
 const [Id, setId] = useState('');

    const handleEnter = async () => {
      if(Id === ''){
        return
      }
      else{
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (response.ok) {
                // success - redirect to /main
                navigate('/main');
            } else {
                // error - stay and show message
                setError('Invalid details');
            }
        } catch (err) {
            setError('Server error. Try again later.');
        }
    }
  };

    const content = (
    <div className={styles.Enter}>
         <main>
    <p>ID_</p>
    <div className={styles.choose}>
        <input type="text" placeholder="Enter ID"
        // required
        value={Id}
        onChange={(e) => setId(e.target.value)}/>
        <button type="button" onClick={()=>handleEnter()} >ENTER</button>
    </div>
    </main>
    </div>
    )
  return content
}

export default Enter
