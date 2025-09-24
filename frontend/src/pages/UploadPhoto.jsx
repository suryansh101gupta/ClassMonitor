import React, { useRef, useState, useContext } from 'react';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Webcam from "react-webcam";

const UploadPhoto = () => {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const webcamRef = useRef(null); // ✅ keep this outside function
  const [file, setFile] = useState(null);
  const [photo, setPhoto] = useState(null); // ✅ state for captured webcam photo

  const { backendUrl, getUserData } = useContext(AppContext);

  axios.defaults.withCredentials = true;

  // ✅ Capture from webcam
  const capturePhoto = (e) => {
    e.preventDefault();
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setPhoto(imageSrc);
      setFile(null); // clear file if capturing new photo
    }
  };

  // ✅ Select file manually
  const handleSelectPhoto = (e) => {
    e.preventDefault();
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPhoto(null); // clear webcam photo if selecting file
  };

  // ✅ Upload to backend (works for both file & webcam photo)
  const handleUploadPhoto = async (e) => {
    e.preventDefault();

    try {
      let uploadFile = file;

      // If using webcam capture, convert base64 → Blob
      if (photo && !file) {
        const res = await fetch(photo);
        const blob = await res.blob();
        uploadFile = new File([blob], "captured_photo.jpg", { type: "image/jpeg" });
      }

      if (!uploadFile) {
        toast.error("Please capture or select a photo first!");
        return;
      }

      // 1. Get signed URL
      const { data } = await axios.post(backendUrl + '/user/get-upload-url', {
        fileName: uploadFile.name,
        fileType: uploadFile.type,
      });

      const { uploadUrl, fileUrl } = data;

      // 2. Upload file directly to S3
      await axios.put(uploadUrl, uploadFile, {
        headers: { "Content-Type": uploadFile.type },
      });

      // 3. Update backend with file URL
      await axios.post(backendUrl + '/user/update-photo', { photoUrl: fileUrl });

      await getUserData();
      toast.success("Photo Uploaded Successfully!");
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-400'>
      <img
        onClick={() => { navigate('/') }}
        src={assets.logo}
        alt="logo"
        className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer'
      />

      <form className='bg-slate-900 p-8 rounded-lg shadow-lg w-182 text-sm'>
        <h1 className='text-white text-2xl font-semibold text-center mb-4'>Photo Upload</h1>
        <p className='text-center mb-6 text-indigo-300'>
          Upload your photo. Your face should be clearly visible in the photo
        </p>

        <div className='flex flex-col gap-5 items-center'>
          {/* Webcam Capture */}
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
          />
          <button onClick={capturePhoto}
            className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-lg cursor-pointer'>
            Take Photo
          </button>

          {/* Show Webcam Photo Preview */}
          {photo && (
            <div className="mt-4">
              <h3 className="text-white">Preview (Webcam):</h3>
              <img src={photo} alt="Captured" width="150" style={{ borderRadius: "50%" }} />
            </div>
          )}

          {/* File Upload */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button onClick={handleSelectPhoto}
            className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-lg cursor-pointer'>
            Select Photo
          </button>

          {/* Show File Preview */}
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

          {/* Upload Button */}
          <button onClick={handleUploadPhoto}
            className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 text-white rounded-lg cursor-pointer'>
            Upload Photo
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadPhoto;
