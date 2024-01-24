if (process.env.NODE_ENV != "production") {
	require("dotenv").config();
}

const express = require("express");
const app = express();
const Listing = require(__dirname + "/models/listing.js");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require(__dirname + "/models/review.js");
const User = require(__dirname + "/models/user.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { isLoggedIn, isReviewAuthor } = require("./middleware.js");

const listingRouter = require("./routes/listing.js");
const userRouter = require("./routes/user.js");
const { log, error } = require("console");

const reviewController = require("./controllers/review.js");
const { db } = require("./models/review.js");

const dbURL = process.env.ATLASDB_URL;

main()
	.then(() => {
		console.log("connected to DB");
	})
	.catch((err) => {
		console.log(err);
	});

async function main() {
	await mongoose.connect(dbURL);
}

app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
	mongoUrl: dbURL,
	crypto: {
		secret: process.env.SECRET,
	},
	touchAfter: 24 * 60 * 60,
});

store.on("error", () => {
	console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOption = {
	store,
	secret: process.env.SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: {
		expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
		maxAge: 7 * 24 * 60 * 60 * 1000,
		httpOnly: true,
	},
};

// app.get("/", (req, res) => {
// 	res.send("Hi, I am root");
// });

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
	res.locals.success = req.flash("success");
	res.locals.error = req.flash("error");
	res.locals.currUser = req.user;
	next();
});

app.get("/demouser", async (req, res) => {
	let fakeUser = new User({
		email: "arshiya@gmail.com",
		username: "Arshiyasiddique",
	});

	let registerUser = await User.register(fakeUser, "helloWorld");
	res.send(registerUser);
});

const validateReview = (req, res, next) => {
	let { error } = reviewSchema.validate(req.body);
	if (error) {
		let errMsg = error.details.map((el) => el.message).join(",");
		throw new ExpressError(400, errMsg);
	} else {
		next();
	}
};

app.use("/listings", listingRouter);
app.use("/", userRouter);

//Review Post Route

app.post(
	"/listings/:id/reviews",
	isLoggedIn,
	validateReview,
	wrapAsync(reviewController.createReview)
);

// Review Delete

app.delete(
	"/listings/:id/reviews/:reviewId",
	isLoggedIn,
	isReviewAuthor,
	wrapAsync(reviewController.destroyReview)
);

/* 

Create a new listing using the defined schema 

app.get("/testlisting", async (req, res) => {
    let sampleListing = new Listing({
        title: "Beautiful Beachfront Villa",
        description: "A stunning beachfront villa with breathtaking views.",
        price: 500,
        location: "Beachfront Paradise",
        country: "Tropical Island",
    });
    sampleListing.save();
    console.log("sample listing is saved");
    res.send("Successsful");
});

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found"));
})

*/

app.use((err, req, res, next) => {
	let { status = 500, message = "Something went wrong" } = err;
	res.status(status).render("error.ejs", { message });
	// res.status(status).send(message)
});

app.listen(8080, () => {
	console.log("Server is listening on port 8080");
});
