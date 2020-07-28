"use strict";

module.exports = class StudentData {
    
    constructor(studID, plainPassword, requestKey, accessKey, requestSecret) {
        this.id = studID;
        this.password = plainPassword;
        this.requestKey = requestKey;
        this.accessKey = accessKey;
        this.requestSecret = requestSecret;
    }

    toObject() {
        return {
            id: this.id,
            password: this.password
        };
    }

    destroy() {
        this.id = undefined;
        this.password = undefined;
        this.requestKey = undefined;
        this.accessKey = undefined;
        this.requestSecret = undefined;
    }

};