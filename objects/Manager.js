const fs = require("fs-jetpack");

module.exports = class Manager {

    initialize() {
        if (this.name === undefined && this.displayName === undefined && this.desc === undefined) {
            throw new Error("Manager extended incorrectly.");
        }

        console.log("Loading manager: \"" + this.name + "\"");
        if (typeof(this.load) === "function") this.load();
        else console.warn(this.name + "'s \"load\" is not a function.");
    }

    getDataFolder() {
        var path = require("path").join(__dirname, "..", ".data", this.name);
        var exists = require("fs-jetpack").exists(path);

        if (exists === "file" || exists === "other") {
            console.error("Data folder invalid. Creating new data folder...");
            fs.remove(this.credentialsFolder);
            fs.dir(this.credentialsFolder);
        } else if (exists === false)
            require("fs-jetpack").dir(path);

        return path;
    }

};