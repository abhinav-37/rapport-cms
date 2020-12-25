const express = require("express");
const PORT = 8000;
const shortid = require("shortid");
const request = require("request");
const path = require("path");
const ejs = require("ejs");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");
const OrderData = require("./models/orderData");
const Callback = require("./models/callback");
const FavourateServices = require("./models/favouriteServices");
const ClientReviews = require("./models/clientReviews");
const ClietnIcons = require("./models/clientIcons");
//auth
const session = require("express-session");
const bodyParser = require("body-parser");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//auth finished
const Blog = require("./models/blog");
const app = express();
const servicePage = require("./models/servicePage");
const CustomerResponse = require("./models/customerResponse");
const QuestionInMind = require("./models/questionInMind");
//middlewares
//file uploads
let multer = require("multer");
const dailyWages = require("./models/dailyWages");
const lawUpdates = require("./models/lawUpdates");
const { text, json } = require("body-parser");
const { Logger } = require("mongodb");
const clientIcons = require("./models/clientIcons");

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
app.use(passport.initialize());
app.use(passport.session());
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
        default: true,
    },
    username: {
        type: String,
    },
    contact_number: {
        type: Number,
    },
    date: {
        type: Date,
        default: Date.now(),
    },
    type: String,
});
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//============== end user Schema ====================== //
//=================== razor pay integration ==========//
let instance = new Razorpay({
    key_id: "rzp_test_W6LG94sImodYti",
    key_secret: "eLBJgE7IJkPCuiNEfboSDq8F",
});
//============ done =======================//
const serviceSort = async () => {
    let services = await servicePage.find();
    let startAbusiness = [];
    let licenses = [];
    let labour = [];
    let HR = [];
    services.forEach(function (d) {
        if (d.category.replace(/\s/g, "").toLowerCase() === "startabusiness") {
            startAbusiness.push(d);
        } else if (
            d.category.replace(/\s/g, "").toLowerCase() ===
            "licenses/registration"
        ) {
            licenses.push(d);
        } else if (
            d.category.replace(/\s/g, "").toLowerCase() ===
            "labourlawcompliances"
        ) {
            labour.push(d);
        } else {
            HR.push(d);
        }
    });
    return [startAbusiness, licenses, labour, HR];
};
app.get("/", async (req, res) => {
    req.session.returnTo = req.originalUrl;
    try {
        let [startAbusiness, licenses, labour, HR] = await serviceSort();
        let allFavourate = await FavourateServices.find();
        let clientRating = await ClientReviews.find();
        let clientIcons = await ClietnIcons.find();
        let latestFavourat = allFavourate[allFavourate.length - 1];
        res.render("index", {
            clientRating,
            startAbusiness,
            licenses,
            labour,
            HR,
            clientIcons,
            user: req.user,
            latestFavourat,
        });
    } catch (error) {
        console.log(error);
        res.redirect("/error");
    }
});
let newOrder = {};
app.get("/customer/dashboard", async function (req, res) {
    let auth = req.isAuthenticated();
    req.session.returnTo = req.originalUrl;
    let allFavourate = await FavourateServices.find();
    let latestFavourat = allFavourate[allFavourate.length - 1];
    if (auth) {
        let passedMessage = "";
        let orders = await CustomerResponse.find({ user: req.user.id });
        let details = await OrderData.find({ customer: req.user.id });
        let [startAbusiness, licenses, labour, HR] = await serviceSort();
        res.render("dashboard", {
            details,
            orders,
            passedMessage,
            startAbusiness,
            licenses,
            labour,
            HR,
            user: req.user,
            latestFavourat,
        });
    } else {
        res.redirect("/login/customer");
    }
});
app.post("/customer/dashboard", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        try {
            request(
                `https://rzp_test_W6LG94sImodYti:eLBJgE7IJkPCuiNEfboSDq8F@api.razorpay.com/v1/payments/${req.body.razorpay_payment_id}`,
                async function (error, response, body) {
                    let newPayment = new OrderData({
                        customer: req.user.id,
                        orderData: body,
                    });
                    await newPayment.save();
                    let newresponse = new CustomerResponse({
                        user: req.user.id,
                        ...newOrder,
                    });

                    newOrder = {};
                    await newresponse.save();
                    let passedMessage = "Order Successfull";
                    let [
                        startAbusiness,
                        licenses,
                        labour,
                        HR,
                    ] = await serviceSort();
                    let orders = await CustomerResponse.find({
                        user: req.user.id,
                    });
                    let allFavourate = await FavourateServices.find();
                    let latestFavourat = allFavourate[allFavourate.length - 1];
                    let details = await OrderData.find({
                        customer: req.user.id,
                    });
                    res.render("dashboard", {
                        details,
                        latestFavourat,
                        startAbusiness,
                        licenses,
                        labour,
                        HR,
                        user: req.user,
                        passedMessage,
                        orders,
                    });
                }
            );
        } catch (error) {
            res.redirect("/customer/dashboard");
        }
    } else {
        res.redirect("/login/customer");
    }
});
app.get("/blog", async (req, res) => {
    req.session.returnTo = req.originalUrl;
    let allBlogs = await Blog.find();
    let allFavourate = await FavourateServices.find();
    let latestFavourat = allFavourate[allFavourate.length - 1];
    let [startAbusiness, licenses, labour, HR] = await serviceSort();
    res.render("blog-grid", {
        startAbusiness,
        user: req.user,
        licenses,
        labour,
        HR,
        allBlogs,
        latestFavourat,
    });
});
app.get("/blogSingle/:blogId", async (req, res) => {
    req.session.returnTo = req.originalUrl;
    let singleBlog = await Blog.findById(req.params.blogId);
    let [startAbusiness, licenses, labour, HR] = await serviceSort();
    let allFavourate = await FavourateServices.find();
    let latestFavourat = allFavourate[allFavourate.length - 1];
    res.render("post", {
        startAbusiness,
        user: req.user,
        licenses,
        labour,
        HR,
        singleBlog,
        latestFavourat,
    });
});
app.get("/services/:slug", async (req, res) => {
    req.session.returnTo = req.originalUrl;
    let pageData = await servicePage.findOne({ slug: req.params.slug });
    let [startAbusiness, licenses, labour, HR] = await serviceSort();
    let allFavourate = await FavourateServices.find();
    let latestFavourat = allFavourate[allFavourate.length - 1];
    if (pageData) {
        res.render("servicePage", {
            startAbusiness,
            licenses,
            labour,
            HR,
            ...pageData._doc,
            user: req.user,
            latestFavourat,
        });
    } else {
        res.redirect("/error");
    }
});
app.get("/lawUpdates", async function (req, res) {
    req.session.returnTo = req.originalUrl;
    let updates = await lawUpdates.find();
    let [startAbusiness, licenses, labour, HR] = await serviceSort();
    let allFavourate = await FavourateServices.find();
    let latestFavourat = allFavourate[allFavourate.length - 1];
    res.render("lawUpdates", {
        startAbusiness,
        licenses,
        labour,
        HR,
        user: req.user,
        updates,
        latestFavourat,
    });
});
app.get("/minimumWages/:state", async function (req, res) {
    req.session.returnTo = req.originalUrl;
    let wages = await dailyWages.findOne({ state: req.params.state });
    let [startAbusiness, licenses, labour, HR] = await serviceSort();
    let allFavourate = await FavourateServices.find();
    let latestFavourat = allFavourate[allFavourate.length - 1];
    res.render("minimumWages", {
        startAbusiness,
        licenses,
        labour,
        HR,
        user: req.user,
        wages,
        latestFavourat,
    });
});
app.get("/minimumWagesSelector", async function (req, res) {
    let allFavourate = await FavourateServices.find();
    let latestFavourat = allFavourate[allFavourate.length - 1];
    req.session.returnTo = req.originalUrl;
    let [startAbusiness, licenses, labour, HR] = await serviceSort();
    res.render("minimumWagesSelector", {
        startAbusiness,
        licenses,
        labour,
        HR,
        user: req.user,
        latestFavourat,
    });
});
app.post("/servicesSearch", async function (req, res) {
    try {
        let searchedService = await servicePage.findOne({
            name: req.body.serviceSearch,
        });
        res.redirect(`/services/${searchedService.slug}`);
    } catch (error) {
        res.redirect(`/notFound`);
    }
});
app.post("/allServices", async function (req, res) {
    let allServices = await servicePage.find().select("name -_id");
    let json = JSON.stringify(allServices);
    res.end(json);
});
app.get("/orderForm/:id/:type", async function (req, res) {
    req.session.returnTo = req.originalUrl;
    let auth = req.isAuthenticated();
    if (auth) {
        try {
            let allFavourate = await FavourateServices.find();
            let latestFavourat = allFavourate[allFavourate.length - 1];
            let serviceId = req.params.id;
            let serviceType = req.params.type;
            let [startAbusiness, licenses, labour, HR] = await serviceSort();
            let allPricing = await servicePage
                .findById(serviceId)
                .select({ pricingCards: 1, name: 1 });
            let pricing = allPricing.pricingCards[serviceType][0];
            let passedMessage = req.query.message;
            res.render("orderForm", {
                startAbusiness,
                licenses,
                labour,
                HR,
                user: req.user,
                pricing,
                passedMessage,
                nameOfService: allPricing.name,
                idOfService: allPricing.id,
                serviceType,
                latestFavourat,
            });
        } catch (error) {
            console.error(error);
            res.redirect("/error");
        }
    } else {
        res.redirect("/login/customer");
    }
});
app.post("/orderForm", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        try {
            try {
                let allPricing = await servicePage
                    .findById(req.body.idOfService)
                    .select({ pricingCards: 1, name: 1 });
                let pricing = allPricing.pricingCards[req.body.serviceType][0];
                const options = {
                    amount: Number(pricing) * 100,
                    currency: "INR",
                    receipt: shortid.generate(), //any unique id
                };
                const response = await instance.orders.create(options);
                res.render("orderConfermation", {
                    nameOfService: allPricing.name,
                    response,
                    customer_data: req.body,
                });
                newOrder = {};
                newOrder = req.body;
            } catch (error) {
                console.log(error);
                res.redirect("/error");
            }
        } catch (error) {
            console.log(error);
            res.redirect("/error");
        }
    } else {
        res.redirect("/login/customer");
    }
});
app.post("/callback", async function (req, res) {
    try {
        let data = req.body;
        let newCall = new Callback(data);
        await newCall.save();
        res.end("Callback Request SuccessFull");
    } catch (error) {
        res.end("Unsuccessfull, please fill all the fields!");
    }
});
app.post("/questionForm", async function (req, res) {
    try {
        let newQues = new QuestionInMind(req.body);
        await newQues.save();
        res.end("Done Sending the request!");
    } catch (error) {
        res.end(error);
    }
});
app.get("/aboutUs", async function (req, res) {
    let allFavourate = await FavourateServices.find();
    let [startAbusiness, licenses, labour, HR] = await serviceSort();
    let latestFavourat = allFavourate[allFavourate.length - 1];
    res.render("aboutUs", {
        latestFavourat,
        user: req.user,
        startAbusiness,
        licenses,
        labour,
        HR,
    });
});
// ========================= Authentication start =================== //

