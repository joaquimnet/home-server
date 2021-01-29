const express = require('express');
const log = require('consola');

const { ERRORS } = require('../../config');
const Bit = require('../../models/bit.model');
const auth = require('../../middleware/jwt');

module.exports = {
  name: 'bit',
  routes: {
    'POST /knowledge/bit': 'postBit',
    'GET /knowledge/bit': 'listBits',
    'DELETE /knowledge/bit/:id': 'deleteBit',
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
          if (params.search) {
            bits = await Bit.find(
              { author: req.user._id, $text: { $search: params.search } },
              { score: { $meta: 'textScore' } },
            )
              .sort({ score: { $meta: 'textScore' } })
              .exec();
          } else {
            bits = await Bit.find({ author: req.user._id }).exec();
          }
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }
        return res.status(201).send(bits);
      },
    },
    deleteBit: {
      middleware: [express.json(), auth({ required: true })],
      params: {
        id: 'string',
        $$strict: true,
      },
      async handler({ req, res, params }) {
        let bit;
        try {
          bit = await Bit.findById(params.id);
          if (!bit) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
        } catch (err) {
          if (err instanceof Error.CastError) {
            return res.status(404).send(ERRORS.NOT_FOUND);
          }
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        if (bit.author._id.toString() !== req.user._id.toString()) {
          return res.status(403).send(ERRORS.AUTH.UNAUTHORIZED);
        }

        try {
          await Bit.findByIdAndDelete(bit._id).exec();
        } catch (err) {
          log.error(err);
          return res.status(500).send(ERRORS.GENERIC);
        }

        res.status(204).end();
      },
    },
  },
};
