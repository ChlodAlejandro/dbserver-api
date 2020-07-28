"use strict";

const Module = require("../../objects/Module.js");
const APIError = require("../../objects/APIError.js");
const ModuleUtilities = require("../../objects/ModuleUtilities.js");
const DBServer = require("../../objects/DBServer.js");

module.exports = new Module(
    {
        name: "Student Authorizer",
        sector: "DBServer API Utilities",
        description:
            "Logs the student in and returns the student information and access key."
    },
    "/?account/((get_)?access_key|authorize)",
    {
        "200": "If the user was verified successfully.",
        "400": "If the specified arguments are incomplete.",
        "405": "If the method specified is not allowed.",
        "400-S": "If the user provided does not match an ID number or if the user is a student.",
        "401-U": "If the user provided an invalid username.",
        "401-P": "If the user provided an invalid password.",
        "401-S": "If the user provided the incorrect secret password.",
        "403-L": "If the user has already logged in in another session.",
        "403-B": "If the user has been banned.",
        "423-D": "If the user was found but has been deactivated.",
        "503-D": "If the DBServer is offline or unavailable."
    },
    {
        processWebRequest: async (log, req, res, managers) => {
            let ip = (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0] : req.connection.remoteAddress);

            res.set("Content-Type", "application/json");
            
            if (!await(DBServer.getDBServerState())) {
                res.send(ModuleUtilities.buildErrorResponse("500-D"));
                return;
            }
            if (req.method !== "POST") {
                res.send(ModuleUtilities.buildErrorResponse(405));
                return;
            }
            log.write("Access key request incoming:", {
                "IP Address": ip,
                "username": req.body.username,
                "requestKey": req.body.requestKey,
            });
            if (req.body.username === undefined
                || req.body.password === undefined
                || req.body.requestKey === undefined
                || req.body.requestSecret === undefined) {
                res.send(ModuleUtilities.buildErrorResponse(400));
                return;
            }
            if (!/[0-9]{2}-[0-9]{5}/gi.test(req.body.username)) {
                res.send(ModuleUtilities.buildErrorResponse("400-S"));
                return;
            }

            var dbMan = managers["dbSessionManager"];
            var akMan = managers["accessKeyManager"];

            var ak, studInfo, session;
            try {
                if (akMan.hasAccessKey(req.body.requestKey))
                    ak = akMan.getAccessKey(req.body.requestKey, req.body.requestSecret, req.body.username, req.body.password);
                else
                    ak = akMan.createAccessKey(req.body.requestKey, req.body.requestSecret, req.body.username, req.body.password);

                session = await(dbMan.createSession(akMan.getStudentFromAccessKey(
                    req.body.requestKey, req.body.requestSecret, ak
                )));
    
                studInfo = await(session.getProfile({basic: true}));
                await(session.logout());
            } catch (err) {
                if (err instanceof APIError) {
                    log.write("Requesting access key", {
                        "IP Address": ip,
                        "Username": req.body.username,
                        "Success": {
                            state: false,
                            reason: `${err.name} - ${err.message}`
                        }
                    });
                    res.send(ModuleUtilities.buildErrorResponse(err.code, err.message));
                    return;
                } else {
                    log.write("Requesting access key", {
                        "IP Address": ip,
                        "Username": req.body.username,
                        "Success": {
                            state: false,
                            reason: `${err.name} - ${err.message}`
                        }
                    });
                    res.send(ModuleUtilities.buildErrorResponse(500, err.message));
                    return;
                }
            }

            log.write("Requesting access key", {
                "IP Address": ip,
                "Username": req.body.username,
                "Name": studInfo.profileName,
                "Section": studInfo.studentSection,
                "Success": {
                    state: true
                }
            });

            res.send(ModuleUtilities.buildResponse(200, { accessKey: ak, student: studInfo }));
        }
    }
);
