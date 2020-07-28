"use strict";

const AuthorizedModule = require("../../objects/AuthorizedModule.js");
const Constants = require("../../objects/Constants.js");
const DBServer = require("../../objects/DBServer.js");

module.exports = new AuthorizedModule(
    {
        name: "Student Body",
        sector: "Student Services",
        description:
            "Returns a list of all students."
    },
    "/?services/(student(_body|s))|studb?info",
    {
        "200": "Returns."
    },
    {
        processAPIRequest: async (log, session, req) => {
            var $ = (require("cheerio")).load((await(session.executeRequest({
                method: "GET",
                url: DBServer.getDBServerLink("live/studbinfo"),
                responseType: "text"
            }))).data);

            var students;
            if (req.query.formatted === "true") {
                students = [];
                $("#student_data").children().each((i, el) => {
                    if (el.tagName !== "tr")
                        return;
					if ($(el).find(":nth-child(8)").text() === "-")
						return;

                    var grsec = $(el).find(":nth-child(8)").text().split("-");
                    students.push({
                        id: $(el).find(":nth-child(2)").text(),
                        fname: $(el).find(":nth-child(3)").text().toUpperCase(),
                        gname: $(el).find(":nth-child(4)").text(),
                        mi: $(el).find(":nth-child(5)").text(),
						gender: $(el).find(":nth-child(6)").text(),
                        grade: grsec[0],
                        section: grsec[1]
                    });
                });
            } else {
                students = {
                    format: ["id", "fname", "gname", "mi", "gender", "grade", "section"],
                    values: []
                };

                $("#student_data").children().each((i, el) => {
                    if (el.tagName !== "tr")
                        return;
					if ($(el).find(":nth-child(8)").text() === "-")
						return;

                    var grsec = $(el).find(":nth-child(8)").text().split("-");
                    students.values.push([
                        $(el).find(":nth-child(2)").text(),
                        $(el).find(":nth-child(3)").text().toUpperCase(),
                        $(el).find(":nth-child(4)").text(),
                        $(el).find(":nth-child(5)").text(),
						$(el).find(":nth-child(6)").text(),
                        grsec[0],
                        grsec[1]
                    ]);
                });
            }

            return {students: students};
        }
    }
);
