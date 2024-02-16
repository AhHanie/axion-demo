const {
  getAddedAndRemovedIds,
  clearDuplicates,
} = require("../_common/api.helper");

module.exports = class ClassroomManager {
  constructor({ mongoModels, validators, cortex }) {
    console.log("*** CLASSROOM MANAGER ***");
    this.Classroom = mongoModels.classroom;
    this.validators = validators;
    this.httpExposed = [
      "v1_createClassroom",
      "get=v1_getClassrooms",
      "get=v1_getClassroomById",
      "put=v1_updateClassroom",
      "delete=v1_deleteClassroom",
    ];
    this.cortex = cortex;
    this.cortexExposed = [
      "studentRemovedEvent",
      "studentCreatedEvent",
      "studentUpdatedEvent",
      "classroomsExistEvent",
      "schoolCreatedEvent",
      "schoolUpdatedEvent",
      "schoolDeletedEvent",
    ];
  }

  /**
   * @api {post} /api/classroom/v1_createClassroom Create Classroom
   * @apiName CreateClassroom
   * @apiGroup Classroom
   *
   * @apiBody {String} name Classroom name. Can only contain letters and whitespaces. Length between 1 and 20 characters.
   * @apiBody {String[]} students Array of string student ids. Can be an empty array.
   *
   * @apiDescription
   * Create a new classroom document in the database.
   * Accessible only by SchoolAdmin role.
   *
   * @apiHeader {String} token JWT Auth token (short).
   *
   * @apiExample {js} Example body:
   * {
   *  "name": "classroom",
   *  "students": []
   * }
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "ok": true,
   *    "data": {
   *      "name": "classroom",
   *      "students": [],
   *      "_id": "65cf6e53882f9b09c25c17d9",
   *      "createdAt": "2024-02-16T14:16:51.139Z",
   *      "updatedAt": "2024-02-16T14:16:51.139Z",
   *      "__v": 0
   *    },
   *       "errors": [],
   *       "message": ""
   *  }
   */
  async v1_createClassroom({ name, students, __token, __permissions }) {
    const validatedStudents = clearDuplicates(students);
    const classroom = {
      name,
      students: validatedStudents,
    };

    let result = await this.validators.classroom.createClassroom(classroom);
    if (result) {
      return result;
    }

    if (validatedStudents?.length) {
      result = await this._validateStudentsExist(validatedStudents);
      if (!result.ok) {
        return result;
      }
    }
    const createdClasroom = new this.Classroom(classroom);
    await createdClasroom.save();

    if (validatedStudents?.length) {
      this.cortex.AsyncEmitToOneOf({
        type: this.cortex.nodeType,
        call: "student.classroomCreatedEvent",
        args: createdClasroom,
      });
    }

    return createdClasroom;
  }

  async _validateStudentsExist(studentIds) {
    return await this.cortex.AsyncEmitToOneOf({
      type: this.cortex.nodeType,
      call: "student.studentsExistEvent",
      args: {
        students: studentIds.map((studentId) => ({ _id: studentId })),
      },
    });
  }

  /**
   * @api {get} /api/classroom/v1_getClassrooms Get classrooms
   * @apiName GetClassrooms
   * @apiGroup Classroom
   *
   *
   * @apiDescription
   * Gets all classrooms from the database.
   * Accessible only by SchoolAdmin role.
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
   *          "name": "classroom",
   *          "students": [],
   *          "createdAt": "2024-02-16T11:45:48.986Z",
   *          "updatedAt": "2024-02-16T11:45:48.986Z",
   *          "__v": 0
   *        },
   *        {
   *          "_id": "65cf4afabcd0537f31b0585a",
   *          "name": "zamoksha",
   *          "students": [
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
  async v1_getClassrooms({ __token, __permissions }) {
    return await this.Classroom.find();
  }

  /**
   * @api {get} /api/classroom/v1_getClassroomById/:id Get classroom
   * @apiName GetClassroom
   * @apiGroup Classroom
   *
   * @apiParam {String} id Classroom Id
   *
   * @apiDescription
   * Get classroom using id from the database.
   * Accessible only by SchoolAdmin role.
   *
   * @apiHeader {String} token JWT Auth token (short).
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "ok": true,
   *    "data": {
   *        "_id": "65cf4aecbcd0537f31b05856",
   *        "name": "classroom",
   *        "students": [],
   *        "createdAt": "2024-02-16T11:45:48.986Z",
   *        "updatedAt": "2024-02-16T11:45:48.986Z",
   *        "__v": 0
   *    },
   *    "errors": [],
   *    "message": ""
   *   }
   */
  async v1_getClassroomById({ __params, __token, __permissions }) {
    const result = await this.validators.classroom.classroomIdParams(__params);
    if (result) {
      return result;
    }

    const { id } = __params;

    const classroom = await this.Classroom.findById(id);
    if (!classroom) {
      return { ok: false, error: `Classroom ${id} not found` };
    }

    return classroom;
  }

  async studentRemovedEvent(student) {
    await this.Classroom.updateMany(
      { students: student._id },
      { $pull: { students: student._id } }
    );
  }

  async studentCreatedEvent(student) {
    await this.Classroom.updateMany(
      { _id: { $in: student.classrooms } },
      { $addToSet: { students: student._id } }
    );
  }

  async studentUpdatedEvent({ student, newClassroomIds, deletedClassroomIds }) {
    if (newClassroomIds.length) {
      await this.Classroom.updateMany(
        { _id: { $in: newClassroomIds } },
        { $addToSet: { students: student._id } }
      );
    }

    if (deletedClassroomIds.length) {
      await this.Classroom.updateMany(
        { _id: { $in: deletedClassroomIds } },
        { $pull: { students: student._id } }
      );
    }
  }

  async schoolUpdatedEvent({ school, newClassroomIds, deletedClassroomIds }) {
    if (newClassroomIds.length) {
      await this.Classroom.updateMany(
        { _id: { $in: newClassroomIds } },
        { school: school._id }
      );
    }

    if (deletedClassroomIds.length) {
      await this.Classroom.updateMany(
        { _id: { $in: deletedClassroomIds } },
        { $unset: { school: 1 } }
      );
    }
  }

  async schoolDeletedEvent(school) {
    await this.Classroom.updateMany(
      { _id: { $in: school.classrooms } },
      { $unset: { school: 1 } }
    );
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
   * @api {put} /api/classroom/v1_updateClassroom/:id Update classroom
   * @apiName UpdateClassroom
   * @apiGroup Classroom
   *
   * @apiParam {String} id Classroom Id
   *
   * @apiBody {String} name Classroom name. Can only contain letters and whitespaces. Length between 1 and 20 characters.
   * @apiBody {String[]} students Array of string students ids. Can be an empty array.
   *
   * @apiDescription
   * Updates an existing classroom document in the database.
   * Accessible only by SchoolAdmin role.
   *
   * @apiHeader {String} token JWT Auth token (short).
   *
   * @apiExample {js} Example body:
   * {
   *  "name": "classroom",
   *  "students": []
   * }
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "ok": true,
   *    "data": {
   *        "name": "classroom",
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
  async v1_updateClassroom({
    __params,
    __token,
    __permissions,
    name,
    students,
  }) {
    let result = await this.validators.classroom.classroomIdParams(__params);
    if (result) {
      return result;
    }

    const validatedStudents = clearDuplicates(students);
    const classroom = {
      name,
      students: validatedStudents,
    };

    result = await this.validators.classroom.updateClassroom(classroom);
    if (result) {
      return result;
    }

    if (validatedStudents?.length) {
      result = await this._validateStudentsExist(validatedStudents);
      if (!result.ok) {
        return result;
      }
    }

    const { id } = __params;

    let dbClassroom = await this.Classroom.findById(id);
    if (!dbClassroom) {
      return { error: "Classroom not found" };
    }
    const oldClassroomData = dbClassroom.toJSON();

    dbClassroom.set(classroom);
    dbClassroom = await dbClassroom.save();

    const { addedIds: newStudentIds, removedIds: deletedStudentIds } =
      getAddedAndRemovedIds(
        oldClassroomData.students.map((id) => id.toString()),
        validatedStudents
      );

    if (newStudentIds.length || deletedStudentIds.length) {
      this.cortex.AsyncEmitToOneOf({
        type: this.cortex.nodeType,
        call: "student.classroomUpdatedEvent",
        args: {
          classroom: dbClassroom.toJSON(),
          newStudentIds,
          deletedStudentIds,
        },
      });
    }

    return dbClassroom;
  }

  /**
   * @api {delete} /api/classroom/v1_deleteClassroom/:id Delete classroom
   * @apiName DeleteClassroom
   * @apiGroup Classroom
   *
   * @apiParam {String} id Classroom Id
   *
   * @apiDescription
   * Deletes a classroom using id from the database.
   * Accessible only by SchoolAdmin role.
   *
   * @apiHeader {String} token JWT Auth token (short).
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *
   * {
   *   "ok": true,
   *   "data": {
   *       "message": "Classroom deleted successfully"
   *   },
   *   "errors": [],
   *   "message": ""
   * }
   */
  async v1_deleteClassroom({ __params, __token, __permissions }) {
    const result = await this.validators.classroom.classroomIdParams(__params);
    if (result) {
      return result;
    }

    const { id } = __params;

    const deletedClassroom = await this.Classroom.findByIdAndDelete(id);

    if (!deletedClassroom) {
      return { error: "Classroom not found" };
    }

    if (deletedClassroom.students.length) {
      this.cortex.AsyncEmitToOneOf({
        type: this.cortex.nodeType,
        call: "student.classroomDeletedEvent",
        args: deletedClassroom,
      });
    }

    if (deletedClassroom.school) {
      this.cortex.AsyncEmitToOneOf({
        type: this.cortex.nodeType,
        call: "school.classroomDeletedEvent",
        args: deletedClassroom,
      });
    }

    return { message: "Classroom deleted successfully" };
  }

  async classroomsExistEvent({ classrooms }) {
    const promises = [];
    for (const classroom of classrooms) {
      promises.push(this.Classroom.countDocuments({ _id: classroom._id }));
    }
    const results = await Promise.all(promises);

    const missingClassrooms = [];
    for (let i = 0; i < results.length; i++) {
      if (results[i] === 0) {
        missingClassrooms.push(classrooms[i]);
      }
    }

    return missingClassrooms.length
      ? {
          ok: false,
          error: `Classrooms ${missingClassrooms
            .map((classroom) => classroom._id)
            .join(",")} do not exist`,
        }
      : { ok: true };
  }

  async schoolCreatedEvent(school) {
    await this.Classroom.updateMany(
      { _id: { $in: school.classrooms } },
      { school: school._id }
    );
  }
};
