"use strict";

const Module = require("../../objects/Module.js");
const ModuleUtilities = require("../../objects/ModuleUtilities.js");

module.exports = new Module(
    {
        name: "Managers",
        sector: "DBServer API Utilities",
        description:
            "Displays all managers of the DBServer API and their statuses."
    },
    "/?uti?l/managers",
    {
        "200": "This page always returns."
    },
    {
        processWebRequest: async (log, req, res, man, server) => {
            res.set("Content-Type", "application/json");
          
            var out = [];

            var show = {
                name: (req.query.showAll || req.query.showName || "1") === "1",
                displayName: (req.query.showAll || req.query.showDisplayName || "0") === "1",
                description: (req.query.showAll || req.query.showDescription || "0") === "1",
                enabled: (req.query.showAll || req.query.showEnabled || "1") === "1"
            };
            
            for (var m of server.managers) {
                out.push({
                    name: show.name ? m.name : undefined,
                    displayName: show.displayName ? m.displayName : undefined,
                    description: show.description ? m.desc : undefined,
                    enabled: show.enabled ? m.enabled : undefined
                });
            }

            res.send(ModuleUtilities.buildResponse(200, { managers: out , a: "A"}));
        }
    }
);