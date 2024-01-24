const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schema.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");

const upload = multer({ storage });

const listingController = require("../controllers/listing.js");

//Router.route

//Index Route
router.get("/", wrapAsync(listingController.index));

//New ROute
router.get("/new", isLoggedIn, listingController.renderNewForm);
//SHow Route

router.get("/:id/", wrapAsync(listingController.showListings));

//Create Route
router.post(
	"/",
	isLoggedIn,
	upload.single("listing[image]"),
	wrapAsync(listingController.createListing)
);

//Edit And Uodate ROute

router.get(
	"/:id/edit",
	isLoggedIn,
	isOwner,
	wrapAsync(listingController.editForm)
);

//Update Route

router.put(
	"/:id",
	isLoggedIn,
	isOwner,
	upload.single("listing[image]"),
	wrapAsync(listingController.updateListings)
);

//Delete ROute

router.delete(
	"/:id",
	isLoggedIn,
	isOwner,
	wrapAsync(listingController.destroy)
);
module.exports = router;
