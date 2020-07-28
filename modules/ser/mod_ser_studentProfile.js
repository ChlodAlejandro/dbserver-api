"use strict";

const Constants = require("../../objects/Constants.js");
const AuthorizedModule = require("../../objects/AuthorizedModule.js");
const APIError = require("../../objects/APIError.js");

function objectLookup(object, regex) {
    var output = {};
    for (var e of Object.keys(object)) {
        output[e] = {...regex.exec(e), objectValue: object[e]};
    }
    return output.length === 0 ? null : output;
}

module.exports = new AuthorizedModule(
    {
        name: "Student Profile",
        sector: "Student Services",
        description:
            "Gets the profile information of a student, given their ID."
    },
    "/?services/student_?[Pp]rofile",
    {
        "200": "This page always returns its inputs."
    },
    {
        requiredRight: "home_personalProfile",
        processAPIRequest: async (log, session, req) => {
            var harvestMatrix;

            var options = {
                all: req.query.all || true,
                basic: req.query.basic,
                personal: req.query.personal,
                contact: req.query.contact,
                about: req.query.about,
                parents: req.query.parents
            };
          
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

            return { profile: await (session.executeRequest({
                method: "GET",
                url: Constants.URL.dbserver + "dbserver/Applications/UserInfo/index.php",
                params: {
                    studid: req.query.id || session.username
                }
            })
                .then(({data: profileHTML}) => {
                    var $ = require("cheerio").load(profileHTML);

                    var studentInfo = {};

                    var profileTable = $("table.profile tr");

                    var repeatLog = {};

                    studentInfo["id"] = /[0-9]{2}-[0-9]{5}/.exec($("table.border .polaroid .position").text())[0];
                    if (Object.prototype.hasOwnProperty.call(harvestMatrix, "Image"))
                        studentInfo["profileImage"] = Constants.URL.dbserver + "dbserver/" + $("table.border .polaroid img").attr("src").replace(/\.\.\//g, "");

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
			})) };
        }
    }
);