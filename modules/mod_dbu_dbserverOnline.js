"use strict";

const Module = require("../objects/Module.js");
const ModuleUtilities = require("../objects/ModuleUtilities.js");
const DBServer = require("../objects/DBServer.js");

module.exports = new Module(
    {
        name: "DBServer Status Checker",
        sector: "DBServer Utilities",
        description:
            "Checks the DBServer status."
    },
    "/?uti?l/dbserver_status",
    {
        "200": "This page always reports."
    },
    {
        processWebRequest: async (log, req, res) => {
            res.set("Content-Type", "application/json");
          
            var state = await(DBServer.getDBServerState());
            res.send(ModuleUtilities.buildResponse(200, { status: state ? "online" : "offline", active: state }));
        }
    }
);