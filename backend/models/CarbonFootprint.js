const mongoose = require('mongoose');

const CarbonFootprintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  travelEmissions: {
    type: Number,
    required: true
  },
  energyEmissions: {
    type: Number,
    required: true
  },
  wasteEmissions: {
    type: Number,
    required: true
  },
  dietEmissions: {
    type: Number,
    required: true
  },
  totalEmissions: {
    type: Number,
    required: true
  },
  inputs: {
    travelDistance: { type: Number, default: 0 },
    vehicleType: { type: String, default: 'walk_cycle' },
    electricity: { type: Number, default: 0 },
    cylinders: { type: Number, default: 0 },
    diet: { type: String, default: 'vegetarian' },
    waste: { type: Number, default: 0 },
    recycleRate: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('CarbonFootprint', CarbonFootprintSchema);
