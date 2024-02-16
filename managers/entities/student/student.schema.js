const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Student = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    classrooms: [
      {
        type: Schema.Types.ObjectId,
        ref: "Classroom",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", Student);
