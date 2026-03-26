import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [isLoggedin, setIsLoggedin] = useState(false)
    const [userData, setUserData] = useState(false)
    const [adminData, setAdminData] = useState(false)

    // ✅ ADDED
    const [teacherData, setTeacherData] = useState(false)

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

    // ✅ ADDED
    const getTeacherData = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/teacher-data/data')
            data.success ? setTeacherData(data.teacherData) : toast.error(data.message)
        }catch(error){
            toast.error(error.message)
        }
    }

    useEffect(() => {
        getAuthState();
    }, [])

    useEffect(() => {
        getAdminAuthState();
    }, [])

    // ✅ ADDED
    useEffect(() => {
        getTeacherAuthState();
    }, [])

    const value = {
        backendUrl,
        isLoggedin,
        setIsLoggedin,
        userData,
        setUserData,
        getUserData,
        adminData,
        setAdminData,
        getAdminData,

        // ✅ ADDED
        teacherData,
        setTeacherData,
        getTeacherData
    }

    return(
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}