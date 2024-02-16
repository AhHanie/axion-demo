module.exports = {
  createSchool: [
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
      length: { min: 0, max: 1000 },
    },
  ],
  updateSchool: [
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
      length: { min: 0, max: 1000 },
    },
  ],
  schoolIdParams: [
    {
      path: "id",
      length: 24,
      custom: "_id",
      required: true,
    },
  ],
};
