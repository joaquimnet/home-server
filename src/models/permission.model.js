const { Schema, model } = require('mongoose');

const schema = new Schema(
  {
    module: {
      type: String,
      required: true,
    },
    capability: {
      type: String,
      required: true,
    },
    scope: {
      type: Object,
      required: false,
    },
  },
  { timestamps: true },
);

module.exports = model('permission', schema);
