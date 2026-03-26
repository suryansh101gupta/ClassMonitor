import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    }
  },
  { timestamps: true }
);

<<<<<<< HEAD
subjectSchema.index({ name: "text" })

=======
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
const subjectModel = mongoose.models.subject || mongoose.model("Subject", subjectSchema);

export default subjectModel;