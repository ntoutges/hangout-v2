var express = require("express");
var mongodb = require("mongodb");
var bodyParser = require("body-parser");
var expressLayouts = require("express-ejs-layouts");
var session = require("express-session");
var formidable = require("formidable");
var profanity = require("profanity-middleware");
var imageMagick = require("node-imagemagick")
var socketio = require("socket.io");
var crypto = require("crypto");
var fs = require("fs");

var tagTools = require('./tagCheck.js');
var textTools = require('./text.js');

var app = express();
var filter = profanity.filter;
var staticFiles = express.static(__dirname + "/public");
app.use(staticFiles);
app.set("view engine", "ejs");
app.use(expressLayouts);
var urlencoded = bodyParser.urlencoded({
    extended: true
});

app.use(urlencoded);
app.use(session({
    secret: "nothingToSeeHereBecauseNoReasonAndIWillContinueToMakeThisStringLongerSoNoOneCanSomehowGetIntoMySystemAndSoItIsLongerThanMelaniesAndSheWillNeverKnowThatBecauseSheCannotSeeThisSecretMessage",
    resave: false,
    saveUninitialized: false
}));

var db;
var io;
var databaseURL = "mongodb://userforhangoutsv2:this1isauser@ds157946.mlab.com:57946/hangouts-v2";
mongodb.MongoClient.connect(databaseURL, function(error, database) {
    db = database;

    var server = app.listen(process.env.PORT || 3006, function() {
        console.log("app started");
    });
    io = socketio.listen(server);
});

// sign in page
app.get("/", function(request, response) {


    // get rid of this
    // request.session.username = "ntoutges";


    if (request.session.username) {
        response.status = 418;
        response.redirect("/home");
    }
    else {
        response.render("pages/signIn.ejs", {
            href: "signIn.css",
            title: "Sign In",
            loggedIn: false
        });
    }
});

app.post("/signIn", function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    password = encryptPassword(password);
    db.collection("users").findOne({
        _id: username
    }, function(error, info) {
        if (info) {
            if (info.password == password) {
                request.session.username = username;
                response.send("home");
            }
            else {
                response.status = 401;
                response.send("Invalid Password");
            }
        }
        else {
            response.status = 401
            response.send("Invalid Username");
        }
    });
});

// sign up
app.get("/signUp", function(request, response) {
    if (request.session.username) {
        response.status = 418;
        response.redirect("/home")
    }
    else {
        response.render("pages/signUp.ejs", {
            href: "signIn.css",
            title: "Sign Up",
            loggedIn: false
        });
    }
});

// create account
app.post("/createAccount", function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    password = encryptPassword(password);
    db.collection("users").findOne({
        "_id": username
    }, function(error, info) {
        if (!info) {
            var template = {
                "_id": username,
                "nickname": username,
                "password": password,
                "admin": false,
                "profilePicture": "no-profile-picture.png",
                settings: {
                    darkMode: false,
                    accountPrivacy: {
                        viewingStatus: 0,
                        accountStatus: 0,
                        username: 0,
                        followingPrivacy: false
                    },
                }
            };
            db.collection("users").insertOne(template, function(error, data) {
                request.session.username = username;
                response.send("home");
            });
        }
        else {
            response.send("Username Taken");
        }
    });
});

function encryptPassword(password) {
    // make hash
    var hash = crypto.createHash('md5').update(password).digest('hex');
    // block cypher
    var hashBlock = [];
    var key = "1110001101111110";
    var key2 = 4178618;
    for (var i = 0; i < hash.length; i += 2) {
        var char1 = hash.charCodeAt(i).toString(2); // 8
        var char2 = hash.charCodeAt(i + 1).toString(2); // 8
        var combo = char1 + char2; // 16
        combo = performXOR(combo, key); // 16
        combo = convertToChar(combo); // 8
        combo += key2 * i; // 9
        hashBlock.push(combo); // 9
    }
    var newHashBlock = "";
    for (var i = 0; i < hashBlock.length; i++) {
        newHashBlock += hashBlock[i];
    }
    return newHashBlock;
}

