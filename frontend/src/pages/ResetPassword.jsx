import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const ResetPassword = () => {

  const {backendUrl} = useContext(AppContext)
  axios.defaults.withCredentials = true

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [otp, setOtp] = useState(0)
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false)


  const inputRefs = React.useRef([])

  const handleInput = (e, index) => {
    if(e.target.value.length>0 && index < inputRefs.current.length - 1){
      inputRefs.current[index+1].focus();
    }
  }

  const handleKeyDown = (e, index) => {
    if(e.key == 'Backspace' && index < e.target.value === '' && index>0){
      inputRefs.current[index-1].focus();
    }
  }

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text')
    const pasteArray = paste.split('')
    pasteArray.forEach((char, index) => {
      if(inputRefs.current[index]){
        inputRefs.current[index].value = char
      }
    })
  }

  const onSubmitEmail = async (e) => {
    e.preventDefault()
    try{
      const {data} = await axios.post(backendUrl + '/user/send-reset-otp', {email})
      data.success ? toast.success(data.message) : toast.error(data.message)
      data.success && setIsEmailSent(true)
    }catch(error){
      toast.error(error.message)
    }
  }

  const onSubmitOtp = async (e) => {
    e.preventDefault()
    const otpArray = inputRefs.current.map(e => e.value)
    setOtp(otpArray.join(''))
    setIsOtpSubmitted(true)
  }

  const onSubmitNewPassword = async (e) => {
    e.preventDefault();
    try{
      const {data} = await axios.post(backendUrl + '/user/reset-password', {email, otp, newPassword})
      data.success ? toast.success(data.message) : toast.error(data.message)
      data.success && navigate('/login')
    }catch(error){
      toast.error(error.message)
    }
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-400'>
      <img onClick={() => { navigate ('/')}} src={assets.logo} alt="logo" className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer'/>
      
      {!isEmailSent && 
        <form onSubmit={onSubmitEmail} className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>Reset Password</h1>
          <p className='text-center mb-6 text-indigo-300'>Enter your registered email-id</p>
          <div className='mb-4 flex items-center gap-3 w-full px-5  py-2.5 rounded-full bg-[#333A5C]'>
            <i className="ri-mail-line text-white text-2xl"></i>
            <input type="email" placeholder='Email-Id' required
            className='bg-transparent outline-none text-white'
            value = {email}
            onChange={e => setEmail(e.target.value)}/>
          </div>
          <button className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full cursor-pointer hover:bg-green-700'>Submit</button>
        </form>
      }

      {!isOtpSubmitted && isEmailSent &&
        <form onSubmit={onSubmitOtp} className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>Password Reset OTP</h1>
          <p className='text-center mb-6 text-indigo-300'>Enter the six-digit code sent to your email-id</p>
          <div className='flex justify-between mb-8' onPaste={handlePaste}>
            {Array(6).fill(0).map( ( _, index )=>(
              <input type="text" maxLength='1' key={index} required
              className='w-12 h-12 bg-[#333A5C] text-white text-center text-xl rounded-lg'
              ref = {e => inputRefs.current[index] = e}
              onInput={(e) => { handleInput(e, index) }}
              onKeyDown={(e) => {handleKeyDown(e,index)}}/>
            ) )}
          </div>
          <button className='w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full cursor-pointer hover:bg-green-700'>Submit</button>
        </form>
      }

      {isOtpSubmitted && isEmailSent &&
        <form onSubmit={onSubmitNewPassword} className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>Enter New Password</h1>
          <p className='text-center mb-6 text-indigo-300'>Enter the new password below</p>
          <div className='mb-4 flex items-center gap-3 w-full px-5  py-2.5 rounded-full bg-[#333A5C]'>
            <i className="ri-lock-line text-white text-2xl"></i>
            <input type="password" placeholder='New Password' required
            className='bg-transparent outline-none text-white'
            value = {newPassword}
            onChange={e => setNewPassword(e.target.value)}/>
          </div>
          <button className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-full cursor-pointer hover:bg-green-700'>Submit</button>
        </form>
      }
    </div>
  )
}

export default ResetPassword
ResetPassword