//GET requset for login
app.get("/login/:type", async function (req, res) {
    let type = req.params.type;
    let passedMessage = req.query.message;
    let [startAbusiness, licenses, labour, HR] = await serviceSort();
    let allFavourate = await FavourateServices.find();
    let latestFavourat = allFavourate[allFavourate.length - 1];
    if (type === "customer") {
        res.render("login", {
            startAbusiness,
            licenses,
            labour,
            HR,
            user: req.user,
            passedMessage,
            latestFavourat,
        });
    } else if (type === "admin" || type === "employee") {
        res.render("adminPanel/authentication/login", {
            passedMessage,
            user: req.user,
            type,
        });
    }
});

//GET request for regsiter
app.get("/register/:type", async function (req, res) {
    let passedMessage = req.query.message;
    let [startAbusiness, licenses, labour, HR] = await serviceSort();
    let allFavourate = await FavourateServices.find();
    let latestFavourat = allFavourate[allFavourate.length - 1];
    if (req.params.type === "customer") {
        res.render("register", {
            startAbusiness,
            licenses,
            labour,
            HR,
            user: req.user,
            passedMessage,
            latestFavourat,
        });
    } else {
        res.render("adminPanel/authentication/register", {
            passedMessage,
            type: req.params.type,
        });
    }
});

