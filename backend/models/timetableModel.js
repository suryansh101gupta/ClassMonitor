import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
    lecture_id: {
        type: String,
        required: true,
        unique: true
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    lecture_date: {
        type: Date,
        required: true
    },
    start_time: {
        type: String,
        required: true
    },
    end_time: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    processed: {
        type: Number,
        default: 0
    }
}, {
    timestamps: false
});

const lectureModel = mongoose.models.Lecture || mongoose.model('Lecture', lectureSchema);

export default lectureModel;
