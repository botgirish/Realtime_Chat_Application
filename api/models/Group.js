const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    name: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Assuming users are part of the group
}, { timestamps: true });

const Group = mongoose.model('Group', GroupSchema);

module.exports = Group;
