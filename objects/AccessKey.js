module.exports = class AccessKey {

    constructor (hashedAccessKey, hashedRequestKey, studentID, expiry) {
        this.accessKey = hashedAccessKey;
        this.requestKey = hashedRequestKey;
        this.id = studentID;
        this.expiry = expiry;
    }

}