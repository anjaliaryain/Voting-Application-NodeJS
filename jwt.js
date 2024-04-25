const jwt = require('jsonwebtoken');

const jwtAuthMiddleware = (req, res, next) => {

    const authorization = req.headers.authorization
    if(!authorization) return res.status(401).json({error: 'Token not found'});

    const token = req.headers.authorization.split(' ')[1].replace(/"/g, '');
    if(!token) return res.status(401).json({error: 'Unauthorized'});

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(err){
        console.error(err);
        res.status(401).json({error: 'Invalid token'});

    }
}
//function to generate token
    const generateToken = (userData) => {
        //generate a new JWT token using the user data
        return jwt.sign(userData, process.env.JWT_SECRET, {expiresIn: '7d'});
    }


    module.exports = {jwtAuthMiddleware, generateToken};