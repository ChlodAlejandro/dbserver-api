"use strict";

const Module = require("../../objects/Module.js");

module.exports = new Module(
    {
        name: "Random Number Generator",
        sector: "DBServer API Utilities",
        description:
            "Creates and returns a random number from a random number generator."
    },
    "/?uti?l/random_?number",
    {
        "200": "This page always returns its inputs."
    },
    {
        processWebRequest: async (log, req, res) => {
            res.set("Content-Type", "application/json");
          
            res.send(JSON.stringify({
                code: "200",
                num: (new (require("chance"))()).integer()
            }));
        }
    }
);