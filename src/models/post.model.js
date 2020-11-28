const { Schema, model } = require('mongoose');

const schema = new Schema(
  {
    slug: {
      type: String,
      unique: true,
      index: true,
      required: true,
      maxlength: 255,
    },
    title: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 128,
    },
    content: {
      type: String,
      required: true,
      minlength: 3,
    },
    description: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 280,
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
    meta: {
      likes: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

module.exports = model('post', schema);
