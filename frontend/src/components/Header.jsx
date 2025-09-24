import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Header = () => {

  // const navigate =  useNavigate();

  const {userData} =  useContext(AppContext);

  return (
    <div className='flex flex-col items-center mt-20 px-4 text-center text-gray-800'>
      <img src={assets.logo} alt="logo" className='w-36 h-36 rounded-full mb-6'/>
      <h1 className='flex items-center gap-2 text-xl sm:text-3xl font-medium mb-2'>
        Hello, {userData ? userData.name :'Name'}! <i className="ri-shake-hands-fill"></i>
      </h1>
      <h2 className='text-3xl sm:text-5xl font-semibold mb-4'>Welcome to ClassMonitor</h2>
      <p className='mb-8 max-w-md'>Welcome to ClassMonitor blah blah blah welcome blah blah</p>
      <button 
        // onClick={() => {navigate('/login')}} 
        className='border border-gray-500 rounded-full px-8 py-2.5 hover:bg-green-700 cursor-pointer'>
        Get Started
      </button>
    </div>
  )
}

export default Header
