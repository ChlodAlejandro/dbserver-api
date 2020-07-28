"use strict";

const Module = require("./Module.js");
const DBServer = require("./DBServer.js");
const APIError = require("./APIError.js");
const ModuleUtilities = require("./ModuleUtilities.js");

module.exports = class AuthorizedModule extends Module {

    constructor(info, listenOn, returns, moduleOptions) {
        super({...info, requiresAuth: true}, listenOn, { 
            ...returns, 
            "400-S": "If the user provided does not match an ID number or if the user is a student.",
            "401-U": "If the user provided an invalid username.",
            "401-P": "If the user provided an invalid password.",
            "401-S": "If the user provided the incorrect secret password.",
            "403-L": "If the user has already logged in in another session.",
            "403-B": "If the user has been banned.",
            "423-D": "If the user was found but has been deactivated.",
            "503-D": "If the DBServer is offline or unavailable."
        }, moduleOptions);
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

    // noinspection DuplicatedCode
    async processWebRequest(log, req, res, managers, server) {
        let ip = (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0] : req.connection.remoteAddress);

        if (this.moduleOptions.processAPIRequest === undefined)
            throw new Error("Module does not have a definition for \"processAPIRequest\".");

        res.set("Content-Type", "application/json");

        if (!await(DBServer.getDBServerState())) {
            res.send(ModuleUtilities.buildErrorResponse("503-D"));
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

        var dbMan = managers["dbSessionManager"];
        var akMan = managers["accessKeyManager"];

        var session;
        // noinspection DuplicatedCode
        try {
            if (akMan.matchingAccessKey(auth.rk, auth.ak)) {
                session = await(dbMan.createSession(akMan.getStudentFromAccessKey(
                    auth.rk, auth.rs, auth.ak
                )));

                var output;
                if (this.moduleOptions.requiredRight !== undefined) {
                    var rights = await session.getRights();

                    if (rights.includes(this.moduleOptions.requiredRight))
                        output = await(this.moduleOptions.processAPIRequest(log, session, req, res, managers, server));
                    else
                        output = new APIError("403-R", "The user does not have the right to access this endpoint.")
                } else
                    output = await(this.moduleOptions.processAPIRequest(log, session, req, res, managers, server));
                
                if (output instanceof APIError) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw output;
                } else {
                    if (output !== undefined && output._sent !== true)
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
        } finally {
            await(session.logout());
        }
    }

};