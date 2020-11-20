const express = require("express");
const PORT = 3000;
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
let multer = require('multer')


app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(
    session({
        secret: "keyboard cat",
        resave: false,
        saveUninitialized: false,
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
//========================== User Schema start ==========================//
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
//============== end user Schema ====================== //

app.get("/", (req, res) => {
    req.session.returnTo = req.originalUrl
    res.render("index")
});

app.get("/blog", (req, res) => {
    req.session.returnTo = req.originalUrl
    res.render("blog-grid")
});
app.get("/blogSingle", (req, res) => {
    req.session.returnTo = req.originalUrl
    res.render("post")
});

// ========================= Authentication start =================== //

//GET requset for login
app.get("/login/:type", function (req, res) {
    req.session.returnTo = req.originalUrl
    let passedMessage = req.query.message;
    if (req.params.type === "customer") {
        res.render("login", { user: req.user, passedMessage });
    } else if(req.params.type === "admin") {
        res.render("admin/login",{ passedMessage })
    }
});

//GET request for regsiter
app.get("/register/:type", function (req, res) {
    req.session.returnTo = req.originalUrl
     let passedMessage = req.query.message;
    if (req.params.type === "customer") {
    res.render("register", { user: req.user,passedMessage })
    } else {
         res.render("admin/register", {passedMessage })
    }
  
});

// POST for the registration of the user
app.post("/register/:type", async function (req, res) {
    const {first_name,last_name, username, password, contact_number,repassword } = req.body;

    if (password === repassword) {
        User.register({ username: username }, password, function (err, user) {
        if (err) {
            console.log(err);
            var message = encodeURIComponent("Email Already Exists");
            res.redirect("/register/customer?message="+message);
        } else {
            passport.authenticate("local")(req, res, async function () {
                user.type = req.params.type;
                user.contact_number = contact_number,
                user.first_name = first_name,
                user.last_name = last_name
                await user.save();
                if(req.params.type === "admin") res.redirect("/admin")
                res.redirect(req.session.returnTo || '/');
                delete req.session.returnTo;

            });
        }
    });
    } else {
          var message = encodeURIComponent('Passwords do not match!');
        if (req.params.type === "customer") {
          res.redirect('/register/customer?message=' + message);
        } else {
             res.redirect('/register/admin?message=' + message);
        }
    }      
});

// POST for the login of the user
app.post("/login/:type", async function (req, res) {
        let user = await User.findOne({ username: req.body.username });
        if (user) {
            if (user.type === req.params.type) {
                if (user.access) {
                    const user = new User({
                    username: req.body.username,
                    password: req.body.password,
                    });

                    req.login(user, function (err) {
                        if (err) {
                            console.log(err);
                            
                        } else {
                           
                            passport.authenticate("local", function (err, user, info) {
                               
                                if (user) {
                                   if(req.params.type === "admin") res.redirect("/admin")
                                    res.redirect(req.session.returnTo || '/');
                                    delete req.session.returnTo; 
                                } else {
                                    let message = encodeURIComponent('UserName Or Passport is incorrect !');
                                    req.logOut();
                                    if (req.params.type === "admin") {
                                        res.redirect("/login/admin?message=" + message);
                                    } else {
                                        res.redirect("/login/customer?message=" + message);
                                    }
                                    
                                }
                               
                            })(req, res, function () {});
                        }
                    }); 
                } else {
                    let message = encodeURIComponent('Authetication error!');
                    res.redirect("/login/customer?message=" + message);
                }
              
            }
        } else {
            let message = encodeURIComponent('Authentication error!!');
            res.redirect('/login/customer?message=' + message);
        }
        
   

   
})

//========================== Admin panel ======================//
app.get("/adminPanel", (req, res) => {
    res.render("adminPanel/dashboard",{data:null})
});
app.get("/admin/servicePage", (req, res) => {
    res.render("adminPanel/serviceForm",{data:null})
});
app.get("/services/:slug", async(req, res) => {
    let pageData = await servicePage.findOne({ slug: req.params.slug });
    if (pageData) {
        
        res.render("servicePage",{...pageData._doc});
    } else {
         res.render("pfReturn");
    }
   
});

// Post request to get all the service page info from the admin //

//multer
let count = 0;
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname+"/public/uploads")
  },
    filename: function (req, file, cb) {
        count += 1;
        cb(null, req.body.serviceurl + "procedure" + count.toString()+"."+file.originalname.substring(file.originalname.length-3));
  }
})
let upload = multer({ storage })

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



// ================= admin panel finished ==================== //
app.listen(PORT, () => {
    console.log(`Server started on PORT ${PORT}`);
});