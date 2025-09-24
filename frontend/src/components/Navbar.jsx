import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Navbar = () => {

  const navigate =  useNavigate();

  const {userData, backendUrl, setUserData, setIsLoggedin} = useContext(AppContext)

  const sendVerificationOtp = async ()=>{
    try{
      axios.defaults.withCredentials = true;

      const {data} = await axios.post(backendUrl + '/user/send-verify-otp')

      if(data.success){
        navigate('/email-verify')
        toast.success(data.message)
      }else{
        toast.error(data.message)
      }

    }catch(error){
      toast.error(error.message)
    }
  }

  const logout = async ()=> {
    try{
      axios.defaults.withCredentials = true
      const {data} = await axios.post(backendUrl + '/user/logout')

      data.success && setIsLoggedin(false)
      data.success && setUserData(false)
      navigate('/')

    }catch(error){
      toast.error(error.message) 
    }
  } 

  const uploadPhoto = async () => {
    navigate('/upload-photo')
  }

  return (
    <div className='w-full flex justify-between items-center p-4 sm:p-6 sm:px-24 absolute top-0'>
      <img src={assets.logo} alt="logo" className='w-28 sm:w-32' />
      {userData ? 
        <div className='w-14 h-14 flex justify-center items-center rounded-full bg-black text-white relative group'>
          {userData.name[0].toUpperCase()}
          <div className='absolute hidden group-hover:block top-5 right-5 z-10 text-black rounded pt-10'>
            <ul className='list-none m-0 p-2 bg-gray-300 text-sm rounded-lg flex flex-col gap-2'>
              {!userData.isAccountVerified && 
                <li onClick={sendVerificationOtp} className='py-1 px-2 hover:bg-gray-400 cursor-pointer rounded-lg border'>Verify Email</li>
              }
              {!userData.photoUrl?.trim() && 
                <li onClick={uploadPhoto} className='py-1 px-2 hover:bg-gray-400 cursor-pointer rounded-lg whitespace-nowrap border'>Upload Photo</li>
              }
              <li onClick={logout} className='py-1 px-2 hover:bg-gray-400 cursor-pointer pr-10 rounded-lg border'>Logout</li>

            </ul>

          </div>
        </div>
        : <button onClick={() => {navigate('/login')}} className='flex items-center gap-2 border border-gray-500 rounded-2xl px-6 px-2 hover:bg-green-700 transition-all cursor-pointer'>
            Login <i className="ri-user-6-fill"></i>
          </button>
      }
    </div>
  )
}

export default Navbar