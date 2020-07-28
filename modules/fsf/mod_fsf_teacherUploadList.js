"use strict";

const AuthorizedModule = require("../../objects/AuthorizedModule.js");
const Constants = require("../../objects/Constants.js");

module.exports = new AuthorizedModule(
    {
        name: "Faculty Upload List",
        sector: "File Sharing Facility",
        description:
            "Lists the teachers that can be sent files to."
    },
    "/?file_?sharing/list_?faculty?",
    {
        "200": "If the user was verified successfully."
    },
    {
        processAPIRequest: async (log, session, req) => {
            let ip = (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0] : req.connection.remoteAddress);

            var faculty = {};
            var swapped = {};

            if (+(require("fs-jetpack").read(".data/fsf_faculty_ids.expiretime")) > Date.now() - 60 * 60) {
                var page = await(session.executeRequest({
                    method: "GET",
                    url: Constants.URL.dbserver + "dbserver/Applications/UploadServiceTool/Students/"
                })
                    .then(({data: r}) => {return r;})
                    .catch(e => { return e; }));

                if (page instanceof Error)
                    return page;

                var $ = require("cheerio").load(page);

                faculty = {};

                var facultySelect = $("#faculty option");
                facultySelect.each((i, option) => {
                    let facultyOption = $(option);
                    if (facultyOption.text().trim() !== "")
                        faculty[facultyOption.text()] = facultyOption.attr("value");
                });

                log.write("Requesting teacher list for uploads", {
                    "IP Address": ip,
                    "Success": {
                        state: true
                    }
                });

                swapped = {};
                for (let key in faculty){
                    swapped[faculty[key]] = key;
                }
                require("fs-jetpack").write(".data/fsf_faculty_ids.json", JSON.stringify(swapped));
                require("fs-jetpack").write(".data/fsf_faculty_ids.expiretime", Date.now().toString());

                return {faculty: faculty};
            } else {
                faculty = JSON.parse(require("fs-jetpack").read(".data/fsf_faculty_ids.json"));
                swapped = {};
                for (let key in faculty){
                    swapped[faculty[key]] = key;
                }
                return {faculty: swapped};
            }
        }
    }
);