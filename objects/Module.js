"use strict";

module.exports = class Module {

    constructor(info, listenOn, returns, moduleOptions) {
        if (info === undefined || info.name === undefined || info.sector === undefined || info.description === undefined
            || returns === undefined|| listenOn === undefined || moduleOptions === undefined)
            throw new Error("Illegal arguments.");

        this.name = info.name;
        this.sector = info.sector;
        this.description = info.description;
        this.listenOn = listenOn instanceof RegExp ? listenOn : new RegExp(listenOn, "gi");
        this.returns = returns;
        this.active = false;

        this.moduleOptions = moduleOptions;

        console.log("Loading module: \"" + this.name + "\"");
        if (this.moduleOptions.load !== undefined) this.moduleOptions.load();
    }

    getTechnicalName() {
        return (this.name.charAt(0).toLowerCase() + this.name.substring(1)).replace(/\s/g, "");
    }

    enable(verbose = true) {
        if (verbose) console.log("Enabling module: \"" + this.name + "\"");
        var result = this.moduleOptions.enable === undefined ? true : this.moduleOptions.enable();

        if (result === undefined)
            throw new Error("\"" + this.name + "\" enable function did not return a boolean.");

        this.active = result;
        if (this.active) {
            if (verbose)
                console.log("Enabled module: \"" + this.name + "\"");
        } else
            console.error("Failed to enable module: \"" + this.name + "\"");
        return this.active;
    }

    disable(verbose = true) {
        if (this.moduleOptions.disable === undefined)
            throw new Error("Module does not have a definition for \"disable\".");

        if (verbose) console.log("Disabling module: \"" + this.name + "\"");
        var result = this.moduleOptions.enable === undefined ? true : this.moduleOptions.disable();

        if (result === undefined)
            throw new Error("\"" + this.name + "\" disable function did not return a boolean.");

        this.active = !result;
        if (this.active) {
            if (verbose)
                console.log("Disabled module: \"" + this.name + "\"");
        } else
            console.log("Failed to disable module: \"" + this.name + "\"");
        return this.active;
    }

    processWebRequest(log, request, response, managers, server) {
        if (this.moduleOptions.processWebRequest === undefined)
            throw new Error("Module does not have a definition for \"processWebRequest\".");

        this.moduleOptions.processWebRequest(log, request, response, managers, server);
    }

};