const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;


// middleware

 app.use(cors());


 const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.edk1eij.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
      // Connect the client to the server	(optional starting in v4.7)
      const premiumMemberCollection = client.db("Assignment-no-12").collection("premium-member");
      app.get('/premiumMember' , async(req,res)=>{
        const {order} = req.query;
        let sort = {};
        if(order === "descending"){
           sort = {age: -1};
        }
        if(order === "ascending"){
           sort = {age: 1};
        }
        const result = await premiumMemberCollection.find().sort(sort).toArray();
        res.send(result);
    });


    
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
   
    }
  }
  run().catch(console.dir);


 app.get('/', (req, res) => {
    res.send('Matrimony server side Home page running');
 });
 app.listen(port , ()=>{
    console.log(`Example app listening on port ${port}`)
 });