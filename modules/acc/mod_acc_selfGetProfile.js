"use strict";

const AuthorizedModule = require("../../objects/AuthorizedModule.js");

module.exports = new AuthorizedModule(
    {
        name: "Account Profile",
        sector: "DBServer Account",
        description:
            "Gets the profile information of the authenticated user."
    },
    "/?account/(get_)?profile(_info)?",
    {
        "200": "If the user was verified successfully."
    },
    {
        processAPIRequest: async (log, session, req) => {
            let ip = (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0] : req.connection.remoteAddress);

            var studentInfo = await(session.getProfile({all: true}));
                    
            log.write("Requesting access key", {
                "IP Address": ip,
                "Name": studentInfo.profileName,
                "Section": studentInfo.studentSection,
                "Success": {
                    state: true
                }
            });

            return {profile: studentInfo};
        }
    }
);