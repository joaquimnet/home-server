const log = require('consola');
const { Error: E } = require('mongoose');

const User = require('../../models/user.model');
const { ERRORS } = require('../../config');

module.exports = {
  name: 'user',
  routes: {
    'GET /users/:id': 'getUser',
  },
  actions: {
    getUser: {
      params: {
        id: 'string',
        $$strict: true,
      },
      async handler(req, res) {
        const params = { ...req.params, ...req.query, ...req.body };
        let user;
        try {
          user = await User.findById(params.id).exec();
        } catch (err) {
          if (err instanceof E.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (!user) {
          return res.status(404).send(ERRORS.NOT_FOUND);
        }

        res.send(user.safe());
      },
    },
  },
};
