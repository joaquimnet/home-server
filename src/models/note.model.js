const { Schema, model } = require('mongoose');

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255,
    },
    content: {
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
    connections: {
      projects: [
        {
          type: Schema.Types.ObjectId,
          ref: 'project',
        },
      ],
      notes: [
        {
          type: Schema.Types.ObjectId,
          ref: 'note',
        },
      ],
      todos: [
        {
          type: Schema.Types.ObjectId,
          ref: 'todo',
        },
      ],
    },
  },
  { timestamps: true },
);

schema.index({ title: 'text', content: 'text', tags: 'text' });

schema.methods.safe = function safe() {
  const note = this.toObject({ versionKey: false });
  return note;
};

module.exports = model('note', schema);
