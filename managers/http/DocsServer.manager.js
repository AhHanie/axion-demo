const http = require("http");
const express = require("express");
const cors = require("cors");
const app = express();
const fs = require("fs");
const path = require("path");

module.exports = class ClassroomServer {
  constructor({ config, managers }) {
    this.config = config;
  }

  /** for injecting middlewares */
  use(args) {
    app.use(args);
  }

  /** server configs */
  run() {
    app.use(cors({ origin: "*" }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(
      "/api/assets",
      express.static(path.join(__dirname, "../../doc", "assets"))
    );

    /** an error handler */
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).send("Something broke!");
    });

    /** a single middleware to handle all */
    app.get("/api/docs", (req, res) => {
      fs.readFile(
        path.join(__dirname, "../../doc/index.html"),
        "utf8",
        (err, text) => {
          res.send(text);
        }
      );
    });

    let server = http.createServer(app);
    server.listen(this.config.dotEnv.API_DOCS_PORT, () => {
      console.log(
        `Classroom service is running on port: ${this.config.dotEnv.API_DOCS_PORT}`
      );
    });
  }
};
