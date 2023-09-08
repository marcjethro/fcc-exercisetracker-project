const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);
const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date,
});
const userSchema = new mongoose.Schema({
  username: String,
  log: [exerciseSchema],
});
const UserModel = mongoose.model("UserModel", userSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.post("/api/users", (req, res) => {
  let userDocument = new UserModel({
    username: req.body.username,
    log: [],
    count: 0,
  });
  userDocument
    .save()
    .then((done) => {
      res.json({ username: userDocument.username, _id: userDocument._id });
    })
    .catch((err) => {
      console.error(err);
    });
});
app.get("/api/users", (req, res) => {
  UserModel.find({})
    .then((allUserDocuments) => {
      res.json([
        ...allUserDocuments.map((e) => ({ username: e.username, _id: e._id })),
      ]);
    })
    .catch((err) => {
      console.error(err);
    });
});
app.get("/api/users/:_id/logs", (req, res) => {
  UserModel.findById(req.params._id).then((userDocument) => {
    let log = userDocument.log;
    let from = new Date(req.query.from);
    let to = new Date(req.query.to);
    let limit = parseInt(req.query.limit);
    if (!(from == "Invalid Date")) {
      log = log.filter(ele => {
        return ele.date >= from;
      });
    }
    if (!(to == "Invalid Date")) {
      log = log.filter(ele => {
        return ele.date <= to;
      });
    }
    if (!(isNaN(limit))) {
      log.length = Math.min(log.length, limit);
    }
    log = log.map((ele) => {
      let log_element = {
        description: ele.description,
        duration: ele.duration,
        date: ele.date.toDateString(),
      };
      return log_element;
    });
    let response = {
      _id: userDocument._id,
      username: userDocument.username,
      count: userDocument.log.length,
      log
    };
    res.json(response);
  });
});
app.post("/api/users/:_id/exercises", (req, res) => {
  UserModel.findById(req.params._id).then((userDocument) => {
    let { username, _id } = userDocument;
    let description = req.body.description;
    let duration = parseInt(req.body.duration);
    let date = new Date(req.body.date);
    if (!description) {
      res.send("Description is required!");
      return;
    } else if (!duration) {
      res.send("Duration is required!");
      return;
    }
    if (date == "Invalid Date") {
      date = new Date();
    }
    userDocument.log.push({
      description,
      duration,
      date,
    });
    userDocument
      .save()
      .then((done) => {
        res.json({
          _id,
          username,
          description,
          duration,
          date: date.toDateString(),
        });
      })
      .catch((err) => {
        console.error(err);
      });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
