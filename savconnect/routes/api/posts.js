const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const {
  check,
  validationResult,
} = require("express-validator");
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

//@route   POST api/posts
//@desc    Create a post
//@access  Private
router.post(
  "/",
  [
    auth,
    [
      check("text", "Text is required")
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
    try {
      const user = await User.findById(
        req.user.id
      ).select("-password");

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send(
          "Server Error while creating new post"
        );
    }
  }
);
//@route   GET api/posts
//@desc    get all posts
//@access  Private
router.get(
  "/",
  auth,
  async (req, res) => {
    try {
      const posts =
        await Post.find().sort({
          date: -1,
        });
      //sort -1 =>> most recent
      res.json(posts);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send(
          "Server Error while getting posts"
        );
    }
  }
);
//@route   GET api/posts/:id
//@desc    get a post by id
//@access  Private
router.get(
  "/:id",
  auth,
  async (req, res) => {
    try {
      const post = await Post.findById(
        req.params.id
      ).select("-_id");

      if (!post) {
        return res.status(404).json({
          msg: "Post not found",
        });
      }
      res.json(post);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({
          msg: "Post not found",
        });
      }

      res
        .status(500)
        .send(
          "Server Error while getting posts"
        );
    }
  }
);
//@route   DELETE api/posts/:id
//@desc    Delete a post
//@access  Private
router.delete(
  "/:id",
  auth,
  async (req, res) => {
    try {
      const post = await Post.findById(
        req.params.id
      );
      if (!post) {
        return res.status(404).json({
          msg: "Post not found",
        });
      }
      //check user
      if (
        post.user.toString() !==
        req.user.id
      ) {
        return res.status(401).json({
          msg: "User not authorized",
        });
      }
      await post.remove();
      res.json({ msg: "post removed" });
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({
          msg: "Post not found",
        });
      }
      res
        .status(500)
        .send(
          "Server Error while deleting posts"
        );
    }
  }
);
//@route   PUT api/posts/likes/:id
//@desc    Like a post
//@access  Private
router.put(
  "/likes/:id",
  auth,
  async (req, res) => {
    try {
      const post = await Post.findById(
        req.params.id
      );
      //Check if the post has already been liked
      if (
        post.likes.filter(
          (like) =>
            like.user.toString() ===
            req.user.id
        ).length > 0
      ) {
        return res.status(400).json({
          msg: "Post already liked",
        });
      }
      post.likes.unshift({
        user: req.user.id,
      });
      await post.save();
      res.json(post.likes);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send(
          "Server Error while liking post"
        );
    }
  }
);
//@route   PUT api/posts/unlike/:id
//@desc    unLike a post
//@access  Private
router.put(
  "/unlike/:id",
  auth,
  async (req, res) => {
    try {
      const post = await Post.findById(
        req.params.id
      );
      //Check if the post has already been liked
      if (
        post.likes.filter(
          (like) =>
            like.user.toString() ===
            req.user.id
        ).length === 0
      ) {
        return res.status(400).json({
          msg: "Post has been not yet liked",
        });
      }
      //Get remove index
      const removeIndex =
        post.likes.map((like) =>
          like.user
            .toString()
            .indexOf(req.user.id)
        );
      post.likes.splice(removeIndex, 1);
      await post.save();
      res.json({
        msg: "you unliked this post",
      });
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send(
          "Server Error while liking post"
        );
    }
  }
);
//@route   POST api/posts/comment/:id
//@desc    Comment on  a post
//@access  Private
router.post(
  "/comment/:id",
  [
    auth,
    [
      check("text", "Text is required")
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
    try {
      const user = await User.findById(
        req.user.id
      ).select("-password");
      const post = await Post.findById(
        req.params.id
      );

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send(
          "Server Error while commenting a post"
        );
    }
  }
);
//@route   DELETE api/posts/comment/:id/:comment_id
//@desc    Delete a Comment on  a post
//@access  Private
router.delete(
  "/comment/:id/:comment_id",
  [auth],
  async (req, res) => {
    try {
      const post = await Post.findById(
        req.params.id
      );
      //check which comment concerned
      const comment =
        post.comments.find(
          (comment) =>
            comment.id ===
            req.params.comment_id
        );
      console.log(comment);
      // look if it exist
      if (!comment) {
        return res.status(404).json({
          msg: "this comment does not exist!",
        });
      }
      //make sure that its user hwo will delete it
      console.log(
        comment.user.toString()
      );
      const commentToDelete =
        comment.user.toString();
      if (commentToDelete !== req.user.id) {
        return res.status(401).json({
          msg: "user not authorized",
        });
      }
      //Get remove index
      // const removeIndex = post.comments
      //   .map((comment) => comment.user.toString())
      //   .indexOf(req.user.id);
        const removeIndex = post.comments
        .map(item => item._id.toString())
        .indexOf(req.params.comment_id);
      post.comments.splice(
        removeIndex,
        1
      );
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res
        .status(500)
        .send(
          "Server Error while deleting a comment"
        );
    }
  }
);
module.exports = router;
