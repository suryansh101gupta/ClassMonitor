import axios from "axios";
<<<<<<< HEAD
import { createContext, use, useEffect, useState } from "react";
=======
import { createContext, useEffect, useState } from "react";
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [isLoggedin, setIsLoggedin] = useState(false)
    const [userData, setUserData] = useState(false)
    const [adminData, setAdminData] = useState(false)

<<<<<<< HEAD
=======
    // ✅ ADDED
    const [teacherData, setTeacherData] = useState(false)

>>>>>>> fae32d8 (Initial commit - teacher dashboard)
    axios.defaults.withCredentials = true;

    const getAuthState = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/user/is-auth')
            if(data.success){
                setIsLoggedin(true)
                getUserData()
            }
        }catch(error){
            if(error.response?.status !== 401){
                toast.error(error.message)
            }
        }
    }

    const getAdminAuthState = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/admin/is-admin-auth')
            if(data.success){
                setIsLoggedin(true)
                getAdminData()
            }
        }catch(error){
<<<<<<< HEAD
            // Don't show toast for 401 errors - it's expected when not logged in
=======
            if(error.response?.status !== 401){
                toast.error(error.message)
            }
        }
    }

    // ✅ ADDED
    const getTeacherAuthState = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/teacher/is-teacher-auth')
            if(data.success){
                setIsLoggedin(true)
                getTeacherData()
            }
        }catch(error){
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
            if(error.response?.status !== 401){
                toast.error(error.message)
            }
        }
    }

    const getUserData = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/user-data/data')
            data.success ? setUserData(data.userData) : toast.error(data.message)
        }catch(error){
            toast.error(error.message)
        }
    }

    const getAdminData = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/admin-data/data')
            data.success ? setAdminData(data.adminData) : toast.error(data.message)
        }catch(error){
            console.error(error)
            toast.error(error.message)
        }
    }

<<<<<<< HEAD
=======
    // ✅ ADDED
    const getTeacherData = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/teacher-data/data')
            data.success ? setTeacherData(data.teacherData) : toast.error(data.message)
        }catch(error){
            toast.error(error.message)
        }
    }

>>>>>>> fae32d8 (Initial commit - teacher dashboard)
    useEffect(() => {
        getAuthState();
    }, [])

    useEffect(() => {
        getAdminAuthState();
    }, [])

<<<<<<< HEAD
=======
    // ✅ ADDED
    useEffect(() => {
        getTeacherAuthState();
    }, [])

>>>>>>> fae32d8 (Initial commit - teacher dashboard)
    const value = {
        backendUrl,
        isLoggedin,
        setIsLoggedin,
        userData,
        setUserData,
        getUserData,
        adminData,
        setAdminData,
<<<<<<< HEAD
        getAdminData 
=======
        getAdminData,

        // ✅ ADDED
        teacherData,
        setTeacherData,
        getTeacherData
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
    }

    return(
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}