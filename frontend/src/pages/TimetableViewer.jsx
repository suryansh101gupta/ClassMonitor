import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './TimetableViewer.css';

const TimetableViewer = ({ isEmbedded = false }) => {

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
      setError('Please fill in all fields');
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

  const content = (
    <div className={!isEmbedded ? "content-wrapper" : "w-full"}>
      <div className="form-container">
        <h2 className="page-title">Timetable Viewer</h2>
        
        <div className="content-card">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Select Class</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="minimal-input"
              >
                <option value="">Choose Class</option>
                {classes?.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="minimal-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="minimal-input"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            onClick={handleGetTimetable}
            className="minimal-btn"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'View Timetable'}
          </button>
        </div>

        {timetable.length > 0 && (
          <div className="content-card">
            <h3 className="card-title">Timetable Records</h3>
            <div className="table-container">
              <table className="timetable-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((t, i) => (
                    <tr key={i}>
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
          </div>
        )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="timetable-viewer-page">
      <div className="abstract-shape shape-circle"></div>
      <div className="abstract-shape shape-square"></div>
      <div className="abstract-shape shape-triangle"></div>

      <div className="top-bar">
        <div className="top-bar-left" onClick={() => navigate('/')}>
          <img src="/cm_logo.png" alt="ClassMonitor" className="h-10 w-auto" />
          <span className="brand-name">ClassMonitor</span>
        </div>
        <div className="top-bar-right">
          <button
            onClick={() => navigate(-1)}
            className="back-button"
          >
            <i className="ri-arrow-left-line"></i> Back
          </button>
        </div>
      </div>
      {content}
    </div>
  );
};

export default TimetableViewer;
