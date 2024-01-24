const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
	const allListings = await Listing.find({});
	res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
	res.render("listings/new.ejs");
};

module.exports.showListings = async (req, res) => {
	let { id } = req.params;
	const listing = await Listing.findById(id)
		.populate({
			path: "reviews",
			populate: {
				path: "author",
			},
		})
		.populate("owner");
	if (!listing) {
		req.flash("error", "Listing you requested does not exist!");
		res.redirect("/listings");
	}
	res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
	let url = req.file.path;
	let filename = req.file.filename;
	// console.log(url, "..", filename);
	let { listing } = req.body;
	const newListing = new Listing(listing);
	newListing.image = { url, filename };
	newListing.owner = req.user._id;
	await newListing.save();

	req.flash("success", "New Listing Created");
	res.redirect("/listings");
};

module.exports.editForm = async (req, res) => {
	let { id } = req.params;
	const listing = await Listing.findById(id);
	if (!listing) {
		req.flash("error", "Listing you requested does not exist!");
		res.redirect("/listings");
	}

	let OriginalImageUrl = listing.image.url;
	OriginalImageUrl = OriginalImageUrl.replace("/upload", "/upload/w_250");
	res.render("listings/edit.ejs", { listing, OriginalImageUrl });
};

module.exports.updateListings = async (req, res) => {
	let { id } = req.params;
	let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

	if (typeof req.file !== "undefined") {
		let url = req.file.path;
		let filename = req.file.filename;
		listing.image = { url, filename };
		await listing.save();
	}
	req.flash("success", "Listing Updated!");
	res.redirect(`/listings/${id}`);
};

module.exports.destroy = async (req, res) => {
	let { id } = req.params;
	let deletedListing = await Listing.findByIdAndDelete(id);
	// console.log(deletedListing);
	req.flash("success", "Listing Deleted");
	res.redirect("/listings");
};