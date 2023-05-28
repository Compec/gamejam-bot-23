require("dotenv").config();
const admin = require("firebase-admin");
// import { createTeams } from "./createTeams_export.js";
const reader = require('xlsx')

const serviceAccount = {
    "type": process.env.FIREBASE_TYPE,
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": process.env.FIREBASE_AUTH_URI,
    "token_uri": process.env.FIREBASE_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER,
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
const teamslistsRef = db.ref("teamslists");

let func = async () => {
    const file = reader.readFile('./data/denemeteams.xlsx')

    let data = []

    const sheets = file.SheetNames

    for (let i = 0; i < sheets.length; i++) {
        const temp = reader.utils.sheet_to_json(
            file.Sheets[file.SheetNames[i]])
        temp.forEach((res) => {
            data.push(res)
        })
    }

    const myArgs = process.argv.slice(2);
    // if ekle - argument yok ise error döndür
    let newteamslist = myArgs[0]

    teamslistsRef.child(newteamslist).set(data).then(() => {
        console.log("bbb")
    })

    // Printing data
    // participantsRef.set(data).then(() => {
    //     console.log("aaa")
    // })
}

func();