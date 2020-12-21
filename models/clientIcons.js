const mongoose = require("mongoose");

const clientIconsSchema = new mongoose.Schema({
    user: {
        type: String,
        default: "pending",
    },

    filename: {
        type: String,
    },
    timeStamp: {
        type: Date,
        default: Date.now(),
    },
});

module.exports = ClientIcons = mongoose.model("ClientIcons", clientIconsSchema);
