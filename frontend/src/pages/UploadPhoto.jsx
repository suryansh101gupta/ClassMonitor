import React, { useRef, useState, useContext } from 'react';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Webcam from "react-webcam";
import './UploadPhoto.css';

const UploadPhoto = () => {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const webcamRef = useRef(null); // keep this outside function
  const [file, setFile] = useState(null);
  const [photo, setPhoto] = useState(null); // state for captured webcam photo

  const { backendUrl, getUserData } = useContext(AppContext);

  axios.defaults.withCredentials = true;

  // Capture from webcam
  const capturePhoto = (e) => {
    e.preventDefault();
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setPhoto(imageSrc);
      setFile(null); // clear file if capturing new photo
    }
  };

  // Select file manually
  const handleSelectPhoto = (e) => {
    e.preventDefault();
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPhoto(null); // clear webcam photo if selecting file
  };

  // Upload to backend (works for both file & webcam photo)
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
      console.log("all good")

      // // 1. Get signed URL
      // const { data } = await axios.post(backendUrl + '/user/get-upload-url', {
      //   fileName: uploadFile.name,
      //   fileType: uploadFile.type,
      // });

      // const { uploadUrl, fileUrl } = data;

      // // 2. Upload file directly to S3
      // await axios.put(uploadUrl, uploadFile, {
      //   headers: { "Content-Type": uploadFile.type },
      // });

      // // 3. Update backend with file URL
      // // await axios.post(backendUrl + '/user/update-photo', { photoUrl: fileUrl });
      // const s3Key = fileUrl.split(`.amazonaws.com/`)[1]; // extract key from URL
      // await axios.post(backendUrl + '/user/update-photo', { s3Key });

      // 1. Get signed URL from backend
      const res1 = await axios.post(backendUrl + '/user/get-upload-url', {
        fileName: uploadFile.name,
        fileType: uploadFile.type,
        fileSize: uploadFile.size,
      });

      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
      
      if (uploadFile.size > MAX_FILE_SIZE) {
        toast.error("File too large. Max 5MB.");
        return;
      }
      
      if (!ALLOWED_TYPES.includes(uploadFile.type)) {
        toast.error("Invalid file type. Only JPEG, PNG, WebP allowed.");
        return;
      }

      const uploadUrl = res1?.data?.uploadUrl;
      const fileUrl = res1?.data?.fileUrl;
      const s3KeyFromBackend = res1?.data?.s3Key;

      if (!uploadUrl || !fileUrl) {
        toast.error("Failed to get S3 upload URL. Try again.");
        return;
      }

      // 2. Upload file directly to S3
      await axios.put(uploadUrl, uploadFile, {
        headers: { "Content-Type": uploadFile.type },
      });

      // 3. Use backend-provided s3Key or fallback to parsing from URL
      const s3Key = s3KeyFromBackend || fileUrl?.split(".amazonaws.com/")[1];
      if (!s3Key) {
        toast.error("Invalid file URL from S3");
        return;
      }

      // 4. Update backend with s3Key and photoUrl (triggers change stream in face-service)
      await axios.post(backendUrl + '/user/update-photo', { s3Key, photoUrl: fileUrl });

      await getUserData();
      toast.success("Photo Uploaded Successfully!");
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="upload-photo-page">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <div className="logo-shape"></div>
          <span className="brand-name">ClassMonitor</span>
        </div>
        <div className="top-bar-right">
          <button
            onClick={() => navigate('/')}
            className="icon-button"
            title="Home"
          >
            <i className="ri-home-line"></i>
          </button>
        </div>
      </div>

      <div className="content-wrapper">
        <div className="form-container">
          <h2 className="upload-title">Photo Upload</h2>
          <p className="upload-subtitle">
            Upload your photo. Your face should be clearly visible in the photo.
          </p>

          <div className="upload-card">
            {/* Webcam Section */}
            <div className="webcam-section">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={320}
                height={240}
                className="webcam-feed"
              />
              <button 
                onClick={capturePhoto}
                className="action-button primary"
              >
                Take Photo
              </button>

              {photo && (
                <div className="preview-section">
                  <h3 className="preview-title">Preview (Webcam):</h3>
                  <img 
                    src={photo} 
                    alt="Captured" 
                    className="preview-image" 
                  />
                </div>
              )}
            </div>

            <div className="divider">
              <span>OR</span>
            </div>

            {/* File Upload Section */}
            <div className="file-section">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <button 
                onClick={handleSelectPhoto}
                className="action-button secondary"
              >
                Select Photo
              </button>

              {file && (
                <div className="preview-section">
                  <p className="preview-title">Selected Photo: {file.name}</p>
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="preview-image"
                  />
                </div>
              )}
            </div>

            {/* Upload Button */}
            <button 
              onClick={handleUploadPhoto}
              className="upload-button"
            >
              Upload Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPhoto;
