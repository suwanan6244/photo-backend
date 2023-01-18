const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json())
const cors = require("cors");
app.use(cors());
const bcrypt = require("bcryptjs");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

const jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");

const JWT_SECRET = "hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe";
const mongoUrl = "mongodb+srv://suwanan:suwanan@cluster0.xehmmb3.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(mongoUrl,{
    useNewUrlParser: true,
})
.then(() => {
    console.log("Connected to database");
})
.catch((e) => console.log(e));


require("./userDetails");

const User = mongoose.model("UserInfo");
app.post("/register", async(req,res) => {
    const { username, fname, lname, email, password } = req.body;

    const encryptedPassword = await bcrypt.hash(password, 10);
    try {
        const oldUser = await User.findOne({ username });

        if(oldUser){
           return res.json({ status: "User Exists" });
        }
        await User.create({
            username,
            fname,
            lname,
            email,
            password: encryptedPassword,
        });
        res.send({ status: "ok" });
    } catch (error) {
        res.send({ status: "error" });
    }
});

/*app.post("/login", async(req,res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if(!User){
        return res.json({ error: "User Not found"});
    }
    if(await bcrypt.compare(password, user.password)){
        const token = jwt.sign({username: user.username}, JWT_SECRET, {
            expiresIn: "5m",
        });

        if(res.status(201)){
            return res.json({ status: "ok", data:token });
        } else {
            return res.json({ status: "error" });
        }
    }
    res.json({ status:"error", error: "Invalid Password" });
});*/

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.json({ status: "ไม่พบผู้ใช้" });
  }
  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ username: user.username }, JWT_SECRET, {
      expiresIn: 30,
    });

    if (res.status(201)) {
      return res.json({ status: "ok", data: token });
    } else {
      return res.json({ status: "error" });
    }
  }
  res.json({ status: "รหัสผ่านไม่ถูกต้อง" });
});


app.post("/userData", async (req, res) => {
    const { token } = req.body;
    try {
      const user = jwt.verify(token, JWT_SECRET, (err, res) => {
        if (err) {
          return "token expired";
        }
        return res;
      });
      console.log(user);
      if (user == "token expired") {
        return res.send({ status: "error", data: "token expired" });
      }
  
      const username = user.username;
      User.findOne({ username: username })
        .then((data) => {
          res.send({ status: "ok", data: data });
        })
        .catch((error) => {
          res.send({ status: "error", data: error });
        });
    } catch (error) {}
  });


app.listen(5000, ()=> {
    console.log("Server Started");
});

app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
      const oldUser = await User.findOne({ email });
      if (!oldUser) {
        return res.json({ status: "User Not Exists!!" });
      }
      const secret = JWT_SECRET + oldUser.password;
      const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
        expiresIn: "5m",
      });
      const link = `http://localhost:5000/resetpass/${oldUser._id}/${token}`;
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "suwanan6244@gmail.com",
          pass: "eqzxqyovdupjmojx",
        },
      });
  
      var mailOptions = {
        from: "youremail@gmail.com",
        to: "noonwonder22@gmail.com",
        subject: "Password Reset",
        text: link,
      };
  
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      console.log(link);
    } catch (error) {}
  });

  app.get("/resetpass/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    console.log(req.params);
    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
      return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
      const verify = jwt.verify(token, secret);
      res.render("index", { email: verify.email, status: "Not Verified" });
    } catch (error) {
      console.log(error);
      res.send("Not Verified");
    }
  });
  
  app.post("/resetpass/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body;
  
    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
      return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
      const verify = jwt.verify(token, secret);
      const encryptedPassword = await bcrypt.hash(password, 10);
      await User.updateOne(
        {
          _id: id,
        },
        {
          $set: {
            password: encryptedPassword,
          },
        }
      );
  
      res.render("index", { email: verify.email, status: "verified" });
    } catch (error) {
      console.log(error);
      res.json({ status: "Something Went Wrong" });
    }
  });

/*app.post("/post",async(req,res)=>{
    console.log(req.body);
    const {data}=req.body;
    
    try{
        if(data == "suwanan"){
            res.send({status:"ok"});

        } else{
            res.send({status:"User Not Found"});
        }
    }catch(error){
        res.send({status:"Something went wrong try again"});
    }

});*/