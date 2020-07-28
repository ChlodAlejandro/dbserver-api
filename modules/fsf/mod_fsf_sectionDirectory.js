"use strict";

const AuthorizedModule = require("../../objects/AuthorizedModule.js");
const Constants = require("../../objects/Constants.js");

module.exports = new AuthorizedModule(
    {
        name: "Section Directory",
        sector: "File Sharing Facility",
        description:
            "Gets the file directory of the student's section."
    },
    "/?file_?sharing/section_?directory",
    {
        "200": "If the user was verified successfully."
    },
    {
        processAPIRequest: async (log, session, req) => {
            let ip = (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0] : req.connection.remoteAddress);

            var page = await(session.executeRequest({
                method: "POST",
                url: Constants.URL.dbserver + "dbserver/Applications/Downloadables/Students/directory.php"
            })
                .then(({data: r}) => {return r;})
                .catch(e => { return e; }));

            if (page instanceof Error) 
                return page;

            var $ = require("cheerio").load(page);
            
            var files = [];

            var directory = $("table.directory tr.even, table.directory tr.odd");
            directory.each((i, fileRowObject) => {
                let fileRow = $(fileRowObject);
                
                var fileName = fileRow.find("td:nth-child(2)").text();
                var uploadDate = fileRow.find("td:nth-child(3)").text();
                var fileSize = fileRow.find("td:nth-child(4)").text();

                files.push({
                    name: fileName,
                    fileSize: fileSize,
                    uploadDate: Date.parse(uploadDate.substring(4))
                });
            });

            log.write("Requesting section upload directory", {
                "IP Address": ip,
                "Success": {
                    state: true
                }
            });

            return {section: (await(session.getProfile({basic: true}))).studentSection, directory: files};
        }
    }
);