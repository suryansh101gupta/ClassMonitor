import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";

const StudentAttendanceCalendar = () => {
  const { backendUrl } = useContext(AppContext);

  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔹 FETCH SUBJECTS
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${backendUrl}/subjects/get-all-subjects`);
      if (res.data.success) {
        setSubjects(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch subjects");
    }
  };

  // 🔹 FETCH ATTENDANCE
  const fetchAttendance = async () => {
    if (!subjectId || !startDate || !endDate) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${backendUrl}/get-attendance-range`, {
        params: { subjectId, startDate, endDate },
      });

      const formatted = {};
      res.data.forEach((item) => {
        formatted[item.date] = item.status;
      });

      setAttendanceData(formatted);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 GENERATE DATES
  const generateDates = () => {
    if (!startDate || !endDate) return [];
    const dates = [];
    let current = new Date(startDate);
    const last = new Date(endDate);

    while (current <= last) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  // 🔹 STATUS COLORS
  const getStatusColor = (status) => {
    if (status === "Present") return "bg-green-600 text-white";
    if (status === "Absent") return "bg-red-600 text-white";
    if (status === "Leave") return "bg-yellow-500 text-black";
    return "bg-gray-700 text-gray-300";
  };

  return (
    <div className="bg-gradient-to-br from-blue-200 to-purple-400 min-h-screen flex items-center justify-center p-4">

      <div className="bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-5xl text-indigo-300">

        {/* TITLE */}
        <h2 className="text-3xl text-white font-bold text-center mb-6">
          Student Attendance Calendar
        </h2>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

          {/* SUBJECT DROPDOWN */}
          <div>
            <label className="text-white text-sm">Select Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 text-white mt-1 focus:outline-none"
            >
              <option value="">Choose Subject</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* START DATE */}
          <div>
            <label className="text-white text-sm">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 text-white mt-1 focus:outline-none"
            />
          </div>

          {/* END DATE */}
          <div>
            <label className="text-white text-sm">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 text-white mt-1 focus:outline-none"
            />
          </div>

          {/* BUTTON */}
          <div className="flex items-end">
            <button
              onClick={fetchAttendance}
              className="w-full bg-green-600 py-3 rounded-full text-white hover:scale-105 transition"
            >
              {loading ? "Loading..." : "Generate"}
            </button>
          </div>

        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-500 text-white p-2 rounded mb-4">
            {error}
          </div>
        )}

        {/* CALENDAR */}
        <div className="grid grid-cols-7 gap-3">

          {generateDates().map((dateObj, index) => {
            const dateStr = dateObj.toISOString().split("T")[0];
            const status = attendanceData[dateStr];

            return (
              <div
                key={index}
                className={`p-4 rounded-xl text-center shadow-md ${getStatusColor(status)}`}
              >
                <p className="font-bold text-lg">
                  {dateObj.getDate()}
                </p>
                <p className="text-sm mt-1">
                  {status || "No Data"}
                </p>
              </div>
            );
          })}

        </div>

        {/* LEGEND */}
        <div className="flex flex-wrap gap-6 mt-8 text-white justify-center">

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded-sm"></div>
            Present
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded-sm"></div>
            Absent
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-sm"></div>
            Leave
          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentAttendanceCalendar;