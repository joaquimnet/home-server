const express = require('express');
const log = require('consola');

const { ERRORS } = require('../../config');
const Bit = require('../../models/bit.model');
const auth = require('../../middleware/jwt');

module.exports = {
  name: 'knowledge',
  routes: {
    'POST /knowledge/bit': 'postBit',
    'GET /knowledge/bit': 'listBits',
  },
  actions: {
    postBit: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        name: { type: 'string', min: 3, max: 255 },
        content: { type: 'string', min: 3, max: 255 },
        tags: { type: 'array', items: 'string', optional: true },
        $$strict: true,
      },
      async handler({ req, params, res }) {
        let bit;
        try {
          bit = new Bit({ ...params, author: req.user._id });
          bit.save();
        } catch (err) {
          return res.status(500).send(ERRORS.GENERIC);
        }
        return res.status(201).send(bit);
      },
    },
    listBits: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        search: { type: 'string', optional: true },
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let bits;
        try {
          bits = await Bit.find(
            {
              author: req.user._id,
              $text: { $search: params.search },
            },
            { score: { $meta: 'textScore' } },
          );
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }
        return res.status(201).send(bits);
      },
    },
  },
};
