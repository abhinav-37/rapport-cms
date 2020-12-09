const mongoose = require("mongoose");

const questionInMindSchema = new mongoose.Schema({
    status: {
        type: String,
        default:"pending"
    },
    name: {
        required: true,
        type: String
    },
    comapnyName: {
        type: String,
    },
    email: {
        type: String,
        required:true
    },
    customerNumber: {
        type: String,
        required:true
    },
    enquiryFor: {
        type: String,
        required:true
    },
    timeStamp: {
        type: Date,
        default: Date.now()
    },

});

module.exports = QuestionInMind = mongoose.model("QuestionInMind", questionInMindSchema);