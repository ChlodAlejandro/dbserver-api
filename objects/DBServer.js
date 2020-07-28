"use strict";

const Constants = require("./Constants.js");

const cheerio = require("cheerio");
const axios = require("axios").default;

module.exports = class DBServer {

    static getDBServerLink(subDirectory) {
        return Constants.URL.dbserver + "dbserver/" + (subDirectory || "");
    }

    static async getDBServerState() {
        return await(axios.get(DBServer.getDBServerLink(),
                {responseType: "text"})
            .then((checkRequestRes) => {
                var $ = cheerio.load(checkRequestRes.data);

                return $("head > title").text().includes("DBServer");
            }).catch(() => {
                return false;
            })
        );
    }

    static async userLoggedIn(userID) {
        return await(axios.post(
            DBServer.getDBServerLink("Admin/LogStatus/log_status.php"),
            //Constants.URL.main + "/util/endpoint_tester",
            qs({
                id: userID,
                choice: 0
            }))
            .then(({data: checkRequestRes}) => {
                var $ = cheerio.load(checkRequestRes);

                return {
                    loggedIn: $("table.status > tr:nth-child(3) > td:nth-child(2) b").text().endsWith("in"),
                    lastLogout: Date.parse($("table.status > tr:nth-child(1) > td:nth-child(2) b").text()),
                    lastLogin: Date.parse($("table.status > tr:nth-child(2) > td:nth-child(2) b").text())
                };
            }).catch(() => {
                return false;
            })
        );
    }

};