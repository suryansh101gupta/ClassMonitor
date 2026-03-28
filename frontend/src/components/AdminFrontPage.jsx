import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import TimetableScheduler from './TimetableScheduler';
import './AdminFrontPage.css';
import { toast } from 'react-toastify';

const AdminFrontPage = () => {
  const {backendUrl, setIsLoggedin} =  useContext(AppContext);
  const navigate = useNavigate();
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Assignment modal state
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTeacher, setSearchTeacher] = useState('');
  const [searchSubject, setSearchSubject] = useState('');
  const [subjectName, setSubjectName] = useState('');
  
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [events, setEvents] = useState([
    { title: 'Lecture - DBMS', date: '2026-03-22' },
    { title: 'AI Lab', date: '2026-03-23' }
  ]);
  
  // Tab configuration
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'assignments', label: 'Assign Subjects', icon: '📚' },
    { id: 'timetable', label: 'Timetable', icon: '📅' },
    { id: 'calendar', label: 'Calendar', icon: '📆' },
    { id: 'subjects', label: 'Add Subjects', icon: '📖' }
  ];

  // Fetch teachers when assignment modal opens
  useEffect(() => {
    if (isAssignmentModalOpen) {
      fetchTeachers();
    }
  }, [isAssignmentModalOpen]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + '/teachers/get-all-teachers');
      if (response.data.success) {
        setTeachers(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch teachers');
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(backendUrl + '/subjects/get-all-subjects');
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch subjects');
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSubject = async () => {
    try{
      const response = await axios.post(backendUrl + '/subjects/create-sub', {name: subjectName});
      if (response.data.success) {
        toast.success("Subject Added");
        setSubjectName("");
      }else{
        toast.error("Failed")
      }
    }catch(error){
      setError('Failed to create subject');
      console.error('Error creating subject:', error);
      toast.error('Error creating subject');
    }
  }

  const handleTeacherClick = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedSubjects([]);
    fetchSubjects();
  };

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedTeacher || selectedSubjects.length === 0) {
      setError('Please select a teacher and at least one subject');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(backendUrl + '/admin/assign-sub-teacher', {
        teacherId: selectedTeacher._id,
        subjectIds: selectedSubjects
      });

      if (response.data.success) {
        toast.success('Subjects assigned successfully!');
        setIsAssignmentModalOpen(false);
        // Reset state
        setSelectedTeacher(null);
        setSelectedSubjects([]);
        setSubjects([]);
      } else {
        setError(response.data.message || 'Failed to assign subjects');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign subjects');
      console.error('Error assigning subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAssignmentModal = () => {
    setIsAssignmentModalOpen(false);
    setSelectedTeacher(null);
    setSelectedSubjects([]);
    setSubjects([]);
    setError('');
  };

  const handleLogout = async () => {
    try {
      const { data } = await axios.post(`${backendUrl}/admin/logout`);
      if (data.success) {
        setIsLoggedin(false);
        toast.success("Logged out successfully");
        navigate('/admin-login');
      } else {
        toast.error(data.message || "Logout failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error during logout");
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
    // Convert everything to a string and handle potential null values
    const name = String(teacher.name || "").toLowerCase();
    const email = String(teacher.email || "").toLowerCase();
    const query = searchTeacher.toLowerCase();

    return name.includes(query) || email.includes(query);
  });
  }, [teachers, searchTeacher]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => 
      subject.name.toLowerCase().includes(searchSubject.toLowerCase())
    );
  }, [subjects, searchSubject]);
  
  const handleDateClick = async (info) => {
    const title = prompt("Enter lecture title");

    if (title) {
      const newEvent = {
        title,
        start: info.dateStr
      };

      await axios.post("http://localhost:5000/api/events", newEvent);
      setEvents(prev => [...prev, newEvent]);
    }
  };
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Welcome to Admin Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-purple-500 border-opacity-20">
                <div className="text-2xl mb-2">👥</div>
                <h3 className="text-lg font-semibold text-white">Manage Teachers</h3>
                <p className="text-gray-400 text-sm mt-2">Assign subjects to teachers</p>
              </div>
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-purple-500 border-opacity-20">
                <div className="text-2xl mb-2">📚</div>
                <h3 className="text-lg font-semibold text-white">Manage Subjects</h3>
                <p className="text-gray-400 text-sm mt-2">View and organize subjects</p>
              </div>
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-purple-500 border-opacity-20">
                <div className="text-2xl mb-2">📅</div>
                <h3 className="text-lg font-semibold text-white">Timetable</h3>
                <p className="text-gray-400 text-sm mt-2">Create and manage schedules</p>
              </div>
            </div>
          </div>
        );
        
      case 'assignments':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Assign Subjects to Teachers</h2>
            <button
              onClick={() => setIsAssignmentModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-medium shadow-lg hover:shadow-purple-500 hover:shadow-lg"
            >
              Open Assignment Panel
            </button>
          </div>
        );
        
      case 'timetable':
        return <TimetableScheduler onClose={() => setActiveTab('dashboard')} />;
        
      case 'calendar':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Academic Calendar</h2>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                dateClick={handleDateClick}
                events={events}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
              />
            </div>
          </div>
        );
        
      case 'subjects':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Create Subject</h2>
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-500 border-opacity-20 ">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Enter subject name"
                  className="px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
                <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded" onClick={createSubject}> Create a new Subject </button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="admin-front-page">
      {/* Top Right Buttons */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => navigate('/admin-home')}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-200"
        >
          <i className="ri-arrow-left-line"></i>
          Back
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
        >
          <i className="ri-logout-box-line"></i>
          Logout
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-list">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : 'inactive'}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {renderTabContent()}
      </div>

      {/* Assignment Modal */}
      {isAssignmentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={handleCloseAssignmentModal}
            >
              ×
            </button>

            <h2 className="modal-title">Assign Subjects to Teacher</h2>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="modal-body">
              {/* Teachers List */}
              <div className="teachers-panel">
                <h3 className="panel-title">Select Teacher</h3>
                <div className="search-container border-white">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTeacher}
                    onChange={(e) => setSearchTeacher(e.target.value)}
                    className="w-full px-5 py-3 mb-5 bg-[#1A1B26] text-white rounded-xl border-2 border-purple-500 placeholder-gray-500 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                  />
                </div>
                {loading && !teachers.length ? (
                  <div className="loading-message">Loading teachers...</div>
                ) : filteredTeachers.length === 0 ? ( // 3. Use filteredTeachers here
                  <div className="empty-message">No teachers matching "{searchTeacher}"</div>
                ) : (
                  <div className="teacher-list">
                    {filteredTeachers.map(teacher => (
                      <div
                        key={teacher._id}
                        onClick={() => handleTeacherClick(teacher)}
                        className={`teacher-item ${
                          selectedTeacher?._id === teacher._id ? 'selected' : ''
                        }`}
                      >
                        <div className="teacher-name">{teacher.name}</div>
                        <div className="teacher-email">{teacher.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Subjects List */}
              <div className="subjects-panel">
                <h3 className="panel-title">Select Subjects</h3>
                <div className="search-container border-white">
                  <input
                    type="text"
                    placeholder="Search subjects..."
                    value={searchSubject}
                    onChange={(e) => setSearchSubject(e.target.value)}
                    className="w-full px-5 py-3 mb-5 bg-[#1A1B26] text-white rounded-xl border-2 border-purple-500 placeholder-gray-500 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
                  />
                </div>
                {selectedTeacher ? (
                  loading && !subjects.length ? (
                    <div className="loading-message">Loading subjects...</div>
                  ) : filteredSubjects.length === 0 ? (
                    <div className="empty-message">No subjects matching "{searchSubject}"</div>
                  ) : (
                    <div className="subject-list">
                      {filteredSubjects.map(subject => (
                        <div
                          key={subject._id}
                          className="subject-item"
                        >
                          <input
                            type="checkbox"
                            id={`subject-${subject._id}`}
                            checked={selectedSubjects.includes(subject._id)}
                            onChange={() => handleSubjectToggle(subject._id)}
                            className="subject-checkbox"
                          />
                          <label 
                            htmlFor={`subject-${subject._id}`}
                            className="subject-label"
                          >
                            {subject.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="empty-message">Please select a teacher first</div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="modal-footer">
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedTeacher || selectedSubjects.length === 0}
                className="submit-button"
              >
                {loading ? 'Assigning...' : `Assign ${selectedSubjects.length} Subject${selectedSubjects.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFrontPage
