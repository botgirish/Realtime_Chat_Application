const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }] // Reference to groups
}, { timestamps: true });

const usermodel = mongoose.model('userrs', UserSchema);

module.exports = usermodel;