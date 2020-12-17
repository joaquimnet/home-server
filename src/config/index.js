require('tinv')();
const mongoose = require('mongoose');
const log = require('consola');

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT;
const JWT_TOKEN_SECRET = process.env.JWT_TOKEN_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const SENDGRID_SIGN_KEY = process.env.SENDGRID_SIGN_KEY;

const ERRORS = {
  GENERIC: { message: 'Something went wrong, please try again later' },
  NOT_FOUND: { message: 'Resource not found' },
  AUTH: {
    NO_TOKEN: { message: 'Missing bearer token on authorization header' },
    INVALID_TOKEN: { message: 'Invalid token, please log in again' },
    UNAUTHORIZED: { message: "You're not authorized to perform that action" },
  },
  CUSTOM(message) {
    return { message };
  },
};

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    log.info('Db... ok');
  })
  .catch((err) => {
    log.error(err);
    log.fatal('Db... not ok :(');
    process.exit(1);
  });

module.exports = {
  MONGODB_URI,
  PORT,
  JWT_TOKEN_SECRET,
  JWT_REFRESH_SECRET,
  ERRORS,
  SENDGRID_SIGN_KEY,
};
