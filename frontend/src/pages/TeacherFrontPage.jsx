import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import TimetableScheduler from "../components/TimetableScheduler";
import TeacherNavbar from '../components/TeacherNavbar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './TeacherFrontPage.css';

const TeacherFrontPage = () => {

  const navigate = useNavigate();
  const { backendUrl, setIsLoggedin, isLoggedin, teacherData, getTeacherData } = useContext(AppContext);

  useEffect(() => {
    if (!isLoggedin) {
      navigate('/teacher-login');
    } else {
      getTeacherData();
    }
  }, [isLoggedin, navigate]);

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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAttendance, setEditingAttendance] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'attendance', label: 'Attendance', icon: '📊' },
    { id: 'timetable', label: 'Timetable', icon: '📅' }
  ];

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
      const { data } = await axios.post(`${backendUrl}/teachers/logout`);
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

      const res = await axios.get(`${backendUrl}/teachers/get-attendance`, {
        params: formData
      });

      if (res.data.success) {
        setAttendanceData(res.data.data || []);
        console.log(res.data)
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

  // ---------------- UPDATE ATTENDANCE ----------------
  const handleUpdateAttendance = async (studentId, newStatus) => {
    try {
      const res = await axios.post(`${backendUrl}/teachers/update-attendance`, {
        studentId,
        status: newStatus,
        classId: formData.classId,
        subjectId: formData.subjectId,
        lectureDate: formData.lectureDate,
        startTime: formData.startTime,
        endTime: formData.endTime
      });

      if (res.data.success) {
        setAttendanceData(prev => 
          prev.map(student => 
            student._id === studentId 
              ? { ...student, status: newStatus }
              : student
          )
        );
        toast.success('Attendance updated successfully');
      } else {
        toast.error(res.data.message || 'Failed to update attendance');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update attendance');
    }
  };

  // ---------------- SEARCH FILTER ----------------
  const filteredAttendance = attendanceData.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.roll_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ---------------- ATTENDANCE STATS ----------------
  const attendanceStats = {
    total: attendanceData.length,
    present: attendanceData.filter(s => s.status === 1).length,
    absent: attendanceData.filter(s => s.status === 0).length,
    percentage: attendanceData.length > 0 
      ? Math.round((attendanceData.filter(s => s.status === 1).length / attendanceData.length) * 100)
      : 0
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="tab-content-wrapper">
            <div className="tab-content-header">
              <h2 className="tab-title">Welcome to Teacher Dashboard</h2>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>Attendance</h3>
                  <p>View and manage student attendance</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>Timetable</h3>
                  <p>Manage your class schedules</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'attendance':
        return (
          <div className="tab-content-wrapper">
            <div className="tab-content-header">
              <h2 className="tab-title">Attendance Management</h2>
            </div>
            
            {/* Attendance Form */}
            <div className="content-card">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Select Class</label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleChange}
                    className="minimal-input"
                  >
                    <option value="">Choose Class</option>
                    {classes?.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Subject</label>
                  <select
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleChange}
                    className="minimal-input"
                  >
                    <option value="">Choose Subject</option>
                    {subjects?.map(sub => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Lecture Date</label>
                  <input
                    type="date"
                    name="lectureDate"
                    value={formData.lectureDate}
                    onChange={handleChange}
                    className="minimal-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="minimal-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
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
                onClick={handleGetAttendance}
                className="minimal-btn primary-btn"
              >
                {loading ? 'Loading...' : 'Get Attendance'}
              </button>
            </div>

            {/* Attendance Statistics */}
            {attendanceData.length > 0 && (
              <div className="content-card">
                <h3 className="text-[#111111] mb-4 font-bold uppercase">Attendance Summary</h3>
                <div className="attendance-stats-grid">
                  <div className="stat-item present">
                    <div className="stat-value">{attendanceStats.present}</div>
                    <div className="stat-label">Present</div>
                  </div>
                  <div className="stat-item absent">
                    <div className="stat-value">{attendanceStats.absent}</div>
                    <div className="stat-label">Absent</div>
                  </div>
                  <div className="stat-item total">
                    <div className="stat-value">{attendanceStats.total}</div>
                    <div className="stat-label">Total</div>
                  </div>
                  <div className="stat-item percentage">
                    <div className="stat-value">{attendanceStats.percentage}%</div>
                    <div className="stat-label">Rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Bar */}
            {attendanceData.length > 0 && (
              <div className="content-card">
                <div className="search-bar">
                  <i className="ri-search-line search-icon"></i>
                  <input
                    type="text"
                    placeholder="Search by name or roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                <button
                  onClick={() => setEditingAttendance(!editingAttendance)}
                  className="minimal-btn secondary-btn"
                >
                  <i className="ri-edit-line"></i>
                  {editingAttendance ? 'Disable Editing' : 'Enable Editing'}
                </button>
              </div>
            )}

            {/* Attendance Table */}
            {attendanceData.length > 0 && (
              <div className="content-card">
                <h3 className="text-[#111111] mb-4 font-bold uppercase">Attendance Records</h3>
                <div className="table-container">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Roll No</th>
                        <th>Status</th>
                        {editingAttendance && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance.map((s, i) => (
                        <tr key={i}>
                          <td className="student-name">
                            <div className="student-avatar">
                              {s.name[0].toUpperCase()}
                            </div>
                            <span>{s.name}</span>
                          </td>
                          <td className="roll-no">{s.roll_no}</td>
                          <td>
                            <span className={`status-badge ${s.status === 1 ? 'present' : 'absent'}`}>
                              {s.status === 1 ? 'Present' : 'Absent'}
                            </span>
                          </td>
                          {editingAttendance && (
                            <td className="actions">
                              <button
                                onClick={() => handleUpdateAttendance(s._id, 1)}
                                className="action-btn present-btn"
                                title="Mark Present"
                              >
                                <i className="ri-check-line"></i>
                              </button>
                              <button
                                onClick={() => handleUpdateAttendance(s._id, 0)}
                                className="action-btn absent-btn"
                                title="Mark Absent"
                              >
                                <i className="ri-close-line"></i>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredAttendance.length === 0 && searchQuery && (
                  <div className="no-results">
                    <i className="ri-search-2-line"></i>
                    <p>No students found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      case 'timetable':
        return <TimetableScheduler onClose={() => setActiveTab('dashboard')} />;
      
      default:
        return null;
    }
  };

  return (
    <div className="teacher-front-page">
      {/* Abstract Background Shapes */}
      <div className="abstract-shape shape-circle"></div>
      <div className="abstract-shape shape-square"></div>
      <div className="abstract-shape shape-triangle"></div>

      {/* Top Bar - Unified from TeacherNavbar */}
      <div className="z-50 relative">
        <TeacherNavbar />
      </div>

      <div className="main-container">
        {/* Left Sidebar */}
        <div className="sidebar">
          <div className="sidebar-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                {activeTab === tab.id && <div className="tab-indicator"></div>}
              </button>
            ))}
          </div>
          <div className="sidebar-decoration"></div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          <div className="content-wrapper">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Abstract Decorative Shapes */}
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>
      <div className="shape shape-3"></div>
    </div>
  );
};

export default TeacherFrontPage;
