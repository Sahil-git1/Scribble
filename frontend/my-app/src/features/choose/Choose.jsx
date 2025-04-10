import React from 'react'
import styles from './choose.module.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Choose = () => {

    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChoice = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ })
            });

            if (response.ok) {
                // success - redirect to /main
                navigate('/enter');
            } else {
                // error - stay and show message
                setError('Invalid details');
            }
        } catch (err) {
            setError('Server error. Try again later.');
        }
    };


    const content = (
        <div className={styles.ChooseX}>
        <main>
        <p>\ Play . Win . Repeat \</p>
        <div className={styles.choose}>
            <button type="button" 
            onClick={()=>handleChoice()}>Create Playground</button>
            <button type="button"
             onClick={()=>handleChoice()}>Join Playground</button>
        </div>
        </main>
        
        </div>
    )
  return content
}

export default Choose
