const {
  getAddedAndRemovedIds,
  clearDuplicates,
} = require("../_common/api.helper");

module.exports = class SchoolManager {
  constructor({ mongoModels, validators, cortex }) {
    console.log("*** SCHOOL MANAGER ***");
    this.School = mongoModels.school;
    this.validators = validators;
    this.httpExposed = [
      "v1_createSchool",
      "get=v1_getSchools",
      "get=v1_getSchoolById",
      "put=v1_updateSchool",
      "delete=v1_deleteSchool",
    ];
    this.cortex = cortex;
    this.cortexExposed = ["classroomDeletedEvent"];
  }

  /**
   * @api {post} /api/school/v1_createSchool Create School
   * @apiName CreateSchool
   * @apiGroup School
   *
   * @apiBody {String} name School name. Can only contain letters and whitespaces. Length between 1 and 20 characters.
   * @apiBody {String[]} classrooms Array of string classroom ids. Can be an empty array.
   *
   * @apiDescription
   * Create a new school document in the database.
   * Accessible only by SuperAdmin role.
   *
   * @apiHeader {String} token JWT Auth token (short).
   *
   * @apiExample {js} Example body:
   * {
   *  "name": "school",
   *  "classrooms": []
   * }
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "ok": true,
   *    "data": {
   *      "name": "school",
   *      "classrooms": [],
   *      "_id": "65cf6e53882f9b09c25c17d9",
   *      "createdAt": "2024-02-16T14:16:51.139Z",
   *      "updatedAt": "2024-02-16T14:16:51.139Z",
   *      "__v": 0
   *    },
   *       "errors": [],
   *       "message": ""
   *  }
   */
  async v1_createSchool({ name, classrooms, __token, __permissions }) {
    const validatedClassrooms = clearDuplicates(classrooms);
    const school = { name, classrooms: validatedClassrooms };

    let result = await this.validators.school.createSchool(school);
    if (result) {
      return result;
    }

    if (validatedClassrooms?.length) {
      result = await this._validateClassroomsExist(validatedClassrooms);
      if (!result.ok) {
        return result;
      }

      await this.School.updateMany(
        { classrooms: { $in: validatedClassrooms } },
        { $pullAll: { classrooms: validatedClassrooms } }
      );
    }

    const createdSchool = new this.School(school);
    await createdSchool.save();

    if (validatedClassrooms?.length) {
      this.cortex.AsyncEmitToOneOf({
        type: this.cortex.nodeType,
        call: "classroom.schoolCreatedEvent",
        args: createdSchool,
      });
    }

    return createdSchool;
  }

  async _validateClassroomsExist(classroomIds) {
    return await this.cortex.AsyncEmitToOneOf({
      type: this.cortex.nodeType,
      call: "classroom.classroomsExistEvent",
      args: {
        classrooms: classroomIds.map((classroomId) => ({ _id: classroomId })),
      },
    });
  }

  /**
   * @api {get} /api/school/v1_getSchools Get schools
   * @apiName GetSchools
   * @apiGroup School
   *
   *
   * @apiDescription
   * Gets all schools from the database.
   * Accessible only by SuperAdmin role.
   *
   * @apiHeader {String} token JWT Auth token (short).
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "ok": true,
   *    "data": [
   *        {
   *          "_id": "65cf4aecbcd0537f31b05856",
   *          "name": "school",
   *          "classrooms": [],
   *          "createdAt": "2024-02-16T11:45:48.986Z",
   *          "updatedAt": "2024-02-16T11:45:48.986Z",
   *          "__v": 0
   *        },
   *        {
   *          "_id": "65cf4afabcd0537f31b0585a",
   *          "name": "school1",
   *          "classrooms": [
   *            "65cf457b3642d3ffa619bfe2"
   *          ],
   *          "createdAt": "2024-02-16T11:46:02.070Z",
   *          "updatedAt": "2024-02-16T12:26:09.692Z",
   *          "__v": 2
   *        }
   *    ],
   *    "errors": [],
   *    "message": ""
   *   }
   */
  async v1_getSchools({ __token, __permissions }) {
    return await this.School.find();
  }

  /**
   * @api {get} /api/school/v1_getSchoolById/:id Get school
   * @apiName GetSchool
   * @apiGroup School
   *
   * @apiParam {String} id School Id
   *
   * @apiDescription
   * Get school using id from the database.
   * Accessible only by SuperAdmin role.
   *
   * @apiHeader {String} token JWT Auth token (short).
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "ok": true,
   *    "data": {
   *        "_id": "65cf4aecbcd0537f31b05856",
   *        "name": "school",
   *        "classrooms": [],
   *        "createdAt": "2024-02-16T11:45:48.986Z",
   *        "updatedAt": "2024-02-16T11:45:48.986Z",
   *        "__v": 0
   *    },
   *    "errors": [],
   *    "message": ""
   *   }
   */
  async v1_getSchoolById({ __params, __token, __permissions }) {
    const result = await this.validators.school.schoolIdParams(__params);
    if (result) {
      return result;
    }

    const { id } = __params;

    const school = await this.School.findById(id);
    if (!school) {
      return { ok: false, error: `School ${id} not found` };
    }

    return school;
  }

  async classroomDeletedEvent(classroom) {
    await this.School.updateMany(
      { _id: { $in: classroom.schools } },
      { $pull: { classrooms: classroom._id } }
    );
  }

  /**
   * @api {put} /api/school/v1_updateSchool/:id Update school
   * @apiName UpdateSchool
   * @apiGroup School
   *
   * @apiParam {String} id School Id
   *
   * @apiBody {String} name School name. Can only contain letters and whitespaces. Length between 1 and 20 characters.
   * @apiBody {String[]} classrooms Array of string classroom ids. Can be an empty array.
   *
   * @apiDescription
   * Updates an existing school document in the database.
   * Accessible only by SuperAdmin role.
   *
   * @apiHeader {String} token JWT Auth token (short).
   *
   * @apiExample {js} Example body:
   * {
   *  "name": "school",
   *  "classrooms": []
   * }
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "ok": true,
   *    "data": {
   *        "name": "school",
   *        "classrooms": [],
   *        "_id": "65cf6e53882f9b09c25c17d9",
   *        "createdAt": "2024-02-16T14:16:51.139Z",
   *        "updatedAt": "2024-02-16T14:16:51.139Z",
   *        "__v": 0
   *      },
   *    "errors": [],
   *    "message": ""
   *  }
   */
  async v1_updateSchool({
    __params,
    __token,
    name,
    classrooms,
    __permissions,
  }) {
    let result = await this.validators.school.schoolIdParams(__params);
    if (result) {
      return result;
    }

    const validatedClassrooms = clearDuplicates(classrooms);
    const school = {
      name,
      classrooms: validatedClassrooms,
    };

    result = await this.validators.school.updateSchool(school);
    if (result) {
      return result;
    }

    const { id } = __params;

    if (validatedClassrooms?.length) {
      result = await this._validateClassroomsExist(validatedClassrooms);
      if (!result.ok) {
        return result;
      }

      await this.School.updateMany(
        {
          classrooms: { $in: validatedClassrooms },
          _id: { $ne: id },
        },
        { $pullAll: { classrooms: validatedClassrooms } }
      );
    }

    let dbSchool = await this.School.findById(id);
    if (!dbSchool) {
      return { error: "School not found" };
    }
    const oldSchoolData = dbSchool.toJSON();

    dbSchool.set(school);
    dbSchool = await dbSchool.save();

    const { addedIds: newClassroomIds, removedIds: deletedClassroomIds } =
      getAddedAndRemovedIds(
        oldSchoolData.classrooms.map((id) => id.toString()),
        validatedClassrooms
      );

    if (newClassroomIds.length || deletedClassroomIds.length) {
      this.cortex.AsyncEmitToOneOf({
        type: this.cortex.nodeType,
        call: "classroom.schoolUpdatedEvent",
        args: {
          school: dbSchool.toJSON(),
          newClassroomIds,
          deletedClassroomIds,
        },
      });
    }

    return dbSchool;
  }

  async interceptor({ data, cb, meta, fnName }) {
    if (this.cortexExposed.includes(fnName)) {
      const result = await this[`${fnName}`](data);
      cb(result);
    } else {
      cb({ error: `${fnName} is not executable` });
    }
  }

  /**
   * @api {delete} /api/school/v1_deleteSchool/:id Delete school
   * @apiName DeleteSchool
   * @apiGroup School
   *
   * @apiParam {String} id School Id
   *
   * @apiDescription
   * Deletes a school using id from the database.
   * Accessible only by SuperAdmin role.
   *
   * @apiHeader {String} token JWT Auth token (short).
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *
   * {
   *   "ok": true,
   *   "data": {
   *       "message": "School deleted successfully"
   *   },
   *   "errors": [],
   *   "message": ""
   * }
   */
  async v1_deleteSchool({ __params, __token, __permissions }) {
    const result = await this.validators.school.schoolIdParams(__params);
    if (result) {
      return result;
    }

    const { id } = __params;

    const deletedSchool = await this.School.findByIdAndDelete(id);

    if (!deletedSchool) {
      return { error: "School not found" };
    }

    if (deletedSchool.classrooms.length) {
      this.cortex.AsyncEmitToOneOf({
        type: this.cortex.nodeType,
        call: "classroom.schoolDeletedEvent",
        args: deletedSchool,
      });
    }

    return { message: "School deleted successfully" };
  }
};
