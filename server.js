const express = require("express");
const PORT = 8000;
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
const servicePage = require("./models/servicePage");
//middlewares
//file uploads
var multer = require('multer')


app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
//mongo db
const mongoURI =
    "mongodb+srv://admin-Abhinav:admin-Abhinav@cluster0-fz1t0.mongodb.net/rapport";
mongoose
    .connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("database has been connected");
    });
mongoose.set("useCreateIndex", true);
//========================== Authentication start ==========================//
//user schema
const userSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    access: {
        type: Boolean,
        default: true
    },
    username: {
        type: String,
        
    },
    contact_number: {
        type: Number,
    },
    date: {
        type: Date,
        default: Date.now()
    },
    type:String

});
userSchema.plugin(passportLocalMongoose);
const User =  new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//============== end authentication ====================== //
app.get("/", (req, res) => {
    res.render("index")
});

app.get("/blog", (req, res) => {
    res.render("blog-grid")
});
app.get("/blogSingle", (req, res) => {
    res.render("post")
});
app.get("/adminPanel", (req, res) => {
    res.render("adminPanel",{data:null})
});

app.get("/services/:slug", async(req, res) => {
    let pageData = await servicePage.findOne({ slug: req.params.slug });
    if (pageData) {
        
        res.render("servicePage",{...pageData._doc});
    } else {
         res.render("pfReturn");
    }
   
});

//    Post request to get all the service page info from the admin //

//multer
let count = 0;
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname+"/public/uploads")
  },
    filename: function (req, file, cb) {
        count += 1;
        cb(null, req.body.serviceurl + "procedure" + count.toString()+"."+file.originalname.substring(file.originalname.length-3));
  }
})
var upload = multer({ storage })

app.post("/websiteData", upload.array("image"),  async (req, res) => {
   
    const { nameOfService, serviceurl, rapportStart, rapportSelect, rapportSuper, about_service, procedureName, procedureDescription, documents_required, eligibility,advantages , faqQuestion, faqAnswer,stepsName, stepsDescription } = req.body;
    const servicePageObject = {
        name: nameOfService,
        slug: serviceurl,
        pricingCards: { rapportStart, rapportSelect, rapportSuper },
        aboutService: about_service,
        procedure: { procedureName, procedureDescription },
        documentsRequired: documents_required,
        eligibility,
        advantages,
        steps:{stepsName, stepsDescription},
        faq:{ faqQuestion,faqAnswer }
    }
    const newServicePage = new servicePage(servicePageObject);
    await newServicePage.save();
    res.render("adminPanel")

});

// ===========image upload ================= //


app.listen(PORT, () => {
    console.log(`Server started on PORT ${PORT}`);
});