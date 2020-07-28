var fs = require("fs-jetpack");
var path = require("path");

// const stackRegex = /([^\s]+(?:\s\[[^[\]]+\])?)\s\((?:(?:([^():]+):([^():]+):([^():]+))|(<anonymous>))\)/gi;

function titleCase(str) {
    var splitStr = str.toLowerCase().split(" ");
    for (var i = 0; i < splitStr.length; i++) {
        splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
    }
    return splitStr.join(" "); 
}

module.exports = class Logger {
    
    constructor(dataLocation) {
        this.logLocation = path.resolve(path.join(dataLocation, "log.dat"));
    }

    write(message, extras) {
        var logData = { message: message, extras: extras };

        if (message === undefined)
            throw new Error("Log message is not defined.");

        // get timestamp

        logData.time = Date.now();

        console.log(message);

        if (extras === undefined)
            console.warn("This object does not contain extras.");
        else {
            for (let eK in extras) {
                console.log("\t" + eK + ": " + 
                (typeof(extras[eK]) === "object" ? JSON.stringify(extras[eK]) : extras[eK]));
            }
        }

        // convert names
        var newExtras = {};
        for (let eK in logData.extras) {
            newExtras[eK.replace(/\t|\s| /g, "").toLowerCase().substring(0, 1)
                + titleCase(eK).replace(/\t|\s| /g, "").substring(1).trim()] = logData.extras[eK];
        }
        logData.extras = newExtras;

        fs.append(this.logLocation, JSON.stringify(logData) + "\n");
    }

};