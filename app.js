require('dotenv').config();
console.log("DB HOST:",
    process.env.ATLASDB_URL?.split("@")[1]?.split("/")[0]
);

console.log("DB URL EXISTS:",
    !!process.env.ATLASDB_URL
);
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require(".../utils/ExpressError.js");
// const MONGO_URL ="mongodb://127.0.0.1:27017/wonderlust";

const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js")

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


// const MONGO_URL ="mongodb://127.0.0.1:27017/wonderlust";
const dbUrl = process.env.ATLASDB_URL;

console.log("START:", dbUrl ? JSON.stringify(dbUrl.substring(0, 20)) : "undefined");

async function main() {
    await mongoose.connect(dbUrl, {
        family: 4
    });
}

async function startServer() {
    try {
        await main()
        console.log("connected to DB");

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride ("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    client: mongoose.connection.getClient(),
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error",(err) =>{
    console.log("ERROR in MONGO SESSION STORE",err);
})

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie :{
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    },
};
// app.get("/",(req,res) =>{
//     res.send("root is working.....")
// });

app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());

passport.use( new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());//serialize users into the session
passport.deserializeUser(User.deserializeUser());//end of session dserialize user

app.use((req,res,next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/",userRouter);


app.use((req,res,next) =>{
    next(new ExpressError(404,"page not found"));
})

app.use((err,req,res,next)=>{
    let {statusCode=500,message="something went wrong"} = err;
    res.status (statusCode).render("error.ejs",{message});
})

app.listen(8080,() =>{
    console.log("port 8080 is connected successful");
})
    }catch (err) {
        console.log("MongoDB connection error:", err);
    }
};
startServer();
