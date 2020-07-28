"use strict";

const axios = require("axios");

const Module = require("../objects/Module.js");

module.exports = new Module(
    {
        name: "Favicon Mirror",
        sector: "Interface Mirror",
        description:
            "Redirects all favicon requests towards the favicon asset."
    },
    /^\/?favicon(.ico)?$/gi,
    {
        "200": "This module always returns 200."
    },
    {
        processWebRequest: async (log, req, res) => {
            res.redirect("/images/favicon.ico");
        }
    }
);