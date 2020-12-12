const { Schema, model } = require('mongoose');

const schema = new Schema(
  {
    // this is a stretch goal
    title: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255,
    },
    description: {
      type: String,
      required: true,
      minlength: 3,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

schema.index({ title: 'text', description: 'text', tags: 'text' });

schema.methods.safe = function safe() {
  const epic = this.toObject({ versionKey: false });
  return epic;
};

module.exports = model('epic', schema);
