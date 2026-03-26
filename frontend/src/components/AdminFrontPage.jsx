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
        setSelectedTeacher(null);
        setSelectedSubjects([]);
        setSubjects([]);
      } else {
        setError(response.data.message || 'Failed to assign subjects');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign subjects');
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
    <div className="bg-gradient-to-br from-blue-200 to-purple-400 w-screen h-screen flex items-center justify-center">

        <div className="bg-slate-900 p-8 rounded-2xl shadow-xl w-96 text-center text-indigo-300">
            <h2 className="text-2xl text-white font-bold mb-4">Welcome!</h2>
            <p className="mb-6">Admin Dashboard - Manage Teacher Assignments</p>

            <div className='flex flex-col gap-4'>
                <button onClick={() => setIsOpen(true)} className="bg-gradient-to-r from-indigo-500 to-indigo-900 text-white px-4 py-2 rounded-full hover:scale-105 transition">
                    Assign Subject to a Teacher
                </button>

                {isOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-slate-900 w-11/12 md:w-2/3 h-4/5 rounded-2xl p-8 relative flex flex-col overflow-hidden text-indigo-300">

                        <button
                            className="absolute top-4 right-4 text-white text-2xl"
                            onClick={handleClose}
                        >
                            ×
                        </button>

                        <h2 className="text-2xl text-white font-bold mb-6">Assign Subjects to Teacher</h2>
                        
                        {error && (
                            <div className="bg-red-500 text-white px-4 py-2 rounded mb-4">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-1 overflow-hidden">
                            
                            {/* Teachers */}
                            <div className="w-1/2 pr-4 border-r border-gray-600 overflow-y-auto">
                                <h3 className="text-lg text-white font-semibold mb-4">Select Teacher</h3>

                                <div className="space-y-2">
                                    {teachers.map(teacher => (
                                        <div
                                            key={teacher._id}
                                            onClick={() => handleTeacherClick(teacher)}
                                            className={`p-3 rounded-lg cursor-pointer ${
                                                selectedTeacher?._id === teacher._id
                                                    ? 'bg-indigo-700'
                                                    : 'bg-[#333A5C] hover:bg-gray-700'
                                            }`}
                                        >
                                            <div>{teacher.name}</div>
                                            <div className="text-sm text-gray-400">{teacher.email}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Subjects */}
                            <div className="w-1/2 pl-4 overflow-y-auto">
                                <h3 className="text-lg text-white font-semibold mb-4">Select Subjects</h3>

                                <div className="space-y-2">
                                    {subjects.map(subject => (
                                        <div key={subject._id} className="flex items-center p-3 rounded-lg bg-[#333A5C]">
                                            <input
                                                type="checkbox"
                                                checked={selectedSubjects.includes(subject._id)}
                                                onChange={() => handleSubjectToggle(subject._id)}
                                                className="mr-3"
                                            />
                                            <span>{subject.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                className="rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 px-6 py-2 text-white"
                            >
                                Assign Subjects
                            </button>
                        </div>
                    </div>
                    </div>
                )}

                <button onClick={() => setShowTimetableScheduler(true)} className="border border-gray-500 py-2 rounded-full hover:bg-green-700 transition">
                    Timetable Scheduler
                </button>

                <button onClick={() => setShowCalendar(true)} className="border border-gray-500 py-2 rounded-full hover:bg-green-700 transition">
                    View Calendar
                </button>

                {showCalendar && (
                  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white w-11/12 md:w-2/3 h-4/5 rounded-2xl p-8 relative">
                        <button
                            className="absolute top-4 right-4 text-black text-2xl"
                            onClick={() => setShowCalendar(false)}
                        >
                            ×
                        </button>

                        <FullCalendar
                          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                          initialView="timeGridWeek"
                          dateClick={handleDateClick}
                        />
                    </div>
                  </div>
                )}

                <button className="border border-gray-500 py-2 rounded-full hover:bg-green-700 transition">
                    View All Subjects
                </button>
            </div>
        </div>

        {showTimetableScheduler && (
            <TimetableScheduler onClose={() => setShowTimetableScheduler(false)} />
        )}
    </div>
  )
}

export default AdminFrontPage;