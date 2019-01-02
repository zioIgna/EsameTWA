const mongoose = require('mongoose');

const msgSchema = mongoose.Schema({
    autore: { type: String, required: true },    // { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contenuto: { type: String, required: true },
    destinatario: { type: String, required: true },      // { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    timeStamp: { type: Date, default: Date.now } //  required: true
});

module.exports = mongoose.model('Message', msgSchema);