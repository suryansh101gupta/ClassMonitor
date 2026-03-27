import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';

const TeacherLogin = () => {

  const navigate = useNavigate();

  const { backendUrl, setIsLoggedin, setTeacherData } = useContext(AppContext)

  const [state, setState] = useState('Sign Up')

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();

      axios.defaults.withCredentials = true;

      if (state === 'Sign Up') {
        const { data } = await axios.post(backendUrl + '/teacher/register', { name, email, password })

        if (data.success) {
          setIsLoggedin(true);
          setTeacherData(data.teacher)
          navigate('/teacher')
        } else {
          toast.error(data.message)
        }

      } else {
        const { data } = await axios.post(backendUrl + '/teacher/login', { email, password })

        if (data.success) {
          setIsLoggedin(true);
          setTeacherData(data.teacher)
          navigate('/teacher')
        } else {
          toast.error(data.message)
        }
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className='flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-br from-blue-200 to-purple-400'>
      
      <img onClick={() => { navigate('/') }} src={assets.logo} alt="logo" className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer'/>

      <div className='bg-slate-900 p-10 rounded-lg shadow-lg w-full sm:w-96 text-indigo-300 text-sm'>

        <h2 className='text-3xl font-semibold text-white text-center mb-3'>
          {state === 'Sign Up' ? 'Create Teacher Account' : 'Teacher Login'}
        </h2>

        <p className='text-center text-sm mb-6'>
          {state === 'Sign Up' ? 'Register as a Teacher' : 'Login to your Teacher account!'}
        </p>
              {/* ✅ Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className='absolute top-5 right-5 flex items-center gap-2 px-4 py-2 rounded-full 
             bg-[#333A5C] text-indigo-300 border border-indigo-500/30 
             shadow-md hover:bg-indigo-600 hover:text-white 
             transition-all duration-300'
>
            <i className="ri-arrow-left-line text-lg"></i>
            Back
        </button>

        <form onSubmit={onSubmitHandler}>

          {state === 'Sign Up' && (
            <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
              <i className="ri-user-3-line text-white text-2xl"></i>
              <input 
                onChange={e => setName(e.target.value)} 
                value={name} 
                type="text" placeholder="Full Name" required 
                className='bg-transparent text-white outline-none px-2'/>
            </div>
          )}

          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
            <i className="ri-mail-line text-white text-2xl"></i>
            <input 
              onChange={e => setEmail(e.target.value)} 
              value={email} 
              type="email" placeholder="Email Id" required 
              className='bg-transparent text-white outline-none px-2'/>
          </div>

          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
            <i className="ri-lock-line text-white text-2xl"></i>
            <input 
              onChange={e => setPassword(e.target.value)} 
              value={password}
              type="password" placeholder="Password" required 
              className='bg-transparent text-white outline-none px-2'/>
          </div>

          <p className='mb-4 text-indigo-500 cursor-pointer'>Forgot Password?</p>

          <button className='w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium cursor-pointer hover:bg-green-700'>
            {state}
          </button>
        </form>

        {state === 'Sign Up' ? (
          <p className='text-gray-400 text-center text-xs mt-4'>
            Already have an Account?{' '}
            <span onClick={() => setState('Login')} className='text-blue-400 cursor-pointer underline'>
              Login Here
            </span>
          </p>
        ) : (
          <p className='text-gray-400 text-center text-xs mt-4'>
            Don't have an Account?{' '}
            <span onClick={() => setState('Sign Up')} className='text-blue-400 cursor-pointer underline'>
              Sign-up Here
            </span>
          </p>
        )}

      </div>
    </div>
  )
}

export default TeacherLogin