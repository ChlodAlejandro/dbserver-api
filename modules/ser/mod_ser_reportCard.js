"use strict";

const axios = require("axios");
const acjs = require("axios-cookiejar-support").default;

acjs(axios);

const AuthorizedModule = require("../../objects/AuthorizedModule.js");
const Constants = require("../../objects/Constants.js");

module.exports = new AuthorizedModule(
    {
        name: "Report Card",
        sector: "Student Services",
        description:
            "Shows the report card of a student."
    },
    "/?services/academic/report_?card",
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
		requiredRight: "apps_reportCard",
        processAPIRequest: async (log, session, req, res, managers) => {
			var finalOut = await(session.executeRequest({
                method: "GET",
                url: Constants.URL.dbserver + "dbserver/Applications/ReportCard/"
            })).then(({data: reportCard}) => {
                var $ = require("cheerio").load(reportCard);
                let schoolYear = /Schoo?l\sYear\s([0-9]+)-[0-9]+/gi.exec(reportCard)[1];

                //start at 3, count until hit GWA (colspan = 2)
                let complete = false;
                let currentRow = 3; // starts at 1
                let subjects = [];
                let gwa = {};
                let totalUnits = 1.0;

                while (!complete) {
                    var subjectRow = $("table.reportcardmain table.reportcard:nth-child(1) tr:nth-child(" + currentRow + ")");

                    if (subjectRow.children("td:nth-child(1)").attr("colspan") === "2") {
                        gwa.quarterly = {};
                        gwa.quarterly.q1 =
                            subjectRow.children("td:nth-child(2)").text() !== "" ?
                                +(subjectRow.children("td:nth-child(2)").text()) :
                                null;
                        gwa.quarterly.q2 =
                            subjectRow.children("td:nth-child(3)").text() !== "" ?
                                +(subjectRow.children("td:nth-child(3)").text()) :
                                null;
                        gwa.quarterly.q3 =
                            subjectRow.children("td:nth-child(4)").text() !== "" ?
                                +(subjectRow.children("td:nth-child(4)").text()) :
                                null;
                        gwa.quarterly.q4 =
                            subjectRow.children("td:nth-child(5)").text() !== "" ?
                                +(subjectRow.children("td:nth-child(5)").text()) :
                                null;
                        gwa.final =
                            subjectRow.children("td:nth-child(6)").text() !== "" ?
                                +(subjectRow.children("td:nth-child(6)").text()) :
                                null;
                        totalUnits = +(subjectRow.children("td:nth-child(7)").text());
                        complete = true;
                    } else {
                        var subjectName = subjectRow.children("td:nth-child(1)").text();
                        var subjectDescription = subjectRow.children("td:nth-child(2)").text();
                        var subjectQ1grade = subjectRow.children("td:nth-child(3)").text();
                        var subjectQ2grade = subjectRow.children("td:nth-child(4)").text();
                        var subjectQ3grade = subjectRow.children("td:nth-child(5)").text();
                        var subjectQ4grade = subjectRow.children("td:nth-child(6)").text();
                        var subjectFinalGrade = subjectRow.children("td:nth-child(7)").text();
                        var subjectUnits = subjectRow.children("td:nth-child(8)").text();

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
                    subjects: subjects,
                    schoolYear: schoolYear,
                    gwa: gwa,
                    totalUnits: totalUnits
                };

                return { reportCard: output };
            }).catch((err) => {
                console.error("Error occurred trying to make a request.");
                console.error(err);
                return err;
            });

            if (finalOut instanceof Error) {
                throw finalOut;
            } else {
                return finalOut;
            }
        }
    }
);
