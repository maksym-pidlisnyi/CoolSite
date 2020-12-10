"use strict";
const express = require("express");
const app = express();
app.listen(8080);
app.use('/', express.static(__dirname));

const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017/";
let mongoClient = MongoClient;

const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const nodemailer = require('nodemailer');
let transporter;
let mailOptions;

app.get('/', function (req, res) {
    res.render('index', {
        title: "MAIN", menuTopics: config.menuTopics, menuTheme: config.menuTheme, menuColor: config.menuColor,
        domain: config.domain, img: config.img
    });
})

app.get('/UKR', function (req, res) {
    res.render('indexUKR', {
        title: "MAIN", menuTopics: config.menuTopics, menuTheme: config.menuTheme, menuColor: config.menuColor,
        domain: config.domain, img: config.img, menuTopicsUKR: config.menuTopicsUKR
    });
})

app.get('/trainings', function (req, res) {
    res.render('index', {
        title: "TRAININGS", menuTopics: config.menuTopics, menuTheme: config.menuTheme, menuColor: config.menuColor,
        domain: config.domain, img: config.img
    });
})

app.get('/trainingsUKR', function (req, res) {
    res.render('indexUKR', {
        title: "TRAININGS", menuTopics: config.menuTopics, menuTheme: config.menuTheme, menuColor: config.menuColor,
        domain: config.domain, img: config.img, menuTopicsUKR: config.menuTopicsUKR
    });
})

app.get('/aboutus', function (req, res) {
    res.render('index', {
        title: "ABOUT US", menuTopics: config.menuTopics, menuTheme: config.menuTheme, menuColor: config.menuColor,
        domain: config.domain, img: config.img
    });
})

app.get('/aboutusUKR', function (req, res) {
    res.render('indexUKR', {
        title: "ABOUT US", menuTopics: config.menuTopics, menuTheme: config.menuTheme, menuColor: config.menuColor,
        domain: config.domain, img: config.img, menuTopicsUKR: config.menuTopicsUKR
    });
})

app.get('/main', function (req, res) {
    res.redirect('/')
})

app.get('/mainUKR', function (req, res) {
    res.redirect('/UKR')
})

app.get('/trainings_list', function (req, res) {
    getALLTrainings().then(trainings => {
        res.json({ trainings: trainings });
    });
})

app.post('/sendForm', function (req, res) {
    let json = req.body;
    console.log(json);
    if (config.emailVerify === "enabled") {
        let link = "http://localhost:8080/confirmation/" + json.email;
        let text = `Hello, ${json.firstName} ${json.lastName}\nPlease verify your email by clicking on link - ${link}`;
        send(json.email, "Email confirmation", text);
        addApplication(json.firstName, json.lastName, json.email, json.phone, json.formText, "unverified");
        res.render('index', {
            title: "CONFIRMATION", menuTopics: config.menuTopics, menuTheme: config.menuTheme, menuColor: config.menuColor,
            domain: config.domain, img: config.img, message: "Please verify your email. Letter for confirmation was sent on your email." });
    } else {
        addApplication(json.firstName, json.lastName, json.email, json.phone, json.formText, "verified");
        let text = `Hello, ${json.firstName} ${json.lastName}\nYour application is accepted, our manager will call you soon!`;
        send(json.email, "Application successfully accepted", text)
        res.render('index', {
            title: "CONFIRMATION", menuTopics: config.menuTopics, menuTheme: config.menuTheme, menuColor: config.menuColor,
            domain: config.domain, img: config.img, message: "Thank you for your application, our manager will call you soon!" });
    }
})

app.get('/confirmation/(:email)', function (req, res) {
    let email = req.params.email;
    editApplication(email);
    let text = `Hello,\nYour email has been verified and your application is accepted. Our manager will get in touch with you soon!`;
    send(email, "Application successfully accepted", text)
    res.render('index', {
        title: "CONFIRMATION", menuTopics: config.menuTopics, menuTheme: config.menuTheme, menuColor: config.menuColor,
        domain: config.domain, img: config.img, message: "Your email has been verified.\n" +
            "Thank you for your application, our manager will call you soon!" });
})

