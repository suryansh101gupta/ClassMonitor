import React, { useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminNavbar = () => {

  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const avatarRef = useRef(null);
  const menuRef = useRef(null);

  const { adminData, backendUrl, setAdminData, setIsLoggedin } = useContext(AppContext);

  const updateDropdownPosition = () => {
    if (!avatarRef.current) return;
    const rect = avatarRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  };

  const toggleDropdown = () => {
    if (!showDropdown) updateDropdownPosition();
    setShowDropdown(prev => !prev);
  };

  // Close on outside click / scroll / resize
  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e) => {
      if (avatarRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setShowDropdown(false);
    };
    const reposition = () => updateDropdownPosition();
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [showDropdown]);

  const sendVerificationOtp = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + '/admin/send-admin-verify-otp');
      if (data.success) {
        navigate('/email-verify');
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backendUrl + '/admin/logout');
      if (data.success) {
        setIsLoggedin(false);
        setAdminData(false);
        navigate('/');
        toast.success('Logged out successfully');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className='w-full flex justify-between items-center p-4 sm:px-8 sticky top-0 z-50 bg-[#F4F0E6] border-b-4 border-[#111111] shadow-[0_4px_0px_#111111] mb-8'>
      {/* Logo */}
      <div className='flex flex-row items-center gap-4 cursor-pointer' onClick={() => navigate('/')}>
        <img src="/cm_logo.png" alt="ClassMonitor" className="h-10 w-auto" />
        <h1 className='text-2xl font-black tracking-widest text-[#111111] uppercase'>ClassMonitor</h1>
      </div>

      {/* Right side */}
      {adminData ? (
        <div className='relative'>
          {/* Avatar — overflow-hidden stays here for photo clipping, dropdown is a sibling via portal */}
          <div
            ref={avatarRef}
            onClick={toggleDropdown}
            className='w-12 h-12 flex justify-center items-center rounded-full bg-[#FF5722] text-[#111111] font-black border-2 border-[#111111] shadow-[3px_3px_0px_#111111] cursor-pointer select-none overflow-hidden'
          >
            {adminData.photoUrl
              ? <img src={adminData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              : (adminData.name?.[0] || 'A').toUpperCase()
            }
          </div>

          {/* Dropdown rendered in document.body via portal — escapes all overflow/z-index stacking */}
          {showDropdown && createPortal(
            <div
              ref={menuRef}
              style={{ top: dropdownPos.top, right: dropdownPos.right }}
              className='fixed z-[9999] w-52'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='bg-white border-2 border-[#111111] shadow-[6px_6px_0px_#111111] rounded-lg overflow-hidden flex flex-col'>
                {/* Name header */}
                <div className='px-4 py-2.5 border-b-2 border-[#111111] font-extrabold text-sm uppercase text-[#FF5722] truncate'>
                  {adminData.name}
                </div>
                <ul className='list-none m-0 p-0 flex flex-col'>
                  <li
                    onClick={() => { navigate('/admin-front-page'); setShowDropdown(false); }}
                    className='px-4 py-2.5 hover:bg-[#F4F0E6] hover:text-[#FF5722] cursor-pointer text-xs font-extrabold uppercase transition-all duration-200 border-b border-gray-100 flex items-center gap-2'
                  >
                    <i className="ri-dashboard-line text-sm"></i> Dashboard
                  </li>
                  <li
                    onClick={() => { logout(); setShowDropdown(false); }}
                    className='px-4 py-2.5 hover:bg-red-500 hover:text-white cursor-pointer text-xs font-extrabold uppercase transition-all duration-200 flex items-center gap-2'
                  >
                    <i className="ri-logout-box-r-line text-sm"></i> Logout
                  </li>
                </ul>
              </div>
            </div>,
            document.body
          )}
        </div>
      ) : (
        <div className='flex gap-4 items-center'>
          <button
            onClick={() => navigate('/login')}
            className='flex items-center gap-2 bg-[#ffffff] text-[#111111] border-2 border-[#111111] font-bold uppercase px-6 py-2 shadow-[4px_4px_0px_#111111] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#FF5722] transition-all cursor-pointer'
          >
            Login <i className="ri-user-6-fill"></i>
          </button>
          <button
            onClick={() => navigate('/admin-login')}
            className='flex items-center gap-2 bg-[#FF5722] text-[#111111] border-2 border-[#111111] font-bold uppercase px-6 py-2 shadow-[4px_4px_0px_#111111] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#111111] transition-all cursor-pointer'
          >
            Admin Login <i className="ri-user-6-fill"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminNavbar;