// POST for the registration of the user
app.post("/register/:type", async function (req, res) {
    let auth = req.user;
    if (req.params.type === "employee") {
        if (auth && req.user.type === "admin") {
            const {
                first_name,
                last_name,
                username,
                password,
                contact_number,
                repassword,
            } = req.body;

            if (password === repassword) {
                User.register(
                    { username: username },
                    password,
                    function (err, user) {
                        if (err) {
                            console.log(err);
                            var message = encodeURIComponent(
                                "Email Already Exists"
                            );
                            res.redirect(
                                "/register/customer?message=" + message
                            );
                        } else {
                            passport.authenticate("local")(
                                req,
                                res,
                                async function () {
                                    console.log(req.params.type);
                                    user.type = req.params.type;
                                    (user.contact_number = contact_number),
                                        (user.first_name = first_name),
                                        (user.last_name = last_name);
                                    await user.save();
                                    res.redirect("/adminPanel");
                                    res.redirect(req.session.returnTo || "/");
                                    delete req.session.returnTo;
                                }
                            );
                        }
                    }
                );
            } else {
                var message = encodeURIComponent("Passwords do not match!");
                res.redirect(
                    "/register/" + req.params.type + "?message=" + message
                );
            }
        } else {
            var message = encodeURIComponent("Not Enough Authority!");
            res.redirect(
                "/register/" + req.params.type + "?message=" + message
            );
        }
    } else {
        const {
            first_name,
            last_name,
            username,
            password,
            contact_number,
            repassword,
        } = req.body;

        if (password === repassword) {
            User.register(
                { username: username },
                password,
                function (err, user) {
                    if (err) {
                        console.log(err);
                        var message = encodeURIComponent(
                            "Email Already Exists"
                        );
                        res.redirect("/register/customer?message=" + message);
                    } else {
                        passport.authenticate("local")(
                            req,
                            res,
                            async function () {
                                user.type = req.params.type;
                                user.contact_number = contact_number;
                                user.first_name = first_name;
                                user.last_name = last_name;
                                await user.save();
                                if (req.params.type === "admin")
                                    res.redirect("/adminPanel");
                                res.redirect(req.session.returnTo || "/");
                                delete req.session.returnTo;
                            }
                        );
                    }
                }
            );
        } else {
            var message = encodeURIComponent("Passwords do not match!");
            res.redirect(
                "/register/" + req.params.type + "?message=" + message
            );
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
                        passport.authenticate(
                            "local",
                            function (err, user, info) {
                                if (user) {
                                    if (
                                        req.params.type === "admin" ||
                                        req.params.type === "employee"
                                    ) {
                                        res.redirect("/adminPanel");
                                    } else {
                                        res.redirect(
                                            req.session.returnTo || "/"
                                        );
                                        delete req.session.returnTo;
                                    }
                                } else {
                                    let message = encodeURIComponent(
                                        "UserName Or Password is incorrect !"
                                    );
                                    req.logOut();
                                    res.redirect(
                                        "/login/" +
                                            req.params.type +
                                            "?message=" +
                                            message
                                    );
                                }
                            }
                        )(req, res, function () {});
                    }
                });
            } else {
                let message = encodeURIComponent(
                    "Your access is blocked by the admin!"
                );
                res.redirect("/login/customer?message=" + message);
            }
        } else {
            let message = encodeURIComponent("you are supposed to login here!");
            res.redirect(`/login/${user.type}?message=` + message);
        }
    } else {
        let message = encodeURIComponent("Username or password is incorrect!");
        res.redirect("/login/" + req.params.type + "?message=" + message);
    }
});

