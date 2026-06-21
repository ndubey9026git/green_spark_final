const mongoose = require('mongoose');

const BioreactorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feedstockFood: { type: Number, default: 0 }, // tons per day of food waste
  feedstockAgri: { type: Number, default: 0 }, // tons per day of agricultural waste
  temperature: { type: Number, default: 35 }, // digester temperature in °C
  retentionTime: { type: Number, default: 20 }, // days
  netElectricity: { type: Number, default: 0 }, // MWh produced per day
  carbonOffset: { type: Number, default: 0 }, // CO2e offset tons per day
  dailyProfit: { type: Number, default: 0 }, // $ profit per day
}, { timestamps: true });

module.exports = mongoose.model('Bioreactor', BioreactorSchema);
