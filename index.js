const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://assignment-no-12-115fa.web.app",
      "https://assignment-no-12-115fa.firebaseapp.com",
    ],
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.edk1eij.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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

    const successStoryCollection = client
      .db("Assignment-no-12")
      .collection("successStory");
    const boiDatasCollection = client
      .db("Assignment-no-12")
      .collection("boiDatas");
    const FavouritesBiodataCollection = client
      .db("Assignment-no-12")
      .collection("Favourites-Biodata");
    const contactRequestCollection = client
      .db("Assignment-no-12")
      .collection("contactRequest");

    // jwt related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "90d",
      });
      res.send({ token });
    });
    // middleware
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { contact_email: email };
      const user = await boiDatasCollection.findOne(query);

      if (user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // user related api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { contact_email: user?.contact_email };
      const isExist = await boiDatasCollection.findOne(query);
      if (isExist) {
        return;
      }
      const totalUser = await boiDatasCollection.countDocuments();
      const newUser = {...user , biodata_id: totalUser + 1}
      const result = await boiDatasCollection.insertOne(newUser);
      res.send(result);
    });

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { contact_email: email };
      const userInfo = await boiDatasCollection.findOne(query);
      let admin = false;
      if (userInfo) {
        admin = userInfo?.role === "admin";
      }
      res.send({ admin });
    });

    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: "admin",
          },
        };
        const result = await boiDatasCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );
    app.patch(
      "/users/premium/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: "premium",
          },
        };
        const result = await boiDatasCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );
    app.patch(
      "/users/contactRequest/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const filter = { biodata_id: parseInt(id)};
        console.log(filter);
        const updateDoc = {
          $set: {
            status: "approved",
          },
        };
        const result = await contactRequestCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );

    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    app.get("/users/premium/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { contact_email: email };
      const userInfo = await boiDatasCollection.findOne(query);
      let premium = false;
      if (userInfo) {
        premium = userInfo?.role === "premium";
      }
      res.send({ premium });
    });

    app.get("/premiumMember", async (req, res) => {
      const { order } = req.query;
      const query = { role: "premium" };
      let sort = {};
      if (order === "descending") {
        sort = { age: -1 };
      }
      if (order === "ascending") {
        sort = { age: 1 };
      }
      const result = await boiDatasCollection.find(query).sort(sort).toArray();
      res.send(result);
    });
    app.get("/detailsPage/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await boiDatasCollection.findOne(query);
      res.send(result);
    });

    app.get("/ContactRequest", verifyToken , verifyAdmin, async (req, res) => {
      const result = await contactRequestCollection.aggregate([
        {
          $lookup: {
            from: "boiDatas",
            localField: "biodata_id",
            foreignField: "biodata_id",
            as: "contactData",
          },
        },
       {
         $unwind:'$contactData'
      }
      ]).toArray();
      res.send(result);
    });
    app.get("/myContactRequest/:email", verifyToken,  async (req, res) => {
      const email = req.params.email;
      const result = await contactRequestCollection.aggregate([
        {
          $match: {
            email: email ,
          }
        },
        {
          $lookup: {
            from: "boiDatas",
            localField: "biodata_id",
            foreignField: "biodata_id",
            as: "contactData",
          },
        },
       {
         $unwind:'$contactData'
      }
      ]).toArray();
      res.send(result);
    });

    app.post("/contactRequest", async (req, res) => {
      const contectInfo = req.body;
      const query = {
        email: contectInfo?.email,
        biodata_id: contectInfo?.biodata_id,
      };
      const isExist = await contactRequestCollection.findOne(query);
      if (isExist) {
        return res
          .status(409)
          .send({ message: "This data already exists in your contact list." });
      }
      const result = await contactRequestCollection.insertOne(contectInfo);
      res.send(result);
    });

    app.get("/successStory", async (req, res) => {
      const { order } = req.query;
      let sort = {};
      if (order === "descending") {
        sort = { marriageDate: -1 };
      }
      if (order === "ascending") {
        sort = { marriageDate: 1 };
      }
      const result = await successStoryCollection.find().sort(sort).toArray();
      res.send(result);
    });

    app.delete("/favouritesBiodata/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await FavouritesBiodataCollection.deleteOne(query);
      res.send(result);
    });
    app.post("/favouritesBiodata", verifyToken, async (req, res) => {
      const userInfo = req.body;
      const query = {
        biodata_id: userInfo?.biodata_id,
        contact_email: userInfo?.contact_email,
      };
      const isExist = await FavouritesBiodataCollection.findOne(query);
      if (isExist) {
        return res
          .status(409)
          .send({
            message: "This data already exists in your favourite list.",
          });
      }
      const result = await FavouritesBiodataCollection.insertOne(userInfo);
      res.send(result);
    });

    app.get("/favouritesBiodata/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { contact_email: email };
      const result = await FavouritesBiodataCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/boiDatas", async (req, res) => {
      const { ageMax, ageMin, division, type } = req.query;
      let query = {};

      // Check for age range
      if (ageMin && ageMax) {
        query.age = { $gte: parseInt(ageMin), $lte: parseInt(ageMax) };
      } else if (ageMin) {
        query.age = { $gte: parseInt(ageMin) };
      } else if (ageMax) {
        query.age = { $lte: parseInt(ageMax) };
      }

      // Check for biodata_type
      if (type) {
        query.biodata_type = type;
      }

      // Check for permanent_division_name
      if (division) {
        query.permanent_division_name = division;
      }

      const result = await boiDatasCollection.find(query).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Matrimony server side Home page running");
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
