import React from 'react'
import styles from './choose.module.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Choose = ({ setChoice ,email,setEmail}) => {

    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChoiceCreate = async () => {
        setChoice('Create')
        navigate('/enter')
    };
    const handleChoiceJoin = async () => {
        setChoice('Join')
        navigate('/enter')
    };

    const content = (
        <div className={styles.ChooseX}>
        <main>
        <p>\ Play . Win . Repeat \</p>
        <div className={styles.choose}>
            <button type="button" 
            onClick={()=>handleChoiceCreate()}>Create Playground</button>
            <button type="button"
             onClick={()=>handleChoiceJoin()}>Join Playground</button>
        </div>
        </main>
        
        </div>
    )
  return content
}

export default Choose
