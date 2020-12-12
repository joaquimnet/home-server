const { Schema, model } = require('mongoose');

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255,
    },
    items: {
      type: [
        {
          content: {
            type: String,
            required: true,
            minLength: 3,
            maxLength: 255,
          },
          done: {
            type: Boolean,
            default: false,
          },
          createdAt: {
            type: Date,
            default: () => new Date(),
          },
        },
      ],
      required: true,
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

schema.index({ title: 'text', tags: 'text', 'items.content': 'text' });

schema.methods.safe = function safe() {
  const todo = this.toObject({ versionKey: false });
  return todo;
};

module.exports = model('todo', schema);
