const mongoose = require("mongoose");

module.exports = {
  username: (data) => {
    if (data.trim().length < 3) {
      return false;
    }
    return true;
  },
  _id: (data) => {
    // custom validators are broken
    return mongoose.isValidObjectId(data);
  },
};
