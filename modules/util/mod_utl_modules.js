"use strict";

const Module = require("../../objects/Module.js");
const ModuleUtilities = require("../../objects/ModuleUtilities.js");

module.exports = new Module(
    {
        name: "Modules",
        sector: "DBServer API Utilities",
        description:
            "Displays all modules of the DBServer API and their statuses."
    },
    "/?uti?l/modules",
    {
        "200": "This page always returns."
    },
    {
        processWebRequest: async (log, req, res, man, server) => {
            res.set("Content-Type", "application/json");
          
            var out = [];

            var show = {
                name: (req.query.showAll || req.query.showName || "1") === "1",
                displayName: (req.query.showAll || req.query.showDisplayName || "1") === "1",
                sector: (req.query.showAll || req.query.showSector || "0") === "1",
                description: (req.query.showAll || req.query.showDescription || "1") === "1",
                paths: (req.query.showAll || req.query.showPaths || "0") === "1",
                returns: (req.query.showAll || req.query.showReturns || "0") === "1",
                active: (req.query.showAll || req.query.showActive || "1") === "1"
            };
            
            for (var m of server.modules) {
                out.push({
                    name: show.name ? m.getTechnicalName() : undefined,
                    displayName: show.displayName ? m.name : undefined,
                    sector: show.sector ? m.sector : undefined,
                    description: show.description ? m.description : undefined,
                    paths: show.paths ? m.listenOn.toString() : undefined,
                    returns: show.returns ? m.returns : undefined,
                    active: show.active ? m.active : undefined
                });
            }

            res.send(ModuleUtilities.buildResponse(200, { modules: out }));
        }
    }
);