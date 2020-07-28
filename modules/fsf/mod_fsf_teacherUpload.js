"use strict";

const fs = require("fs-jetpack");
const { once } = require("events");

const AuthorizedModule = require("../../objects/AuthorizedModule.js");
const APIError = require("../../objects/APIError.js");
const Constants = require("../../objects/Constants.js");

module.exports = new AuthorizedModule(
    {
        name: "Faculty Upload Service Tool",
        sector: "File Sharing Facility",
        description:
            "Upload a file to a teacher."
    },
    "/?file_?sharing/upload_?faculty?",
    {
        "200": "If the user was verified successfully."
    },
    {
        processAPIRequest: async (log, session, req) => {
            let ip = (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",")[0] : req.connection.remoteAddress);

            if (req.query.faculty_id === undefined || req.body === undefined)
                return new APIError(400);
            if (!Object.keys(JSON.parse(fs.read(".data/fsf_faculty_ids.json"))).includes(req.query.faculty_id))
                return new APIError("400-ID");

            var session_flag = await(session.executeRequest({
                method: "POST",
                url: Constants.URL.dbserver + "dbserver/Applications/UploadServiceTool/Students/save_to_session1.php",
                data: {
                    dostid: req.query.faculty_id
                }
            })
                .then(({data: r}) => {return r;})
                .catch(e => { return e; }));

            if (session_flag instanceof Error)
                throw session_flag;

            var strippedHeaders = req.headers;
            strippedHeaders["Authorization"] = undefined;

            var upload = req.pipe(require("axios").post(
                Constants.URL.dbserver + "dbserver/Applications/UploadServiceTool/Students/upload.php",
                {},
                {
                    headers: strippedHeaders,
                    jar: session.cookieJar,
                    withCredentials: true
                }));

            await once(upload, "response");

            log.write("Uploading file to teacher", {
                "IP Address": ip,
                "Faculty ID": req.query.faculty_id,
                "Response": {
                    statusCode: upload.response.statusCode
                }
            });

            if (upload.response.statusCode !== 200)
                throw new APIError(upload.response.statusCode);

            return { success: true };
        }
    }
);