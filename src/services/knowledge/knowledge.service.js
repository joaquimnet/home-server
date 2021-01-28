const Bit = require('../../models/bit.model');
const { ERRORS } = require('../../config');

module.exports = {
  name: 'knowledge',
  routes: {
    'POST /knowledge/bit': 'postBit',
    'GET /knowledge/bit': 'listBits',
  },
  actions: {
    postBit: {
      params: {
        name: { type: 'string', min: 3, max: 255 },
        content: { type: 'string', min: 3, max: 255 },
        tags: { type: 'array', items: 'string', optional: true },
        $$strict: true,
      },
      async handler({ params, res }) {
        let bit;
        try {
          bit = new Bit(params);
        } catch (err) {
          return res.status(500).send(ERRORS.GENERIC);
        }
        return res.status(201).send(bit);
      },
    },
    listBits: {
      params: {
        $$strict: true,
      },
      async handler({ res }) {
        let bits;
        try {
          bits = await Bit.find({});
        } catch (err) {
          return res.status(500).send(ERRORS.GENERIC);
        }
        return res.status(201).send(bits);
      },
    },
  },
};
