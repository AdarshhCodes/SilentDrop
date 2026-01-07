require("dotenv").config();
const express = require("express");

const mongoose = require("mongoose");

const session = require("express-session");
const passport = require("passport");

const commitRoutes = require("./routes/commits");
const analysisRoutes = require("./routes/analysis");
const auth = require("./routes/auth");
const upload = require("./routes/upload");


const app = express();


app.use(express.json());

app.use(session({
  name: "sid",
  secret: "project2026",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,       
    sameSite: "lax",    
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use("/api/commits", commitRoutes);
app.use("/api/auth", auth);
app.use("/api/analysis", analysisRoutes);
app.use("/upload", upload);



require("./config/passport");
//MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });


//Routes 

app.get("/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => {
   res.redirect(process.env.FRONTEND_URL + "/dashboard");

  }
);



app.get("/", (req, res) => {
    res.send("SilentDrop backend is running ");

});
app.use("/api/commits", commitRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
