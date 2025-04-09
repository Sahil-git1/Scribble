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

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
const App = () => {
  return (
    <Router>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/changePassword" element={<ChangePassword />} />
      <Route path="/mail" element={<Mail />} />
      <Route path="/mailEnd" element={<MailEnd />} />
      <Route path="/choose" element={<Choose />} />
      <Route path="/enter" element={<Enter />} />
      <Route path="/main" element={<Main />} />
    </Routes>
  </Router>
  )
}

export default App
