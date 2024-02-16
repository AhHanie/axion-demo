const loader = require("./_common/fileLoader");

module.exports = class PermissionsLoader {
  constructor({}) {}
  load() {
    return loader("./managers/**/*.permissions.js");
  }
};
