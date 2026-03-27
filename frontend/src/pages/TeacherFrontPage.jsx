import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import TimetableScheduler from "../components/TimetableScheduler";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const TeacherFrontPage = () => {

  const navigate = useNavigate();
  const { backendUrl, setIsLoggedin } = useContext(AppContext);

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    lectureDate: '',
    startTime: '',
    endTime: ''
  });

  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTimetableScheduler, setShowTimetableScheduler] = useState(false);

  // ---------------- FETCH ----------------
  useEffect(() => {
    axios.defaults.withCredentials = true;
    fetchClasses();
    fetchSubjects();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${backendUrl}/classes/get-all-classes`);
      if (res.data.success) setClasses(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch classes');
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${backendUrl}/subjects/get-all-subjects`);
      if (res.data.success) setSubjects(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch subjects');
    }
  };

  // ---------------- LOGOUT ----------------
  const handleLogout = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/teacher/logout`);
      if (data.success) {
        setIsLoggedin(false);
        toast.success("Logged out successfully");
        navigate('/teacher-login');
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Logout failed");
    }
  };

  // ---------------- HANDLE INPUT ----------------
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ---------------- GET ATTENDANCE ----------------
  const handleGetAttendance = async () => {

    if (!formData.classId || !formData.subjectId || !formData.lectureDate || !formData.startTime || !formData.endTime) {
      setError('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await axios.get(`${backendUrl}/teacher/get-attendance`, {
        params: formData
      });

      if (res.data.success) {
        setAttendanceData(res.data.attendance || []);
      } else {
        setAttendanceData([]);
        setError('No attendance found');
      }

    } catch (err) {
      console.error(err);
      setError('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-200 to-purple-400 min-h-screen flex items-center justify-center p-4">

      {/* 🔥 TOP BUTTONS */}
      <div className='absolute top-5 right-5 flex gap-3'>

        {/* Back */}
        <button 
          onClick={() => navigate(-1)} 
          className='flex items-center gap-2 px-4 py-2 rounded-full 
                     bg-[#333A5C] text-indigo-300 border border-indigo-500/30 
                     hover:bg-indigo-600 hover:text-white transition'
        >
          <i className="ri-arrow-left-line"></i>
          Back
        </button>

        {/* Logout */}
        <button 
          onClick={handleLogout} 
          className='flex items-center gap-2 px-4 py-2 rounded-full 
                     bg-[#333A5C] text-red-400 border border-red-500/30 
                     hover:bg-red-600 hover:text-white transition'
        >
          <i className="ri-logout-box-r-line"></i>
          Logout
        </button>

      </div>

      <div className="bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-4xl text-indigo-300">

        <h2 className="text-3xl text-white font-bold text-center mb-6">
          Teacher Dashboard
        </h2>

        {/* FORM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="text-white text-sm">Select Class</label>
            <select
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              className="w-full p-3 rounded bg-gray-800 text-white"
            >
              <option value="">Choose Class</option>
              {classes?.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-white text-sm">Select Subject</label>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={handleChange}
              className="w-full p-3 rounded bg-gray-800 text-white"
            >
              <option value="">Choose Subject</option>
              {subjects?.map(sub => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-white text-sm">Lecture Date</label>
            <input
              type="date"
              name="lectureDate"
              value={formData.lectureDate}
              onChange={handleChange}
              className="w-full p-3 rounded bg-gray-800 text-white"
            />
          </div>

          <div>
            <label className="text-white text-sm">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full p-3 rounded bg-gray-800 text-white"
            />
          </div>

          <div>
            <label className="text-white text-sm">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full p-3 rounded bg-gray-800 text-white"
            />
          </div>

        </div>

        {error && (
          <div className="bg-red-500 text-white p-2 rounded mt-4">
            {error}
          </div>
        )}

        <div className="flex gap-4 mt-6">

          <button
            onClick={handleGetAttendance}
            className="flex-1 bg-green-600 py-3 rounded-full text-white hover:scale-105 transition"
          >
            {loading ? 'Loading...' : 'Get Attendance'}
          </button>

          <button
            onClick={() => setShowTimetableScheduler(true)}
            className="flex-1 border border-gray-500 py-3 rounded-full hover:bg-green-700 transition"
          >
            View Timetable
          </button>

        </div>

        {attendanceData.length > 0 && (
          <div className="mt-8 bg-gray-800 p-4 rounded-xl">
            <h3 className="text-white mb-3">Attendance Records</h3>

            <table className="w-full text-white text-center">
              <thead>
                <tr className="border-b border-gray-600">
                  <th>Name</th>
                  <th>Roll No</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {attendanceData.map((s, i) => (
                  <tr key={i} className="border-t border-gray-700">
                    <td>{s.name}</td>
                    <td>{s.rollNo}</td>
                    <td>
                      <span className={
                        s.status === 'Present'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>

      {showTimetableScheduler && (
        <TimetableScheduler onClose={() => setShowTimetableScheduler(false)} />
      )}

    </div>
  );
};

export default TeacherFrontPage;