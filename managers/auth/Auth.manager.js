const bcrypt = require("bcrypt");
const { nanoid } = require("nanoid");
const md5 = require("md5");

module.exports = class AuthManager {
  constructor({ mongoModels, validators, managers }) {
    console.log("*** AUTH MANAGER ***");
    this.User = mongoModels.user;
    this.validators = validators;
    this.httpExposed = [
      "v1_createUser",
      "v1_login",
      "get=v1_getUsers",
      "delete=v1_deleteUser",
      "v1_createShortToken",
    ];
    this.tokenManager = managers.token;
    this.cortexExposed = ["verifyShortTokenEvent", "findUserByIdEvent"];
  }

  /**
   * @api {post} /api/auth/v1_createUser Create User
   * @apiName CreateUser
   * @apiGroup Auth
   *
   * @apiBody {String} username Can only contain lowercase letters and underscores. Length between 3 and 20 characters.
   * @apiBody {String} password Must contain at least one uppercase letter, one lowercase letter, one digit and one special character. Allowed special characters: [@$!%*#?&]. Length between 8 and 20 characters.
   * @apiBody {String} role One of "SuperAdmin", "SchoolAdmin"
   *
   * @apiDescription
   * Create a new user document in the database. Returns master long token used for generating short tokens for authentication.
   * Public API.
   *
   *
   * @apiExample {js} Example body:
   * {
   *  "username": "username",
   *  "password": "p@ssW0rD",
   *  "role": "SuperAdmin"
   * }
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "ok": true,
   *    "data": {
   *      "username": "username",
   *      "role": "SuperAdmin",
   *      "_id": "65cf8134b002aaa0ac5fc3fa",
   *      "createdAt": "2024-02-16T15:37:24.310Z",
   *      "updatedAt": "2024-02-16T14:16:51.139Z",
   *      "__v": 0,
   *      "longToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWNmODEzNGIwMDJhYWEwYWM1ZmMzZmEiLCJpYXQiOjE3MDgwOTc4NDQsImV4cCI6MTgwMjc3MDY0NH0.H9HaNW9iiZsEKKNcd03D0qb2XJhxN3fe4KlhBiGLfzc"
   *    },
   *       "errors": [],
   *       "message": ""
   *  }
   */
  async v1_createUser({ username, password, role }) {
    const user = { username, password, role };

    const result = await this.validators.user.createUser(user);
    if (result) {
      return result;
    }

    const sameUsernameCount = await this.User.countDocuments({ username });
    if (sameUsernameCount > 0) {
      return { error: "Username already exists" };
    }

    const createdUser = new this.User(user);
    await createdUser.save();

    const longToken = this.tokenManager.genLongToken({
      userId: createdUser._id,
    });

    return { ...createdUser.toJSON(), longToken };
  }

  /**
   * @api {post} /api/auth/v1_login Login
   * @apiName Login
   * @apiGroup Auth
   *
   * @apiBody {String} username Can only contain lowercase letters and underscores. Length between 3 and 20 characters.
   * @apiBody {String} password Must contain at least one uppercase letter, one lowercase letter, one digit and one special character. Allowed special characters: [@$!%*#?&]. Length between 8 and 20 characters.
   *
   * @apiDescription
   * Login with an existing user. Returns master long token used for generating short tokens for authentication.
   * Public API.
   *
   *
   * @apiExample {js} Example body:
   * {
   *  "username": "username",
   *  "password": "p@ssW0rD",
   * }
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "ok": true,
   *    "data": {
   *      "username": "username",
   *      "role": "SuperAdmin",
   *      "_id": "65cf8134b002aaa0ac5fc3fa",
   *      "createdAt": "2024-02-16T15:37:24.310Z",
   *      "updatedAt": "2024-02-16T14:16:51.139Z",
   *      "__v": 0,
   *      "longToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWNmODEzNGIwMDJhYWEwYWM1ZmMzZmEiLCJpYXQiOjE3MDgwOTc4NDQsImV4cCI6MTgwMjc3MDY0NH0.H9HaNW9iiZsEKKNcd03D0qb2XJhxN3fe4KlhBiGLfzc"
   *    },
   *       "errors": [],
   *       "message": ""
   *  }
   */
  async v1_login({ username, password }) {
    const user = { username, password };

    const result = await this.validators.user.loginUser(user);
    if (result) {
      return result;
    }

    const userDb = await this.User.findOne({ username });
    if (!userDb) {
      return { ok: false, error: "Invalid credentials" };
    }

    const isMatch = await bcrypt.compare(password, userDb.password);
    if (!isMatch) {
      return { ok: false, error: "Invalid credentials" };
    }

    const longToken = this.tokenManager.genLongToken({
      userId: userDb._id,
    });

    return { ...userDb.toJSON(), longToken };
  }

  async v1_getUsers({ __token }) {
    return await this.User.find();
  }

  async v1_deleteUser({ __params, __token }) {
    const result = await this.validators.user.userIdParams(__params);
    if (result) {
      return result;
    }

    const { id } = __params;

    const deletedUser = await this.User.findByIdAndDelete(id);

    if (!deletedUser) {
      return { error: "User not found" };
    }

    return { message: "User deleted successfully" };
  }

  /**
   * @api {post} /api/auth/v1_createShortToken Generate Short Token
   * @apiName GenerateShortToken
   * @apiGroup Auth
   *
   * @apiHeader {String} token JWT Auth token (long).
   *
   * @apiDescription
   * Generate a short token for to access all CRUD APIs.
   *
   *
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "ok": true,
   *    "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWNmNTI0ZmYzNGU0MzNkZWU2M2E3YTciLCJzZXNzaW9uSWQiOiJINXhfNGhBWEQzVGhYOFc2WDlDLXIiLCJkZXZpY2VJZCI6IjM0NDljOWU1ZTMzMmYxZGJiODE1MDVjZDczOWZiZjNmIiwiaWF0IjoxNzA4MDk4MTEwLCJleHAiOjE3Mzk2NTU3MTB9.FzbcEYaOhvc0TDlJFWtWMA4sQVC8DWvfhyxBLbryb_Q",
   *    "errors": [],
   *    "message": ""
   *  }
   */
  v1_createShortToken({ __longToken, __device }) {
    const decoded = __longToken;

    return this.tokenManager.genShortToken({
      userId: decoded.userId,
      sessionId: nanoid(),
      deviceId: md5(__device),
    });
  }

  async interceptor({ data, cb, meta, fnName }) {
    if (this.cortexExposed.includes(fnName)) {
      const result = await this[`${fnName}`](data);
      cb(result);
    } else {
      cb({ error: `${fnName} is not executable` });
    }
  }

  async verifyShortTokenEvent({ token }) {
    return this.tokenManager.verifyShortToken({ token });
  }

  async findUserByIdEvent({ _id }) {
    return await this.User.findOne({ _id });
  }
};
