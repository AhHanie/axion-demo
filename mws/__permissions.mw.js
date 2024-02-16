module.exports = ({ managers, permissions, cortex }) => {
  return async ({ req, res, next, results }) => {
    const moduleName = req.params.moduleName;
    if (!req.params.moduleName || !permissions[moduleName]) {
      return next();
    }
    const user = await cortex.AsyncEmitToOneOf({
      type: cortex.nodeType,
      call: "auth.findUserByIdEvent",
      args: { _id: results.__token.userId },
    });
    if (!user) {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 403,
        errors: "Forbidden",
      });
    }
    let isGranted = false;
    switch (req.method) {
      case "GET":
        isGranted = await managers.shark.isGranted({
          layer: moduleName,
          variant: user.role,
          userId: user.id,
          action: "read",
          isOwner: false,
        });
        break;
      case "DELETE":
        isGranted = await managers.shark.isGranted({
          layer: moduleName,
          variant: user.role,
          userId: user.id,
          action: "create",
          isOwner: false,
        });
        break;
      case "PUT":
      case "POST":
        const permissionsRequired = [];
        const modulePermissions = permissions[moduleName];
        for (const key of Object.keys(req.body)) {
          if (!modulePermissions[key]) {
            continue;
          }
          permissionsRequired.push(modulePermissions[key]);
        }
        const promises = [];
        for (const permission of permissionsRequired) {
          promises.push(
            managers.shark.isGranted({
              layer: permission,
              variant: user.role,
              userId: user.id,
              action: "create",
              isOwner: false,
            })
          );
        }
        const results = await Promise.all(promises);
        isGranted = results.every((result) => result === true);
        break;
    }
    if (!isGranted) {
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 403,
        errors: "Forbidden",
      });
    }
    next(true);
  };
};
