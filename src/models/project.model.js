const { Schema, model } = require('mongoose');

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 255,
    },
    // no -> get healthy
    // almost -> lose weight
    // yes -> lose 10 pounds
    specific: {
      type: String,
      required: true,
      minlength: 3,
    },
    // the measure you'll use to know you've successfully achieved your goal
    measurable: {
      type: String,
      required: true,
      minlength: 3,
    },
    // how will the goal be achieved? do you have what you need to do it? if not, what are you lacking?
    achievable: {
      type: String,
      required: true,
      minlength: 3,
    },
    // TODO: research more about realistic/relevant
    // is this goal relevant to your career/life?
    realistic: {
      type: String,
      required: true,
      minlength: 3,
    },
    // in how much time will you achieve it? do you have a deadline?
    time: {
      type: String,
      required: true,
      minlength: 3,
    },
    tags: {
      type: [String],
      default: [],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
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
      epics: [
        {
          type: Schema.Types.ObjectId,
          ref: 'epic',
        },
      ],
    },
  },
  { timestamps: true },
);

schema.index({
  title: 'text',
  specific: 'text',
  measurable: 'text',
  achievable: 'text',
  realistic: 'text',
  time: 'text',
  tags: 'text',
});

schema.methods.safe = function safe() {
  const project = this.toObject({ versionKey: false });
  return project;
};

module.exports = model('project', schema);
