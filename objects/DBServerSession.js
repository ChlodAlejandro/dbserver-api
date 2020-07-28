const axios = require("axios");

const acjs = require("axios-cookiejar-support").default;

acjs(axios);

const Constants = require("./../objects/Constants.js");
const APIError = require("./../objects/APIError.js");
const Utilities = require("./../objects/Utilities.js");

function objectLookup(object, regex) {
    var output = {};
    for (var e of Object.keys(object)) {
        output[e] = {...regex.exec(e), objectValue: object[e]};
    }
    return output.length === 0 ? null : output;
}

module.exports = class DBServerSession {

    constructor(studentData, sessionID, cookieJar) {
        this.studentData = studentData;
        this.sessionID = sessionID;
        this.username = studentData.id;
        this.password = studentData.password;
        this.cookieJar = cookieJar;
        this.active = false;

        this.logoutAttempts = 0;
    }

    async login() {
        return await (axios.post(
            Constants.URL.dbserver + "dbserver/login.php",
            qs({
                username: this.username,
                password: this.password
            }),
            {
                responseType: "json",
                withCredentials: true,
                jar: this.cookieJar
            }
        )
            .then(async ({data: loginRequestRes}) => {
                if (loginRequestRes["login"] !== 6) {
                    switch (loginRequestRes["login"]) {
                        case 1: {
                            throw new APIError("401-U");
                        }
                        case 2: {
                            throw new APIError("423-D");
                        }
                        case 3: {
                            throw new APIError("401-P");
                        }
                        case 4: {
                            throw new APIError("403-L");
                        }
                        case 5: {
                            throw new APIError("403-B");
                        }
                    }
                    return false;
                } else if (loginRequestRes["usertype"] !== 4) {
                    this.logout();
                    throw new APIError("400-S");
                } else {
                    return true;
                }
            })
            .catch((err) => {
                if (err instanceof APIError)
                    throw err;

                console.error("Error occurred trying to make a request.");
                console.error(err);
            }));
    }

    async logout() {
        if (this.logoutAttempts > 8) {
            this.logoutAttempts = 0;
            return;
        }

        await(axios.get(Constants.URL.dbserver + "dbserver/messages/logout.php",
            {
                responseType: "text",
                withCredentials: true,
                jar: this.cookieJar
            }
        ).then(() => {
            this.logoutAttempts = 0;
        }).catch(async (err) => {
            console.error("Failed to log out user. Retrying...");
            console.error(err);
            await(this.logout());
        }));
    }

    // noinspection DuplicatedCode
    async getProfile(options = {basic: true, personal: true, contact: true}) {
        if (typeof(options) != "object") {
            throw new Error("Options not of type Object");
        }
        var harvestMatrix = {};

        if (options.all || options.basic) {
            harvestMatrix = {
                ...harvestMatrix, 
                "School Year": "schoolYear",
                "Image": "profileImage",
                "Account Name": "profileName",
                "Grade-Section": "studentSection",
                "Sex": "profileSex",
                "Account Type": "accountType"
            };
        }
        if (options.all || options.personal) {
            harvestMatrix = {
                ...harvestMatrix,
                "Birthdate": "profileBirthdate",
                "Belief / Affiliations": "profileBelief",
                "Town": "contactTown",
                "Province": "contactProvince"
            };
        }
        if (options.all || options.contact) {
            harvestMatrix = {
                ...harvestMatrix,
                "0#Mobile": "contactPhone",
                "Email": "contactEmail"
            };
        }
        if (options.all || options.about) {
            harvestMatrix = {
                ...harvestMatrix,
                "Hobbies": "hobbies",
                "Interest": "interests",
                "Sports": "sports"
            };
        }
        if (options.all || options.parents) {
            harvestMatrix = {
                ...harvestMatrix,
                "Father": "father",
                "0#Occupation": "fatherOccupation",
                "1#Mobile": "fatherMobile",
                "Mother": "mother",
                "1#Occupation": "motherOccupation",
                "2#Mobile": "motherMobile",
                "Guardian": "guardian",
                "3#Mobile": "guardianMobile"
            };
        }

        return await (axios.get(Constants.URL.dbserver + "dbserver/userinfo.php",
            {
                responseType: "text",
                withCredentials: true,
                jar: this.cookieJar
            })
            .then(({data: mainPageHTML}) => {
                var $ = require("cheerio").load(mainPageHTML);

                var studentInfo = {};

                var profileTable = $("table.profile#rightPane tr");

                var repeatLog = {};

                studentInfo["id"] = /[0-9]{2}-[0-9]{5}/.exec($("table.border .polaroid .position").text())[0];
                if (Object.prototype.hasOwnProperty.call(harvestMatrix, "Image"))
                    studentInfo["profileImage"] = Constants.URL.dbserver + "dbserver/" + $("table.border .polaroid img").attr("src");

                if (studentInfo["id"] === "16-01375") {
                    studentInfo["profileImage"] = "https://ralsei.chlod.net/images/dev01.png";
                }

                profileTable.each((i, element) => {
                    let labelText = $(element).children(".label").text();

                    if (Object.prototype.hasOwnProperty.call(harvestMatrix, labelText) && studentInfo[harvestMatrix[labelText]] === undefined) {
                        studentInfo[harvestMatrix[labelText]] =
                            $(element).children(":nth-child(2)").text();
                        return;
                    }

                    var multiLookup = objectLookup(harvestMatrix, new RegExp(`[0-9]+#(${labelText})`, "gi"));

                    if (multiLookup !== undefined) {
                        if (repeatLog[labelText] === undefined)
                            repeatLog[labelText] = 0;

                        for (var occurenceCheck in multiLookup) {
                            if (occurenceCheck === `${repeatLog[labelText]}#${labelText}`) {
                                studentInfo[multiLookup[occurenceCheck].objectValue] =
                                    $(element).children(":nth-child(2)").text();
                            }
                        }

                        repeatLog[labelText]++;
                    }
                });

                return studentInfo;
            })
            .catch((err) => {
                console.error("Error occurred trying to make a request.");
                console.error(err);
                throw new APIError("500");
            }));
    }
	
	async getRights() {
        return await (axios.get(Constants.URL.dbserver + "dbserver/main.php", {
            responseType: "text",
            withCredentials: true,
            jar: this.cookieJar
        })
            .then(({data: mainPageHTML}) => {
                var $ = require("cheerio").load(mainPageHTML);
                var navigationSidebar = $("#nav");

                var studentRights = [];

                navigationSidebar.children().each((coli, colel) => {
                    var categoryName = "";
                    var category = $(colel).find("> a").text().trim();
                    category = Utilities.transmute(category, Utilities.getSidebarCategoryTransmutationTable())
                        .replace(/\([^)]+\)/g, "")
                        .replace(/['"]/g, "")
                        .replace(/&/g, "and")
                        .replace(/[^A-Za-z0-9]/g, " ")
                        .replace(/\s{2,}/g, " ")
                        .trim();

                    for (var word of category.split(" ")) {
                        if (categoryName.length === 0)
                            categoryName += word.toLowerCase();
                        else
                            categoryName += word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
                    }

                    var categoryObjectsList = $(colel).find("ul");
                    categoryObjectsList.children((i, el) => {
                        var rightName = $(el).text().trim();

                        rightName = rightName
                            .replace(/\(([^)]+)\)/g, "$1")
                            .replace(/['"]/g, "")
                            .replace(/&/g, "and")
                            .replace(/[^A-Za-z0-9]/g, " ")
                            .replace(/\s{2,}/g, " ")
                            .trim();

                        var right = "";
                        for (var word of rightName.split(" ")) {
                            if (right.length === 0)
                                right += word.toLowerCase();
                            else
                                right += word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
                        }

                        studentRights.push(`${categoryName}_${Utilities.transmute(right, Utilities.getMenuTransmutationTable())}`);
                    });
                });

                return studentRights;
            })
            .catch((err) => {
                console.error("Error occurred trying to make a request.");
                console.error(err);
                throw new APIError("500");
            }));
	}

    executeRequest(requestSettings) {
        var request_settings = requestSettings;
        request_settings.withCredentials = true;
        request_settings.jar = this.cookieJar;

        return axios(request_settings);
    }

    // chlod fix this
    executeRequestRaw(requestSettings) {
        var request_settings = requestSettings;
        // request_settings["headers"] = this.cookieJar;

        return (require("request"))(request_settings);
    }
};