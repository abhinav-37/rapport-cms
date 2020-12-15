const mongoose = require("mongoose");

const clientReviewsSchema = new mongoose.Schema({
    user: {
        type: String,
        default: "pending",
    },
    rating: {
        required: true,
        type: String,
    },
    clientName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
    },
    timeStamp: {
        type: Date,
        default: Date.now(),
    },
});

module.exports = ClientReviews = mongoose.model(
    "ClientReviews",
    clientReviewsSchema
);
