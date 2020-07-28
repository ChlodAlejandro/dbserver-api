const ModuleUtilities = require("./ModuleUtilities.js");

module.exports = class APIError extends Error {

    constructor(code, message) {
        super();
        this.code = code;
        this.error = ModuleUtilities.getBasicError(code);
        this.message = message || this.error.err_desc;
        this.name = this.error.err_name;
    }

};