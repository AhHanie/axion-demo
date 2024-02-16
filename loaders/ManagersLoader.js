const MiddlewaresLoader = require("./MiddlewaresLoader");
const ApiHandler = require("../managers/api/Api.manager");
const LiveDB = require("../managers/live_db/LiveDb.manager");
const ResponseDispatcher = require("../managers/response_dispatcher/ResponseDispatcher.manager");
const VirtualStack = require("../managers/virtual_stack/VirtualStack.manager");
const ValidatorsLoader = require("./ValidatorsLoader");
const MongoLoader = require("./MongoLoader");
const ResourceMeshLoader = require("./ResourceMeshLoader");
const PermissionsLoader = require("./PermissionsLoader");
const StudentManager = require("../managers/student/Student.manager");
const ClassroomManager = require("../managers/classroom/Classroom.manager");
const SchoolManager = require("../managers/school/School.manager");
const AuthManager = require("../managers/auth/Auth.manager");
const utils = require("../libs/utils");

const systemArch = require("../static_arch/main.system");
const TokenManager = require("../managers/token/Token.manager");
const SharkFin = require("../managers/shark_fin/SharkFin.manager");
const TimeMachine = require("../managers/time_machine/TimeMachine.manager");

const AuthServer = require("../managers/http/AuthServer.manager");
const StudentServer = require("../managers/http/StudentServer.manager");
const ClassroomServer = require("../managers/http/ClassroomServer.manager");
const SchoolServer = require("../managers/http/SchoolServer.manager");
const DocsServer = require("../managers/http/DocsServer.manager");
/**
 * load sharable modules
 * @return modules tree with instance of each module
 */
module.exports = class ManagersLoader {
  constructor({ config, cortex, cache, oyster, aeon }) {
    this.managers = {};
    this.exposed = {};
    this.config = config;
    this.cache = cache;
    this.cortex = cortex;

    this._preload();
    this.injectable = {
      utils,
      cache,
      config,
      cortex,
      oyster,
      aeon,
      managers: this.managers,
      validators: this.validators,
      mongoModels: this.mongoModels,
      resourceNodes: this.resourceNodes,
      permissions: this.permissions,
    };
  }

  _preload() {
    const validatorsLoader = new ValidatorsLoader({
      models: require("../managers/_common/schema.models"),
      customValidators: require("../managers/_common/schema.validators"),
    });
    const resourceMeshLoader = new ResourceMeshLoader({});
    const mongoLoader = new MongoLoader({ schemaExtension: "schema.js" });
    const permissionsLoader = new PermissionsLoader({});

    this.permissions = permissionsLoader.load();
    this.validators = validatorsLoader.load();
    this.resourceNodes = resourceMeshLoader.load();
    this.mongoModels = mongoLoader.load();
  }

  load() {
    this.managers.responseDispatcher = new ResponseDispatcher();
    this.managers.liveDb = new LiveDB(this.injectable);
    const middlewaresLoader = new MiddlewaresLoader(this.injectable);
    const mwsRepo = middlewaresLoader.load();
    const { layers, actions } = systemArch;
    this.injectable.mwsRepo = mwsRepo;
    /*****************************************CUSTOM MANAGERS*****************************************/
    this.managers.shark = new SharkFin({ ...this.injectable, layers, actions });
    this.managers.timeMachine = new TimeMachine(this.injectable);
    this.managers.token = new TokenManager(this.injectable);
    /*************************************************************************************************/
    this.managers.mwsExec = new VirtualStack({
      ...{ preStack: ["__params", "__device"] },
      ...this.injectable,
    });
    this.managers.student = new StudentManager(this.injectable);
    this.managers.classroom = new ClassroomManager(this.injectable);
    this.managers.school = new SchoolManager(this.injectable);
    this.managers.auth = new AuthManager(this.injectable);

    // Split them into separate microservices

    this.managers.authApi = new ApiHandler({
      ...this.injectable,
      ...{ prop: "httpExposed" },
      managers: {
        auth: this.managers.auth,
        mwsExec: this.managers.mwsExec,
        responseDispatcher: this.managers.responseDispatcher,
      },
    });

    this.managers.studentApi = new ApiHandler({
      ...this.injectable,
      ...{ prop: "httpExposed" },
      managers: {
        student: this.managers.student,
        mwsExec: this.managers.mwsExec,
        responseDispatcher: this.managers.responseDispatcher,
      },
    });

    this.managers.classroomApi = new ApiHandler({
      ...this.injectable,
      ...{ prop: "httpExposed" },
      managers: {
        classroom: this.managers.classroom,
        mwsExec: this.managers.mwsExec,
        responseDispatcher: this.managers.responseDispatcher,
      },
    });

    this.managers.schoolApi = new ApiHandler({
      ...this.injectable,
      ...{ prop: "httpExposed" },
      managers: {
        school: this.managers.school,
        mwsExec: this.managers.mwsExec,
        responseDispatcher: this.managers.responseDispatcher,
      },
    });

    /** expose apis through cortex */
    Object.keys(this.managers).forEach((mk) => {
      if (this.managers[mk].interceptor) {
        this.exposed[mk] = this.managers[mk];
        // console.log(`## ${mk}`);
        if (this.exposed[mk].cortexExposed) {
          this.exposed[mk].cortexExposed.forEach((i) => {
            // console.log(`* ${i} :`,getParamNames(this.exposed[mk][i]));
          });
        }
      }
    });

    /** expose apis through cortex */
    this.cortex.sub("*", (d, meta, cb) => {
      let [moduleName, fnName] = meta.event.split(".");
      let targetModule = this.exposed[moduleName];
      if (!targetModule) return cb({ error: `module ${moduleName} not found` });
      try {
        targetModule.interceptor({ data: d, meta, cb, fnName });
      } catch (err) {
        cb({ error: `failed to execute ${fnName}` });
      }
    });

    this.managers.authServer = new AuthServer({
      config: this.config,
      managers: this.managers,
    });

    this.managers.studentServer = new StudentServer({
      config: this.config,
      managers: this.managers,
    });

    this.managers.classroomServer = new ClassroomServer({
      config: this.config,
      managers: this.managers,
    });

    this.managers.schoolServer = new SchoolServer({
      config: this.config,
      managers: this.managers,
    });

    this.managers.docsServer = new DocsServer({
      config: this.config,
      managers: this.managers,
    });

    return this.managers;
  }
};
