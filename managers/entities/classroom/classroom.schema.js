const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ClassroomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    school: {
      type: Schema.Types.ObjectId,
      ref: "School",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Classroom", ClassroomSchema);
