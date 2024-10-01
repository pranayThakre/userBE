const HttpError = require('../models/http-error');
const jwt = require('jsonwebtoken');

const authMiddleWare = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization : 'Bearer TOKEN';
    if (!token) {
      throw new Error('Authentication Failed!');
    }

    const decodedToken = jwt.verify(token, process.env.PRIVATE_KEY);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    return next(new HttpError('Authentication Failed!', 403));
  }
};

module.exports = authMiddleWare;
