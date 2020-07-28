"use strict";

const axios = require("axios");
const acjs = require("axios-cookiejar-support").default;

acjs(axios);


const AuthorizedModule = require("../../objects/AuthorizedModule.js");
const APIError = require("../../objects/APIError.js");

module.exports = new AuthorizedModule(
    {
        name: "Detailed Report Card",
        sector: "Student Services",
        description:
            "Shows the detailed report card of a student, which includes grades before deliberations."
    },
    "/?services/academic/advanced_report_card",
    {
        "200-H": "If the request was successful and the result is an HTML file.",
        "200-J": "If the request was successful and the result is a JSON file.",
        "400": "If the specified arguments are incomplete.",
        "405": "If the method specified is not allowed.",
        "400-S": "If the user provided does not match an ID number or if the user is a student.",
        "401-C": "If the reCAPTCHA was not submitted successfully.",
        "401-U": "If the user provided an invalid username.",
        "401-P": "If the user provided an invalid password.",
        "403-L": "If the user has already logged in in another session.",
        "403-B": "If the user has been banned.",
        "423-D": "If the user was found but has been deactivated.",
        "503-D": "If the DBServer is offline or unavailable."
    },
    {
        processAPIRequest: async (log, session) => {
			throw new APIError(404);
            var profile = await session.getProfile({basic: true});

            var section = 0;
            switch (profile["schoolYear"]) {
                case "2017-2018": {
                    section += (6 * 3) - 3;
                    break;
                }
                case "2018-2019": {
                    section += 2 * (6 * 3) - 3;
                    break;
                }
                case "2019-2020": {
                    section += 3 * (6 * 3) - 3;
                    break;
                }
                case "2020-2021": {
                    section += 4 * (6 * 3) - 3;
                    break;
                }
                case "2021-2022": {
                    section += 5 * (6 * 3) - 3;
                    break;
                }
                default: {
                    section += 0;
                    break;
                }
            }
            switch (profile["studentSection"]) {
                case "7-AMETHYST": { section += 1; break; }
                case "7-DIAMOND": { section += 2; break; }
                case "7-RUBY": { section += 3; break; }
                case "8-CHAMPACA": { section += 4; break; }
                case "8-JASMINE": { section += 5; break; }
                case "8-ROSAL": { section += 6; break; }
                case "9-CURIUM": { section += 7; break; }
                case "9-EINSTEINIUM": { section += 8; break; }
                case "9-FERMIUM": { section += 9; break; }
                case "10-GLUON": { section += 10; break; }
                case "10-GRAVITON": { section += 11; break; }
                case "10-MUON": { section += 12; break; }
                case "11-ALTAIR": { section += 13; break; }
                case "11-POLARIS": { section += 14; break; }
                case "11-SPICA": { section += 15; break; }
                case "12-ANDROMEDA": { section += 16; break; }
                case "12-CASSIOPEIA": { section += 17; break; }
                case "12-ERIDANI": { section += 18; break; }
            }

            var cookiejar = new (require("tough-cookie")).CookieJar();

            var {data: session_request} = await axios.post(
                "https://dbserver-portal.online/Applications/ClassExplorer/save_to_session.php",
                qs({
                    schoolyear: profile["schoolYear"],
                    studid: profile["id"],
                    id: section
                }),
                { responseType: "json", withCredentials: true, jar: cookiejar }
            );

            if (session_request instanceof Error) return new APIError(500, session_request.message);

            var {data: reportCard} = await axios.get(
                "https://dbserver-portal.online/Applications/ClassExplorer/egrade.php",
                {
                    responseType: "text",
                    withCredentials: true,
                    jar: cookiejar
                });

            if (reportCard instanceof Error) return new APIError(500, session_request.message);

            var $ = require("cheerio").load(reportCard);

            //start at 3, count until hit GWA (colspan = 2)
            let complete = false;
            let currentRow = 3; // starts at 1
            let subjects = [];
            let gwa = {};
            let totalUnits = 1.0;

            while (!complete) {
                var subjectRow = $("table.reportcardmain table.reportcard:nth-child(1) tr:nth-child(" + currentRow + ")");

                if (subjectRow.children(".data2:nth-child(1)").attr("colspan") === "2") {
                    gwa.quarterly = {};
                    gwa.quarterly.q1 =
                        subjectRow.children(".data3:nth-child(2)").text() !== "" ?
                            +(subjectRow.children(".data3:nth-child(2)").text()) :
                            null;
                    gwa.quarterly.q2 =
                        subjectRow.children(".data3:nth-child(3)").text() !== "" ?
                            +(subjectRow.children(".data3:nth-child(3)").text()) :
                            null;
                    gwa.quarterly.q3 =
                        subjectRow.children(".data3:nth-child(4)").text() !== "" ?
                            +(subjectRow.children(".data3:nth-child(4)").text()) :
                            null;
                    gwa.quarterly.q4 =
                        subjectRow.children(".data3:nth-child(5)").text() !== "" ?
                            +(subjectRow.children(".data3:nth-child(5)").text()) :
                            null;
                    gwa.final =
                        subjectRow.children(".data3:nth-child(6)").text() !== "" ?
                            +(subjectRow.children(".data3:nth-child(6)").text()) :
                            null;
                    totalUnits = +(subjectRow.children(".data2:nth-child(7)").text());
                    complete = true;
                } else {
                    var subjectName = subjectRow.children(".data2:nth-child(1)").text();
                    var subjectDescription = subjectRow.children(".data2:nth-child(2)").text();
                    var subjectQ1grade = subjectRow.children(":nth-child(3)").text();
                    var subjectQ2grade = subjectRow.children(":nth-child(4)").text();
                    var subjectQ3grade = subjectRow.children(":nth-child(5)").text();
                    var subjectQ4grade = subjectRow.children(":nth-child(6)").text();
                    var subjectFinalGrade = subjectRow.children(":nth-child(7)").text();
                    var subjectUnits = subjectRow.children(".data2:nth-child(8)").text();

                    subjects.push({
                        subject: subjectName,
                        code: subjectName.replace(/[0-9]*$/gi, ""),
                        year: subjectName.replace(/^[A-Za-z]*/gi, ""),
                        description: subjectDescription,
                        grades: {
                            q1: subjectQ1grade === "" ? null : +(subjectQ1grade),
                            q2: subjectQ2grade === "" ? null : +(subjectQ2grade),
                            q3: subjectQ3grade === "" ? null : +(subjectQ3grade),
                            q4: subjectQ4grade === "" ? null : +(subjectQ4grade)
                        },
                        finalGrade: subjectFinalGrade === "" ? null : +(subjectFinalGrade),
                        units: +(subjectUnits)
                    });
                    currentRow++;
                }
            }

            let output = {
                reportCard: {
                    subjects: subjects,
                    schoolYear: profile["schoolYear"],
                    gwa: gwa,
                    totalUnits: totalUnits
                }
            };

            log.write("Requesting ADVANCED report card access", {
                "ID": profile.id,
                "Name": profile.profileName,
                "Success": {
                    state: true
                }
            });

            return output;
        }
    }
);
