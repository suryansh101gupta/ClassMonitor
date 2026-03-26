// Note: In ESM, you must include the .js extension for local imports
import { updateStudentCounts } from "../services/attendance.service.js";
import "../globals.js";

export const receiveFrameData = async (req, res) => {
  console.log("[ATTENDANCE] /frame-result body:", req.body);
  console.log("[ATTENDANCE] activeLectureId:", global.activeLectureId);
  try {
    const { class_id, recognized_students } = req.body;

    // Store the class_id globally for schedulers to use
    if (class_id) {
      global.activeClassId = class_id;
    }

    // Accessing the global variable set during lecture start
    const lectureId = global.activeLectureId;
    const classId = class_id;

    if (!lectureId) {
      // Return 200 to keep the Python script from retrying/erroring 
      // if it's just a "no lecture currently active" state.
      return res.status(200).json({ message: "No active lecture" });
    }

    // Standardize data: Remove duplicates from the frame results
    const uniqueStudents = [...new Set(recognized_students)];

    // Send to service layer to handle Redis/DB logic
    await updateStudentCounts(lectureId, uniqueStudents);

    res.status(200).json({ message: "Counts updated" });

  } catch (err) {
    console.error("Error in receiveFrameData:", err);
    res.status(500).json({ error: "Server error" });
  }
};