const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try{
        const token = req.headers.authorization.split(' ')[1];
        console.log('questo è il token: ', token);
        jwt.verify(token, 'password_segreta_per_la_cifratura');
        next();
    }
    catch (err){
        res.status(401).json({
            message: 'Authentication failed!'
        });
    }
};
