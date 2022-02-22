const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const {
  check,
  validationResult,
} = require("express-validator");

router.get(
  "/me",
  auth,
  async (req, res) => {
    try {
      const profile =
        await Profile.findOne({
          user: req.user.id,
        }).populate("user", [
          "name",
          "avatar",
        ]);
      if (!profile) {
        return res.status(400).json({
          msg: "there is no profile for this user",
        });
      }
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send("Server Error");
    }
  }
);
// @route POST api/profile
//@desc   Create or update user profile
//@access  Private
router.post(
  "/",
  [
    auth,
    [
      check(
        "status",
        "Status is required"
      )
        .not()
        .isEmpty(),
      check(
        "skills",
        "Skills are required"
      )
        .not()
        .isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors =
      validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    const {
      company,
      skills,
      status,
      location,
      bio,
      LinkedIn,
      Youtube,
    } = req.body;
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) {
      profileFields.company = company;
    }
    if (skills) {
      profileFields.skills = skills
        .split(",")
        .map((skill) => skill.trim());
    }

    if (status) {
      profileFields.status = status;
    }
    if (location) {
      profileFields.location = location;
    }
    if (bio) {
      profileFields.bio = bio;
    }

    console.log(profileFields.skills);
    //build social object
    profileFields.social = {};
    if (LinkedIn) {
      profileFields.social.LinkedIn =
        LinkedIn;
      console.log("yes lk");
    }
    if (Youtube) {
      profileFields.social.Youtube =
        Youtube;
      console.log("yes yt");
    }
    try {
      let profile =
        await Profile.findOne({
          user: req.user.id,
        });
      if (profile) {
        //update
        profile =
          await Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: profileFields },
            { new: true }
          );
        return res.json(profile);
      }
      //create
      profile = new Profile(
        profileFields
      );
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send(
          "Server error while creating or updating"
        );
    }
  }
);
// @route GET api/profile
//@desc   Get all profiles
//@access  Public
router.get("/", async (req, res) => {
  try {
    const profiles =
      await Profile.find().populate(
        "user",
        ["name", "avatar"]
      );
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .send(
        "Server Error while getting all profiles"
      );
  }
});
// @route GET api/profile/user/:user_id
//@desc   Get profile by user id
//@access  Public
router.get(
  "/user/:user_id",
  async (req, res) => {
    try {
      const profile =
        await Profile.findOne({
          user: req.params.user_id,
        }).populate("user", [
          "name",
          "avatar",
        ]);
      if (!profile)
        return res.status(400).json({
          msg: "Profile not found",
        });
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      if (err.kind == "ObjectId") {
        return res.status(400).json({
          msg: "Profile not found",
        });
      }
      res
        .status(500)
        .send(
          "Server Error while getting all profiles"
        );
    }
  }
);
// @route DELETE api/profile
//@desc   Delete profile user and posts
//@access  Private
router.delete(
  "/",
  auth,
  async (req, res) => {
    try {
      //@todo remove user posts

      //Remove profile
      await Profile.findOneAndRemove({
        user: req.user.id,
      });

      //Remove user
      await User.findOneAndRemove({
        _id: req.user.id,
      });
      res.json({ msg: "user removed" });
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send(
          "Server Error while getting all profiles"
        );
    }
  }
);
// @route PUT api/profile/experience
//@desc   Add profile experience
//@access  Private
router.put("/experience", [
  auth,
  [
    check("title", "Title is required")
      .not()
      .isEmpty(),
    check(
      "company",
      "Company is required"
    )
      .not()
      .isEmpty(),
    check(
      "from",
      "From date is required"
    )
      .not()
      .isEmpty(),
  ],
  async (req, res) => {
    const errors =
      validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };
    try {
      const profile =
        await Profile.findOne({
          user: req.user.id,
        });
      profile.experience.unshift(
        newExp
      );
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send(
          "Server error while adding experience"
        );
    }
  },
]);
// @route DELETE api/profile/experiences/:exp_id
//@desc   delete profile experience
//@access  Private
router.delete(
  "/experience/:exp_id",
  auth,
  async (req, res) => {
    try {
      const profile =
        await Profile.findOne({
          user: req.user.id,
        });

      if (!req.params.exp_id)
        return res.status(400).json({
          msg: "experience not found",
        });
        const removeIndex = profile.experience
        //turn array of experiences into id's
        .map(item => item.id)
        //gets us the experience to delete
        .indexOf(req.params.exp_id);

      //Splice out of the array
      profile.experience.splice(removeIndex, 1);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send(
          "Server error while removing an experience"
        );
    }
  }
);
// @route PUT api/profile/education
//@desc   Add profile education
//@access  Private
router.put("/education", [
  auth,
  [
    check(
      "university",
      "University is required"
    )
      .not()
      .isEmpty(),
    check(
      "degree",
      "Degree is required"
    )
      .not()
      .isEmpty(),
    check(
      "fieldofstudy",
      "Field Of Study is required"
    )
      .not()
      .isEmpty(),
    check(
      "from",
      "From date is required"
    )
      .not()
      .isEmpty(),
  ],
  async (req, res) => {
    const errors =
      validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    const {
      university,
      degree,
      fieldofstudy,
      location,
      from,
      to,
      current,
      description,
    } = req.body;
    const newEdu = {
      university,
      degree,
      fieldofstudy,
      location,
      from,
      to,
      current,
      description,
    };
    try {
      const profile =
        await Profile.findOne({
          user: req.user.id,
        });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send(
          "Server error while adding education"
        );
    }
  },
]);
// @route DELETE api/profile/education/:exp_id
//@desc   delete profile education
//@access  Private
router.delete(
  "/education/:edu_id",
  auth,
  async (req, res) => {
    try {
      const profile =
        await Profile.findOne({
          user: req.user.id,
        });
      if (!req.params.edu_id)
        return res.status(400).json({
          msg: "education not found",
        });
      const removeIndex =
        profile.education
          .map((item) => item.id)
          .indexOf(req.params.edu_id);

      profile.education.splice(
        removeIndex,
        1
      );

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send(
          "Server error while removing an education"
        );
    }
  }
);
module.exports = router;
