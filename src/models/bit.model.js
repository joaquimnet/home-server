const { Schema, model } = require('mongoose');

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255,
    },
    content: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

schema.index({ title: 'text', tags: 'text', content: 'text' });

schema.methods.safe = function safe() {
  return this.toObject({ versionKey: false });
};

module.exports = model('bit', schema);
