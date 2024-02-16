module.exports = ({ meta, config, managers, cortex }) => {
  return async ({ req, res, next }) => {
    if (!req.headers.token) {
      console.log("token required but not found");
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: "unauthorized",
      });
    }
    let decoded = null;
    try {
      // Only Auth microservice can self verify, other microservices have to communicate with Auth
      if (req.params.moduleName === "auth") {
        decoded = managers.token.verifyShortToken({ token: req.headers.token });
      } else {
        decoded = await cortex.AsyncEmitToOneOf({
          type: cortex.nodeType,
          call: "auth.verifyShortTokenEvent",
          args: { token: req.headers.token },
        });
      }
      if (!decoded) {
        console.log("failed to decode-1");
        return managers.responseDispatcher.dispatch(res, {
          ok: false,
          code: 401,
          errors: "unauthorized",
        });
      }
    } catch (err) {
      console.log("failed to decode-2");
      return managers.responseDispatcher.dispatch(res, {
        ok: false,
        code: 401,
        errors: "unauthorized",
      });
    }

    next(decoded);
  };
};
