"use strict";

const Module = require("../../objects/Module.js");
const ModuleUtilities = require("../../objects/ModuleUtilities.js");

module.exports = new Module(
    {
        name: "Error Generator",
        sector: "DBServer API Utilities",
        description:
            "Creates and returns an error."
    },
    "/?uti?l/error_test",
    {
        "200": "This page always returns."
    },
    {
        processWebRequest: async (log, req, res) => {
            res.set("Content-Type", "application/json");
          
            res.send(ModuleUtilities.buildErrorResponse(req.query.code || "200", req.query.message || "You asked for this..."));
        }
    }
);