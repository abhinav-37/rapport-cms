const express = require("express");
const PORT = 4000;
const path = require("path");
const ejs = require("ejs");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
//auth
const session = require("express-session");
const bodyParser = require("body-parser");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//auth finished
const Blog = require("./models/blog");
const app = express();
//middlewares
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.get("/", (req, res) => {
    res.render("index")
});
app.get("/services/:name", (req, res) => {
    res.render("pfReturn");
});

app.get("/blog", (req, res) => {
    res.render("blog-grid")
});
app.get("/blogSingle", (req, res) => {
    res.render("post")
});

app.listen(PORT, () => {
    console.log(`Server started on PORT ${PORT}`);
});