app.get("/logout", function (req, res) {
    req.logOut();
    res.redirect(req.session.returnTo || "/");
});

//========================== Admin panel ======================//
//====multer config=========//

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + "/public/uploads");
    },
    filename: function (req, file, cb) {
        let parts = file.originalname.split(".");
        let format = parts[parts.length - 1];
        let pathName = req.route.path.substring(1);
        if (pathName === "blogsGenerator") {
            cb(null, file.originalname.replace(/\s/g, ""));
        } else if (pathName === "admin/dailyWages") {
            cb(null, file.originalname.replace(/\s/g, ""));
        } else if (pathName === "admin/clientIcons") {
            cb(null, file.originalname.replace(/\s/g, ""));
        } else {
            cb(null, file.originalname.replace(/\s/g, ""));
        }
    },
});

let upload = multer({ storage });
//=====multer config end ======//
app.get("/adminPanel", async (req, res) => {
    let auth = req.isAuthenticated();
    let passedMessage = req.query.message;
    req.session.returnTo = req.originalUrl;
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let customers = await User.find({ type: "customer" });
            let employees = await User.find({ type: "employee" });
            let orders = await CustomerResponse.find();
            res.render("adminPanel/dashboard", {
                data: null,
                passedMessage,
                user: req.user,
                customers,
                employees,
                orders,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
// service page
app.get("/admin/servicePage", (req, res) => {
    let auth = req.isAuthenticated();
    let singleService;
    req.session.returnTo = req.originalUrl;
    if (auth && req.user.type === "admin") {
        res.render("adminPanel/serviceForm", {
            data: null,
            user: req.user,
            singleService: null,
        });
    } else {
        res.redirect("/login/admin");
    }
});
app.get("/admin/serviceEditor", async function (req, res) {
    let auth = req.isAuthenticated();
    let passedMessage = req.query.message;
    req.session.returnTo = req.originalUrl;
    if (auth) {
        try {
            let services = await servicePage.find();
            res.render("adminPanel/serviceEditor", {
                services,
                user: req.user,
                passedMessage,
            });
        } catch (error) {
            res.send(error);
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.get("/admin/singleServiceEditor/:id", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        let singleService = await servicePage.findById(req.params.id);
        res.render("adminPanel/serviceForm", {
            data: null,
            user: req.user,
            singleService,
        });
    } else {
        res.redirect("/login/admin");
    }
});
app.get("/admin/singleServiceDelete/:id", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        await servicePage.deleteOne({ _id: req.params.id });
        let message = encodeURIComponent("Service Page Deleted Successfully!");
        res.redirect("/adminPanel?message=" + message);
    } else {
        res.redirect("/login/admin");
    }
});
// Post request to get all the service page info from the admin //
app.post("/websiteData", upload.array("image"), async (req, res) => {
    const {
        descriptionOfService,
        categoryOfService,
        submit_button_above,
        nameOfService,
        serviceurl,
        rapportStart,
        rapportSelect,
        rapportSuper,
        about_service,
        procedureName,
        procedureDescription,
        documents_required,
        eligibility,
        advantages,
        faqQuestion,
        faqAnswer,
        stepsName,
        stepsDescription,
    } = req.body;
    const servicePageObject = {
        category: categoryOfService,
        name: nameOfService,
        slug: serviceurl.replace(/\s/g, ""),
        descriptionOfService,
        pricingCards: { rapportStart, rapportSelect, rapportSuper },
        aboutService: about_service,
        procedure: { procedureName, procedureDescription },
        documentsRequired: documents_required,
        eligibility,
        advantages,
        steps: { stepsName, stepsDescription },
        faq: { faqQuestion, faqAnswer },
        filename: req.files.length !== 0 && req.files,
    };
    let service = await servicePage.findById(submit_button_above);
    if (service) {
        let toPush = { ...servicePageObject };
        delete toPush.steps;
        await servicePage.findOneAndUpdate(
            { _id: service.id },
            { $set: toPush },
            { new: true }
        );
        let message = encodeURIComponent("Service Page updated Successfully!");
        res.redirect("/adminPanel?message=" + message);
    } else {
        const newServicePage = new servicePage(servicePageObject);
        await newServicePage.save();
        let message = encodeURIComponent("Service Page Created Successfully!");
        res.redirect("/adminPanel?message=" + message);
    }
});
//blog
app.get("/blogsGenerator", function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let passedMessage = req.query.message;
            res.render("adminPanel/blogForm", {
                user: req.user,
                passedMessage,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.post("/blogsGenerator", upload.array("image"), async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth && req.user.type === "admin") {
        let newBlog = new Blog({
            user: req.user.id,
            title: req.body.nameOfBlog,
            description: req.body.blog_description,
            filename:
                req.files.length !== 0 &&
                req.files[0].originalname.replace(/\s/g, ""),
        });
        await newBlog.save();
        let message = encodeURIComponent("Blog Successfully created!");
        res.redirect("/blogsGenerator?message=" + message);
    } else {
        res.redirect("/login/admin");
    }
});

//Task distributions
app.get("/admin/taskDistribution", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth && req.user.type === "admin") {
        let employees = await User.find({ type: "employee" });

        let customerResponses = await CustomerResponse.find().populate(
            "employeeAssigned"
        );

        res.render("adminPanel/taskDistribution", {
            user: req.user,
            employees,
            customerResponses,
        });
    } else {
        res.redirect("/login/admin");
    }
});
app.post("/admin/taskDistribution", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth && req.user.type === "admin") {
        const { employeeId, responseId } = req.body;
        console.log(employeeId, responseId);
        let customerResponse = await CustomerResponse.findOne({
            _id: responseId,
        });
        customerResponse.employeeAssigned = employeeId;
        await customerResponse.save();
        res.end("done");
    }
});
app.get("/admin/customersAssigned", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let customersAssigned = await CustomerResponse.find({
                employeeAssigned: req.user.id,
            });
            let passedMessage = req.query.message;
            res.render("adminPanel/customersAssigned", {
                customersAssigned,
                user: req.user,
                passedMessage,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.get("/admin/customerResponseInfo/:id", async function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let response = await customerResponse.findById(req.params.id);
            res.render("adminPanel/customerResponseInfo", {
                user: req.user,
                response,
            });
        } else {
            res.redirect("/login/employee");
        }
    } else {
        res.redirect("/login/employee");
    }
});
app.post("/admin/statusUpdate", async function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let existingResponse = await customerResponse.findById(
                req.body.submitButton
            );
            console.log(existingResponse);
            existingResponse.statusOfWork = req.body.statusOfWork;
            existingResponse.save();
            let message = encodeURIComponent("Status Updated Successfully!");
            res.redirect("/admin/customersAssigned?message = " + message);
        } else {
            res.redirect("/login/employee");
        }
    } else {
        res.redirect("/login/employee");
    }
});

