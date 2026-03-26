<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
=======
import React, { useState, useEffect, useContext } from 'react';
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const TimetableScheduler = ({ onClose }) => {
<<<<<<< HEAD
    const { backendUrl } = useContext(AppContext);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [timetableEvents, setTimetableEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [copyWeekModal, setCopyWeekModal] = useState(false);
    const [copyStartDate, setCopyStartDate] = useState('');
    const [copyEndDate, setCopyEndDate] = useState('');
=======

    const { backendUrl } = useContext(AppContext);

    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);

    const [selectedClass, setSelectedClass] = useState(null);
    const [timetableEvents, setTimetableEvents] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showSlotModal, setShowSlotModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');

    const [copyWeekModal, setCopyWeekModal] = useState(false);
    const [copyStartDate, setCopyStartDate] = useState('');
    const [copyEndDate, setCopyEndDate] = useState('');

>>>>>>> fae32d8 (Initial commit - teacher dashboard)
    const [dayStartTime, setDayStartTime] = useState('08:00');
    const [dayEndTime, setDayEndTime] = useState('17:00');

    useEffect(() => {
        fetchClasses();
        fetchSubjects();
        fetchTeachers();
    }, []);

<<<<<<< HEAD
    const fetchClasses = async () => {
        try {
            const response = await axios.get(backendUrl + '/classes/get-all-classes');
            if (response.data.success) {
                setClasses(response.data.data);
            }
        } catch (err) {
            setError('Failed to fetch classes');
            console.error('Error fetching classes:', err);
        }
    };
    

    const fetchSubjects = async () => {
        try {
            const response = await axios.get(backendUrl + '/subjects/get-all-subjects');
            if (response.data.success) {
                setSubjects(response.data.data);
            }
        } catch (err) {
            setError('Failed to fetch subjects');
            console.error('Error fetching subjects:', err);
=======
    // ---------------- FETCH ----------------
    const fetchClasses = async () => {
        try {
            const res = await axios.get(`${backendUrl}/classes/get-all-classes`);
            if (res.data.success) setClasses(res.data.data || []);
        } catch (err) {
            setError('Failed to fetch classes');
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await axios.get(`${backendUrl}/subjects/get-all-subjects`);
            if (res.data.success) setSubjects(res.data.data || []);
        } catch (err) {
            setError('Failed to fetch subjects');
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
        }
    };

    const fetchTeachers = async () => {
        try {
<<<<<<< HEAD
            const response = await axios.get(backendUrl + '/teachers/get-all-teachers');
            if (response.data.success) {
                setTeachers(response.data.data);
            }
        } catch (err) {
            setError('Failed to fetch teachers');
            console.error('Error fetching teachers:', err);
        }
    };

    const handleDateClick = (info) => {
        if (!selectedClass) {
            setError('Please select a class first');
            return;
        }

        const slotInfo = {
            start: info.date,
            end: new Date(info.date.getTime() + 60 * 60 * 1000), // 1 hour slot
            allDay: false
        };

        setSelectedSlot(slotInfo);
=======
            const res = await axios.get(`${backendUrl}/teachers/get-all-teachers`);
            if (res.data.success) setTeachers(res.data.data || []);
        } catch (err) {
            setError('Failed to fetch teachers');
        }
    };

    // ---------------- CALENDAR ----------------
    const handleDateClick = (info) => {
        if (!selectedClass) {
            setError('Select class first');
            return;
        }

        setSelectedSlot({
            start: info.date,
            end: new Date(info.date.getTime() + 60 * 60 * 1000)
        });

>>>>>>> fae32d8 (Initial commit - teacher dashboard)
        setShowSlotModal(true);
    };

    const handleEventClick = (info) => {
<<<<<<< HEAD
        const event = info.event;
        if (window.confirm('Do you want to remove this lecture?')) {
            setTimetableEvents(prev => prev.filter(e => e.id !== event.id));
        }
    };

    const addLectureToSlot = () => {
        if (!selectedSubject || !selectedTeacher) {
            setError('Please select both subject and teacher');
=======
        if (window.confirm('Delete this lecture?')) {
            setTimetableEvents(prev => prev.filter(e => e.id !== info.event.id));
        }
    };

    // ---------------- ADD LECTURE ----------------
    const addLectureToSlot = () => {

        if (!selectedSubject || !selectedTeacher || !selectedSlot) {
            setError('Select subject & teacher');
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
            return;
        }

        const subject = subjects.find(s => s._id === selectedSubject);
        const teacher = teachers.find(t => t._id === selectedTeacher);

<<<<<<< HEAD
=======
        if (!subject || !teacher) {
            setError('Invalid subject or teacher');
            return;
        }

>>>>>>> fae32d8 (Initial commit - teacher dashboard)
        const newEvent = {
            id: Date.now().toString(),
            title: `${subject.name} - ${teacher.name}`,
            start: selectedSlot.start,
            end: selectedSlot.end,
<<<<<<< HEAD
            // Store data both ways for compatibility
            extendedProps: {
                classId: selectedClass._id,
                subjectId: selectedSubject,
                teacherId: selectedTeacher,
                subjectName: subject.name,
                teacherName: teacher.name,
                className: selectedClass.name
            },
            // Also store directly for easier access
            subjectId: selectedSubject,
            teacherId: selectedTeacher,
            classId: selectedClass._id
        };

        setTimetableEvents(prev => [...prev, newEvent]);
=======
            extendedProps: {
                subjectId: selectedSubject,
                teacherId: selectedTeacher,
                classId: selectedClass._id
            }
        };

        setTimetableEvents(prev => [...prev, newEvent]);

        // reset
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
        setShowSlotModal(false);
        setSelectedSubject('');
        setSelectedTeacher('');
        setError('');
    };

<<<<<<< HEAD
    const copyWeekToAllWeeks = async () => {
        if (!copyStartDate || !copyEndDate) {
            setError('Please select start and end dates');
=======
    // ---------------- COPY WEEK ----------------
    const copyWeekToAllWeeks = () => {

        if (!copyStartDate || !copyEndDate) {
            setError('Select dates');
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
            return;
        }

        if (timetableEvents.length === 0) {
<<<<<<< HEAD
            setError('No timetable events to copy');
=======
            setError('No events to copy');
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
            return;
        }

        const start = new Date(copyStartDate);
        const end = new Date(copyEndDate);
<<<<<<< HEAD
        const allEvents = [];

        // Generate events for each week
        let currentWeek = new Date(start);
        while (currentWeek <= end) {
            timetableEvents.forEach(event => {
                // Check if event has valid start property
                if (!event || !event.start) {
                    console.warn('Invalid event found:', event);
                    return;
                }

                const eventDate = new Date(event.start);
                const dayOfWeek = eventDate.getDay();
                
                // Find the same day of week in current week
                const weekStart = new Date(currentWeek);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                
                const newEventDate = new Date(weekStart);
                newEventDate.setDate(newEventDate.getDate() + dayOfWeek);
                newEventDate.setHours(eventDate.getHours(), eventDate.getMinutes());
                
                const newEventEnd = new Date(newEventDate);
                newEventEnd.setHours(newEventDate.getHours() + 1);

                allEvents.push({
                    ...event,
                    id: `${event.id || Date.now()}-${(currentWeek && currentWeek.getTime) ? currentWeek.getTime() : Date.now()}`,
                    start: newEventDate,
                    end: newEventEnd
                });
            });
            
            // Move to next week
            currentWeek.setDate(currentWeek.getDate() + 7);
        }

        setTimetableEvents(allEvents);
        setCopyWeekModal(false);
        setCopyStartDate('');
        setCopyEndDate('');
        alert('Timetable copied to all weeks!');
    };

    const saveTimetable = async () => {
        if (!selectedClass || timetableEvents.length === 0) {
            setError('Please select a class and add some lectures');
=======

        let newEvents = [];

        let current = new Date(start);

        while (current <= end) {

            timetableEvents.forEach(event => {

                if (!event.start) return;

                const baseDate = new Date(event.start);
                const newDate = new Date(current);

                newDate.setDate(current.getDate() + (baseDate.getDay() - current.getDay()));
                newDate.setHours(baseDate.getHours(), baseDate.getMinutes());

                const newEnd = new Date(newDate);
                newEnd.setHours(newDate.getHours() + 1);

                newEvents.push({
                    ...event,
                    id: Date.now() + Math.random(),
                    start: newDate,
                    end: newEnd
                });
            });

            current.setDate(current.getDate() + 7);
        }

        setTimetableEvents(newEvents);
        setCopyWeekModal(false);
    };

    // ---------------- SAVE ----------------
    const saveTimetable = async () => {

        if (!selectedClass || timetableEvents.length === 0) {
            setError('Add data first');
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
            return;
        }

        try {
            setLoading(true);
<<<<<<< HEAD
            
            // Filter out invalid events and prepare lecture data for backend
            const validEvents = timetableEvents.filter(event => {
                console.log('Checking event:', event);
                return event && 
                       event.start && 
                       event.end && 
                       (event.extendedProps || (event.subjectId && event.teacherId));
            });

            if (validEvents.length === 0) {
                setError('No valid events to save');
                return;
            }

            const lectureData = validEvents.map(event => {
                // Handle both event structures (with and without extendedProps)
                const subjectId = event.extendedProps?.subjectId || event.subjectId;
                const teacherId = event.extendedProps?.teacherId || event.teacherId;
                
                return {
                    class_id: selectedClass._id,
                    subject_id: subjectId,
                    teacher_id: teacherId,
                    start_time: event.start.toISOString(),
                    end_time: event.end.toISOString()
                };
            });

            console.log('Sending lecture data:', lectureData);

            const response = await axios.post(backendUrl + '/timetable/save-timetable', {
                classId: selectedClass._id,
                events: lectureData
            });

            if (response.data.success) {
                alert('Timetable saved successfully!');
                console.log('Saved response:', response.data);
            } else {
                setError(response.data.message || 'Failed to save timetable');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save timetable');
            console.error('Error saving timetable:', err);
=======

            const events = timetableEvents.map(e => ({
                class_id: selectedClass._id,
                subject_id: e.extendedProps?.subjectId,
                teacher_id: e.extendedProps?.teacherId,
                start_time: e.start,
                end_time: e.end
            }));

            const res = await axios.post(`${backendUrl}/timetable/save-timetable`, {
                classId: selectedClass._id,
                events
            });

            if (res.data.success) {
                alert('Saved successfully');
            }

        } catch (err) {
            setError('Save failed');
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
        } finally {
            setLoading(false);
        }
    };

<<<<<<< HEAD
    const getCalendarConfig = () => {
        if (!selectedClass) {
            return {
                plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
                initialView: 'timeGridWeek',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                editable: false,
                selectable: false,
                events: []
            };
        }

        return {
            plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
            initialView: 'timeGridWeek',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            editable: true,
            selectable: true,
            selectMirror: true,
            dayMaxEvents: true,
            weekends: true,
            slotMinTime: dayStartTime || '08:00',
            slotMaxTime: dayEndTime || '17:00',
            slotDuration: '01:00:00',
            dateClick: handleDateClick,
            eventClick: handleEventClick,
            events: timetableEvents
        };
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white w-11/12 md:w-4/5 h-5/6 rounded-2xl p-8 relative flex flex-col overflow-hidden">
                <button
                    className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl"
                    onClick={onClose}
                >
                    ×
                </button>

                <h2 className="text-2xl font-bold mb-6">Timetable Scheduler</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Class
                        </label>
                        <select
                            value={selectedClass?._id || ''}
                            onChange={(e) => setSelectedClass(classes.find(c => c._id === e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">Select a class...</option>
                            {classes.map(cls => (
                                <option key={cls._id} value={cls._id}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Day Start Time
                            </label>
                            <input
                                type="time"
                                value={dayStartTime}
                                onChange={(e) => setDayStartTime(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Day End Time
                            </label>
                            <input
                                type="time"
                                value={dayEndTime}
                                onChange={(e) => setDayEndTime(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 items-end">
                        <button
                            onClick={() => setCopyWeekModal(true)}
                            disabled={!selectedClass || timetableEvents.length === 0}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Copy Week
                        </button>
                        <button
                            onClick={saveTimetable}
                            disabled={loading || !selectedClass || timetableEvents.length === 0}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save Timetable'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    <FullCalendar {...getCalendarConfig()} />
                </div>

                {/* Slot Modal */}
                {showSlotModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
                        <div className="bg-white p-6 rounded-lg w-96">
                            <h3 className="text-lg font-semibold mb-4">Add Lecture</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject
                                </label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Select subject...</option>
                                    {subjects.map(subject => (
                                        <option key={subject._id} value={subject._id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Teacher
                                </label>
                                <select
                                    value={selectedTeacher}
                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Select teacher...</option>
                                    {teachers.map(teacher => (
                                        <option key={teacher._id} value={teacher._id}>
                                            {teacher.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={addLectureToSlot}
                                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                                >
                                    Add Lecture
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSlotModal(false);
                                        setSelectedSubject('');
                                        setSelectedTeacher('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
=======
    // ---------------- CAL CONFIG ----------------
    const calendarConfig = {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        selectable: true,
        editable: true,
        events: timetableEvents,
        dateClick: handleDateClick,
        eventClick: handleEventClick,
        slotMinTime: dayStartTime,
        slotMaxTime: dayEndTime
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">

            <div className="bg-white w-11/12 md:w-4/5 h-[90%] rounded-xl p-6 relative flex flex-col">

                <button onClick={onClose} className="absolute right-4 top-2 text-xl">×</button>

                <h2 className="text-xl font-bold mb-4">Timetable Scheduler</h2>

                {error && <div className="bg-red-200 p-2 mb-2">{error}</div>}

                {/* Controls */}
                <div className="flex gap-4 mb-4">

                    <select
                        value={selectedClass?._id || ''}
                        onChange={(e) => setSelectedClass(classes.find(c => c._id === e.target.value))}
                        className="p-2 border"
                    >
                        <option value="">Select Class</option>
                        {classes.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>

                    <button onClick={saveTimetable} className="bg-green-500 text-white px-4">
                        {loading ? 'Saving...' : 'Save'}
                    </button>

                    <button onClick={() => setCopyWeekModal(true)} className="bg-blue-500 text-white px-4">
                        Copy Week
                    </button>

                </div>

                {/* Calendar */}
                <div className="flex-1">
                    <FullCalendar {...calendarConfig} />
                </div>

                {/* SLOT MODAL */}
                {showSlotModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">

                        <div className="bg-white p-4 w-80">

                            <h3>Add Lecture</h3>

                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="w-full p-2 mb-2 border"
                            >
                                <option value="">Subject</option>
                                {subjects.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>

                            <select
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                className="w-full p-2 mb-2 border"
                            >
                                <option value="">Teacher</option>
                                {teachers.map(t => (
                                    <option key={t._id} value={t._id}>{t.name}</option>
                                ))}
                            </select>

                            <button onClick={addLectureToSlot} className="bg-purple-500 text-white w-full">
                                Add
                            </button>

>>>>>>> fae32d8 (Initial commit - teacher dashboard)
                        </div>
                    </div>
                )}

<<<<<<< HEAD
                {/* Copy Week Modal */}
                {copyWeekModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
                        <div className="bg-white p-6 rounded-lg w-96">
                            <h3 className="text-lg font-semibold mb-4">Copy Week to All Weeks</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={copyStartDate}
                                    onChange={(e) => setCopyStartDate(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={copyEndDate}
                                    onChange={(e) => setCopyEndDate(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={copyWeekToAllWeeks}
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                    Copy to All Weeks
                                </button>
                                <button
                                    onClick={() => {
                                        setCopyWeekModal(false);
                                        setCopyStartDate('');
                                        setCopyEndDate('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
=======
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
            </div>
        </div>
    );
};

<<<<<<< HEAD
export default TimetableScheduler;
=======
export default TimetableScheduler;
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
