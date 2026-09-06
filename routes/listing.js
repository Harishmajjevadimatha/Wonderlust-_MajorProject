const express = require("express");
const router = express.Router();
const wrapAsync = require("../Utils/wrapAsync.js");
const {isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const controllersListings = require("../controllers/listings.js")
const multer  = require('multer')
const{storage} = require("../cloudinaryconfig.js")
const upload = multer({ storage });//it stores in cloudinary

router.route("/")
.get( wrapAsync(controllersListings.index))
.post(isLoggedIn,
    upload.single("listing[image][url]"),
    wrapAsync(controllersListings.createListing));

//new route
router.get("/new",isLoggedIn,(controllersListings.renderNewForm));

router.route("/:id")
.get(wrapAsync(controllersListings.showListing))
.put(isLoggedIn,
    isOwner,
    upload.single("listing[image][url]"),
    validateListing,
    wrapAsync(controllersListings.updateListing))
.delete(isLoggedIn,
    isOwner,
    wrapAsync(controllersListings.destroyListing));
 
//Edit route
router.get("/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(controllersListings.renderEditForm))

module.exports = router;