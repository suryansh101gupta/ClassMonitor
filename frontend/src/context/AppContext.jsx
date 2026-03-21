import axios from "axios";
import { createContext, use, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [isLoggedin, setIsLoggedin] = useState(false)
    const [userData, setUserData] = useState(false)
    const [adminData, setAdminData] = useState(false)

    axios.defaults.withCredentials = true;

    const getAuthState = async () => {
        try{
            const {data} = await axios.get(backendUrl + '/user/is-auth')
            if(data.success){
                setIsLoggedin(true)
                getUserData()
            }
        }catch(error){
            toast.error(error.message)
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
            // Don't show toast for 401 errors - it's expected when not logged in
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

    useEffect(() => {
        getAuthState();
    }, [])

    useEffect(() => {
        getAdminAuthState();
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
        getAdminData 
    }

    return(
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}