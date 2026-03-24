import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

adminSchema.index({ name: 'text', email: 'text' })

const adminModel = mongoose.model("Admin", adminSchema);

export default adminModel;