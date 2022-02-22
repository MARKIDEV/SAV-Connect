const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config=require('config');
const {
  check,
  validationResult,
} = require("express-validator");

router.get(
  "/",
  auth,
  async (req, res) => {
    try {
      const user = await User.findById(
        req.user.id
      ).select("-password");
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send("SERVER ERROR");
    }

    //res.send("auth router");
  }
);

//@route   POST api/auth

router.post(
  "/",
  [
    check(
      "email",
      "Please include a valid email"
    ).isEmail(),
    check(
      "password",
      "password is required"
    ).exists(),
  ],
  async (req, res) => {
    const errors =
      validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { email, password } =
      req.body;
    try {
      //check whether the user exist
      let user = await User.findOne({
        email,
      });
      if (!user) {
        return res.status(400).json({
          errors: [
            {
              msg: "Invalid credentials",
            },
          ],
        });
      }
      const isMatch =
        await bcrypt.compare(
          password,
          user.password
        );
      if (!isMatch) {
        return res.status(400).json({
          errors: [
            {
              //for security reason i will make the same msg error
              msg: "Invalid credentials",
            },
          ],
        });
      }

      //return jsonwebtoken

      const payload = {
        user: {
          id: user.id,
        },
      };
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 36000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send("Server error");
    }
  }
);
module.exports = router;
