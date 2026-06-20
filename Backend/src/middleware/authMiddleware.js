import jwt from 'jsonwebtoken';

const auth = (req, res, next) =>{
    // Get token from header
    let token = req.header('x-auth-token');

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Adds user id to req.user
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
export default auth;    