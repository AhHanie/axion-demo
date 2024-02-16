module.exports = {
  createClassroom: [
    {
      path: "name",
      required: true,
      length: { min: 1, max: 20 },
      regex: "^[a-zA-Z ]+$",
    },
    {
      path: "students",
      type: "Array",
      required: true,
      items: {
        type: "String",
        length: 24,
        custom: "_id",
      },
    },
  ],
  updateClassroom: [
    {
      path: "name",
      required: true,
      length: { min: 1, max: 20 },
      regex: "^[a-zA-Z ]+$",
    },
    {
      path: "students",
      type: "Array",
      required: true,
      items: {
        type: "String",
        length: 24,
        custom: "_id",
      },
    },
  ],
  classroomIdParams: [
    {
      path: "id",
      length: 24,
      custom: "_id",
      required: true,
    },
  ],
};
