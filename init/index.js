const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');

// Connect to MongoDB
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

// Function to seed the database
main()
.then(() => {
  console.log("Connected to MongoDB");
})
.catch ((err) => {
  console.log(err);
});

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  // Clear existing listings
  await Listing.deleteMany({});

  initData.data = initData.data.map((obj) => ({...obj, owner: "6876b6c04ee0e4a04240ef86"}));

  // Insert new listings from data.js
  await Listing.insertMany(initData.data);

  console.log("Data was initialized");
}

initDB()
