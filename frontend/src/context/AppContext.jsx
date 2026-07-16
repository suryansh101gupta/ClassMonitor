import axios from "axios";
import { createContext, use, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [isLoggedin, setIsLoggedin] = useState(false)
    const [userData, setUserData] = useState(false)
    const [adminData, setAdminData] = useState(false)
    const [teacherData, setTeacherData] = useState(false)

    axios.defaults.withCredentials = true;

    const getAuthState = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/user/is-auth', {withCredentials: true});
            if(data.success){
                setIsLoggedin(true)
                getUserData()
            }else{
                setIsLoggedin(false);
            }
        }catch(error){
            if(error.response?.status !== 401 && error.response?.status !== 403){
                toast.error(error.message)
            }
        }
    }

    const getAdminAuthState = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/admin/is-admin-auth', {withCredentials: true})
            if(data.success){
                setIsLoggedin(true)
                getAdminData()
            }
        }catch(error){
            if(error.response?.status !== 401 && error.response?.status !== 403){
                toast.error(error.message)
            }
        }
    }

    // ✅ ADDED
    const getTeacherAuthState = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/teachers/is-teacher-auth', {withCredentials: true})
            if(data.success){
                setIsLoggedin(true)
                getTeacherData()
            }
        }catch(error){
            // Don't show toast for 401 and 403 errors - it's expected when not logged in
            if(error.response?.status !== 401 && error.response?.status !== 403){
                toast.error(error.message)
            }
        }
    }

    const getUserData = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/user-data/data')
            data.success ? setUserData(data.userData) : console.log(data.message)
        }catch(error){
            if(error.response?.status !== 401 && error.response?.status !== 403){
                toast.error(error.message)
            }
        }
    }

    const getAdminData = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/admin-data/data')
            data.success ? setAdminData(data.adminData) : console.log(data.message)
        }catch(error){
            if(error.response?.status !== 401 && error.response?.status !== 403){
                console.error(error)
                toast.error(error.message)
            }
        }
    }
    const getTeacherData = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/teacher-data/data', {withCredentials: true})
            data.success ? setTeacherData(data.teacherData) : console.log(data.message)
        }catch(error){
            if(error.response?.status !== 401 && error.response?.status !== 403 && error.response?.status !== 404){
                toast.error(error.message)
            }
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
