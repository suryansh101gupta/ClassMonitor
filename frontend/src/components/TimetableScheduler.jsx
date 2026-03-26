import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const TimetableScheduler = ({ onClose }) => {

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

    const [dayStartTime, setDayStartTime] = useState('08:00');
    const [dayEndTime, setDayEndTime] = useState('17:00');

    useEffect(() => {
        fetchClasses();
        fetchSubjects();
        fetchTeachers();
    }, []);

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
        }
    };

    const fetchTeachers = async () => {
        try {
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

        setShowSlotModal(true);
    };

    const handleEventClick = (info) => {
        if (window.confirm('Delete this lecture?')) {
            setTimetableEvents(prev => prev.filter(e => e.id !== info.event.id));
        }
    };

    // ---------------- ADD LECTURE ----------------
    const addLectureToSlot = () => {

        if (!selectedSubject || !selectedTeacher || !selectedSlot) {
            setError('Select subject & teacher');
            return;
        }

        const subject = subjects.find(s => s._id === selectedSubject);
        const teacher = teachers.find(t => t._id === selectedTeacher);

        if (!subject || !teacher) {
            setError('Invalid subject or teacher');
            return;
        }

        const newEvent = {
            id: Date.now().toString(),
            title: `${subject.name} - ${teacher.name}`,
            start: selectedSlot.start,
            end: selectedSlot.end,
            extendedProps: {
                subjectId: selectedSubject,
                teacherId: selectedTeacher,
                classId: selectedClass._id
            }
        };

        setTimetableEvents(prev => [...prev, newEvent]);

        // reset
        setShowSlotModal(false);
        setSelectedSubject('');
        setSelectedTeacher('');
        setError('');
    };

    // ---------------- COPY WEEK ----------------
    const copyWeekToAllWeeks = () => {

        if (!copyStartDate || !copyEndDate) {
            setError('Select dates');
            return;
        }

        if (timetableEvents.length === 0) {
            setError('No events to copy');
            return;
        }

        const start = new Date(copyStartDate);
        const end = new Date(copyEndDate);

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
            return;
        }

        try {
            setLoading(true);

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
        } finally {
            setLoading(false);
        }
    };

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

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default TimetableScheduler;