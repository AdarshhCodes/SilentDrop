require("dotenv").config();
const cors = require("cors");
const express = require("express");

const mongoose = require("mongoose");

require("./config/passport");
const session = require("express-session");
const passport = require("passport");

const analysisRoutes = require("./routes/analysis");
const auth = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard.routes")

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = [
   "https://silent-drop.vercel.app/",
  "https://silentdrop-frontend.onrender.com",
 
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true
}));

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
app.use(passport.initialize());
app.use("/api/auth", auth);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analysis", analysisRoutes);







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
