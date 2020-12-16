const { Schema, model } = require('mongoose');

const schema = new Schema(
  {
    headers: {
      type: Object,
      required: true,
    },
    body: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = model('webhooklog', schema);
