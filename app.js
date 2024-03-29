const express = require("express")
const app = express()
const mongoose = require("mongoose")
app.use(express.json())
const cors = require("cors")
app.use(cors())
const bcrypt = require("bcryptjs")
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: false }))
const multer = require('multer')

const jwt = require("jsonwebtoken")
var nodemailer = require("nodemailer")

const JWT_SECRET = "hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe";
const mongoUrl = "mongodb+srv://suwanan:suwanan@cluster0.xehmmb3.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
})
  .then(() => {
    console.log("Connected to database")
  })
  .catch((e) => console.log(e))

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1])
  }
})

const fileFilter = (req, file, cb) => {
  // รับเฉพาะไฟล์ที่เป็น .jpg, .jpeg, และ .png
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
    return cb(new Error('Only image files are allowed!'), false)
  }
  cb(null, true)
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
})

require("./userDetails")

const UserInfo = mongoose.model("UserInfo")
app.post("/signup", async (req, res) => {
  const { username, fname, lname, email, password } = req.body

  const encryptedPassword = await bcrypt.hash(password, 10)
  try {
    const oldUser = await UserInfo.findOne({ username })
    const oldEmail = await UserInfo.findOne({ email })

    if (oldUser) {
      return res.json({ status: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" })
    }
    if (oldEmail) {
      return res.json({ status: "อีเมลล์นี้ถูกใช้แล้ว" })
    }
    if (username.length < 3) {
      return res.json({ status: "Username สั้นเกินไปโปรดกรอกอย่างน้อย 3 ตัวอักษร" })
    }

    if (password.length < 8) {
      return res.json({ status: "กรุณากรอก Password ให้ถูกต้อง" })
    }

    await UserInfo.create({
      username,
      fname,
      lname,
      email,
      password: encryptedPassword,
    })
    res.send({ status: "ok" })
  } catch (error) {
    res.send({ status: "error" })
  }
})

app.get("/user", async (req, res) => {
  try {
    const image = await UserInfo.find({}).sort({ _id: -1 })
    res.status(200).json(image)
  } catch (error) {
    res.status(404).json({ msg: "Data error" })
  }
})

app.get("/user/:id", async (req, res) => {
  try {
    const seller = await UserInfo.findById(req.params.id)
    res.status(200).json(seller)
  } catch (error) {
    res.status(404).json({ msg: "Seller not found" })
  }
})
require("./upload")
const Upload = mongoose.model("Upload")

// post image
app.post('/image', upload.single('image'), async (req, res) => {
  try {
    const { title, price, description } = req.body
    const userId = req.headers.authorization.split(' ')[1]

    const watermarkDetected = await checkImageForWatermark(`uploads/${req.file.filename}`)
    
    if (watermarkDetected) {
      console.log('Watermark detected, upload aborted')
      res.status(400).json({ msg: 'Watermark detected, upload aborted' })
    } else {
      const createImage = {
        image: req.file.filename,
        title,
        price,
        description,
        sellerId: userId,
      }

      if (createImage) {
        const newImage = await Upload.create(createImage)
        res.status(201).json(newImage)
      }
    }
  } catch (error) {
    res.status(400).json({ msg: error.message })
  }
})


app.use('/uploads', express.static('uploads'))

// get all images
app.get("/allimage", async (req, res) => {
  try {
    const image = await Upload.find({}).sort({ _id: -1 })
    res.status(200).json(image)
  } catch (error) {
    res.status(404).json({ msg: "Data error" })
  }
})

app.get("/allimage/:id", async (req, res) => {
  try {
    const product = await Upload.findById(req.params.id)
    res.send(product)
  } catch (err) {
    console.error(err)
    res.status(500).send("Internal server error")
  }
})

app.get("/image/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params
    const image = await Upload.find({ sellerId: sellerId }).sort({ _id: -1 })
    res.status(200).json(image)
  } catch (error) {
    res.status(404).json({ msg: "Data error" })
  }
})

const fs = require("fs")

