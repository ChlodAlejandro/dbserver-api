"use strict";

const AuthorizedModule = require("../../objects/AuthorizedModule.js");
const Constants = require("../../objects/Constants.js");

module.exports = new AuthorizedModule(
    {
        name: "Faculty Directory",
        sector: "File Sharing Facility",
        description:
            "Get the file directory of a teacher."
    },
    "/?file_?sharing/faculty_?directory",
    {
        "200": "If the user was verified successfully."
    },
    {
        processAPIRequest: async (log, session, req) => {
            let ip = (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0] : req.connection.remoteAddress);

            var page = await(session.executeRequest({
                method: "POST",
                url: Constants.URL.dbserver + "dbserver/Applications/UploadServiceTool/Students/directory.php",
                data: {
                    dostid: req.query.faculty_id
                }
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
                
                var fileName = fileRow.find("td:nth-child(1)").text();
                var uploadDate = fileRow.find("td:nth-child(2)").text();
                var fileSize = fileRow.find("td:nth-child(3)").text();

                files.push({
                    name: fileName,
                    fileSize: fileSize,
                    uploadDate: Date.parse(uploadDate.substring(4))
                });
            });

            log.write("Requesting teacher list for uploads", {
                "IP Address": ip,
                "Success": {
                    state: true
                }
            });

            return {directory: files};
        }
    }
);