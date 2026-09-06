const Listing = require("../models/listing");
const {listingSchema} = require("../schema.js");
const axios = require("axios");
const ExpressError = require("../Utils/ExpressError.js");

module.exports.index = (async(req,res) =>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs",{allListings})
})

module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs")
}

module.exports.showListing = async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({path:"reviews",
        populate: {
            path: "author"
        },
    })
    .populate("owner");
    if(!listing){
        req.flash("error","Listing you requested for does not exit!");
        return res.redirect("/listings");
    }
    res.render("listings/show",{listing});
 }

 module.exports.createListing = async (req, res) => {
    let result = listingSchema.validate(req.body);
    if (result.error) {
        throw new ExpressError(400, result.error.message);
    }//req.file is default object
    let url = req.file.path;
    let filename = req.file.filename;
    
    const newlisting = new Listing(req.body.listing);
    const searchLocation =
    `${newlisting.location}, ${newlisting.country}`;

    const response = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
        params: {
            q: searchLocation,
            format: "json",
            limit: 1
        },
        headers: {
            "User-Agent": "Wanderlust-MajorProject"
        }
    }
);
if (response.data.length === 0) {
    req.flash("error", "Location not found!");
    return res.redirect("/listings/new");
}
const place = response.data[0];

newlisting.geometry = {
    type: "Point",
    coordinates: [
        Number(place.lon),
        Number(place.lat)
    ]
};

    newlisting.owner = req.user._id;
    newlisting.image = {url,filename};
    await newlisting.save();

    req.flash("success", "New Listing Created Successfully!");
    res.redirect("/listings");
};

 module.exports.renderEditForm = async(req,res) =>{
     let {id} = req.params;
     const listing = await Listing.findById(id);
     if(!listing){
         req.flash("error","Listing you requested for does not exit!");
         return res.redirect("/listings");
     }
     let originalImageUrl = listing.image.url;
     originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250")
     res.render("listings/edit.ejs",{listing,originalImageUrl});
 }

 module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    let listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Save old location and country
    let oldLocation = listing.location;
    let oldCountry = listing.country;

    // Update listing data
    Object.assign(listing, req.body.listing);

    // Update coordinates only when location/country changes
    if (
        oldLocation !== listing.location ||
        oldCountry !== listing.country
    ) {
        const searchLocation =
            `${listing.location}, ${listing.country}`;

        const response = await axios.get(
            "https://nominatim.openstreetmap.org/search",
            {
                params: {
                    q: searchLocation,
                    format: "json",
                    limit: 1
                },
                headers: {
                    "User-Agent": "Wanderlust-MajorProject/1.0"
                }
            }
        );

        if (response.data.length === 0) {
            req.flash("error", "Location not found!");
            return res.redirect(`/listings/${id}/edit`);
        }

        const place = response.data[0];

        listing.geometry = {
            type: "Point",
            coordinates: [
                Number(place.lon),
                Number(place.lat)
            ]
        };
    }

    // Update image if new image is uploaded
    if (req.file) {
        let url = req.file.path;
        let filename = req.file.filename;

        listing.image = {
            url,
            filename
        };
    }

    await listing.save();

    req.flash("success", "Listing Updated Successfully!");
    res.redirect(`/listings/${id}`);
};