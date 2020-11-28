const { Schema, model } = require('mongoose');

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    permissions: {
      type: [
        {
          permission: {
            type: [Schema.Types.ObjectId],
            ref: 'permission',
          },
          scope: Object,
        },
      ],
    },
  },
  { timestamps: true },
);

module.exports = model('role', schema);
