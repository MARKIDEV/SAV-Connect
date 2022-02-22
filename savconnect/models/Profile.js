const mongoose = require("mongoose");
const ProfileSchema =
  new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types
        .ObjectId,
      ref: "User",
    },
    company: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    bio: { type: String },
    experience: [
      {
        title: {
          type: String,
          required: true,
        },
        company: {
          type: String,
          required: true,
        },
        location: {
          type: String,
          required: true,
        },
        from: {
          type: Date,
          required: true,
        },
        to: { type: Date },
        current: {
          type: Boolean,
          default: false,
        },
        description: { type: String },
      },
    ],
    education: [
      {
        university: {
          type: String,
          required: true,
        },
        degree: {
          type: String,
          required: true,
        },
        fieldofstudy: {
          type: String,
          required: true,
        },
        location: {
          type: String,
          required: true,
        },
        from: {
          type: Date,
          required: true,
        },
        to: { type: Date },
        description: { type: String },
      },
    ],
    social: [
      {
        LinkedIn: {
          type: String,
        },
        Youtube: {
          type: String,
        },
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
  });
module.exports = Profile =
  mongoose.model(
    "profile",
    ProfileSchema
  );
  
