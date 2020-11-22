const mongoose = require("mongoose");

const customerResponseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    full_name: {
        type: String,
        required:true
    },
    contact_info: {
        type: Number,
        required: true
    },
    emailId: {
        type: String,
        required:true
    },
    task: {
        type: String,
        required: true
    },
    employeeAssigned: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default:null
    },
    statusOfWork: {
        type: String,
        default:"started"
    },
    timeStamp: {
        type: Date,
        default: Date.now()
    },
    nameOfImage:String
});

module.exports = CustomerResponse = mongoose.model("customerResponse", customerResponseSchema);