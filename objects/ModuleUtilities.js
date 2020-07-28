"use strict";

module.exports = class ModuleUtilities {

    static getTimestamp() {
        var date = new Date();
      
        var day = date.getDate();
        var month = date.getMonth() + 1; 
        var year = date.getFullYear(); 
      
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();
        var seconds = "0" + date.getSeconds();
    
        return month + "/" + day + "/" + year + " " + hours + ":" + minutes.substr(-2) + ":" + seconds.substr(-2) + " UTC";
    }

    static buildResponse(responseCode, data, options) {
        var stringify = true;
        var timestamp = true;

        if (typeof(options) === "boolean") {
            stringify = options;
        } else if (typeof(options) === "object") {
            stringify = options.stringify || stringify;
            timestamp = options.timestamp || timestamp;
        }
        
        var output = {
            code: responseCode + "",
            timestamp: timestamp = typeof(timestamp) === "boolean" ? (timestamp ? Date.now() : undefined) : (typeof(timestamp) === "number" ? timestamp : undefined),
            ...data
        };

        return stringify ? JSON.stringify(output) : output;
    }

    static buildErrorResponse(errorCode, customDesc, stringify = true) {
        var output = {
            code: errorCode + "",
            error: ModuleUtilities.getBasicError(errorCode, customDesc)
        };

        return stringify ? JSON.stringify(output) : output;
    }

    static getBasicError(errorCode, customDesc) {
        errorCode = errorCode + "";
        switch (errorCode) {
            case "400": {
                return {
                    err_code: 400,
                    err_name: "Bad Request",
                    err_desc:
                        customDesc || "The server might have not received the correct arguments for this endpoint."
                };
            }
            case "400-A": {
                return {
                    err_code: 400,
                    err_name: "Bad Authorization Header",
                    err_desc:
                        customDesc || "The provided authorization header or credentials are not valid."
                };
            }
            case "400-S": {
                return {
                    err_code: 400,
                    err_name: "Non-Student User",
                    err_desc:
                        customDesc || "The user credentials to be used or was logged in with is not a student."
                };
            }
            case "400-L": {
                return {
                    err_code: 400,
                    err_name: "Invalid Length",
                    err_desc:
                        customDesc || "The size of the arguments are invalid."
                };
            }
            case "400-C": {
                return {
                    err_code: 400,
                    err_name: "Invalid Characters",
                    err_desc:
                        customDesc || "The arguments provided contain invalid characters."
                };
            }
            case "400-KR": {
                return {
                    err_code: 400,
                    err_name: "Key Already Registered",
                    err_desc:
                        customDesc || "The given key is already registered."
                };
            }
            case "400-RK": {
                return {
                    err_code: 400,
                    err_name: "Bad Request Key",
                    err_desc:
                        customDesc || "The given key request key is either unknown, invalid, or disabled."
                };
            }
            case "401": {
                return {
                    err_code: 401,
                    err_name: "Unauthorized",
                    err_desc:
                        customDesc || "You are not given the proper authority to access this endpoint."
                };
            }
            case "401-C": {
                return {
                    err_code: 401,
                    err_name: "Unauthorized",
                    err_desc:
                        customDesc || "The reCAPTCHA was not answered correctly."
                };
            }
            case "401-U": {
                return {
                    err_code: 401,
                    err_name: "Invalid Username",
                    err_desc:
                        customDesc || "The username given is not valid."
                };
            }
            case "401-AU": {
                return {
                    err_code: 401,
                    err_name: "Access Key Mismatch",
                    err_desc:
                        customDesc || "The given access key is for a different user."
                };
            }
            case "401-AP": {
                return {
                    err_code: 401,
                    err_name: "Incorrect Password",
                    err_desc:
                        customDesc || "The given password provided is not correct."
                };
            }
            case "401-P": {
                return {
                    err_code: 401,
                    err_name: "Invalid Password",
                    err_desc:
                        customDesc || "The password given is not valid."
                };  
            }
            case "401-RK": {
                return {
                    err_code: 401,
                    err_name: "Invalid Request Key",
                    err_desc:
                        customDesc || "The request key provided is invalid."
                };  
            }
            case "401-AK": {
                return {
                    err_code: 401,
                    err_name: "Invalid Access Key",
                    err_desc:
                        customDesc || "The access key provided is invalid."
                };  
            }
            case "401-BD": {
                return {
                    err_code: 401,
                    err_name: "Bad Decryption",
                    err_desc:
                        customDesc || "An invalid access key, request key, request secret, password, or date (internal) caused a failed decryption."
                };  
            }
            case "403": {
                return {
                    err_code: 403,
                    err_name: "Forbidden",
                    err_desc:
                        customDesc || "You are not allowed to access this endpoint."
                };
            }
            case "403-A": {
                return {
                    err_code: 403,
                    err_name: "Not Authorized",
                    err_desc:
                        customDesc || "You are not allowed to access this endpoint. You may not be logged in."
                };
            }
            case "403-L": {
                return {
                    err_code: 403,
                    err_name: "Already Logged In",
                    err_desc:
                        customDesc || "The user specified is already logged into another session."
                };
            }
            case "403-B": {
                return {
                    err_code: 403,
                    err_name: "Banned",
                    err_desc:
                        customDesc || "This user has been banned."
                };
            }
            case "403-ED": {
                return {
                    err_code: 403,
                    err_name: "Expired Download Link",
                    err_desc:
                        customDesc || "This download link has already expired."
                };
            }
            case "403-R": {
                return {
                    err_code: 403,
                    err_name: "No Right",
                    err_desc: "The user does not have the rights to access this endpoint."
                }
            }
            case "404": {
                return {
                    err_code: 404,
                    err_name: "Not Found",
                    err_desc:
                        customDesc || "The server did not find a module that matches that endpoint."
                };
            }
            case "404-D": {
                return {
                    err_code: 404,
                    err_name: "Download Link Not Found",
                    err_desc:
                        customDesc || "The download link that you have provided is not valid or has not yet been registered."
                };
            }
            case "404-RK": {
                return {
                    err_code: 404,
                    err_name: "Request Key Not Found",
                    err_desc:
                        customDesc || "The server does not have this request key registered."
                };
            }
            case "405": {
                return {
                    err_code: 405,
                    err_name: "Method Not Allowed",
                    err_desc:
                        customDesc || "The request method used is not allowed for this endpoint."
                };
            }
            case "423": {
                return {
                    err_code: 423,
                    err_name: "Locked",
                    err_desc:
                        customDesc || "The resource being accessed is locked."
                };
            }
            case "423-D": {
                return {
                    err_code: 423,
                    err_name: "Deactivated",
                    err_desc:
                        customDesc || "The user being accessed has been deactivated."
                };
            }
            case "429": {
                return {
                    err_code: 429,
                    err_name: "Too Many Requests",
                    err_desc:
                        customDesc || "Slow down."
                };
            }
            case "500": {
                return {
                    err_code: 500,
                    err_name: "Internal Server Error",
                    err_desc:
                        customDesc || "The server failed to process the output of this endpoint correctly."
                };
            }
            case "503": {
                return {
                    err_code: 503,
                    err_name: "Service Unavailable",
                    err_desc:
                        customDesc || "The service being accessed is unavailable at the moment."
                };
            }
            case "503-D": {
                return {
                    err_code: 503,
                    err_name: "DBServer Unavailable",
                    err_desc:
                        customDesc || "The DBServer is either disconnected, unavailable, or is offline."
                };
            }
            case "503-M": {
                return {
                    err_code: 503,
                    err_name: "Module Disabled",
                    err_desc:
                        customDesc || "This module has been temporarily disabled."
                };
            }
            case "503-PD": {
                return {
                    err_code: 503,
                    err_name: "Module Permanently Disabled",
                    err_desc:
                        customDesc || "This module has been permanently disabled."
                };
            }
            default:
                return {
                    err_code: +(/^([0-9]+)/g.exec(errorCode)[1]),
                    err_name: "Unknown Error",
                    err_desc:
                        customDesc || "This error is not recognized in the DBSAPI Error Database."
                };
        }
    }

};