//Daily wages
app.get("/admin/dailyWages", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let passedMessage = req.query.message;
            res.render("adminPanel/dailyWagesForm", {
                user: req.user,
                passedMessage,
                singleWage: null,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.get("/admin/dailyWagesUpdate", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let passedMessage = req.query.message;
            let wages = await dailyWages.find();
            res.render("adminPanel/dailyWagesEdit", {
                user: req.user,
                passedMessage,
                wages,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.get("/admin/singWageEditor/:id", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let singleWage = await dailyWages.findById(req.params.id);
            let passedMessage = req.query.message;
            res.render("adminPanel/dailyWagesForm", {
                user: req.user,
                passedMessage,
                singleWage,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.get("/admin/singleWageDelete/:id", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            await dailyWages.deleteOne({ _id: req.params.id });
            let message = encodeURIComponent("Wage Deleted Successfully!");
            res.redirect("/admin/dailyWagesUpdate?message=" + message);
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.post(
    "/admin/dailyWages",
    upload.array("ratesPdf"),
    async function (req, res) {
        let auth = req.isAuthenticated();
        if (auth) {
            if (req.user.type === "admin" || req.user.type === "employee") {
                const {
                    effectiveDate,
                    state_select,
                    schedule,
                    category,
                    ratesPerMonth,
                    ratesPerDay,
                } = req.body;
                let dailyWageObject = {
                    state: state_select.toLowerCase().replace(/\s/g, "-"),
                    user: req.user.id,
                    schedule,
                    category,
                    effectiveDate,
                    minimumRates: {
                        ratesPerDay,
                        ratesPerMonth,
                    },
                    filename:
                        req.files.length !== 0 &&
                        req.files[0].originalname.replace(/\s/g, ""),
                };

                const newdailyWage = new dailyWages(dailyWageObject);
                let wage = await dailyWages.findById(req.body.submit_button);
                if (wage) {
                    if (req.files.length !== 0) {
                        let test = await dailyWages.findOneAndUpdate(
                            { _id: req.body.submit_button },
                            { $set: dailyWageObject },
                            { new: true }
                        );
                        let message = encodeURIComponent(
                            "Done Updating The Wage !"
                        );
                        res.redirect("/admin/dailyWages?message=" + message);
                    } else {
                        let test = await dailyWages.findOneAndUpdate(
                            { _id: req.body.submit_button },
                            {
                                state: state_select
                                    .toLowerCase()
                                    .replace(/\s/g, "-"),
                                schedule,
                                category,
                                effectiveDate,
                                minimumRates: {
                                    ratesPerDay,
                                    ratesPerMonth,
                                },
                            },
                            { new: true }
                        );
                    }
                    let message = encodeURIComponent("Done Editing The Wage !");
                    res.redirect("/admin/dailyWagesUpdate?message=" + message);
                } else {
                    await newdailyWage.save();
                    let message = encodeURIComponent("Done Adding new Wage !");
                    res.redirect("/admin/dailyWagesUpdate?message=" + message);
                }
            } else {
                res.redirect("/login/admin");
            }
        } else {
            res.redirect("/login/admin");
        }
    }
);

//Law updates
app.get("/admin/lawUpdatesForm", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let passedMessage = req.query.message;
            let SingleLawUpdate = null;
            res.render("adminPanel/lawUpdatesForm", {
                user: req.user,
                passedMessage,
                SingleLawUpdate,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.get("/admin/lawUpdatesFormUpdate", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let passedMessage = req.query.message;
            let updates = await lawUpdates.find();
            res.render("adminPanel/lawUpdatesEditor", {
                user: req.user,
                passedMessage,
                updates,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.get("/admin/singleLawEditor/:id", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let SingleLawUpdate = await lawUpdates.findById(req.params.id);
            let passedMessage = req.query.message;
            res.render("adminPanel/lawUpdatesForm", {
                user: req.user,
                passedMessage,
                SingleLawUpdate,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.get("/admin/singleLawDelete/:id", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            await lawUpdates.deleteOne({ _id: req.params.id });
            let message = encodeURIComponent(
                "Law Update  Deleted Successfully!"
            );
            res.redirect("/adminPanel?message=" + message);
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.post("/admin/lawUpdatesForm", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            const {
                submit_button,
                department,
                authority,
                url,
                subject,
            } = req.body;
            const newLawUpdate = new lawUpdates({
                user: req.user.id,
                department,
                authority,
                url,
                subject,
            });
            let update = await lawUpdates.findById(submit_button);
            if (update) {
                let test = await servicePage.findOneAndUpdate(
                    { _id: update.id },
                    { $set: newLawUpdate },
                    { new: true }
                );
                let message = encodeURIComponent("Done editing the update!");
                res.redirect("/adminpanel?message=" + message);
            } else {
                await newLawUpdate.save();
                let message = encodeURIComponent("Done Posting the update!");
                res.redirect("/admin/lawUpdatesForm?message=" + message);
            }
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});

//callback
app.get("/admin/callback", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let passedMessage = req.query.message;
            let callData = await Callback.find();
            res.render("adminPanel/callback", {
                user: req.user,
                passedMessage,
                callData,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.post("/admin/callback", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let foundCall = await Callback.findById(req.body.CallDoneButton);
            foundCall.status = "Done";
            foundCall.save();
            let message = encodeURIComponent("Call update done!");
            res.redirect("/admin/callback?message=" + message);
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});

//have a question form
app.get("/admin/haveAquestion", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let question = await QuestionInMind.find();
            res.render("admin/questionInMindForm", {
                user: req.user,
                question,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});

//favourite services
app.get("/admin/favouriteServices", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        let passedMessage = req.query.message;
        if (req.user.type === "admin" || req.user.type === "employee") {
            let favourates = await FavourateServices.find();
            res.render("adminPanel/favouriteServices", {
                user: req.user,
                passedMessage,
                favourate: favourates[favourates.length - 1],
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.post("/admin/favouriteServices", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        let passedMessage = req.query.message;
        if (req.user.type === "admin" || req.user.type === "employee") {
            let newFavourate = new FavourateServices({
                user: req.user,
                favourates: req.body,
            });
            await newFavourate.save();
            let message = decodeURIComponent("Updated Successfully!");
            res.redirect("/admin/favouriteServices?message=" + message);
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
//Customer reviews
app.get("/admin/clientReviews", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        let passedMessage = req.query.message;
        if (req.user.type === "admin" || req.user.type === "employee") {
            res.render("adminPanel/clientReviews", {
                passedMessage,
                user: req.user,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.post("/admin/clientReviews", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        if (req.user.type === "admin" || req.user.type === "employee") {
            let newReview = new ClientReviews({
                user: req.user.id,
                ...req.body,
            });
            await newReview.save();
            let message = encodeURIComponent("Review Added successfully!!");
            res.redirect("/admin/clientReviews?message=" + message);
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.get("/admin/editClientReviewsForm", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        let allReviews = await ClientReviews.find();
        let passedMessage = req.query.message;
        if (req.user.type === "admin" || req.user.type === "employee") {
            res.render("adminPanel/editClientReviews", {
                allReviews,
                passedMessage,
                user: req.user,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.get("/admin/editClientReviews/:id", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        let message = encodeURIComponent("Successfully Deleted!");
        if (req.user.type === "admin" || req.user.type === "employee") {
            await ClientReviews.deleteOne({ _id: req.params.id });
            res.redirect("/admin/editClientReviewsForm?message=" + message);
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});

//clientIcons
app.get("/admin/clientIcons", async function (req, res) {
    let auth = req.isAuthenticated();
    if (auth) {
        let passedMessage = req.query.message;
        if (req.user.type === "admin" || req.user.type === "employee") {
            res.render("adminPanel/clientIconsForm", {
                passedMessage,
                user: req.user,
            });
        } else {
            res.redirect("/login/admin");
        }
    } else {
        res.redirect("/login/admin");
    }
});
app.post(
    "/admin/clientIcons",
    upload.array("clientImage"),
    async function (req, res) {
        let auth = req.isAuthenticated();
        if (auth) {
            if (req.user.type === "admin" || req.user.type === "employee") {
                let clientImageObject = new ClietnIcons({
                    user: req.user.id,
                    filename: req.files[0].originalname.replace(/\s/g, ""),
                });
                await clientImageObject.save();
                let message = encodeURIComponent(
                    "successfully uploaded the image!"
                );
                res.redirect("/admin/clientIcons?message=" + message);
            } else {
                res.redirect("/login/admin");
            }
        } else {
            res.redirect("/login/admin");
        }
    }
);
app.get("/admin/editClientIcons", async function (req, res) {
    try {
        if (req.isAuthenticated()) {
            if (req.user.type === "admin" || req.user.type === "employee") {
                let passedMessage = req.query.message;
                let images = await clientIcons.find();
                res.render("adminPanel/editClientImages", {
                    passedMessage,
                    images,
                    user: req.user,
                });
            } else {
                res.redirect("/login/admin");
            }
        } else {
            res.redirect("/login/admin");
        }
    } catch (error) {
        console.log(error);
        res.redirect("/admin/error");
    }
});
app.get("/admin/deleteClientIcons/:id", async function (req, res) {
    try {
        let id = req.params.id;
        await clientIcons.findByIdAndRemove(id);
        let message = encodeURIComponent("successfuly deleted");
        res.redirect("/admin/editClientIcons?message=" + message);
    } catch (error) {
        res.redirect("/admin/error");
    }
});
//404 routes
app.get("/admin/*", function (req, res) {
    res.render("adminPanel/404", { user: req.user });
});
// ================= admin panel finished ==================== //

app.get("*", async function (req, res) {
    let allFavourate = await FavourateServices.find();
    let latestFavourat = allFavourate[allFavourate.length - 1];
    let [startAbusiness, licenses, labour, HR] = await serviceSort();
    res.render("404", {
        startAbusiness,
        licenses,
        labour,
        HR,
        user: req.user,
        latestFavourat,
    });
});

app.listen(PORT, () => {
    console.log(`Server started on PORT ${PORT}`);
});