app.delete("/image/:id", async (req, res) => {
  const { id } = req.params
  const { sellerId } = req.body

  try {
    const image = await Upload.findOne({ _id: id, sellerId })

    if (!image) {
      return res.status(404).json({ msg: "Image not found" })
    }

    await image.remove()

    try {
      fs.unlinkSync(`uploads/${image.image}`)
    } catch (error) {
      console.error(error)
    }

    res.status(200).json({ msg: "Image deleted successfully" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Internal server error" })
  }
})


app.post("/signin", async (req, res) => {
  const { username, password } = req.body

  const user = await UserInfo.findOne({ username })
  if (!user) {
    return res.json({ status: "ไม่พบผู้ใช้" })
  }
  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ username: user.username, userId: user._id }, JWT_SECRET, {
      expiresIn: "24h",
    })

    if (res.status(201)) {
      return res.json({ status: "ok", data: token, userId: user._id })
    } else {
      return res.json({ status: "error" })
    }
  }
  res.json({ status: "รหัสผ่านไม่ถูกต้อง" })
})


app.post("/userData", async (req, res) => {
  const { token } = req.body
  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired"
      }
      return res
    })
    console.log(user)
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" })
    }

    const username = user.username
    UserInfo.findOne({ username: username })
      .then((data) => {
        res.send({ status: "ok", data: data })
      })
      .catch((error) => {
        res.send({ status: "error", data: error })
      })
  } catch (error) { }
})


app.listen(5000, () => {
  console.log("Server Started")
})



app.post("/forgot-password", async (req, res) => {
  const { email } = req.body
  try {
    const oldUser = await UserInfo.findOne({ email })
    if (!oldUser) {
      return res.json({ status: "User Not Exists!!" })
    }
    const secret = JWT_SECRET + oldUser.password
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
      expiresIn: "5m",
    })
    const link = `http://localhost:5000/resetpass/${oldUser._id}/${token}`
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "suwanan6244@gmail.com",
        pass: "eqzxqyovdupjmojx",
      },
    })

    var mailOptions = {
      from: "youremail@gmail.com",
      to: email,
      subject: "Password Reset",
      text: link,
    }

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error)
      } else {
        console.log("Email sent: " + info.response)
      }
    })
    console.log(link)
  } catch (error) {
    res.send({ status: "error" })
  }
})

app.get("/resetpass/:id/:token", async (req, res) => {
  const { id, token } = req.params
  console.log(req.params)
  const oldUser = await UserInfo.findOne({ _id: id })
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" })
  }
  const secret = JWT_SECRET + oldUser.password
  try {
    const verify = jwt.verify(token, secret)
    res.render("index", { email: verify.email, status: "Not Verified" })
  } catch (error) {
    console.log(error)
    res.send("Not Verified")
  }
})

app.post("/resetpass/:id/:token", async (req, res) => {
  const { id, token } = req.params
  const { password } = req.body

  const oldUser = await UserInfo.findOne({ _id: id })
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" })
  }
  const secret = JWT_SECRET + oldUser.password
  try {
    const verify = jwt.verify(token, secret)
    const encryptedPassword = await bcrypt.hash(password, 10)
    await UserInfo.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encryptedPassword,
        },
      }
    )

    res.render("index", { email: verify.email, status: "verified" })
  } catch (error) {
    console.log(error)
    res.json({ status: "Something Went Wrong" })
  }
})



require("./cart")
const Cart = mongoose.model("Cart")

app.get('/cart/:buyerId', async (req, res) => {
  const { buyerId } = req.params

  try {
    const cartItems = await Cart.find({ buyerId }).populate('productId')

    res.status(200).json({ cartItems })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error retrieving cart items' })
  }
})


