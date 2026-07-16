import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { useEffect } from 'react';
import './Login.css';

const AdminLogin = () => {

  const navigate = useNavigate();

  const {backendUrl, setIsLoggedin, getAdminData} = useContext(AppContext)

  const [state, setState] = useState('Sign Up')

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmitHandler = async (e)=>{
    try{
        e.preventDefault();

        axios.defaults.withCredentials = true;

        if(state === 'Sign Up'){
            const {data} = await axios.post(backendUrl + '/admin/register' ,{name, email, password})

            if(data.success){
                setIsLoggedin(true);
                getAdminData()
                navigate('/admin-front-page')
            }else{
                console.log("user /admin/register toast error")
                toast.error(data.message)
            }
        }else{
            const {data} = await axios.post(backendUrl + '/admin/login' ,{email, password})

            if(data.success){
                setIsLoggedin(true);
                getAdminData()
                // console.log(data)
                navigate('/admin-front-page')
            }else{
                console.log("user /admin/login toast error")
                toast.error(data.message)
            }
        }
    }catch(error){
        console.log("user toast error")
        toast.error(error.message)
    }
  }


  return (
    <div className='login-page'>
      {/* Abstract Background Shapes */}
      <div className="abstract-shape shape-circle"></div>
      <div className="abstract-shape shape-square"></div>
      <div className="abstract-shape shape-triangle"></div>

      {/* Logo */}
      <div onClick={() => { navigate('/') }} className='login-logo'>
        <img src="/cm_logo.png" alt="ClassMonitor" className="h-10 w-auto" />
        <span>ClassMonitor</span>
      </div>

      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className='back-button'
      >
        <i className="ri-arrow-left-line"></i>
        Back
      </button>

      {/* Login Box */}
      <div className='login-container'>
        <h2 className='login-title'>
          {state === 'Sign Up' ? 'Create Admin Account' : 'Admin Login'}
        </h2>

        <p className='login-subtitle'>
          {state === 'Sign Up' ? 'Register with your details' : 'Login to your account!'}
        </p>

        <form onSubmit={onSubmitHandler}>
          {state === 'Sign Up' && (
            <div className='input-group'>
              <i className="ri-user-3-line input-icon"></i>
              <input 
                onChange={e => setName(e.target.value)} 
                value={name} 
                type="text" 
                placeholder="Full Name" 
                required 
                className='input-field'
              />
            </div>
          )}
          
          <div className='input-group'>
            <i className="ri-mail-line input-icon"></i> 
            <input 
              onChange={e => setEmail(e.target.value)} 
              value={email} 
              type="email" 
              placeholder="Email Id" 
              required 
              className='input-field'
            />
          </div>
          <div className='input-group'>
            <i className="ri-lock-line input-icon"></i> 
            <input 
              onChange={e => setPassword(e.target.value)} 
              value={password}
              type="password" 
              placeholder="Password" 
              required 
              className='input-field'
            />
          </div>

          <p 
            onClick={() => { navigate('/#')}} 
            className='forgot-password'
          >
            Forgot Password?
          </p>

          <button className='submit-button'>
            {state}
          </button>
        </form>

        {state === 'Sign Up' ? (
          <p className='switch-auth'>
            Already have an Account?{' '}
            <span 
              onClick={()=>{setState('Login')}} 
              className='switch-link'
            >
              Login Here
            </span>
          </p>
        ) : (
          <p className='switch-auth'>
            Don't have an Account?{' '}
            <span 
              onClick={()=>{setState('Sign Up')}} 
              className='switch-link'
            >
              Sign-up Here
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

export default AdminLogin
