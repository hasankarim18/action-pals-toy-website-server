const express = require('express')
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const cors = require('cors');
const port = process.env.PORT || 5000



const app = express()


// middle wares 
app.use(cors())
app.use(express.json())

const user_name = process.env.USER_NAME 
const password = process.env.PASSWORD


const uri =
  `mongodb+srv://${user_name}:${password}@cluster0.nzfxe6e.mongodb.net/?retryWrites=true&w=majority`;

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

    // code below this line

     const actionPalsDb = client.db("actionPalsDb");
    const toysCollection = actionPalsDb.collection("toys");

    app.get("/toys", async (req, res) => {

      const query = req.query 
      // console.log(query);
      const queryLimit = parseInt(query.limit, 10)
     
       const cursor = toysCollection
         .find()
         .sort({ created_at: -1 })
         .limit(queryLimit);
       const result = await cursor.toArray()
       res.send(result)
    });

    // add a toy
    app.post("/toys", async (req, res) => {
      const toy = req.body;
        
     toy.created_at = new Date()
      const result = await toysCollection.insertOne(toy);
      res.send(result)
    });

    // get my toy 
    app.get("/mytoys", async (req, res)=> {
      const { email, sortOrder } = req.query;
      const sortOrderInt = parseInt(sortOrder, 10)
      const query = {
        seller_email: email,
      };
      const cursor = toysCollection.find(query).sort({ price: sortOrderInt });
      const result = await cursor.toArray();
      res.send(result);
    } )

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  //  await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res)=> {
    res.send('Action pals server is running')
} )

app.listen(port , ()=> {
    console.log('Action pals log');
})



