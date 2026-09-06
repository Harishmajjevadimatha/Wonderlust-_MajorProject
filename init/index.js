const mongoose = require("mongoose");
const axios = require("axios");

const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wonderlust";

async function main() {
    await mongoose.connect(MONGO_URL);
    console.log("connected to DB");

    await initDB();

    await mongoose.connection.close();
    console.log("Database connection closed");
}

const geocode = async (location, country) => {

    const searchLocation = `${location}, ${country}`;

    try {

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
            console.log(`❌ Location not found: ${searchLocation}`);
            return null;
        }

        const place = response.data[0];

        console.log(
            `✅ ${searchLocation} → ${place.lat}, ${place.lon}`
        );

        return {
            type: "Point",
            coordinates: [
                Number(place.lon),
                Number(place.lat)
            ]
        };

    } catch (err) {

        console.log(
            `❌ Error for ${searchLocation}:`,
            err.response?.status || err.message
        );

        return null;
    }
};


const initDB = async () => {

    await Listing.deleteMany({});

    const listings = [];

    for (let obj of initData.data) {

        const geometry = await geocode(
            obj.location,
            obj.country
        );

        listings.push({
            ...obj,

            geometry: geometry,

            owner: "6a91de2a8f956576e972ea90"
        });

        // Wait 1.5 seconds before next request
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    await Listing.insertMany(listings);

    console.log("🎉 Data was initialized with coordinates!");
};


main()
    .catch(err => {
        console.log(err);
    });