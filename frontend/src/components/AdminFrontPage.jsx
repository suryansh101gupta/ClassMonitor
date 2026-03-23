import React from 'react'
import { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import TimetableScheduler from './TimetableScheduler';

const AdminFrontPage = () => {

  const {backendUrl} =  useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimetableScheduler, setShowTimetableScheduler] = useState(false);

  // Fetch teachers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

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
        alert('Subjects assigned successfully!');
        setIsOpen(false);
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

  const handleClose = () => {
    setIsOpen(false);
    setSelectedTeacher(null);
    setSelectedSubjects([]);
    setSubjects([]);
    setError('');
  };

  return (
    <div className="bg-purple-500 w-screen h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-96 text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
            <p className="text-gray-700 mb-6">Admin Dashboard - Manage Teacher Assignments</p>
            <div className='flex flex-col'>
                <button onClick={() => setIsOpen(true)} className="bg-purple-500 text-white px-4 py-2 mb-4 rounded hover:bg-purple-600 transition">
                    Assign Subject to a Teacher
                </button>
                {isOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white w-11/12 md:w-2/3 h-4/5 rounded-2xl p-8 relative flex flex-col overflow-hidden">
                        <button
                            className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl"
                            onClick={handleClose}
                        >
                            ×
                        </button>

                        <h2 className="text-2xl font-bold mb-6">Assign Subjects to Teacher</h2>
                        
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-1 overflow-hidden">
                            {/* Teachers List */}
                            <div className="w-1/2 pr-4 border-r border-gray-200 overflow-y-auto">
                                <h3 className="text-lg font-semibold mb-4">Select Teacher</h3>
                                {loading && !teachers.length ? (
                                    <div className="text-center py-4">Loading teachers...</div>
                                ) : teachers.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500">No teachers found</div>
                                ) : (
                                    <div className="space-y-2">
                                        {teachers.map(teacher => (
                                            <div
                                                key={teacher._id}
                                                onClick={() => handleTeacherClick(teacher)}
                                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                                    selectedTeacher?._id === teacher._id
                                                        ? 'bg-purple-100 border-2 border-purple-500'
                                                        : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                                                }`}
                                            >
                                                <div className="font-medium">{teacher.name}</div>
                                                <div className="text-sm text-gray-500">{teacher.email}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Subjects List */}
                            <div className="w-1/2 pl-4 overflow-y-auto">
                                <h3 className="text-lg font-semibold mb-4">Select Subjects</h3>
                                {selectedTeacher ? (
                                    loading && !subjects.length ? (
                                        <div className="text-center py-4">Loading subjects...</div>
                                    ) : subjects.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">No subjects found</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {subjects.map(subject => (
                                                <div
                                                    key={subject._id}
                                                    className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        id={`subject-${subject._id}`}
                                                        checked={selectedSubjects.includes(subject._id)}
                                                        onChange={() => handleSubjectToggle(subject._id)}
                                                        className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                                    />
                                                    <label 
                                                        htmlFor={`subject-${subject._id}`}
                                                        className="flex-1 cursor-pointer font-medium"
                                                    >
                                                        {subject.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center py-4 text-gray-500">Please select a teacher first</div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !selectedTeacher || selectedSubjects.length === 0}
                                className="inline-block rounded-sm border border-purple-600 bg-purple-600 px-12 py-3 text-sm font-medium text-white hover:bg-transparent hover:text-purple-600 disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Assigning...' : `Assign ${selectedSubjects.length} Subject${selectedSubjects.length !== 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                    </div>
                )}
                <button onClick={() => setShowTimetableScheduler(true)} className="bg-purple-500 text-white px-4 py-2 mb-4 rounded hover:bg-purple-600 transition">
                    Timetable Scheduler
                </button>
                <button onClick={() => setShowCalendar(true)} className="bg-purple-500 text-white px-4 py-2 mb-4 rounded hover:bg-purple-600 transition">
                    View Calendar
                </button>
                {showCalendar && (
                  <div className="calendar-container">
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                      <div className="bg-white w-11/12 md:w-2/3 h-4/5 rounded-2xl p-8 relative flex flex-col overflow-hidden">
                        <button
                            className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl"
                            onClick={() => setShowCalendar(false)}
                        >
                            ×
                        </button>
                        <FullCalendar
                          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                          initialView="timeGridWeek"
                          dateClick={handleDateClick}
                          events={[
                            { title: 'Lecture - DBMS', date: '2026-03-22' },
                            { title: 'AI Lab', date: '2026-03-23' }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition">
                    View All Subjects
                </button>
            </div>
        </div>
        {/* Timetable Scheduler Modal */}
        {showTimetableScheduler && (
            <TimetableScheduler onClose={() => setShowTimetableScheduler(false)} />
        )}
    </div>
  )
}

export default AdminFrontPage
