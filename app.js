if(process.env.NODE_ENV != "production") {
require("dotenv").config();
}

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');


const listingsRouter = require('./routes/listing.js');
const reviewsRouter = require('./routes/review.js');
const userRoutes = require('./routes/user.js');

const app = express();

const dbUrl = process.env.ATLASDB_URL;

main()
.then(() => {
  console.log("Connected to MongoDB");
})
.catch ((err) => {
  console.log(err);
});

async function main() {
  await mongoose.connect(dbUrl );
}

// EJS Setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")))


const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("ERROR IN MONGO SESSION STORE", err);
});


const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expire: Date.now() + 7 * 24 * 24 * 60 * 60 * 1000, // 7 days
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true, // Helps prevent XSS attacks
  } 
};

// app.get("/", (req,res) => {
//   res.send("Hi, I am root");
// });



app.use(session(sessionOptions));
app.use(flash());



// Passport Configuration
// Initialize Passport
app.use(passport.initialize());

// Use session with Passport
app.use(passport.session());

// Configure Passport to use the LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// Serialize user to store in session
passport.serializeUser(User.serializeUser());
// Deserialize user from session
passport.deserializeUser(User.deserializeUser());



app.use((req, res, next) => {
  res.locals.success = req.flash("success");  
  res.locals.error = req.flash("error"); 
  res.locals.currentUser = req.user; // Make currentUser available in all templates
  next();
});


app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter); 
app.use("/", userRoutes);


// Error-handling middleware
app.use((err, req, res, next) => {
  let { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong!";
  res.status(statusCode).render("error.ejs", { err });
});


app.listen(8080, () => {
  console.log("Server listening on port 8080");
})