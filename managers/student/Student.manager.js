const {
  getAddedAndRemovedIds,
  clearDuplicates,
} = require("../_common/api.helper");

module.exports = class StudentManager {
  constructor({ mongoModels, validators, cortex }) {
    console.log("*** STUDENT MANAGER ***");
    this.Student = mongoModels.student;
    this.validators = validators;
    this.httpExposed = [
      "v1_createStudent",
      "get=v1_getStudents",
      "get=v1_getStudentById",
      "put=v1_updateStudent",
      "delete=v1_deleteStudent",
    ];
    this.cortexExposed = [
      "studentsExistEvent",
      "classroomCreatedEvent",
      "classroomDeletedEvent",
      "classroomUpdatedEvent",
    ];
    this.cortex = cortex;
  }

  /**
   * @api {post} /api/student/v1_createStudent Create student
   * @apiName CreateStudent
   * @apiGroup Student
   *
   * @apiBody {String} name Student name. Can only contain letters and whitespaces. Length between 1 and 20 characters.
   * @apiBody {String[]} classrooms Array of string classroom ids. Can be an empty array.
   *
   * @apiDescription
   * Create a new student document in the database.
   * Accessible only by SchoolAdmin role.
   *
   * @apiHeader {String} token JWT Auth token (short).
   *
   * @apiExample {js} Example body:
   * {
   *  "name": "student",
   *  "classrooms": []
   * }
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "ok": true,
   *    "data": {
   *      "name": "aly",
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
  async v1_createStudent({ name, classrooms, __token, __permissions }) {
    const validatedClassrooms = clearDuplicates(classrooms);
    const student = { name, classrooms: validatedClassrooms };

    let result = await this.validators.student.createStudent(student);
    if (result) {
      return result;
    }

    if (validatedClassrooms?.length) {
      result = await this._validateClassroomsExist(validatedClassrooms);
      if (!result.ok) {
        return result;
      }
    }

    const createdStudent = new this.Student(student);
    await createdStudent.save();

    if (validatedClassrooms?.length) {
      this.cortex.AsyncEmitToOneOf({
        type: this.cortex.nodeType,
        call: "classroom.studentCreatedEvent",
        args: createdStudent,
      });
    }

    return createdStudent;
  }

  /**
   * @api {get} /api/student/v1_getStudents Get students
   * @apiName GetStudents
   * @apiGroup Student
   *
   *
   * @apiDescription
   * Gets all students from the database.
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
   *          "name": "aly",
   *          "classrooms": [],
   *          "createdAt": "2024-02-16T11:45:48.986Z",
   *          "updatedAt": "2024-02-16T11:45:48.986Z",
   *          "__v": 0
   *        },
   *        {
   *          "_id": "65cf4afabcd0537f31b0585a",
   *          "name": "zamoksha",
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
  async v1_getStudents({ __token, __permissions }) {
    return await this.Student.find();
  }

  /**
   * @api {get} /api/student/v1_getStudentById/:id Get student
   * @apiName GetStudent
   * @apiGroup Student
   *
   * @apiParam {String} id Student Id
   *
   * @apiDescription
   * Get student using id from the database.
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
   *        "name": "aly",
   *        "classrooms": [],
   *        "createdAt": "2024-02-16T11:45:48.986Z",
   *        "updatedAt": "2024-02-16T11:45:48.986Z",
   *        "__v": 0
   *    },
   *    "errors": [],
   *    "message": ""
   *   }
   */
  async v1_getStudentById({ __params, __token, __permissions }) {
    const result = await this.validators.student.studentIdParams(__params);
    if (result) {
      return result;
    }

    const { id } = __params;

    const student = await this.Student.findById(id);
    if (!student) {
      return { ok: false, error: `Student ${id} not found` };
    }

    return student;
  }

  /**
   * @api {put} /api/student/v1_updateStudent/:id Update student
   * @apiName UpdateStudent
   * @apiGroup Student
   *
   * @apiParam {String} id Student Id
   *
   * @apiBody {String} name Student name. Can only contain letters and whitespaces. Length between 1 and 20 characters.
   * @apiBody {String[]} classrooms Array of string classroom ids. Can be an empty array.
   *
   * @apiDescription
   * Updates an existing student document in the database.
   * Accessible only by SchoolAdmin role.
   *
   * @apiHeader {String} token JWT Auth token (short).
   *
   * @apiExample {js} Example body:
   * {
   *  "name": "student",
   *  "classrooms": []
   * }
   *
   * @apiSuccessExample {json} Success-Response:
   *  HTTP/1.1 200 OK
   *  {
   *    "ok": true,
   *    "data": {
   *        "name": "aly",
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
  async v1_updateStudent({
    __params,
    name,
    classrooms,
    __token,
    __permissions,
  }) {
    let result = await this.validators.student.studentIdParams(__params);
    if (result) {
      return result;
    }

    const validatedClassrooms = clearDuplicates(classrooms);
    const student = { name, classrooms: validatedClassrooms };

    result = await this.validators.student.updateStudent(student);
    if (result) {
      return result;
    }

    if (validatedClassrooms?.length) {
      result = await this._validateClassroomsExist(validatedClassrooms);
      if (!result.ok) {
        return result;
      }
    }

    const { id } = __params;

    let dbStudent = await this.Student.findById(id);
    if (!dbStudent) {
      return { error: "Student not found" };
    }
    const oldStudentData = dbStudent.toJSON();

    dbStudent.set(student);
    dbStudent = await dbStudent.save();

    const { addedIds: newClassroomIds, removedIds: deletedClassroomIds } =
      getAddedAndRemovedIds(
        oldStudentData.classrooms.map((id) => id.toString()),
        validatedClassrooms
      );

    if (newClassroomIds.length || deletedClassroomIds.length) {
      this.cortex.AsyncEmitToOneOf({
        type: this.cortex.nodeType,
        call: "classroom.studentUpdatedEvent",
        args: {
          student: dbStudent.toJSON(),
          newClassroomIds,
          deletedClassroomIds,
        },
      });
    }

    return dbStudent;
  }

  /**
   * @api {delete} /api/student/v1_deleteStudent/:id Delete student
   * @apiName DeleteStudent
   * @apiGroup Student
   *
   * @apiParam {String} id Student Id
   *
   * @apiDescription
   * Deletes a student using id from the database.
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
   *       "message": "Student deleted successfully"
   *   },
   *   "errors": [],
   *   "message": ""
   * }
   */
  async v1_deleteStudent({ __params, __token, __permissions }) {
    const result = await this.validators.student.studentIdParams(__params);
    if (result) {
      return result;
    }

    const { id } = __params;

    const deletedStudent = await this.Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return { error: "Student not found" };
    }

    if (deletedStudent.classrooms.length) {
      this.cortex.AsyncEmitToOneOf({
        type: this.cortex.nodeType,
        call: "classroom.studentRemovedEvent",
        args: deletedStudent,
      });
    }

    return { message: "Student deleted successfully" };
  }

  async interceptor({ data, cb, meta, fnName }) {
    if (this.cortexExposed.includes(fnName)) {
      const result = await this[`${fnName}`](data);
      cb(result);
    } else {
      cb({ error: `${fnName} is not executable` });
    }
  }

  async studentsExistEvent({ students }) {
    const promises = [];
    for (const student of students) {
      promises.push(this.Student.countDocuments({ _id: student._id }));
    }
    const results = await Promise.all(promises);

    const missingStudents = [];
    for (let i = 0; i < results.length; i++) {
      if (results[i] === 0) {
        missingStudents.push(students[i]);
      }
    }

    return missingStudents.length
      ? {
          ok: false,
          error: `Students ${missingStudents
            .map((student) => student._id)
            .join(",")} do not exist`,
        }
      : { ok: true };
  }

  async classroomCreatedEvent(classroom) {
    await this.Student.updateMany(
      { _id: { $in: classroom.students } },
      { $addToSet: { classrooms: classroom._id } }
    );
  }

  async classroomDeletedEvent(classroom) {
    await this.Student.updateMany(
      { _id: { $in: classroom.students } },
      { $pull: { classrooms: classroom._id } }
    );
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

  async classroomUpdatedEvent({ classroom, newStudentIds, deletedStudentIds }) {
    if (newStudentIds.length) {
      await this.Student.updateMany(
        { _id: { $in: newStudentIds } },
        { $addToSet: { classrooms: classroom._id } }
      );
    }

    if (deletedStudentIds.length) {
      await this.Student.updateMany(
        { _id: { $in: deletedStudentIds } },
        { $pull: { classrooms: classroom._id } }
      );
    }
  }
};
