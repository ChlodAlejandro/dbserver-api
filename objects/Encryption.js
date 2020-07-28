"use strict";

const crypto = require("crypto");

const Chance = require("chance");

const ENCRYPTION_METHOD = "aes-256-cbc";
const IV_LENGTH = 32;

module.exports = class Encryption {

    static createIV(ivSeed) {
        var rng = new Chance(ivSeed);
        var randHex = "";
        while (randHex.length !== IV_LENGTH) {
            switch (rng.integer({min: 0, max: 15})) {
                case 0: randHex += "0"; break;
                case 1: randHex += "1"; break;
                case 2: randHex += "2"; break;
                case 3: randHex += "3"; break;
                case 4: randHex += "4"; break;
                case 5: randHex += "5"; break;
                case 6: randHex += "6"; break;
                case 7: randHex += "7"; break;
                case 8: randHex += "8"; break;
                case 9: randHex += "9"; break;
                case 10: randHex += "A"; break;
                case 11: randHex += "B"; break;
                case 12: randHex += "C"; break;
                case 13: randHex += "D"; break;
                case 14: randHex += "E"; break;
                case 15: randHex += "F"; break;
            }
        }
        return Buffer.from(randHex, "hex");
    }

    static encrypt(value, key, ivSeed) {
        var iv = Encryption.createIV(ivSeed);
        let cipher = crypto.createCipheriv(ENCRYPTION_METHOD, key, iv);
        let encrypted = cipher.update(value, "utf8", "base64");
        encrypted += cipher.final("base64");
        return encrypted;
    }

    static decrypt(encrypted, key, ivSeed) {
        var iv = Encryption.createIV(ivSeed);
        let decipher = crypto.createDecipheriv(ENCRYPTION_METHOD, key, iv);
        let decrypted = decipher.update(encrypted, "base64", "utf8");
        return (decrypted + decipher.final("utf8"));
    }

};