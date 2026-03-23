import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import EmailVerify from './pages/EmailVerify'
import UploadPhoto from './pages/UploadPhoto'
import ResetPassword from './pages/ResetPassword'
import { ToastContainer } from 'react-toastify';
import AdminLogin from './pages/AdminLogin'
import AdminHome from './pages/AdminHome'
import AdminFrontPage from './components/AdminFrontPage'

const App = () => {
  return (
    <div>
      <ToastContainer/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/admin-home' element={<AdminHome/>}/>
        <Route path='/admin-front-page' element={<AdminFrontPage/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/admin-login' element={<AdminLogin/>}/>
        <Route path='/email-verify' element={<EmailVerify/>}/>
        <Route path='/upload-photo' element={<UploadPhoto/>}/>
        <Route path='/reset-password' element={<ResetPassword/>}/>
      </Routes>
    </div>
  )
}

export default App
