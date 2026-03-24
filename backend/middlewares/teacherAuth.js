import jwt from 'jsonwebtoken';

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

export default teacherAuth;