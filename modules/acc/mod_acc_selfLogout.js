"use strict";

const axios = require("axios");

const SemiAuthorizedModule = require("../../objects/SemiAuthorizedModule.js");
const ModuleUtilities = require("../../objects/ModuleUtilities.js");
const DBServer = require("../../objects/DBServer.js");
const APIError = require("../../objects/APIError.js");
const Constants = require("../../objects/Constants.js");

module.exports = new SemiAuthorizedModule(
    {
        name: "User Login State",
        sector: "User Utilities",
        description:
            "Checks the login state of a DBServer user."
    },
    "/?account/self_logout",
    {
        "200-F": "If the page returned a full login status check.",
        "500-D": "If the DBServer cannot be accessed."
    },
    {
        processSemiAuthRequest: async (log, studentData, req, res) => {
            res.set("Content-Type", "application/json");

            if (req.method !== "POST")
                return new APIError(400);
          
            var state = await(DBServer.userLoggedIn(studentData.id));

            if (state === false) {
                res.send(ModuleUtilities.buildErrorResponse("500-D"));
                return;
            }

            if (state) {
                await(axios.post(
                    Constants.URL.dbserver + "dbserver/Admin/UsersLoggedIn/update.php",
                    qs({
                        log_status: 0,
                        group: 0,
                        id: studentData.id
                    })));
            }

            state = await(DBServer.userLoggedIn(studentData.id));

            return state;
        }
    }
);