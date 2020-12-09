const express = require('express');
const rateLimiter = require('express-rate-limit');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const log = require('consola');
const { promisify } = require('util');

const { JWT_TOKEN_SECRET, JWT_REFRESH_SECRET, ERRORS } = require('../config');
const User = require('../models/user.model');
const Session = require('../models/session.model');
const auth = require('../middleware/jwt');

module.exports = {
  name: 'auth',
  routes: {
    'GET /auth/me': 'me',
    'POST /auth/login': 'postLogin',
    'POST /auth/register': 'postRegister',
    'POST /auth/token': 'refreshToken',
    'POST /auth/logout': 'logout',
  },
  actions: {
    me: {
      middleware: [express.json(), auth({ required: true })],
      handler({ req, res }) {
        res.send(req.user);
      },
    },
    async refreshToken({ req, res }) {
      const refreshToken = req.headers['authorization']?.slice(7);
      const verify = promisify(jwt.verify);
      try {
        const payload = await verify(refreshToken, JWT_REFRESH_SECRET);
        const session = await Session.findOne({ userId: payload.sub }).exec();

        if (!session || session.refreshToken !== refreshToken) {
          return res.status(403).send(ERRORS.AUTH.INVALID_TOKEN);
        }

        const token = await this.generateAccessToken(payload.sub);
        res.send({ token });
      } catch (err) {
        log.error(err);
        res.status(403).send(ERRORS.AUTH.INVALID_TOKEN);
      }
    },
    postLogin: {
      params: {
        email: 'email',
        password: 'string',
        $$strict: true,
      },
      middleware: [express.json()],
      async handler({ req, res, params }) {
        const { email, password } = params;

        const user = await User.findOne({ email }).exec();

        if (!user) {
          return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const samePassword = await bcrypt.compare(password, user.password);

        if (!samePassword) {
          return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // JWT
        const refreshToken = jwt.sign({ sub: user._id }, JWT_REFRESH_SECRET, { expiresIn: 604800 }); // 1 week
        const accessToken = await this.generateAccessToken(user._id);

        try {
          let session = await Session.findOne({ userId: user._id }).exec();
          if (session) {
            session.refreshToken = refreshToken;
            await session.save();
          } else {
            await Session.create({ userId: user._id, refreshToken });
          }
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        return res.json({ user: user.safe(), refreshToken, accessToken });
      },
    },
    async logout({ req, res }) {
      const refreshToken = req.headers['authorization']?.slice(7);
      const verify = promisify(jwt.verify);

      if (!refreshToken) {
        return res.status(401).send(ERRORS.AUTH.NO_TOKEN);
      }

      try {
        const payload = await verify(refreshToken, JWT_REFRESH_SECRET);
        await Session.deleteOne({ userId: payload.sub }).exec();
      } catch (err) {
        return res.status(403).send(ERRORS.AUTH.INVALID_TOKEN);
      }

      res.status(204).end();
    },
    postRegister: {
      middleware: [rateLimiter({ max: 10, windowMs: 60000 }), express.json()],
      params: {
        email: 'email',
        confirmEmail: 'email',
        password: {
          type: 'string',
          min: 6,
        },
        confirmPassword: {
          type: 'string',
          singleLine: true,
          trim: true,
          min: 6,
        },
        username: {
          type: 'string',
          singleLine: true,
          trim: true,
          min: 2,
          max: 32,
        },
        $$strict: true,
      },
      async handler({ req, res, params }) {
        return res.status(403).send({ message: 'Account creation is disabled for now' });

        const email = params.email.trim();
        const confirmEmail = params.confirmEmail.trim();
        const password = params.password.trim();
        const confirmPassword = params.confirmPassword.trim();
        const username = params.username.trim();

        if (email !== confirmEmail) {
          return res.status(400).json({ message: 'Emails do not match' });
        }

        if (password !== confirmPassword) {
          return res.status(400).json({ message: 'Passwords do not match' });
        }

        const emailCount = await User.countDocuments({
          email: validator.normalizeEmail(email),
        }).exec();

        if (emailCount > 0) {
          return res.status(400).json({ message: 'This email address is already in use' });
        }

        const hash = await this.hashPassword(password);

        const user = new User({
          email: validator.normalizeEmail(email),
          password: hash,
          username,
        });

        await user.save();

        return res.json(user);
      },
    },
  },
  methods: {
    async hashPassword(password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    },
    generateAccessToken(userId) {
      return new Promise((resolve, reject) => {
        jwt.sign({ sub: userId }, JWT_TOKEN_SECRET, { expiresIn: 1200 }, (err, token) => {
          if (err) reject(err);
          resolve(token);
        });
      });
    },
  },
};