function performXOR(binary, key) {
    key = key.toString(2);
    var xOrString = "";
    for (var j = key.length - 1; j >= 0; j--) {
        var newJ = (binary.length - 1) - ((key.length - 1) - j);
        if (key[j] == binary[newJ]) {
            xOrString = 0 + xOrString;
        }
        else {
            xOrString = 1 + xOrString;
        }
    }
    xOrString = binary.substring(0, binary.length - key.length) + xOrString;
    return xOrString;
}

function convertToChar(binary) {
    var total = 0;
    for (var i = 0; i < binary.length; i++) {
        var multiplier = Math.pow(3, (binary.length - 1) - i);
        total += multiplier * binary[i];
    }
    return total;
}

// home
app.get("/home", function(request, response) {


    // get rid of this
    // request.session.username = "ntoutges";


    if (request.session.username) {
        db.collection("users").findOne({
            _id: request.session.username
        }, function(error, data) {
            var profilePicture = "profileUploads/" + data.profilePicture;
            var displayName = data.nickname;
            var settings = data.settings;
            response.render("pages/home", {
                href: "home.css",
                title: "Home",
                loggedIn: true,
                image: profilePicture,
                displayName: displayName,
                settings: settings,
                username: request.session.username
            });
        });
    }
    else {
        response.status = 401;
        response.redirect("/");
    }
});

app.get("/shortDesc", function(request, response) {
    if (request.session.username) {
        db.collection("users").findOne({
            "_id": request.session.username
        }, function(error, data) {
            if (error) {
                response.status = 500;
                response.send(["Something Broke", "Please try reloading"]);
            }
            else {
                var desc = data.shortDesc;
                response.status = 200;
                response.send(desc);
            }
        });
    }
    else {
        response.status = 401;
        response.redirect("/");
    }
})

// upload profile picture
app.post("/profile", function(request, response) {
    if (request.session.username) {
        db.collection("users").findOne({
            "_id": request.session.username
        }, function(err, data) {
            if (err) {
                response.status = 500;
                response.redirect("/home")
            }
            if (data.profilePicture != "no-profile-picture.png") {
                var path = __dirname + "/public/profileUploads/" + data.profilePicture
                fs.unlink(path, function() {
                    var form = new formidable.IncomingForm();
                    // set max file size for images in bytes (25 x 1024 x 1024)
                    form.maxFileSize = 26214400;

                    form.parse(request, function(error, fields, files) {
                        files.file.name = files.file.name.replace(" ", "");
                        // make sure name is not null
                        if (files.file.name) {
                            var oldpath = files.file.path;
                            var dotSomething = files.file.name.split(".");
                            dotSomething = dotSomething[dotSomething.length - 1];
                            var name = request.session.username + "." + dotSomething;
                            var newpath = __dirname + "/public/profileUploads/" + name;
                            db.collection("users").updateOne({
                                "_id": request.session.username
                            }, {
                                $set: {
                                    "profilePicture": name
                                }
                            });
                            var options = {
                                srcPath: oldpath,
                                dstPath: newpath,
                                width: 256
                            };
                            imageMagick.resize(options, function(error) {
                                if (error) {
                                    response.status = 721;
                                    response.redirect("/home");
                                }
                                else {
                                    response.status = 201;
                                    response.redirect("/home");
                                }
                            });

                        }
                        else {
                            db.collection("users").updateOne({
                                "_id": request.session.username
                            }, {
                                $set: {
                                    "profilePicture": "no-profile-picture.png"
                                }
                            });
                            response.redirect("/home");
                        }
                    });
                });
            }
        });
    }
    else {
        response.status = 701;
        response.redirect("/");
    }
});

app.post("/changeDisplayName", function(request, response) {
    if (request.session.username) {
        var nameToChangeTo = request.body.name;
        if (nameToChangeTo > 520) {
            nameToChangeTo = nameToChangeTo.substring(0, 520);
        }
        db.collection("users").updateOne({
            "_id": request.session.username
        }, {
            $set: {
                "nickname": nameToChangeTo
            }
        }, function(error, data) {
            if (error) {
                response.status = 500;
                response.send(false);
            }
            else {
                response.status = 200;
                response.send("Successful");
            }
        });
    }
    else {
        request.status = 722;
        response.redirect("/");
    }
});