app.post('/sendFormUKR', function (req, res) {
    let json = req.body;
    console.log(json);
    if (config.emailVerify === "enabled") {
        let link = "http://localhost:8080/confirmationUKR/" + json.email;
        let text = `Доброго дня, ${json.firstName} ${json.lastName}\nБудь ласка, перейдіть за посиланням щоб підтвердити пошту - ${link}`;
        send(json.email, "Підтвердження пошти", text);
        addApplication(json.firstName, json.lastName, json.email, json.phone, json.formText, "unverified");
        res.render('indexUKR', {
            title: "CONFIRMATION", menuTopics: config.menuTopics, menuTheme: config.menuTheme, menuColor: config.menuColor,
            domain: config.domain, img: config.img, message: "Будь ласка, підтвердіть вашу пошту. Лист для підтвердження вже відправлений."
            , menuTopicsUKR: config.menuTopicsUKR});
    } else {
        addApplication(json.firstName, json.lastName, json.email, json.phone, json.formText, "verified");
        let text = `Доброго дня, ${json.firstName} ${json.lastName}\nВаша заявка прийнята, найближчим часом з вами зв'яжеться наш менеджер!`;
        send(json.email, "Заявка успішно прийнята", text)
        res.render('indexUKR', {
            title: "CONFIRMATION", menuTopics: config.menuTopics, menuTheme: config.menuTheme, menuColor: config.menuColor,
            domain: config.domain, img: config.img, message: "Дякуємо за вашу заявку,  найближчим часом з вами зв'яжеться наш менеджер!"
            , menuTopicsUKR: config.menuTopicsUKR});
    }
})

app.get('/confirmationUKR/(:email)', function (req, res) {
    let email = req.params.email;
    editApplication(email);
    let text = `Доброго дня,\nВашу пошту було підтверджено та ваша заявка прийнята. Найближчим часом з вами зв'яжеться наш менеджер!`;
    send(email, "Заявка успішно прийнята", text)
    res.render('indexUKR', {
        title: "CONFIRMATION", menuTopics: config.menuTopics, menuTheme: config.menuTheme, menuColor: config.menuColor,
        domain: config.domain, img: config.img, message: "Вашу пошту було підтверджено.\n" +
            "Дякуємо за вашу заявку, найближчим часом з вами зв'яжеться наш менеджер!", menuTopicsUKR: config.menuTopicsUKR } );
})

app.get('/admin', function (req, res) {
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    getALLApplications().then(applications => {
        res.render('admin', {
            title: "ADMIN PANEL", menuTopics: config.menuTopics, menuTheme: config.menuTheme, menuColor: config.menuColor,
            domain: config.domain, img: config.img, arr: applications, mode: config.emailVerify
        });
    });
})

app.get('/changeMode', function (req, res) {
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    let newConfig
    if (config.emailVerify === 'enabled'){
         newConfig = {
            "domain": config.domain,
            "img": config.img,
            "menuColor": config.menuColor,
            "menuTheme": config.menuTheme,
            "menuTopics": config.menuTopics,
            "menuTopicsUKR": config.menuTopicsUKR,
            "emailVerify": "disabled"
        }
    } else {
         newConfig = {
            "domain": config.domain,
            "img": config.img,
            "menuColor": config.menuColor,
            "menuTheme": config.menuTheme,
            "menuTopics": config.menuTopics,
            "menuTopicsUKR": config.menuTopicsUKR,
            "emailVerify": "enabled"
        }
    }
    fs.writeFileSync('./config.json', JSON.stringify(newConfig));
    res.redirect("/admin");
})

app.post('/addTraining', function (req, res) {
    let body = req.body;
    addTraining(body.trainingNameEN, body.descriptionEN, body.descriptionDetailedEN,
        body.trainingNameUKR, body.descriptionUKR, body.descriptionDetailedUKR);
    res.redirect("/admin");
})

app.post('/deleteApplication', function (req, res) {
    let body = req.body;
    console.log("Hello!")
    console.log(body)
    const info = body.removeBtn.split(" ");
    console.log("info - ");
    console.log(info);
    deleteApplication(info[0],info[1],info[2],info[3], info[4], info[5]);
    res.redirect("/admin");
})

