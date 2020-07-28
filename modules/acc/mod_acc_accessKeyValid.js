"use strict";

const SemiAuthorizedModule = require("../../objects/SemiAuthorizedModule.js");
const DBServer = require("../../objects/DBServer.js");

module.exports = new SemiAuthorizedModule(
    {
        name: "Access Key Validator",
        sector: "DBServer Account",
        description:
            "Validates a DBServer key along with the account associated with it."
    },
    "/?account/authenticate",
    {
        "200": "If the user was verified successfully."
    },
    {
        processSemiAuthRequest: async (_, studentData) => {
            var valid = true;
          
            var logInfo;
            try {
                logInfo = (await DBServer.userLoggedIn(studentData.id));
              
                if (logInfo instanceof Error)
                    throw logInfo;
            } catch (_) {
                console.log(_);
                valid = false;
            }
          
            return {
                valid: valid,
                username: studentData.id, 
                logInfo: logInfo
            };
        }
    }
);