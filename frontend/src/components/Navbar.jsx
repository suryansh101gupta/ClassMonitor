import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Navbar = () => {

  const navigate =  useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const {userData, teacherData, adminData, backendUrl, setUserData, setTeacherData, setAdminData, setIsLoggedin} = useContext(AppContext)

  const activeUser = userData || teacherData || adminData;

  const sendVerificationOtp = async ()=>{
    try{
      axios.defaults.withCredentials = true;
      let endpoint = '/user/send-verify-otp';
      if (teacherData) endpoint = '/teachers/send-teacher-verify-otp';
      if (adminData) endpoint = '/admin/send-admin-verify-otp';

      const {data} = await axios.post(backendUrl + endpoint)

      if(data.success){
        navigate('/email-verify')
        toast.success(data.message)
      }else{
        console.log("user /email-verify toast error")
        toast.error(data.message)
      }

    }catch(error){
      console.log("user sendotp toast error")
      toast.error(error.message)
    }
  }

  const logout = async ()=> {
    try{
      axios.defaults.withCredentials = true

      let endpoint = '/user/logout';
      if (teacherData) endpoint = '/teachers/logout';
      if (adminData) endpoint = '/admin/logout';

      const {data} = await axios.post(backendUrl + endpoint)

      if (data.success) {
        setIsLoggedin(false)
        setUserData(false)
        setTeacherData(false)
        setAdminData(false)
        navigate('/')
        toast.success('Logged out successfully')
      } else {
        toast.error(data.message)
      }

    }catch(error){
      console.log("user logout toast error")
      toast.error(error.message)
    }
  } 

  const uploadPhoto = async () => {
    if (teacherData) navigate('/upload-teacher-photo')
    else if (adminData) navigate('/upload-admin-photo')
    else navigate('/upload-photo')
  }

  return (
    <div className='w-full flex justify-between items-center p-4 sm:px-8 sticky top-0 z-50 bg-[#F4F0E6] border-b-4 border-[#111111] shadow-[0_4px_0px_#111111] mb-8'>
      <div className='flex flex-row items-center gap-4 cursor-pointer' onClick={() => navigate('/')}>
        <img src="/cm_logo.png" alt="ClassMonitor" className="h-10 w-auto" />
        <h1 className='text-2xl font-black tracking-widest text-[#111111] uppercase'>ClassMonitor</h1>
      </div>
      {activeUser ?
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          className='w-12 h-12 flex justify-center items-center rounded-full bg-[#FF5722] text-[#111111] font-black border-2 border-[#111111] shadow-[3px_3px_0px_#111111] relative cursor-pointer select-none'
        >
          {activeUser.name[0].toUpperCase()}
          {showDropdown && (
            <div className='absolute top-full right-0 pt-2 z-50 text-black w-48' onClick={(e) => e.stopPropagation()}>
              <div className='bg-white border-3 border-[#111111] shadow-[6px_6px_0px_#111111] rounded-lg overflow-hidden flex flex-col'>
                <div className='px-4 py-2 border-b-2 border-black font-extrabold text-sm uppercase text-[#FF5722] truncate'>
                  {activeUser.name}
                </div>
                <ul className='list-none m-0 p-0 flex flex-col'>
                  {teacherData && (
                    <li onClick={() => { navigate('/teacher-dashboard'); setShowDropdown(false); }} className='px-4 py-2.5 hover:bg-[#F4F0E6] hover:text-[#FF5722] cursor-pointer text-xs font-extrabold uppercase transition-all duration-200 border-b border-gray-100 flex items-center gap-2'>
                      <i className="ri-dashboard-line text-sm"></i> Dashboard
                    </li>
                  )}
                  {adminData && (
                    <li onClick={() => { navigate('/admin-front-page'); setShowDropdown(false); }} className='px-4 py-2.5 hover:bg-[#F4F0E6] hover:text-[#FF5722] cursor-pointer text-xs font-extrabold uppercase transition-all duration-200 border-b border-gray-100 flex items-center gap-2'>
                      <i className="ri-dashboard-line text-sm"></i> Dashboard
                    </li>
                  )}
                  {userData && (
                    <li onClick={() => { navigate('/my-attendance'); setShowDropdown(false); }} className='px-4 py-2.5 hover:bg-[#F4F0E6] hover:text-[#FF5722] cursor-pointer text-xs font-extrabold uppercase transition-all duration-200 border-b border-gray-100 flex items-center gap-2'>
                      <i className="ri-bar-chart-grouped-line text-sm"></i> My Attendance
                    </li>
                  )}
                  {!activeUser.isAccountVerified &&
                    <li onClick={() => { sendVerificationOtp(); setShowDropdown(false); }} className='px-4 py-2.5 hover:bg-[#F4F0E6] hover:text-[#FF5722] cursor-pointer text-xs font-extrabold uppercase transition-all duration-200 border-b border-gray-100 flex items-center gap-2'>
                      <i className="ri-checkbox-circle-line text-sm"></i> Verify Email
                    </li>
                  }
                  {!activeUser.photoUrl?.trim() &&
                    <li onClick={() => { uploadPhoto(); setShowDropdown(false); }} className='px-4 py-2.5 hover:bg-[#F4F0E6] hover:text-[#FF5722] cursor-pointer text-xs font-extrabold uppercase transition-all duration-200 border-b border-gray-100 whitespace-nowrap flex items-center gap-2'>
                      <i className="ri-image-add-line text-sm"></i> Upload Photo
                    </li>
                  }
                  <li onClick={() => { logout(); setShowDropdown(false); }} className='px-4 py-2.5 hover:bg-red-500 hover:text-white cursor-pointer text-xs font-extrabold uppercase transition-all duration-200 flex items-center gap-2'>
                    <i className="ri-logout-box-r-line text-sm"></i> Logout
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
        : isLoggedin ? null :
        <div className='flex gap-4 items-center'>
            <button 
            onClick={() => {navigate('/login')}} 
            className='flex items-center gap-2 bg-[#ffffff] text-[#111111] border-2 border-[#111111] font-bold uppercase px-6 py-2 shadow-[4px_4px_0px_#111111] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#FF5722] transition-all cursor-pointer'>
            Login <i className="ri-user-6-fill"></i>
            </button>
            <button 
            onClick={() => {navigate('/admin-login')}} 
            className='flex items-center gap-2 bg-[#FF5722] text-[#111111] border-2 border-[#111111] font-bold uppercase px-6 py-2 shadow-[4px_4px_0px_#111111] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#111111] transition-all cursor-pointer'>
              Admin Login <i className="ri-user-6-fill"></i>
            </button>
            <button 
            onClick={() => {navigate('/teacher-login')}} 
            className='flex items-center gap-2 bg-[#ffffff] text-[#111111] border-2 border-[#111111] font-bold uppercase px-6 py-2 shadow-[4px_4px_0px_#111111] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#FF5722] transition-all cursor-pointer'>
            Teacher Login <i className="ri-user-6-fill"></i>
          </button>
          </div>
      }
    </div>
    
  )
}

export default Navbar