app.post("/saveShortDesc", function(request, response) {
    if (request.session.username) {
        var desc = request.body.desc;
        if (desc.length > 170) {
            desc = desc.substring(0, 170);
        }
        db.collection("users").updateOne({
            "_id": request.session.username
        }, {
            $set: {
                "shortDesc": desc
            }
        }, function(error, data) {
            if (error) {
                response.status = 500;
                response.send("bad");
            }
            else {
                response.status = 200;
                response.send(true);
            }
        });
    }
    else {
        response.status = 401;
        response.redirect("/");
    }
});

app.post("/options", function(request, response) {
    if (request.session.username) {
        db.collection("users").updateOne({
            _id: request.session.username
        }, {
            $set: {
                settings: request.body.options
            }
        });
    }
    else {
        response.status = 401;
        response.redirect("/");
    }
});

app.get("/posts", function(request, response) {
    if (request.session.username) {
        db.collection("users").findOne({
            "_id": request.session.username
        }, function(error, data) {
            if (error) {
                response.status = 500;
                response.redirect("/home");
            }
            else {
                db.collection("posts").find({ /* put the tag sorter here */ }).sort({
                    _id: 1
                }).toArray(function(error, info) {
                    if (error) {
                        response.status = 500;
                        response.reidrect("/home")
                    }
                    else {
                        response.status = 200;
                        response.render("pages/posts.ejs", {
                            href: "posts.css",
                            title: "Posts",
                            loggedIn: true,
                            posts: info,
                            name: request.session.username,
                            picture: data.profilePicture
                        });
                    }

                })
            }
        });
    }
    else {
        response.status = 401;
        response.redirect("/");
    }
});

app.post("/postThePost", function(request, response) {
    if (request.session.username) {
        var msg = request.body.text;
        // escape characters
        while (msg.includes("<") || msg.includes(">")) {
            msg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        // replace: *u* */u*, *b* */b* *i* */i* with respective their html tags
        msg = convert(msg, { "*u*": "<u>", "*b*": "<b>", "*i*": "<i>", "*/u*": "</u>", "*/b*": "</b>", "*/i*": "</i>" });
        var image = "";
        var date = new Date();
        date = date.getTime();
        db.collection("posts").find().sort({
            "_id": 1
        }).toArray(function(error, data) {
            if (error) {
                response.status = 500;
                console.log("lo siento pero no funciona")
                response.redirect("/posts");
            }
            else {
                console.log("SI!!, funciona")
                var id = 0;
                if (data.length > 0) {
                    id = parseInt(data[data.length - 1]._id, 10) + 1;
                }
                var info = {
                    _id: id,
                    message: msg[1],
                    tags: msg[0],
                    picture: image,
                    date: date,
                    creator: request.session.username
                };
                db.collection("posts").insertOne(info, function(error, data) {
                    if (error) {
                        response.status = 500;
                        response.redirect("/post");
                    }
                    else {
                        response.status = 200;
                        response.send("Good");
                    }
                });
            }
        });
    }
    else {
        response.status = 401;
        response.redirect("/");
    }
    // original version of tag detection
    // ThisIsATagThatYouShouldNoticeBecauseItIsImportant
    // TIATTYSNBIII
});

function convert(text, patterns) {
    var patternsVal = [];
    for (var i in patterns) {
        while (text.includes(i)) {
            text = text.replace(i, patterns[i]);
        }
        patternsVal.push(patterns[i]);
    }
    // "spellcheck" (in air quotes)
    let pattern = ["<u>", "<b>", "<i>", "</u>", "</b>", "</i>"];
    text = tagTools.checkTags(text, pattern);
    text = tagTools.cleanUp(text, pattern);
    var tags = text.match(/#(\w+)/g);
    text = text.replace(/#(\w+)/g, '<span class=\"tag\">#$1</span>'); // regex to find and replace '#' with an <a> tag
    text = textTools.replaceSpaces(text);
    text = textTools.renameEnter(text);
    return [tags, text];
}




//    ()           yay
//   /{}\          yay
//    ||           yay
