"use strict";

const path = require("path");
const express = require("express");
const axios = require("axios");
const fs = require("fs-jetpack");

require("log-timestamp");

const Module = require("./objects/Module.js");
const ModuleUtilities = require("./objects/ModuleUtilities.js");
const Logger = require("./objects/Logger.js");
const Constants  = require("./objects/Constants.js");

// sets custom UA
Object.assign(axios.defaults.headers, {common: {"user-agent": Constants.App.userAgent}});
// assign global querystring function
global.qs = require("querystring").stringify;

const moduleIgnoreRegex = /ignore|archive/gi;
const pathLogIgnoreRegex = /\/?(favicon\.ico|css|scripts|images|.+\.css$|.+\.js$)/gi;

var log = new Logger(path.join(__dirname, "logs"));

class DBServerAPIServer {

    async deleteTempDirectory() {
        fs.remove(".data/temp");
        fs.dir(".data/temp");
    }

    getWebRequestManagers() {
        var output = {};
        for (var manager in this.managers) {
            output[this.managers[manager].name] = this.managers[manager];
        }
        return output;
    }

    searchForPathInModules(path) {
        for (var m of this.modules) {
            if (m.listenOn.test(path))
                return m;
        }
    }

    gatherModules(directory) {
        var foundModules = require("fs-jetpack").inspectTree(directory);

        var childModules = [];

        for (var childModule of foundModules.children) {
            if (childModule !== undefined) {
                if (childModule.type === "dir" && !moduleIgnoreRegex.test(childModule.name))
                    childModules = [...childModules, ...this.gatherModules(path.join(directory, childModule.name))];

                if (childModule.type === "file") {
                    var module = require("./" + path.join(directory, childModule.name));
                    if (module.constructor.prototype instanceof Module || module instanceof Module)
                        childModules.push(module);
                    else
                        module = undefined;
                }
            }
        }

        return childModules;
    }

    getExportPackage() {
        return {
            managers: this.getWebRequestManagers(),
            modules: this.modules
        };
    }

    async start() {
        console.log("[!] App started at " + ModuleUtilities.getTimestamp());

        // delete all temp files
        this.deleteTempDirectory();

        // create the router and app
        this.app = express();
        this.router = express.Router({ caseSensitive: true });
        this.app.use(this.router);

        this.router.use(require("express-useragent").express());
        this.router.use(require("cookie-parser")());
        this.router.use(express.json());
        this.router.use(express.urlencoded({ extended: true }));
        this.router.use("/interface", express.static("interface"));
        this.router.use("/css", express.static("cdn/css"));
        this.router.use("/scripts", express.static("cdn/scripts"));
        this.router.use("/images", express.static("cdn/images"));

        // get the server IP
        var myIp = "";
        myIp = await(axios.get("https://api.ipify.org?format=json", {responseType: "json", })
            .then(({data: ip}) => { return ip["ip"]; })
            .catch(e => {
                log.write("Failed to catch public IP address.", {
                    error: e.message,
                    stack: e
                });
                return "127.0.0.1";
            }));
        require("fs-jetpack").write(".data/ip_address", myIp);

        // gather the modules
        this.modules = this.gatherModules("modules");

        // start the managers
        this.managers = [ // extended manager objects
            new (require("./managers/man_acc_accessKeyManager.js"))(),
            new (require("./managers/man_acc_dbSessionManager.js"))(),
            new (require("./managers/man_fsf_downloadLinkGenerator.js"))()
        ];

        this.router.all("*", async (req, res) => {
            var ip = (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0] : req.connection.remoteAddress);
            var searchTries = 0;
            var foundModule = false;

            var out_log = !pathLogIgnoreRegex.test(req.path) && !(req.path === "/util/log" && req.cookies["accessUser"] !== "myskinnypenis");

            console.log("[" + ip + "|" + ModuleUtilities.getTimestamp() + "] Locating module for " + req.path + "...");

            do {
                var module = this.searchForPathInModules(req.path);

                if (module !== undefined) {
                    foundModule = true;
                    console.log("Received request from " + ip + (ip === myIp ? " (that's me!)" : ""));
                    if (out_log) {
                        log.write("Receiving connection from " + (ip === myIp ? "self" : ip), {
                            "Path": req.path,
                            "User Agent": req.useragent.source,
                            "Found": true
                        });
                    }

                    if (module.active)
                        module.processWebRequest(
                            log, req, res,
                            this.getWebRequestManagers(), this);
                    else {
                        res.set("Content-Type", "application/json");
                        res.send(ModuleUtilities.buildErrorResponse("503-M"));
                    }
                }
                searchTries++;
            } while (searchTries < 4 && !foundModule);

            if (!foundModule) {
                console.log("[" + ip + "|" + ModuleUtilities.getTimestamp() + "] Module not found for path: " + req.path);
            }

            if (!foundModule) {
                log.write("Receiving connection from " + (ip === myIp ? "self" : ip), {
                    "Path": req.path,
                    "User Agent": req.useragent.source,
                    "Found": false
                });
                res.set("Content-Type", "application/json");
                res.send(ModuleUtilities.buildErrorResponse(404));
            }
        });

        await this.enableManagers();
        await this.enableModules();

        this.listener = require("https").createServer({
			ca: fs.read(Constants.SSL.chainPath),
			key: fs.read(Constants.SSL.keyPath),
			cert: fs.read(Constants.SSL.certificatePath)
		}, this.app);

        this.listener.listen(Constants.App.port, async () => {
            console.log("App is listening on port " + this.listener.address().port);
            console.log("App is on IP: " + myIp);
        });
    }

    async enableManagers() {
        for (var managerIndex in this.managers)
            await(this.managers[managerIndex].enable());
    }

    async disableManagers() {
        for (var managerIndex in this.managers)
            await(this.managers[managerIndex].disable());
    }

    async enableModules() {
        for (var moduleIndex in this.modules)
            await(this.modules[moduleIndex].enable(false));
    }

    async disableModules() {
        for (var moduleIndex in this.modules)
            await(this.modules[moduleIndex].disable());
    }

}

(new DBServerAPIServer()).start();