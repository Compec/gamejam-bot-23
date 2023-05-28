require("dotenv").config();
const { Client } = require("discord.js");
const admin = require("firebase-admin");
// import { createTeams } from "./createTeams_export.js";

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

const client = new Client();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
const participantsRef = db.ref("participants");

let memberRole = {
    name: process.env.MEMBER_ROLE_NAME
}

let orgRole = {
    name: process.env.ORG_ROLE_NAME
}

let mentorRole = {
    name: process.env.MENTOR_ROLE_NAME
}

let verificationChannel = process.env.VERIFICATION_CHANNEL;
let createTeamsChannel = process.env.CREATE_TEAMS_CHANNEL;
let deleteTeamChannel = process.env.DELETE_TEAM_CHANNEL;

function AssignNickName(message, UserRealName)
{
    return message.member.setNickname(UserRealName);       
}

function AssignRole(message, roleArray)
{
    return message.member.roles.add(roleArray);
}

function CreateVoiceChannel(teamName, category)
{
    return client.guilds.cache.array()[0].channels.create(teamName, {
        type: "voice",
        parent: category
    });
}

function CreateTextChannel(teamName, category)
{
    return client.guilds.cache.array()[0].channels.create(teamName, {
        type: "text",
        parent: category
    });
}

function CreateCategory(teamName)
{
    return client.guilds.cache.array()[0].channels.create(teamName, {
        type: "category",
        permissionOverwrites: [
            {
                type: "role",
                id: client.guilds.cache.array()[0].roles.cache.find(role => role.name === teamName),
                allow: "VIEW_CHANNEL"
            },
            {
                type: "role",
                id: client.guilds.cache.array()[0].roles.everyone,
                deny: "VIEW_CHANNEL"
            },
            {
                type: "role",
                id: memberRole.role,
                deny: "VIEW_CHANNEL"
            },
            {
                type: "role",
                id: orgRole.role,
                allow: "VIEW_CHANNEL"
            },
            {
                type: "role",
                id: mentorRole.role,
                allow: "VIEW_CHANNEL"
            }
        ]
    });
}

function CreateRole(teamName)
{
    return client.guilds.cache.array()[0].roles.create({
        data: {
            name: teamName
        }
    });
}

client.on("ready", () => {
    memberRole.role = client.guilds.cache.array()[0].roles.cache.find(role => role.name === memberRole.name);
    orgRole.role = client.guilds.cache.array()[0].roles.cache.find(role => role.name === orgRole.name);
    mentorRole.role = client.guilds.cache.array()[0].roles.cache.find(role => role.name === mentorRole.name);
    console.log(`${client.user.tag} has logged in.`);
});

client.on("message", (message) => {
    
    //User Mesaj Atmışsa
    if (message.author.id !== client.user.id) 
    { 
        
        //Verification Kanalına atılmışsa
        if (message.channel.name === verificationChannel) 
        {
            //Zaten Doğrulanmışsa
            if(message.member.roles.cache.array().some(role => role.name === memberRole.name)) 
            {
                message.reply("Zaten Doğrulanmışsınız")
                .then(msg => {
                    msg.delete({ timeout: 5000 }).catch(err => {console.log(err);});
                })
                
                message.delete().catch(err => {console.log(err);});
            } 
            else 
            {
                participantsRef.orderByChild("Password").equalTo(message.content).once("value")
                .then((data) => 
                {
                    //User kayıtılı ise
                    if(!(data.val() === null))
                    {

                        let uid = Object.keys(data.val())[0];

                        let teamRole = message.guild.roles.cache.find(role => role.name === data.val()[uid].Team);

                        //Önceden böyle bir rol oluşturulmamışsa
                        if(teamRole == null)
                        {
                            let teamName = data.val()[uid].Team;

                            CreateRole(teamName)
                            .then(() => 
                            {
                                let createdRole = client.guilds.cache.array()[0].roles.cache.find(role => role.name === teamName);

                                CreateCategory(teamName)
                                .then((category) => 
                                {    
                                    CreateTextChannel(teamName, category)
                                    .then(() => 
                                    {
                                        CreateVoiceChannel(teamName, category)
                                        .then(() => 
                                        {
                                            AssignRole(message, [memberRole.role, createdRole])
                                            .then(() => 
                                            {
                                                AssignNickName(message, data.val()[uid].Name)
                                                .then(() => 
                                                {
                                                    message.delete().catch(err => {console.log(err);});

                                                }).catch(err => {console.log(err);});
                                            }).catch(err => {console.log(err);});
                                        }).catch(err => {console.log(err);});
                                    }).catch(err => {console.log(err);});
                                }).catch(err => {console.log(err);});
                            }).catch(err => {console.log(err);});
                        }

                        //Önceden böyle bir rol oluşturulmuşsa
                        else 
                        {
                            AssignRole(message, [memberRole.role, teamRole])
                            .then(() => {
                                AssignNickName(message, data.val()[uid].Name)
                                .then(() => {
                                    message.delete().catch(err => {console.log(err);});

                                }).catch(err => {console.log(err);});
                            }).catch(err => {console.log(err);});
                        }

                    } 

                    //User formu doldurmamışsa
                    else 
                    {
                        message.reply("Hatalı kod veya henüz kaydolmamışsınız.")
                        .then(msg => {
                            msg.delete({ timeout: 5000 }).catch(err => {console.log(err);});
                        }).catch(err => {console.log(err);});

                        message.delete().catch(err => {console.log(err);});
                    }
                })
            }
        }
        else if (message.channel.name === createTeamsChannel) {
            let teamName = message.content;

            CreateRole(teamName)
            .then(() => 
            {
                CreateCategory(teamName)
                .then((category) => 
                {    
                    CreateTextChannel(teamName, category)
                    .then(() => 
                    {
                        CreateVoiceChannel(teamName, category).catch(err => {console.log(err);});
                        
                    }).catch(err => {console.log(err);});
                }).catch(err => {console.log(err);});
            }).catch(err => {console.log(err);});
        }
        else if(message.channel.name === deleteTeamChannel)
        {
            let teamName = message.content;

            let roles = message.guild.roles.cache.filter(role => role.name === teamName);
            let channels = message.guild.channels.cache.filter(channel => channel.name === teamName);

            roles.forEach(role => role.delete().catch(err => {console.log(err);}));
            channels.forEach(channel => channel.delete().catch(err => {console.log(err);}));
        }
    }
})

client.login(process.env.DISCORDJS_BOT_TOKEN);