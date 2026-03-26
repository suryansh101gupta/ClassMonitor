import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        unique: true,
        select: false
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject"
    }]
  },
  { timestamps: true }
)

<<<<<<< HEAD
teacherSchema.index({ name: 'text' });

=======
>>>>>>> fae32d8 (Initial commit - teacher dashboard)
const teacherModel = mongoose.models.teacher || mongoose.model('teacher', teacherSchema);

export default teacherModel;