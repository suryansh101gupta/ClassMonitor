import React from 'react'
import { assets } from '../assets/assets'
import { useRef } from 'react';
import { useState } from 'react';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const UploadPhoto = () => {

  const navigate = useNavigate()

  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);

  const {backendUrl, getUserData} = useContext(AppContext)

  axios.defaults.withCredentials = true;

  // Called when "Select Photo" is clicked
  const handleSelectPhoto = (e) => {
    e.preventDefault();
    fileInputRef.current.click(); // programmatically open file picker
  };

  // Called when user selects a file
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Called when "Upload Photo" is clicked
  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!file) {
    //   alert("Please select a file first!");
      toast.error("Please select a file first!")
      return;
    }

    try {
      // 1. Ask backend for a signed URL
      const { data } = await axios.post(backendUrl + '/user/get-upload-url', {
        fileName: file.name,
        fileType: file.type,
      });

    //   console.log("Backend response:", data);

      const { uploadUrl, fileUrl } = data;

    //   console.log("uploadUrl:", uploadUrl);
    //   console.log("fileUrl:", fileUrl);

      // 2. Upload the file to S3 directly
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });

      // 3. Tell backend to save photo URL in DB
      await axios.post(backendUrl + '/user/update-photo', { photoUrl: fileUrl });

    //   alert("Photo uploaded successfully!");
      await getUserData();
      toast.success("Photo Uploaded Successfully")
      navigate('/', { replace: true })
    } catch (err) {
    //   console.error(err);
    //   alert("Upload failed!");
      toast.error(err.message)
    }
  };


  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-400'>
        <img onClick={() => { navigate ('/')}} src={assets.logo} alt="logo" 
        className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer'/>
        <form className='bg-slate-900 p-8 rounded-lg shadow-lg w-182 text-sm'>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>Photo Upload</h1>
          <p className='text-center mb-6 text-indigo-300'>Upload your photo. Your face should be clearly visible in the photo</p>

          <div className='flex flex-col gap-5 items-center'>
            <input
              type="file" accept="image/*"
              ref={fileInputRef} style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button onClick={handleSelectPhoto}
              className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-lg cursor-pointer hover:bg-green-700'>
              Select Photo
            </button>
            <button onClick={handleUploadPhoto}
              className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-lg cursor-pointer hover:bg-green-700'>
              Upload Photo
            </button>
            {file && (
              <div className='mt-5 flex flex-col items-center'>
                <p className='text-white mb-5'>Selected Photo: {file.name}</p>
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  width="150"
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
              </div>
            )}
          </div>
        </form>
      
    </div>
  )
}

export default UploadPhoto
