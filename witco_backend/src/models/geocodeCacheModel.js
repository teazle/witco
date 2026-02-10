const mongoose = require("mongoose");

const GeocodeCacheSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    coords: {
      type: [Number],
      default: null,
    },
    provider: {
      type: String,
      default: "ors",
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

GeocodeCacheSchema.index({ lastUsedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = new mongoose.model("GeocodeCache", GeocodeCacheSchema);
