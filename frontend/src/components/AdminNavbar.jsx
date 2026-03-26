import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminNavbar = () => {

  const navigate =  useNavigate();

  const {adminData, backendUrl, setAdminData, setIsLoggedin} = useContext(AppContext)

  const sendVerificationOtp = async ()=>{
    try{
      axios.defaults.withCredentials = true;

      const {data} = await axios.post(backendUrl + '/admin/send-admin-verify-otp')

      if(data.success){
        navigate('/email-verify')
        toast.success(data.message)
      }else{
        console.log("admin /email-verify toast error")
        toast.error(data.message)
      }

    }catch(error){
      console.log("admin sendverificationotp toast error")
      toast.error(error.message)
    }
  }

  const logout = async ()=> {
    try{
      axios.defaults.withCredentials = true
      const {data} = await axios.post(backendUrl + '/admin/logout')

      data.success && setIsLoggedin(false)
      data.success && setAdminData(false)
      navigate('/')

    }catch(error){
      console.log("admin logout toast error")
      toast.error(error.message) 
    }
  } 

  const uploadPhoto = async () => {
    navigate('/upload-admin-photo')
  }

  return (
    <div className='w-full flex justify-between items-center p-4 sm:p-3 sm:px-12 absolute top-0'>
      <div className='flex flex-row justify-between items-center gap-0'>
        <img src={assets.logo} alt="logo" className='w-28 sm:w-32' />
        <h1 className='text-6xl'>ClassMonitor</h1>
      </div>
      {adminData ? 
        <div className='w-14 h-14 flex justify-center items-center rounded-full bg-black text-white relative group'>
          {adminData.name[0].toUpperCase()}
          <div className='absolute hidden group-hover:block top-0 right-10 z-10 text-black rounded pt-10'>
            <ul className='list-none m-0 p-2 bg-gray-300 text-sm rounded-lg flex flex-col gap-2'>
              {!adminData.isAccountVerified && 
                <li onClick={sendVerificationOtp} className='py-1 px-2 hover:bg-gray-400 cursor-pointer rounded-lg border'>Verify Email</li>
              }
              {!adminData.photoUrl?.trim() && 
                <li onClick={uploadPhoto} className='py-1 px-2 hover:bg-gray-400 cursor-pointer rounded-lg whitespace-nowrap border'>Upload Photo</li>
              }
              <li onClick={logout} className='py-1 px-2 hover:bg-gray-400 cursor-pointer pr-10 rounded-lg border'>Logout</li>

            </ul>

          </div>
        </div>
        : <div>
            <button onClick={() => {navigate('/login')}} className='flex items-center gap-2 border border-gray-500 rounded-2xl px-6 px-2 hover:bg-green-700 transition-all cursor-pointer'>
              Login <i className="ri-user-6-fill"></i>
            </button>
            <button onClick={() => {navigate('/admin-login')}} className='flex items-center gap-2 border border-gray-500 rounded-2xl px-6 px-2 hover:bg-green-700 transition-all cursor-pointer'>
              Admin Login <i className="ri-user-6-fill"></i>
            </button>
<<<<<<< HEAD
=======
            <button onClick={() => {navigate('/teacher-login')}} className='flex items-center gap-2 border border-gray-500 rounded-2xl px-6 px-2 hover:bg-green-700 transition-all cursor-pointer'>
              Teacher Login <i className="ri-user-6-fill"></i>
            </button>
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
          </div>
      }
    </div>
  )
}

export default AdminNavbar