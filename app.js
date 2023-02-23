const express = require("express");
const app = express();
const mongoose = require("mongoose");
app.use(express.json());
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

const UserInfo = mongoose.model("UserInfo");
app.post("/signup", async(req,res) => {
    const { username, fname, lname, email, password } = req.body;

    const encryptedPassword = await bcrypt.hash(password, 10);
    try {
        const oldUser = await UserInfo.findOne({ username });
        const oldEmail = await UserInfo.findOne({ email });

        if(oldUser){
           return res.json({ status: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" });
        }
        if(oldEmail){
          return res.json({ status: "อีเมลล์นี้ถูกใช้แล้ว" });
       }
       if (username.length < 3) {
        return res.json({ status: "Username สั้นเกินไปโปรดกรอกอย่างน้อย 3 ตัวอักษร" });
      }

      if (password.length < 8) {
        return res.json({ status: "กรุณากรอก Password ให้ถูกต้อง" });
      }
       
        await UserInfo.create({
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

app.get("/user", async (req, res) => {
  try {
    const image = await UserInfo.find({}).sort({ _id: -1 });
    res.status(200).json(image);
  } catch (error) {
    res.status(404).json({ msg: "Data error" });
  }
});

require("./upload");
const Upload = mongoose.model("Upload");

// get all images
app.get("/allimage", async (req, res) => {
  try {
    const image = await Upload.find({}).sort({ _id: -1 });
    res.status(200).json(image);
  } catch (error) {
    res.status(404).json({ msg: "Data error" });
  }
});


app.get("/allimage/:id", async (req, res) => {
  try {
    const product = await Upload.findById(req.params.id);
    res.send(product);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});




// post image
app.post("/image", async (req, res) => {
  try {
    const { image, title, price, countInStock, description } = req.body;
    const createImage = {
      image,
      title,
      price,
      countInStock,
      description,
    };
    if (createImage) {
      const newImage = await Upload.create(createImage);
      res.status(201).json(newImage);
    }
  } catch (error) {
    res.status(404).json({ msg: "Invalid Data" });
  }
});

app.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  const user = await UserInfo.findOne({ username });
  if (!user) {
    return res.json({ status: "ไม่พบผู้ใช้" });
  }
  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ username: user.username, userId: user._id }, JWT_SECRET, {
      expiresIn: "24h",
    });

    if (res.status(201)) {
      return res.json({ status: "ok", data: token, userId: user._id });
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
      const oldUser = await UserInfo.findOne({ email });
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
        to: email,
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
    } catch (error) {
      res.send({ status: "error" });
  }
  });

  app.get("/resetpass/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    console.log(req.params);
    const oldUser = await UserInfo.findOne({ _id: id });
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
  
    const oldUser = await UserInfo.findOne({ _id: id });
    if (!oldUser) {
      return res.json({ status: "User Not Exists!!" });
    }
    const secret = JWT_SECRET + oldUser.password;
    try {
      const verify = jwt.verify(token, secret);
      const encryptedPassword = await bcrypt.hash(password, 10);
      await UserInfo.updateOne(
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

/*const sharp = require("sharp");


app.post("/checkWatermark", async (req, res) => {
  try {
      if (!req.files || !req.files.file) {
        res.status(400).send("No file uploaded");
        return;
      }
    const image = sharp(req.files.file.data);
    const metadata = await image.metadata();
    if (metadata.hasAlpha) {
      res.send("Watermark found");
    } else {
      res.send("Watermark not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});*/


  const watermarking = require('digital-watermarking');
  const jimp = require('jimp');

  app.get('/watermarked-images', async (req, res) => {
    try {
      const watermarkedImages = await Upload.find();
      res.json(watermarkedImages);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });


  /*app.get("/watermarked-images/:id", async (req, res) => {
    try {
      const watermarkedImage = await Upload.findById(req.params.id);
    const image = watermarkedImage.image;
    const title = watermarkedImage.title;
    const price = watermarkedImage.price;
    const watermarkText = `Title: ${title}, Price: ${price}`;

    // Use the jimp package to add a digital watermark on the image
    const images = await jimp.read(image);
    const font = await jimp.loadFont(jimp.FONT_SANS_32_WHITE);
    const x = 10;
    const y = 10;
    images.print(font, x, y, watermarkText);
    const outputFilePath = `watermarked-${image}`;
    await images.writeAsync(outputFilePath);

    // Send the watermarked image file to the client
    res.download(outputFilePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});*/

require("./cart");
const Cart = mongoose.model("Cart");

app.get('/cart/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Find all cart items for the user
    const cartItems = await Cart.find({ userId }).populate('productId');

    res.status(200).json({ cartItems });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error retrieving cart items' });
  }
});

app.post('/cart', async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    // Find the user based on the userId
    const user = await UserInfo.findById(userId);

    // Find the cart items for the user
    const cartItems = await Cart.find({ userId: user._id });

    // Check if the product is already in the cart
    const cartItem = cartItems.find(item => item.productId.toString() === productId);

    if (cartItem) {
      // If the product is already in the cart, add the quantity
      cartItem.quantity += quantity;
      await cartItem.save();
    } else {
      // If the product is not in the cart, create a new cart item
      const product = await Upload.findById(productId);

      const newCartItem = new Cart({
        userId: user._id,
        productId: product._id,
        quantity
      });

      await newCartItem.save();
    }

    res.status(200).json({ message: 'Product added to cart' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error adding product to cart' });
  }
});

app.delete('/cart/:userId/:itemId', async (req, res) => {
  const { userId, itemId } = req.params;

  try {
    // Find the cart item for the user and item ID
    const cartItem = await Cart.findOne({ userId, _id: itemId });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await cartItem.remove();

    res.status(200).json({ message: 'Cart item deleted successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error deleting cart item' });
  }
});

const QRCode = require('qrcode')

/*app.get("/watermarked-images/:id", async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    const { title, price } = upload;

    // generate QR code for title and price information
    const watermarkText = `Title: ${title}, Price: ${price}`;
    const qrCode = await QRCode.toDataURL(watermarkText);

    // send QR code image to frontend page
    res.send(`<img src="${qrCode}" alt="Watermark">`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred while generating the watermark");
  }
});*/

const Jimp = require("jimp");

/*app.get('/extract-watermark/:id', async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    const { image } = upload;

    // Load the image using Jimp
    const imageWithWatermark = await Jimp.read(image);

    // Extract the watermark
    const watermarkImage = imageWithWatermark.clone();
    watermarkImage.scan(0, 0, watermarkImage.bitmap.width, watermarkImage.bitmap.height, (x, y, idx) => {
      // Get the LSB of the blue channel
      const lsb = watermarkImage.bitmap.data[idx + 2] & 1;
      // Set the pixel color based on the LSB
      const color = lsb === 1 ? 255 : 0;
      watermarkImage.setPixelColor(Jimp.rgbaToInt(color, color, color, 255), x, y);
    });

    // Send the extracted watermark image to the frontend page
    const extractedWatermarkImage = await watermarkImage.getBufferAsync(Jimp.MIME_JPEG);
    res.contentType('image/jpeg');
    res.send(extractedWatermarkImage);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while extracting the watermark');
  }
});*/


const multer = require('multer');

// Set up multer to handle file uploads
const upload = multer({ dest: 'uploads/' });

app.post('/extract-watermark', upload.single('image'), async (req, res) => {
  try {
    const { path } = req.file;

    // Load the image using Jimp
    const imageWithWatermark = await Jimp.read(path);

    // Extract the watermark
    const watermarkImage = imageWithWatermark.clone();
    watermarkImage.scan(0, 0, watermarkImage.bitmap.width, watermarkImage.bitmap.height, (x, y, idx) => {
      // Get the LSB of the blue channel
      const lsb = watermarkImage.bitmap.data[idx + 2] & 1;
      // Set the pixel color based on the LSB
      const color = lsb === 1 ? 255 : 0;
      watermarkImage.setPixelColor(Jimp.rgbaToInt(color, color, color, 255), x, y);
    });

    // Send the extracted watermark image to the frontend page
    const extractedWatermarkImage = await watermarkImage.getBufferAsync(Jimp.MIME_JPEG);
    res.contentType('image/jpeg');
    res.send(extractedWatermarkImage);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while extracting the watermark');
  }
});