function addTraining(trainingNameEN, descriptionEN, descriptionDetailedEN, trainingNameUKR, descriptionUKR, descriptionDetailedUKR) {
    console.log("lets add - " + trainingNameEN + " " + descriptionEN + " " + descriptionDetailedEN + " " + trainingNameUKR);
    let db;
    mongoClient.connect(url, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }).then((client) => {
            console.log("Connected successfully to server");
            db = client.db("coolSiteDB");
            let myquery = {trainingNameEN: trainingNameEN, descriptionEN: descriptionEN, descriptionDetailedEN: descriptionDetailedEN,
                trainingNameUKR: trainingNameUKR, descriptionUKR: descriptionUKR, descriptionDetailedUKR: descriptionDetailedUKR};
            db.collection("trainings").insertOne(myquery, function (err, obj) {
                if (err) throw err;
                console.log("Training " + trainingNameEN + " " + descriptionEN + " " + descriptionDetailedEN + " " + trainingNameUKR + " was added.");
            });
        }
    ).catch(err => {
        console.log(err);
    });
}

function deleteApplication(firstName, lastName, email, phone, formText, status) {
    console.log("lets delete - " + firstName + " " + lastName  + " " + email);
    let db;
    mongoClient.connect(url, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    })
        .then((client) => {
                console.log("Connected successfully to server");
                db = client.db("coolSiteDB");
                let myquery = {firstName: firstName, lastName: lastName, email: email, phone: phone, formText: formText, status: status };
                db.collection("applications").deleteOne(myquery, function (err, obj) {
                    if (err) throw err;
                    console.log("Application " + firstName + " " + lastName + " " + email + " was deleted.");
                });
            }
        )
        .catch(err => {
            console.log(err);
        });
}

function getALLApplications() {
    let db;
    return mongoClient.connect(url, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    })
        .then((client) => {
            db = client.db("coolSiteDB");
            return db.collection("applications").find().toArray();
        })
        .then(function (results) {
                let values = [];
                if (results) {
                    for (let i = 0; i < results.length; ++i) {
                        let application = {
                            firstName: results[i].firstName,
                            lastName: results[i].lastName,
                            email: results[i].email,
                            phone: results[i].phone,
                            formText: results[i].formText,
                            status: results[i].status,
                        };
                        values.push(application);
                    }
                }
                return values;
            }
        )
        .catch(err => {
            console.log(err);
        });
}

function addApplication(firstName, lastName, email, phone, formText, status) {
    console.log("lets add - " + firstName + " " + lastName  + " " + email + " " + phone + " " + formText + " " + status);
    let db;
    mongoClient.connect(url, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    }).then((client) => {
            console.log("Connected successfully to server");
            db = client.db("coolSiteDB");
            let myquery = {firstName: firstName, lastName: lastName, email: email, phone: phone, formText: formText, status: status};
            db.collection("applications").insertOne(myquery, function (err, obj) {
                if (err) throw err;
                console.log("Application "  + firstName + " " + lastName  + " " + email + " " + phone+ " " + formText + " " + status + " was added.");
            });
        }
    ).catch(err => {
        console.log(err);
    });
}

function getALLTrainings() {
    let db;
    return mongoClient.connect(url, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    })
        .then((client) => {
            db = client.db("coolSiteDB");
            return db.collection("trainings").find().toArray();
        })
        .then(function (results) {
                let values = [];
                if (results) {
                    for (let i = 0; i < results.length; ++i) {
                        let training = {
                            trainingNameEN: results[i].trainingNameEN,
                            descriptionEN: results[i].descriptionEN,
                            trainingNameUKR: results[i].trainingNameUKR,
                            descriptionUKR: results[i].descriptionUKR,
                            descriptionDetailedEN: results[i].descriptionDetailedEN,
                            descriptionDetailedUKR: results[i].descriptionDetailedUKR
                        };
                        values.push(training);
                    }
                }
                return values;
            }
        )
        .catch(err => {
            console.log(err);
        });
}

function editApplication(email) {
    console.log("lets edit -  application with " + email);
    let db;
    mongoClient.connect(url, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    })
        .then((client) => {
            console.log("Connected successfully to server");
            db = client.db("coolSiteDB");
            db.collection("applications").findOneAndUpdate({email: email}, {$set: {status: "verified"}}, {upsert: true}, function(err,doc) {
                if (err) { throw err; }
                else { console.log("Updated"); }
            });
        }
        )
        .catch(err => {
            console.log(err);
        });
}

function send(dist, subject, text) {
    console.log(`Sending letter with subject "${subject}" to mail "${dist}"`);

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'email',
            pass: 'pass'
        }
    });
    mailOptions = {
        from: 'leosmithspammer@gmail.com',
        to: dist,
        subject: subject,
        text: text
    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}
