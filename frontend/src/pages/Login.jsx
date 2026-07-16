import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import { useEffect } from 'react';
import './Login.css';

const Login = () => {

  const navigate = useNavigate();

  const {backendUrl, setIsLoggedin, getUserData} = useContext(AppContext)

  const [state, setState] = useState('Sign Up')

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [rollNo, setRollNo] = useState('');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/user/classes');
            if (data.success) {
                setClasses(data.classes);
            }
            console.log("Classes API response:", data);
        } catch (err) {
            toast.error("Failed to load classes");
        }
    };

    fetchClasses();
    // console.log("Classes API response:", data);
  }, []);

  const onSubmitHandler = async (e)=>{
    try{
        e.preventDefault();

        axios.defaults.withCredentials = true;

        if(state === 'Sign Up'){
            const {data} = await axios.post(backendUrl + '/user/register' ,{name, email, password, roll_no: rollNo, class_id: classId})

            if(data.success){
                setIsLoggedin(true);
                getUserData()
                navigate('/')
            }else{
                console.log("user /user/register toast error")
                toast.error(data.message)
            }
        }else{
            const {data} = await axios.post(backendUrl + '/user/login' ,{email, password})

            if(data.success){
                setIsLoggedin(true);
                getUserData()
                navigate('/')
            }else{
                console.log("user /user/login toast error")
                toast.error(data.message)
            }
        }
    }catch(error){
        const msg = error.response?.data?.message || error.message;
        console.log("Full Error Object:", error.response);
        toast.error(msg);
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
        <h2 className='login-title'>{state === 'Sign Up' ? 'Create Account' : 'Login'}</h2>
        <p className='login-subtitle'>{state === 'Sign Up' ? 'Register with your details' : 'Login to your account!'}</p>

        <form onSubmit={onSubmitHandler}>
          {state === 'Sign Up' && (
            <div className='input-group'>
              <i className="ri-user-3-line input-icon"></i>
              <input 
                onChange={e => setName(e.target.value)} 
                value={name} 
                type="text" placeholder="Full Name" required 
                className='input-field'/>
            </div>
          )}

          {state === 'Sign Up' && (
            <div className='input-group'>
              <i className="ri-building-line input-icon"></i>
              <select
                onChange={e => setClassId(e.target.value)}
                value={classId}
                required
                className='input-field' >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {state === 'Sign Up' && (
            <div className='input-group'>
              <i className="ri-id-card-line input-icon"></i>
              <input 
                onChange={e => setRollNo(e.target.value)} 
                value={rollNo}
                type="text" placeholder="Roll Number" required 
                className='input-field' />
            </div>
          )}
          
          <div className='input-group'>
            <i className="ri-mail-line input-icon"></i> 
            <input 
              onChange={e => setEmail(e.target.value)} 
              value={email} 
              type="email" placeholder="Email Id" required 
              className='input-field'/>
          </div>
          <div className='input-group'>
            <i className="ri-lock-line input-icon"></i> 
            <input 
              onChange={e => setPassword(e.target.value)} 
              value={password}
              type="password" placeholder="Password" required 
              className='input-field'/>
          </div>

          <p onClick={() => { navigate('/reset-password')}} className='forgot-password'>Forgot Password?</p>

          <button className='submit-button'>
            {state}
          </button>
        </form>

        {state === 'Sign Up' ? (
          <p className='switch-auth'>Already have an Account?{' '}
            <span onClick={()=>{setState('Login')}} className='switch-link'>Login Here</span>
          </p>
        ) : (
          <p className='switch-auth'>Don't have an Account?{' '}
            <span onClick={()=>{setState('Sign Up')}} className='switch-link'>Sign-up Here</span>
          </p>
        )}
      </div>
    </div>
  )
}

export default Login
