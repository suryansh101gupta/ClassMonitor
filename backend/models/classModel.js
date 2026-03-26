import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});

const classModel = mongoose.models.Class || mongoose.model('Class', classSchema);

export default classModel;
