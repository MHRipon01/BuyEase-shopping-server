const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);



const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
//middleware
app.use(cors());
app.use(express.json());
 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sarjove.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

const productCollection = client.db("BuyEase").collection("AllProducts");
const categoryCollection = client.db("BuyEase").collection("categories");
const userCollection = client.db('BuyEase').collection('users')


//jwt related api
app.post('/jwt' , async(req,res) => {
  const user = req.body
  // console.log(user);
  const token = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET , {
    expiresIn: '1h'
  }  )
  res.send({token})
})

//middlewares
const verifyToken = (req,res,next) => {
  // console.log('inside verify token line 60' , req.headers);
  if(!req.headers.authorization){
    return res.status(401).send({message: 'unauthorized access'})
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token , process.env.ACCESS_TOKEN_SECRET, (err,decoded) => {
    if(err) {
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.decoded = decoded
    next()
  })

}






  //updating user in db
  app.post("/users", async (req, res) => {
    const user = req.body;
    //insert email if user doesn't exists;
    const query = { email: user.email };
    const existingUser = await userCollection.findOne(query);
    if (existingUser) {
      return res.send({ message: "user already exists", insertedId: null });
    }
    const result = await userCollection.insertOne(user);
    res.send(result);
  });
  




app.get("/api/v1/products", async (req, res) => {
  try {
      const query = {};
      let imgLimit = parseInt(req.query.limit);
      let imgOffset = parseInt(req.query.offset) || 0;

      const total = (await productCollection.find(query).toArray()).length;

      if (imgOffset >= total) {
          return res.send({ result: [], total: 0 });
      }
const result = await productCollection.find().skip(imgOffset).limit(imgLimit).toArray();
      res.send({
          result,
          total: total,
      });
  } catch (error) {
      res.status(500).send({ error: error.message });
  }
});







//work from here
// getting data for "people also watching" which is located in product details page
// app.get('/api/v1/product/:category' , async(req,res) => {
//   const category = req.params.category
//   try {
//     const cursor = productCollection.find({category: category})
//     const
//   }
// })

app.get("/productDetails/:id", async (req, res) => {
  const id = req.params.id;
  // console.log(id);
  const query = { _id: new ObjectId(id) };
  const result = await productCollection.findOne(query);
  res.send(result);
});

app.get("/api/v1/productsCount", async (req, res) => {
  const count = await productCollection.estimatedDocumentCount();
  res.send({ count });
});

//getting all categories for home page
app.get("/allCategories", async (req, res) => {
  const category = await categoryCollection.find().toArray();
  res.send(category);
});

//getting all data on a specific category
app.get("/api/v1/categoryProducts/:category", async (req, res) => {
  const category = req.params.category;
  // console.log(category);
  const productsWithCategory = await productCollection
    .find({ category: category })
    .toArray();
  res.send(productsWithCategory);
});

//payment intent
app.post('/create-payment-intent' , async(req,res) => {
  const {price} = req.body;
  const amount = parseInt(price * 100)
  console.log('amount inside intent ', amount);
//return

const paymentIntent = await stripe.paymentIntents.create({
  amount: amount,
  currency: 'usd', 
  payment_method_types:  ["card"],
})
console.log( {clientSecret: paymentIntent.client_secret});
res.send({ 
  clientSecret: paymentIntent.client_secret,
})



})




//___________________________________________

app.get("/", (req, res) => {
  res.send("buyease server is running");
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
