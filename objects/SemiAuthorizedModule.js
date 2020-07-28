"use strict";

const Module = require("./Module.js");
const DBServer = require("./DBServer.js");
const APIError = require("./APIError.js");
const ModuleUtilities = require("./ModuleUtilities.js");

module.exports = class SemiAuthorizedModule extends Module {

    constructor(info, listenOn, returns, moduleFunctions) {
        super({...info, requiresAuth: true}, listenOn, returns, moduleFunctions);
    }

    enable(verbose = true) {
        return super.enable(verbose);
    }

    disable(verbose = true) {
        return super.disable(verbose);
    }

    reload() {
        console.log("Reloading module: \"" + this.name + "\"");
        if (this.moduleOptions.reload !== undefined) this.moduleOptions.reload();
    }

    async processWebRequest(log, req, res, managers, server) {
        let ip = (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0] : req.connection.remoteAddress);

        if (this.moduleOptions.processSemiAuthRequest === undefined)
            throw new Error("Module does not have a definition for \"processSemiAuthRequest\".");

        res.set("Content-Type", "application/json");

        if (!await(DBServer.getDBServerState())) {
            res.send(ModuleUtilities.buildErrorResponse("500-D"));
            return;
        }

        if (req.get("Authorization") === undefined) {
            res.send(ModuleUtilities.buildErrorResponse("400-RK"));
            return;
        }

        var authHeader = req.get("Authorization").substring(7).split(":");

        if (authHeader.length !== 3) {
            res.send(ModuleUtilities.buildErrorResponse("400-RK"));
            return;
        }

        var auth = {
            rk: Buffer.from(authHeader[0], "base64").toString("utf8"),
            rs: Buffer.from(authHeader[1], "base64").toString("utf8"),
            ak: Buffer.from(authHeader[2], "base64").toString("utf8"),
        };

        var akMan = managers["accessKeyManager"];

        // noinspection DuplicatedCode
        try {
            if (akMan.matchingAccessKey(auth.rk, auth.ak)) {
                var studentData = akMan.getStudentFromAccessKey(auth.rk, auth.rs, auth.ak);
    
                var output = await(this.moduleOptions.processSemiAuthRequest(log, studentData, req, res, managers, server));

                studentData.destroy();
                
                if (output instanceof APIError) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw output;
                } else {
                    res.send(ModuleUtilities.buildResponse(200, output));
                }
            } else {
                res.send(ModuleUtilities.buildErrorResponse("401-AK"));
            }
        } catch (err) {
            console.log(err);
            log.write("API Error", {
                "IP Address": ip,
                "Success": {
                    state: false,
                    reason: `${err instanceof APIError ? err.code : err.message} - ${err.message}`
                }
            });
            res.send(ModuleUtilities.buildErrorResponse((err instanceof APIError ? err.code : 500), err.message));
        }
    }

};