const { Schema, model } = require('mongoose');
const { isEmail } = require('validator');

const schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Please enter an email'],
      unique: true,
      index: true,
      lowercase: true,
      validate: [isEmail, 'Please enter a valid email'],
    },
    username: {
      type: String,
      required: [true, 'Please enter a username'],
      minlength: [2, 'Username must be at least 2 characters long'],
      maxlength: [32, 'Username must be at most 32 characters long'],
    },
    password: {
      type: String,
      required: true,
    },
    roles: {
      type: [Schema.Types.ObjectId],
      ref: 'role',
    },
  },
  { timestamps: true },
);

schema.methods.safe = function safe() {
  const user = this.toObject({ versionKey: false });
  delete user.password;
  return user;
};

module.exports = model('user', schema);
