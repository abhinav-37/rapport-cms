const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    category: {
        type: String,  
    },
    name: {
        required: true,
        type: String
    },
    descriptionOfService: {
        required: true,
        type:String
    },
    slug: {
        required: true,
        type:String
    },
    hasCustomView: {
        type: Boolean,
        default: false 
    },
    pricingCards: {
        type: Object,
        required:true
    },  //this will contain three objects which will contain price and details of the 3 pricing cards
    aboutService: {
        type: String,
        default: null
    },  //will get from the text editor
    procedure: {type: Object,default:null}, //this will contain key value pairs of the Procedure section where key will be the name array and value will be the names and other key will be the description and the array will be the description array
    documentsRequired: {
        type: String,
        default: null
    } ,
    eligibility: {
        type: String,
        default:null
    } ,
    advantages: {
        type: String,
        default:null
    },
    steps: {
        type: Object,
        default:null
    },
    filename: {
        type: String,
        default: null
    },
    faq: {
        type: Object,
        default:null
    } //This will also contain key value pairs of data name and data itself

});

module.exports = ServicePage = mongoose.model("servicePage", serviceSchema);