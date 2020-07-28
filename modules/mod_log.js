"use strict";

const Module = require("../objects/Module.js");
const fs = require("fs-jetpack");

module.exports = new Module(
    {
        name: "Log",
        sector: "DBServer Tools Utilities",
        description:
            "View the server logs."
    },
    "/util/log",
    {
        "200": "This module always returns 200."
    },
    {
        processWebRequest: async (log, req, res) => {
            var limit = req.query.limit || 25;

            var lines = fs.read("logs/log.dat").trim().split(/(\r|\n|\r\n)/g);
            lines = lines.reverse();
            
            var finalOut = "";

            var searchRegex = null;
            if (req.query.s !== undefined) {
                searchRegex = new RegExp(req.query.s, "gi");
            } else {
                searchRegex = /.*/g;
            }

            var linesPut = 0;
            for (var currentLine = (req.query.offset || 0); 
                (linesPut < limit && currentLine < lines.length);
                currentLine++) {
                if (searchRegex.test(lines[currentLine])) {
                    finalOut += lines[currentLine] + "\n";
                    linesPut++;
                }
            }

            res.set("Cache-Control", "no-cache");
            res.set("Content-Type", "text/plain");
            res.send(finalOut);
        }
    }
);