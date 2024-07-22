const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username:{type:String,unique:true},
    password:{type:String},
},{timestamps:true});

const usermodel = mongoose.model('userr',UserSchema);

module.exports = usermodel;