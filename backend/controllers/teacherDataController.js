import teacherModel from "../models/teacher_model.js";

export const getTeacherData = async(req, res) => {

    try{

        const userId = req.userId;
        const user = await teacherModel.findById(userId);

        if(!user){
            return res.json({success: false, message: "teacher not found"});
        }

        return res.json({success: true, teacherData: {name: user.name, isAccountVerified: user.isAccountVerified, photoUrl: user.photoUrl }});

    }catch(error){
        return res.json({success: false, message: error.message});
    }
}