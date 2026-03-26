import React from 'react'
import AdminNavbar from '../components/AdminNavbar'
import AdminHeader from '../components/AdminHeader'

const AdminHome = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-400'>
      <AdminNavbar/>
      <AdminHeader/>
    </div>
  )
}

export default AdminHome