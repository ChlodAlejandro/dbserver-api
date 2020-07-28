const DBServerSession = require("./../objects/DBServerSession.js");
const Manager = require("./../objects/Manager.js");

module.exports = class DBServerSessionManager extends Manager {
  
    constructor() {
        super();
        
        this.name = "dbSessionManager";
        this.displayName = "DBServer Session Manager";
        this.desc = "Managers DBServer connections. This manager logs in a DBServer user, and logs them out once the session is complete. Session usually last for the duration of an action. This manager is made such that the user does not have to log in multiple times to do certain actions.";

        this.sessions = {};
    }

    enable() {
        console.log("DBServer Session Manager enabled.");
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
        throw new Error("Cannot disable a critical manager.");
    }

    async createSession(studentData) {
        var sessionID = (new (require("chance"))()).string({ length: 32, alpha: true, numeric: true, symbols: false });

        this.sessions[sessionID] = new DBServerSession(studentData, sessionID, new (require("tough-cookie")).CookieJar());
        if (await(this.sessions[sessionID].login())) {
            return this.sessions[sessionID];
        } else {
            await(this.sessions[sessionID].logout());
            this.sessions[sessionID] = undefined;
            return undefined;
        }
    }

    async destroySession(sessionID) {
        await(this.sessions[sessionID].logout());
        this.sessions[sessionID] = undefined;
    }

};