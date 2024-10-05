const express = require("express");
const app = express();
require('dotenv').config();
const port = process.env.PORT || 8000;
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://vistavoyage-773f8.web.app"
  ]
}));


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p2btb5w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const database = client.db("VistaVoyage");
    const packageCollection = database.collection("packages");
    const storyCollection = database.collection("stories");
    const userCollection = database.collection('userCollection');
    const wishlistCollection = database.collection('wishlist');
    const paymentCollection = database.collection('payments');

    app.get('/packages', async (req, res) => {
      const result = await packageCollection.find().toArray();
      res.send(result);
    })

    app.get("/package-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await packageCollection.findOne(query);
      res.send(result);
    })

    app.get("/tours-by-type/:type", async (req, res) => {
      const type = req.params.type;
      const query = { tour_type: type };
      const result = await packageCollection.find(query).toArray();
      res.send(result)
    })

    app.get("/stories", async (req, res) => {
      const result = await storyCollection.find().toArray();
      res.send(result);
    })

    app.patch('/liked/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const story = await storyCollection.findOne(filter);
      const updateDoc = {
        $set: {
          likes: story?.likes + 1
        }
      }

      const result = await storyCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    app.get("/story/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await storyCollection.findOne(query);
      res.send(result);
    })

    app.put('/save-user', async (req, res) => {
      const user = req.body;
      const filter = { "userInformations.email": user?.userInformations?.email }
      const options = { upsert: true }
      const isExists = await userCollection.findOne(filter)
      const updatedDoc = {
        $set: {
          ...user
        }
      }
      if (isExists) {
        const result = await userCollection.updateOne(filter, updatedDoc);
        return res.send(result);
      }
      const result = await userCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    })

    app.put("/save-github-user", async (req, res) => {
      const user = req.body;
      const filter = {
        'userInformations.displayName': user?.userInformations?.displayName,
        "userInformations.providerData": {
          $elemMatch: { providerId: user?.userInformations?.providerData[0]?.providerId }
        }
      };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          ...user
        }
      }
      const isExists = await userCollection.findOne(filter);

      if (isExists) {
        const result = await userCollection.updateOne(filter, updatedDoc);
        return res.send(result);
      }

      const result = await userCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    })

    app.get('/get-role/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'userInformations.email': email };
      const result = await userCollection.findOne(query);
      res.send(result)
    })

    app.post('/insert-package', async (req, res) => {
      const package = req.body;
      const result = await packageCollection.insertOne(package);

      res.send(result);
    })

    app.get('/all-packages', async (req, res) => {
      const result = await packageCollection.find().toArray();
      res.send(result);
    })

    app.get('/all-users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    app.get('/specified-package-for-updating/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await packageCollection.findOne(query);
      res.send(result);
    })

    app.patch(`/update-package/:id`, async (req, res) => {
      const id = req.params.id;
      const updatedPackage = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          ...updatedPackage
        }
      }

      const result = await packageCollection.updateOne(filter, updateDoc);

      res.send(result)
    })

    app.delete('/delete-package/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await packageCollection.deleteOne(filter);
      res.send(result);
    })

    app.get('/user-details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result)
    })

    app.patch('/update-role/:id', async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: role,
          status: 'updated'
        }
      }

      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    app.post('/wishlist-package', async (req, res) => {
      const package = req.body;
      const query = { title: package?.title };
      const isExists = await wishlistCollection.findOne(query);

      if (isExists) {
        return res.send({ message: "Package already exists!" });
      }

      const result = await wishlistCollection.insertOne(package);
      console.log(result);
      res.send(result)
    })

    app.get('/all-wishlisted-items/:email', async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/wishlisted-package-details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.findOne(query);
      res.send(result);
    })

    app.get('/selected-for-checkout-wishlist/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishlistCollection.findOne(query);
      res.send(result);
    })

    app.get('/selected-for-checkout/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await packageCollection.findOne(query);
      res.send(result);
    })

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const usdPrice = price * 100

      const paymentIntent = await stripe.paymentIntents?.create({
        amount: usdPrice,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true
        }
      })

      res.send({
        clientSecret: paymentIntent?.client_secret
      })

    })

    app.get('/get-guides', async (req, res) => {
      const query = { role: 'guide' }
      const result = await userCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/save-payment-details', async (req, res) => {
      const payment_details = req.body;
      const query = { title: payment_details?.title, userEmail: payment_details?.userEmail };
      const isExists = await wishlistCollection.findOne(query);
      if (isExists) {
        await wishlistCollection.deleteOne(query);
      }
      const result = await paymentCollection.insertOne(payment_details);
      res.send(result);
    })

    app.get('/invoiced_details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await paymentCollection.findOne(query);
      res.send(result);
    })

    app.get('/guide-details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    })

    app.get('/my-payments/:email', async (req, res) => {
      const email = req.params.email
      const query = { userEmail: email };
      const result = await paymentCollection.find(query).toArray();
      console.log(result)
      res.send(result);
    })

    app.get('/my-assigned-tours/:email', async (req, res) => {
      const email = req.params.email;
      const query = { guide: email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })

    app.patch('/request-role/:email', async (req, res) => {
      const email = req.params.email;
      const query = { "userInformations.email": email }
      const user = await userCollection.findOne(query);
      const updateDoc = {
        $set: {
          status: 'requested'
        }
      }
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    })

    app.post('/post-story', async (req, res) => {
      const story = req.body;
      const result = await storyCollection.insertOne(story);
      res.send(result);
    })

    app.get('/searched-packages/:search', async(req, res) => {
      const input = req.params.search;

      const filter = {
        title : {$regex : input, $options : 'i'}
      }

      const result = await packageCollection.find(filter).toArray();
      res.send(result);
    })

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send("This server is running!")
})

app.listen(port, () => {
  console.log("Server is running on port ", port);
})