module.exports = {
  createStudent: [
    {
      path: "name",
      required: true,
      length: { min: 1, max: 20 },
      regex: "^[a-zA-Z ]+$",
    },
    {
      path: "classrooms",
      type: "Array",
      required: true,
      items: {
        type: "String",
        length: 24,
        custom: "_id",
      },
    },
  ],
  updateStudent: [
    {
      path: "name",
      required: true,
      length: { min: 1, max: 20 },
      regex: "^[a-zA-Z ]+$",
    },
    {
      path: "classrooms",
      type: "Array",
      required: true,
      items: {
        type: "String",
        length: 24,
        custom: "_id",
      },
    },
  ],
  studentIdParams: [
    {
      path: "id",
      length: 24,
      custom: "_id",
      required: true,
    },
  ],
};
