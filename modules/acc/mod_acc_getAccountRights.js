"use strict";

const AuthorizedModule = require("../../objects/AuthorizedModule.js");
const APIError = require("../../objects/APIError.js");

module.exports = new AuthorizedModule(
    {
        name: "Account Rights",
        sector: "DBServer Account",
        description:
            "Gets the rights of a user."
    },
    "/?account/(get_)?(account_)?rights",
    {
        "200": "If the user was verified successfully."
    },
    {
        processAPIRequest: async (log, session, req, res, managers) => {
            let ip = (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0] : req.connection.remoteAddress);

			var studentRights = await(session.getRights());
            var out = {rights: studentRights};

            log.write("Requesting account rights", {
                "IP Address": ip,
                "Success": {
                    state: !(out instanceof APIError)
                }
            });

            return out;
        }
    }
);