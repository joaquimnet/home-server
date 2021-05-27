const { Schema, model } = require('mongoose');

const schema = new Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    mime: {
      type: String,
      required: true,
    },
    blob: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

schema.index({ filename: 'text', tags: 'text' });

schema.methods.safe = function safe() {
  return this.toObject({ versionKey: false });
};

module.exports = model('image', schema);
