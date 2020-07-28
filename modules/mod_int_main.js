"use strict";

const axios = require("axios");

const Module = require("../objects/Module.js");
const Constants = require("../objects/Constants.js");

module.exports = new Module(
    {
        name: "Main Page Mirror",
        sector: "Interface Mirror",
        description:
            "Redirects site visitors to the actual main page in the interface subdirectory."
    },
    /^\/?((index|main)\.(html|php|js|aspx))?$/gi,
    {
        "200": "This module always returns 200."
    },
    {
        processWebRequest: async (log, req, res) => {
            var ip = (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0] : req.connection.remoteAddress);
            res.send(await(axios.get(
                Constants.URL.main + "/interface/main.html",
                {
                    headers: {
                        "X-Forwarded-For": ip,
                        "X-Forwarded-Host": Constants.URL.main,
                        "X-Forwarded-Server": Constants.URL.main
                    }
                }
            ).then(({data: m}) => { return m; })));
        }
    }
);