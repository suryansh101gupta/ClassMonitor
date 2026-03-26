import jwt from 'jsonwebtoken';

<<<<<<< HEAD
const teacherAuth = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.json({ success: false, message: "Not authorised. Login again" });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if (tokenDecode.role !== "teacher") {
            return res.status(403).json({ message: "Forbidden" });
        }

        if (!tokenDecode.id) {                                          // CHANGED: flipped to early return
            return res.json({ success: false, message: "Not authorised" });
        }

        req.userId = tokenDecode.id;
        return next();                                                  // CHANGED: moved next() here, only reached if id exists

    } catch (error) {
        return res.json({ success: false, message: `auth - ${error.message}` });
    }
};
=======
const teacherAuth = async(req,res, next) => {
    const {token} = req.cookies;

    if(!token){
        return res.json({success: false, message: "Not authorised. Login again"});
    }

    try{
        
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if(tokenDecode.id){
            req.userId = tokenDecode.id;
        }else{
            res.json({success: false, message: "Not authorised"});
        }

        next();

    }catch(error){
        res.json({success: false, message: `auth - ${error.message}`});
    }
}
>>>>>>> fae32d8 (Initial commit - teacher dashboard)

export default teacherAuth;