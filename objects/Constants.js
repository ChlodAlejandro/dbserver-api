const APP_ROOT = "/projects/node-web/dbserver-api";
const version = "1.0.0";

const constants = {
    App: {
        port: 42191,
        root: APP_ROOT,
        userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0`,
        defaultHeaders: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0"
        }
    },
    About: {
        name: "dbserver-api",
        displayName: "PSHS-CVC DBServer API",
        description: "An unofficial API that parses output from the PSHS-CVC DBServer and relays it as usable JSON data.",
        version: version
    },
    SSL: {
        keyPath: `${APP_ROOT}/ssl/privkey.pem`,
        certificatePath: `${APP_ROOT}/ssl/cert.pem`,
        chainPath: `${APP_ROOT}/ssl/chain.pem`
    },
    URL: {
        main: "https://dbsa.chlod.net",
        favicon: "https://dbsa.chlod.net/images/favicon.ico",
        dbserver: "http://dbserver.chlod.net/"
    }
};

module.exports = constants;