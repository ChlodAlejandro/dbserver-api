"use strict";

const AuthorizedModule = require("../../objects/AuthorizedModule.js");
const Constants = require("../../objects/Constants.js");
const APIError = require("../../objects/APIError.js");
const DownloadLinkGenerator = require("../../managers/man_fsf_downloadLinkGenerator.js");

module.exports = new AuthorizedModule(
    {
        name: "Section Directory Download",
        sector: "File Sharing Facility",
        description:
            "Pipes a file from the student's section's directory into the response.x"
    },
    "/?file_?sharing/section_?download",
    {
        "200": "If the user was verified successfully."
    },
    {
        processAPIRequest: async (log, session, req, res, man) => {
            if (req.query.file === undefined) {
                return new APIError(400, "Target file name not specified.");
            }


            var targetLink = Constants.URL.main + "/file_sharing/download/" + man["downloadLinkGenerator"].registerDownloadLink(session, DownloadLinkGenerator.Sectors.Section, req.query.file);
            console.log(targetLink);
            if (req.query.link !== undefined) {
                res.send(ModuleUtilities.buildResponse(200, { link: targetLink }));
            } else {
                res.redirect(targetLink);
            }

            return { _sent: true };
        }
    }
);