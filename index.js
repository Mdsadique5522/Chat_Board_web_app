const express = require("express");
// load environment variables from .env (if present)
require("dotenv").config();
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const Chat = require("./models/chat");
const methodOverride = require("method-override");

app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

async function main() {
  // accept either MONGO_URI (repo) or MONGODB_URI (your current .env)
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1/ChatBoard";
  console.log('Attempting to connect to MongoDB with URI:', uri ? (uri.startsWith('mongodb+srv://') ? 'mongodb+srv://<REDACTED>' : uri) : 'none');
  await mongoose.connect(uri);
}

main()
  .then(() => {
    console.log("MongoDB connection successful");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is listening at port ${PORT}`);
});

app.get("/", (req, res) => {
  res.render("root.ejs");
});

app.get("/chats", async (req, res, next) => {
  try {
    let chats = await Chat.find();
    res.render("index.ejs", { chats });
  } catch (err) {
    next(err);
  }
});

app.get("/chats/new", (req, res) => {
  res.render("new.ejs");
});

app.post("/chats", async (req, res, next) => {
  try {
    let { from, message, to } = req.body;
    let newChat = new Chat({
      from: from,
      message: message,
      to: to,
      created_at: new Date(),
    });

    await newChat.save();
    res.redirect("/chats");
  } catch (err) {
    next(err);
  }
});

app.get("/chats/:id/edit", async (req, res, next) => {
  try {
    let { id } = req.params;
    let chat = await Chat.findById(id);
    res.render("edit.ejs", { chat });
  } catch (err) {
    next(err);
  }
});

app.put("/chats/:id", async (req, res, next) => {
  try {
    let { id } = req.params;
    let { message: newMessage } = req.body;

    let updateChat = await Chat.findByIdAndUpdate(
      id,
      { message: newMessage },
      { runValidators: true }
    );

    res.redirect("/chats");
  } catch (err) {
    next(err);
  }
});

app.delete("/chats/:id", async (req, res, next) => {
  try {
    let { id } = req.params;
    let deleteChat = await Chat.findByIdAndDelete(id);
    console.log(deleteChat);
    res.redirect("/chats");
  } catch (err) {
    next(err);
  }
});

//error handling middleware
app.use((err, req, res, next) => {
  let { status = 500, message = "Some Error Occured" } = err;
  res.status(status).send(message);
});
