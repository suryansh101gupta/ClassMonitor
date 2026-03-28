// Note: In ESM, you must include the .js extension for local imports
import { processWindowData } from "../services/attendance.service.js";
import "../globals.js";

export const receiveFrameData = async (req, res) => {
  console.log("[ATTENDANCE] /frame-result body:", req.body);
  console.log("[ATTENDANCE] activeLectureId:", global.activeLectureId);
  try {
    const { class_id, window_id, students, total_frames } = req.body;

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

    // Validate window payload
    if (window_id === undefined || !students || !Array.isArray(students) || total_frames === undefined) {
      console.error("[ATTENDANCE] Invalid window payload:", { window_id, students, total_frames });
      return res.status(400).json({ error: "Invalid window payload" });
    }

    // Send to service layer to handle window processing
    await processWindowData(lectureId, window_id, students, total_frames);

    res.status(200).json({ message: "Window processed" });

  } catch (err) {
    console.error("Error in receiveFrameData:", err);
    res.status(500).json({ error: "Server error" });
  }
};