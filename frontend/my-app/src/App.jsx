import React from 'react'
import Landing from './features/landingPage/Landing'
import Login from './features/login/Login';
import Register from './features/register/Register';
import ChangePassword from './features/changePassword/ChangePassword';
import Mail from './features/changePassword/Mail';
import MailEnd from './features/changePassword/MailEnd';
import Choose from './features/choose/Choose';
import Enter from './features/Enter/Enter';
import Main from './features/mainPage/Main';
import ProtectedRoute from './protectedRoute';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

const App = () => {
  const [choice, setChoice] = useState('');
  const [Id, setId] = useState('');
 const [username,setUsername] = useState('');
  const [email, setEmail] = useState('');

  return (
    <Router>
          <Routes>
             <Route path="/" element={<Landing />} />
             <Route path="/login" element={<Login email={email} setEmail={setEmail}/>} />
             <Route path="/register" element={<Register username={username} setUsername={setUsername} email={email} setEmail={setEmail}/>} />
             <Route path="/changePassword" element={<ChangePassword email={email} setEmail={setEmail}/>} />
             <Route path="/mail" element={<Mail email={email} setEmail={setEmail}/>} />
             <Route path="/mailEnd" element={<MailEnd email={email} setEmail={setEmail}/>} />
             {/* Protected Routes  */}
             <Route
        path="/choose"
        element={
          <ProtectedRoute>
            <Choose setChoice={setChoice} email={email} setEmail={setEmail}/>
          </ProtectedRoute>
        }
      />
 <Route
        path="/enter"
        element={
          <ProtectedRoute>
            <Enter choice={choice} Id={Id} setId={setId} email={email} setEmail={setEmail}/>
          </ProtectedRoute>
        }
      />

             <Route
        path="/main"
        element={
          <ProtectedRoute>
            <Main username={username}  email={email}  Id={Id}/>
          </ProtectedRoute>
        }
      />
          </Routes>
  </Router>
  )
}

export default App
