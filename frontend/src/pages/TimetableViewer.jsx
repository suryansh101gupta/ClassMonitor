import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const TimetableViewer = () => {

  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);

  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ---------------- FETCH CLASSES ----------------
  useEffect(() => {
    axios.defaults.withCredentials = true;
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${backendUrl}/classes/get-all-classes`);
      if (res.data.success) {
        setClasses(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch classes');
    }
  };

  // ---------------- GET TIMETABLE ----------------
  const handleGetTimetable = async () => {

    if (!classId || !startDate || !endDate) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await axios.get(`${backendUrl}/timetable/get-timetable`, {
        params: { classId, startDate, endDate }
      });

      if (res.data.success) {
        setTimetable(res.data.data || []);
      } else {
        setTimetable([]);
        setError('No timetable found');
      }

    } catch (err) {
      console.error(err);
      setError('Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-purple-400 flex justify-center items-center p-4">

      {/* 🔙 Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className='absolute top-5 left-5 px-4 py-2 rounded-full 
                   bg-[#333A5C] text-indigo-300 border border-indigo-500/30 
                   hover:bg-indigo-600 hover:text-white transition'
      >
        ← Back
      </button>

      <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-5xl text-indigo-300 shadow-xl">

        <h2 className="text-3xl text-white text-center mb-6">
          📅 Timetable Viewer
        </h2>

        {/* INPUT SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* CLASS */}
          <div>
            <label className="text-white text-sm mb-1 block">
              Select Class
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded"
            >
              <option value="">-- Choose Class --</option>
              {classes?.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* START DATE */}
          <div>
            <label className="text-white text-sm mb-1 block">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded"
            />
          </div>

          {/* END DATE */}
          <div>
            <label className="text-white text-sm mb-1 block">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded"
            />
          </div>

        </div>

        {/* BUTTON */}
        <button
            onClick={() => navigate('/teacher-login')}
        //   onClick={handleGetTimetable}
          className="w-full mt-6 bg-indigo-600 py-3 rounded-full text-white font-medium hover:bg-indigo-700 transition"
        >
          {loading ? 'Loading...' : 'View Timetable'}
        </button>

        {/* ERROR */}
        {error && (
          <div className="bg-red-500 text-white p-2 mt-4 rounded text-center">
            {error}
          </div>
        )}

        {/* TABLE */}
        {timetable.length > 0 && (
          <div className="mt-8 overflow-auto">

            <h3 className="text-white mb-3 text-lg">
              📘 Timetable Records
            </h3>

            <table className="w-full text-white text-center border border-gray-600">

              <thead>
                <tr className="bg-gray-800">
                  <th className="p-3">Date</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                </tr>
              </thead>

              <tbody>
                {timetable.map((t, i) => (
                  <tr key={i} className="border-t border-gray-700">
                    <td>{new Date(t.start_time).toLocaleDateString()}</td>
                    <td>{t.subject_name}</td>
                    <td>{t.teacher_name}</td>
                    <td>{new Date(t.start_time).toLocaleTimeString()}</td>
                    <td>{new Date(t.end_time).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
};

export default TimetableViewer;