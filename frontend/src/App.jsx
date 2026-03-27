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
import TeacherLogin from "./pages/TeacherLogin";
import TeacherFrontPage from './pages/TeacherFrontPage';
import TimetableViewer from './pages/TimetableViewer';
import StudentAttendanceCalendar from "./pages/StudentAttendanceCalendar";




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
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/teacher-dashboard" element={<TeacherFrontPage />} />
        <Route path="/timetable-viewer" element={<TimetableViewer />} />
        <Route path="/student-calendar" element={<StudentAttendanceCalendar />} />
        <Route path="*" element={<h1 className="text-center mt-10">Page Not Found</h1>} />
        <Route path="*" element={<h1>Wrong URL: {window.location.pathname}</h1>} />
        
        
      </Routes>
    </div>
  )
}

export default App
