const log = require('consola');
const jwt = require('jsonwebtoken');

const { JWT_TOKEN_SECRET, ERRORS } = require('../config');
const User = require('../models/user.model');
const Session = require('../models/session.model');

module.exports = (opts) => async (req, res, next) => {
  const token = req.headers['authorization']?.slice(7);
  if (!token) {
    return res.status(401).send(ERRORS.AUTH.NO_TOKEN);
  }
  try {
    const payload = jwt.verify(token, JWT_TOKEN_SECRET);

    if ((await Session.countDocuments({ userId: payload.sub }).exec()) < 1) {
      return res.status(403).send(ERRORS.AUTH.INVALID_TOKEN);
    }

    const user = await User.findById(payload.sub);
    req.user = user.safe();
  } catch (err) {
    if (!err.message.startsWith('jwt')) {
      log.error(err);
    }
  }
  if (opts.required && !req.user) {
    return res.status(403).send(ERRORS.AUTH.INVALID_TOKEN);
  }
  next();
};