app.post('/cart', async (req, res) => {
  const { buyerId, productId, quantity } = req.body

  try {
    const user = await UserInfo.findById(buyerId)

    const cartItems = await Cart.find({ buyerId: user._id })

    const cartItem = cartItems.find(item => item.productId.toString() === productId)

    if (cartItem) {
      return res.status(400).json({ message: 'Product already in cart' })
    } else {
      const product = await Upload.findById(productId)
      if (product.sellerId.toString() === buyerId) {
        return res.status(400).json({ message: 'You cannot add your own product to the cart' })
      }

      const newCartItem = new Cart({
        buyerId: user._id,
        productId: product._id,
        quantity
      })

      await newCartItem.save()
    }

    res.status(200).json({ message: 'Product added to cart' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error adding product to cart' })
  }
})

app.delete('/cart/:buyerId', async (req, res) => {
  const { buyerId } = req.params

  try {
    await Cart.deleteMany({ buyerId })

    res.status(200).json({ message: 'User cart cleared successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error clearing user cart' })
  }
})



app.delete('/cart/:buyerId/:itemId', async (req, res) => {
  const { buyerId, itemId } = req.params

  try {
    const cartItem = await Cart.findOne({ buyerId, _id: itemId })

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' })
    }

    await cartItem.remove()

    res.status(200).json({ message: 'Cart item deleted successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error deleting cart item' })
  }
})

const QRCode = require('qrcode')

const Jimp = require("jimp")

app.post('/extract-watermark', upload.single('image'), async (req, res) => {
  try {
    const { path } = req.file

    const imageWithWatermark = await Jimp.read(path)

    const watermarkImage = imageWithWatermark.clone()
    watermarkImage.scan(0, 0, watermarkImage.bitmap.width, watermarkImage.bitmap.height, (x, y, idx) => {
      const lsb = watermarkImage.bitmap.data[idx + 2] & 1
      const color = lsb === 1 ? 255 : 0
      watermarkImage.setPixelColor(Jimp.rgbaToInt(color, color, color, 255), x, y)
    })

    const extractedWatermarkImage = await watermarkImage.getBufferAsync(Jimp.MIME_JPEG)
    res.contentType('image/jpeg')
    res.send(extractedWatermarkImage)
  } catch (error) {
    console.error(error)
    res.status(500).send('Error occurred while extracting the watermark')
  }
})


//stripe 
const stripe = require("stripe")("sk_test_51MfJMuCa6p7Qb3lSUd1cZ5LrFTMFPDZlRHoWHLFQdLzlkIjUwEMnax6OT7goZLJbzhYAb54mlb7XCw8Br9dmXkiI00p69JCbWQ");
require("./checkout")
const Checkout = mongoose.model("Checkout")

require("./dataqrcode")
const DataQRcode = mongoose.model("DataQRcode")
/*app.post("/checkout", async (req, res) => {
  try {
    const { buyerId, cartItems, totalAmount, stripeTokenId } = req.body;

    // Create a Stripe charge for the total amount
    const charge = await stripe.charges.create({
      amount: totalAmount * 100, // amount in cents
      currency: "usd",
      source: stripeTokenId,
      description: `Charge for user ${buyerId}`,
    });

    // Create a new checkout document and save it to the database
    const checkout = new Checkout({
      buyerId,
      products: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      totalAmount,
    });
    await checkout.save();

    // Fetch additional data and create a new document in the DataQRcode collection
    const buyer = await UserInfo.findById(buyerId);
    for(const item of cartItems) {
      const product = await Upload.findById(item.productId);
      const seller = await UserInfo.findById(product.sellerId);
      const dataQRcode = new DataQRcode({
        title: product.title,
        image: product.image, // Add the image from the product to the DataQRcode document
        price: product.price,
        seller: {
          fname: seller.fname,
          lname: seller.lname
        },
        buyer: {
          fname: buyer.fname,
          lname: buyer.lname
        },
      });
      await dataQRcode.save();
    }

    // Return a success response to the client
    res.status(200).json({
      msg: "Checkout successful!",
      charge,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ msg: "Checkout failed: " + error.message });
  }
});
*/

app.post("/checkout", async (req, res) => {
  try {
    const { buyerId, cartItems, totalAmount, stripeTokenId } = req.body

    const charge = await stripe.charges.create({
      amount: totalAmount * 100, 
      currency: "usd",
      source: stripeTokenId,
      description: `Charge for user ${buyerId}`,
    })

    const checkout = new Checkout({
      buyerId,
      products: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      totalAmount,
    })
    await checkout.save()

    res.status(200).json({
      msg: "Checkout successful!",
      charge,
    })
  } catch (error) {
    console.error(error)
    res.status(400).json({ msg: "Checkout failed: " + error.message })
  }
})

app.get('/checkout/:buyerId', async (req, res) => {
  const { buyerId } = req.params

  try {
    const checkouts = await Checkout.find({ buyerId })
      .populate({
        path: 'products.productId',
        populate: {
          path: 'sellerId',
          select: 'username',
        },
      })
      .populate('buyerId', 'username')
    res.status(200).json({ checkouts })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: "Internal server error" })
  }
})


