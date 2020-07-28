const path = require("path");
const fs = require("fs-jetpack");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const APIError = require("./../objects/APIError.js");
const Manager = require("./../objects/Manager.js");
const Encryption = require("./../objects/Encryption.js");
const StudentData = require("./../objects/StudentData.js");

const SIX_MONTHS = 15768000000;

module.exports = class AccessKeyManager extends Manager {

    constructor(dataDirectory) {
        super();
        this.dataDir = dataDirectory;
        this.accessKeyIndex = {};

        this.name = "accessKeyManager";
        this.displayName = "Access Key Manager";
        this.desc = "The Access Key manager for the API. This manager is responsible for storing and retrieving access keys so users can use the DBServer API freely. The implementation of this also removes two problems with the DBServer, 1) Non-multiple logins, and 2) Insecure password transmission.";

        this.credentialsFolder = Manager.prototype.getDataFolder.call(this);
        this.initialize();
    }

    load() {
        console.log("Access Key Manager loaded.");
    }



    async setupDatabase() {
        console.log("Setting up access key database...");
        this.sqlite.prepare("CREATE TABLE `AccessKeys` (`RequestKey` CHAR(64) PRIMARY KEY NOT NULL, `AccessKey` CHAR(60) UNIQUE NOT NULL, `Username` CHAR(8) NOT NULL, `Password` CHAR(60) NOT NULL, `Registered` DATETIME NOT NULL, `Expiry` DATETIME NOT NULL)").run();
        console.log("Set up access key database.");
    }

    async enable() {
        if (fs.exists(path.join(this.credentialsFolder, "access_keys_killswitch"))) {
            console.log("Killswitch detected. Deleting access key database...");
            fs.remove(path.join(this.credentialsFolder, "access_keys.sqlite"));
            fs.remove(path.join(this.credentialsFolder, "access_keys_killswitch"));
        }

        this.sqlite = new (require("better-sqlite3"))(path.join(this.credentialsFolder, "access_keys.sqlite"));
        
        // check if db already set up
        var databaseCheck = this.sqlite.prepare("SELECT `name` FROM `sqlite_master` WHERE `type` = ? AND `name` = ?").get("table", "AccessKeys");

        if (databaseCheck === undefined)
            await(this.setupDatabase());

        this.enabled = true;
    }
    
    disable() {
        throw new Error("Cannot disable a critical manager.");
    }

    reload() {
        this.disable();
        this.enable();
    }

    hash(text) {
        return bcrypt.hashSync(text, saltRounds);
    }

    compareHashes(text, hash) {
        return bcrypt.compareSync(text, hash); // true
    }

    hasAccessKey(requestKey) {
        var rkr = this.sqlite.prepare("SELECT * FROM `AccessKeys` WHERE `RequestKey` = ?").get(requestKey);

        if (rkr !== undefined) {
            if (new Date(rkr["Expiry"]).getTime() < Date.now() + SIX_MONTHS) {
                this.sqlite.prepare("DELETE FROM `AccessKeys` WHERE `RequestKey` = ?").run(requestKey);
                return false;
            }
            return true;
        } else return false;
    }

    /**
     * create access key/read access key
     * 
     * pass as raw params
     */ 
    createAccessKey(requestKey, requestSecret, username, password) {
        if (requestKey.length < 64) {
            throw new APIError("400-L");
        }
      
        if (requestSecret.length < 16) {
            throw new APIError("400-L");
        } else if (requestSecret.length > 65535) {
            requestSecret = requestSecret.substring(0, 65535);
        }

        var enc_key;
        if (requestKey.length > 32)
            enc_key = requestKey.substring(requestKey.length - 32);
        else
            enc_key = requestKey;

        var keyRow = this.sqlite.prepare("SELECT * FROM `AccessKeys` WHERE `RequestKey` = ?").get(requestKey);
        var encryptedPassword = Encryption.encrypt(password, enc_key, requestSecret);
        var timestamp = Date.now();
        
        if (keyRow === undefined) {
            var accessKey = new (require("chance"))(requestKey).string({ length: 64, alpha: true, numeric: true, symbols: false });
            var encAccessKey = Encryption.encrypt(accessKey, enc_key, timestamp);

            this.sqlite.prepare("INSERT INTO `AccessKeys` (`RequestKey`, `AccessKey`, `Username`, `Password`, `Registered`, `Expiry`) VALUES (?, ?, ?, ?, ?, ?)").run(requestKey, encAccessKey, username, encryptedPassword, timestamp, Date.now() + 15768000000);

            return accessKey;
        } else {
            throw new APIError("400-KR");
        }
    }

    getAccessKey(requestKey, requestSecret, username, password) {
        var keyRow = this.sqlite.prepare("SELECT * FROM `AccessKeys` WHERE `RequestKey` = ?").get(requestKey);

        var enc_key;
        if (requestKey.length > 32)
            enc_key = requestKey.substring(requestKey.length - 32);
        else
            enc_key = requestKey;
        
        try {
            if (keyRow === undefined) {
                throw new APIError("404-RK");
            } else {
                if (Encryption.decrypt(keyRow["Password"], enc_key, requestSecret) === password) {
                    if (username === keyRow.Username) {
                        return Encryption.decrypt(keyRow.AccessKey, enc_key, new Date(keyRow["Registered"]).getTime());
                    } else 
                        throw new APIError("401-AU");
                } else
                    throw new APIError("401-AP");
            }
        } catch (e) {
            if (e.message.endsWith("bad decrypt"))
                throw new APIError("401-BD");
            else
                throw e;
        }
    }

    matchingAccessKey(requestKey, accessKey) {
        var keyRow = this.sqlite.prepare("SELECT * FROM `AccessKeys` WHERE `RequestKey` = ?").get(requestKey);

        var enc_key;
        if (requestKey.length > 32)
            enc_key = requestKey.substring(requestKey.length - 32);
        else
            enc_key = requestKey;
        
        try {
            if (keyRow === undefined) {
                throw new APIError("404-RK");
            } else
                return Encryption.decrypt(keyRow.AccessKey, enc_key, new Date(keyRow["Registered"]).getTime()) === accessKey;
        } catch (e) {
            if (e.message.endsWith("bad decrypt"))
                throw new APIError("401-BD");
            else
                throw e;
        }
    }

    getStudentFromAccessKey(requestKey, requestSecret, accessKey) {
        var keyRow = this.sqlite.prepare("SELECT * FROM `AccessKeys` WHERE `RequestKey` = ?").get(requestKey);

        var enc_key;
        if (requestKey.length > 32)
            enc_key = requestKey.substring(requestKey.length - 32);
        else
            enc_key = requestKey;
        
        try {
            if (keyRow === undefined) {
                throw new APIError("404-RK");
            } else {
                if (Encryption.decrypt(keyRow.AccessKey, enc_key, new Date(keyRow["Registered"]).getTime()) === accessKey) {
                    return new StudentData(
                        keyRow.Username,
                        Encryption.decrypt(keyRow["Password"], enc_key, requestSecret),
                        requestKey,
                        accessKey,
                        requestSecret
                    );
                } else
                    throw new APIError("401-AP");
            }
        } catch (e) {
            if (e.message.endsWith("bad decrypt"))
                throw new APIError("401-BD");
            else
                throw e;
        }
    }
};