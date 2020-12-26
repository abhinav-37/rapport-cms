const mongoose = require("mongoose");
const emailSubsSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    timeStamp: {
        type: Date,
        default: Date.now(),
    },
});

module.exports = EmailSubs = mongoose.model("EmailSubs", emailSubsSchema);