const path = require("path")
const qr = require("qr-image")
const moment = require('moment-timezone')


app.get("/watermarked-images/:id", async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id)
    const { title, price, image, sellerId } = upload

    const checkout = await Checkout.findOne({ 'products.productId': req.params.id }).sort({ createdAt: -1 }).exec()
    const buyer = await UserInfo.findById(checkout.buyerId)
    const seller = await UserInfo.findById(sellerId)

    const watermarkText = `Title: ${title}, Price: ${price}, Seller: ${seller.fname} ${seller.lname}, Buyer: ${buyer.fname} ${buyer.lname},  Date: ${moment(checkout.createdAt).tz('Asia/Bangkok').format('ddd MMM D YYYY HH:mm:ss')}`
    const qrCode = qr.imageSync(watermarkText, { type: "png" })

    const imagePath = path.join(__dirname, "uploads", image)
    const imageBuffer = await fs.promises.readFile(imagePath)
    const imageWithWatermark = await Jimp.read(imageBuffer)

    const qrCodeImage = await Jimp.read(qrCode)
    qrCodeImage.resize(imageWithWatermark.bitmap.width, imageWithWatermark.bitmap.height)

    const centerX = Math.floor(imageWithWatermark.bitmap.width / 2)
    const centerY = Math.floor(imageWithWatermark.bitmap.height / 2)

    imageWithWatermark.scan(0, 0, imageWithWatermark.bitmap.width, imageWithWatermark.bitmap.height, function (x, y, idx) {
      const lsb = qrCodeImage.bitmap.data[idx + 2] & 1
      if (x === centerX && y === centerY) {
        imageWithWatermark.bitmap.data[idx + 2] = 254
      } else {
        imageWithWatermark.bitmap.data[idx + 2] = (imageWithWatermark.bitmap.data[idx + 2] & ~1) | lsb
      }
    })


    const watermarkedImage = await imageWithWatermark.getBufferAsync(Jimp.MIME_PNG)
    res.setHeader("Content-type", "image/png")
    res.send(watermarkedImage)
  } catch (error) {
    console.error(error)
    res.status(500).send("Error occurred while generating the watermark")
  }
})

const checkAndDeleteImage = async (imageId) => {
  try {
    const image = await Upload.findById(imageId)
    const watermarkDetected = await checkImageForWatermark(`uploads/${image.image}`)

    if (watermarkDetected) {
      await Upload.findByIdAndDelete(imageId)
      await fs.promises.unlink(`uploads/${image.image}`)
      console.log('Image with watermark detected and deleted:', imageId)
    } else {
      console.log('Image without watermark:', imageId)
    }
  } catch (error) {
    console.error('Error occurred while checking and deleting image:', error)
  }
}

const checkImageForWatermark = async (imagePath) => {
  try {
    const image = await Jimp.read(imagePath)

    const centerX = Math.floor(image.bitmap.width / 2)
    const centerY = Math.floor(image.bitmap.height / 2)

    const idx = image.getPixelIndex(centerX, centerY)
    const blue = image.bitmap.data[idx + 2]

    const watermarkDetected = blue === 254

    return watermarkDetected
  } catch (error) {
    console.error('Error occurred while checking the image for watermark:', error)
    return false
  }
}


