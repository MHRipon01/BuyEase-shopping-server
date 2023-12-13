const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

console.log();
console.log();

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

app.get("/api/v1/products", async (req, res) => {
  const cursor = productCollection.find();
  const result = await cursor.toArray();
  res.send(result);
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
  console.log(category);
  const productsWithCategory = await productCollection
    .find({ category: category })
    .toArray();
  res.send(productsWithCategory);
});

//___________________________________________

app.get("/", (req, res) => {
  res.send("buyease server is running");
});

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
