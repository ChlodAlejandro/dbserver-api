"use strict";

const Module = require("../../objects/Module.js");

module.exports = new Module(
    {
        name: "Endpoint Tester",
        sector: "DBServer API Utilities",
        description:
            "Shows details about a request to this endpoint."
    },
    "/?uti?l/endpoint_test(er)?",
    {
        "200": "This page always returns its inputs."
    },
    {
        processWebRequest: async (log, req, res) => {
            res.set("Content-Type", "application/json");
          
            res.send(JSON.stringify({
                code: "200",
                ip: (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0] : req.connection.remoteAddress),
                method: req.method,
                path: req.path,
                protocol: req.protocol,
                cookies: req.cookies,
                query: req.query,
                body: req.body,
                auth: req.get("Authorization"),
                headers: req.headers
            }));
        }
    }
);
