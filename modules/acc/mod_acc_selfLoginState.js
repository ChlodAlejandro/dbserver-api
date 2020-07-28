"use strict";

const SemiAuthorizedModule = require("../../objects/SemiAuthorizedModule.js");
const ModuleUtilities = require("../../objects/ModuleUtilities.js");
const DBServer = require("../../objects/DBServer.js");

module.exports = new SemiAuthorizedModule(
    {
        name: "User Login State",
        sector: "User Utilities",
        description:
            "Checks the login state of a DBServer user."
    },
    "/?account/self_logged_(in|out)",
    {
        "200-F": "If the page returned a full login status check.",
        "500-D": "If the DBServer cannot be accessed."
    },
    {
        processSemiAuthRequest: async (log, studentData, req, res) => {
            res.set("Content-Type", "application/json");
          
            var state = await(DBServer.userLoggedIn(studentData.id));

            if (state === false) {
                res.send(ModuleUtilities.buildErrorResponse("500-D"));
                return;
            }

            return state;
        }
    }
);