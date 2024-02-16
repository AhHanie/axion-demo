const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SchoolSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    classrooms: [
      {
        type: Schema.Types.ObjectId,
        ref: "Classroom",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("School", SchoolSchema);
