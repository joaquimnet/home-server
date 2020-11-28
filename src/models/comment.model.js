const { Schema, model } = require('mongoose');

const schema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'post',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    meta: {
      likes: { type: Number, default: 0 },
    },
    deleted: { type: Boolean, default: false },
    responseTo: {
      type: Schema.Types.ObjectId,
      ref: 'comment',
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = model('comment', schema);
