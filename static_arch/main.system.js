const layers = {
  student: {
    _default: { anyoneCan: "none" },
    _SchoolAdmin: { anyoneCan: "create" },
    classroom: {
      _default: { anyoneCan: "none" },
      _SchoolAdmin: { anyoneCan: "create" },
    },
  },
  classroom: {
    _default: { anyoneCan: "none" },
    _SchoolAdmin: { anyoneCan: "create" },
    student: {
      _default: { anyoneCan: "none" },
      _SchoolAdmin: { anyoneCan: "create" },
    },
  },
  school: {
    _default: { anyoneCan: "none" },
    _SuperAdmin: { anyoneCan: "create" },
    classroom: {
      _default: { anyoneCan: "none" },
      _SuperAdmin: { anyoneCan: "create" },
    },
  },
};

const actions = {
  blocked: -1,
  none: 1,
  read: 2,
  create: 3,
  audit: 4,
  config: 5,
};

module.exports = {
  layers,
  actions,
};
