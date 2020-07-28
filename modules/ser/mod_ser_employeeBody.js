"use strict";

const AuthorizedModule = require("../../objects/AuthorizedModule.js");
const Constants = require("../../objects/Constants.js");
const DBServer = require("../../objects/DBServer.js");

module.exports = new AuthorizedModule(
    {
        name: "Employee Body",
        sector: "Student Services",
        description:
            "Returns a list of all faculty and staff."
    },
    "/?services/((faculty|employee|staff)_body)|fsb?info",
    {
        "200": "Returns."
    },
    {
		requiredRights: "apps_subjectTeachers",
        processAPIRequest: async (log, session, req) => {
            var $ = (require("cheerio")).load((await(session.executeRequest({
                method: "GET",
                url: DBServer.getDBServerLink("live/fsbinfo"),
                responseType: "text"
            }))).data);

            var employees;
            if (req.query.formatted === "true") {
                employees = [];
                $("#employee_data").children().each((i, el) => {
                    if (el.tagName !== "tr")
                        return;

                    var basicNames = $(el).find(":nth-child(3)").text().toUpperCase().split(", ");
                    var mi = /(.+)\s([A-Za-z])\.$/g.exec(basicNames[1]);
                    if (mi === null) {
                        mi = "";
                    } else {
                        basicNames[1] = mi[1];
                        mi = mi[2];
                    }
                    employees.push({
                        id: $(el).find(":nth-child(2)").text(),
                        fname: basicNames[0],
                        gname: basicNames[1],
                        mi: mi,
						gender: $(el).find(":nth-child(4)").text(),
                        position: $(el).find(":nth-child(6)").text()
                    });
                });
            } else {
                employees = {
                    format: ["id", "fname", "gname", "mi", "gender", "position"],
                    values: []
                };

                $("#employee_data").children().each((i, el) => {
                    if (el.tagName !== "tr")
                        return;

                    var basicNames = $(el).find(":nth-child(3)").text().toUpperCase().split(", ");
                    var mi = /(.+)\s([A-Za-z])\.$/g.exec(basicNames[1]);
                    if (mi === null) {
                        mi = "";
                    } else {
                        basicNames[1] = mi[1];
                        mi = mi[2];
                    }
                    employees.values.push([
                        $(el).find(":nth-child(2)").text(),
                        basicNames[0],
                        basicNames[1],
                        mi,
						$(el).find(":nth-child(4)").text(),
                        $(el).find(":nth-child(6)").text()
                    ]);
                });
            }

            return {employees: employees};
        }
    }
);
