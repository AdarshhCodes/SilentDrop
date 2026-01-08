require("dotenv").config();
const cors = require("cors");
const express = require("express");

const mongoose = require("mongoose");

const session = require("express-session");
const passport = require("passport");

const commitRoutes = require("./routes/commits");
const analysisRoutes = require("./routes/analysis");
const auth = require("./routes/auth");
const upload = require("./routes/upload");


const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: "https://silentdrop-frontend.onrender.com",
    credentials: true,
  })
);




app.use(express.json());


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: true,       
    sameSite: "none",   
     maxAge: 1000 * 60 * 60 * 24, 
  }
}));
require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/commits", commitRoutes);
app.use("/api/auth", auth);
app.use("/api/analysis", analysisRoutes);
app.use("/upload", upload);


//MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });





app.get("/", (req, res) => {
    res.send("SilentDrop backend is running ");

});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
