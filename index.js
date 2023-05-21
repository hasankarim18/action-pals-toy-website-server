const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
   // await client.connect();
    client.connect();

     const actionPalsDb = client.db("actionPalsDb");
    const toysCollection = actionPalsDb.collection("toys");

    app.get("/toys", async (req, res) => {

      try {
         const query = req.query;
         // console.log(query);
         const queryLimit = parseInt(query.limit, 10);
         const queryName = query.name;
        
         const cursor = toysCollection
           .find({ name: { $regex: queryName, $options: "i" } })
           .sort({ created_at: -1 })
           .limit(queryLimit);

         const result = await cursor.toArray();
         res.send(result);
      } catch (error) {
        res.send([])
      }
     
    });

    // add a toy
    app.post("/toys", async (req, res) => {
      const toy = req.body;
        
     toy.created_at = new Date()
      const result = await toysCollection.insertOne(toy);
      res.send(result)
    });

    // get mytoys
    app.get("/mytoys", async (req, res)=> {

      try {
         const { email, sortOrder } = req.query;

         const sortOrderInt = parseInt(sortOrder, 10);

         const query = {
           seller_email: email,
         };
         // const cursor = toysCollection.find(query).sort({ price: sortOrderInt });

         const cursor = toysCollection.aggregate([
           { $match: query },
           { $addFields: { price: { $toDouble: "$price" } } },
           { $sort: { price: sortOrderInt } },
         ]);

         const result = await cursor.toArray();
         res.send(result);
      } catch (error) {
        res.send([])
      }

     

    } )

    // latest collections
    app.get('/toys/latest', async (req, res)=> {
      try {
         const cursor = toysCollection
           .find()
           .sort({
             created_at: -1,
           })
           .limit(5);
         const result = await cursor.toArray()
         res.send({message:'success',data:result  })
      } catch (error) {
        res.send({message:error,data:[] })
      }


    } )

 


    /**Get a single toy */
    app.get('/toy/:id', async (req, res)=> {
      const id = req.params.id 

       const query = {_id : new ObjectId(id) }

       const toy = await toysCollection.findOne(query);
      res.send(toy)
    } )

    // delete my toy by id
     app.delete("/toys/:id", async (req, res) => {
       const deleteId = req.params.id;
     // console.log(deleteId);
       const query = { _id: new ObjectId(deleteId) };
       const result = await toysCollection.deleteOne(query);
       res.send(result);
    
     });


     /** update a toy */
     app.put('/toy', async (req, res)=> {
     
      const body = req.body
      const updateId = body.updatedId;
      const newPrice = body.newPrice
      const newQuantity = body.quantity
      const newDescription = body.description;

     // console.log(body);

      // console.log(updateId);
      // console.log(newPrice);
      // console.log(newQuantity);
      // console.log(newDescription);
     

      const filter = { _id: new ObjectId(updateId) };     
      const options = { upsert: true };     
      const updateDoc = {
        $set: {
          price: newPrice,
          description: newDescription,
          available_quantity:newQuantity,
          updated_at: new Date()
        },
      };
      const result = await toysCollection.updateOne(filter, updateDoc, options);
      res.send(result)
     } )


     /** category */
    app.get('/category', async (req, res)=> {

      try {
          const {name} = req.query;
         
          const cursor = toysCollection.aggregate([
            {
              $match: {
                sub_category: { $regex: name, $options: "i" },
              },
            }, // Search for documents with a category matching "marvel" (case-insensitive)
            { $sort: { created_at: -1 } }, // Sort the documents by date in descending order
            { $limit: 3 }, // Limit the result to 3 documents
          ]);

          const result = await cursor.toArray();
          res.send({message: 'success', data: result})
      } catch (error) {
        res.send({message:error, data: []})
      }

    } )


    app.get('/toprated', async (req, res)=> {
         try {
          const query = {rating: "5"}
           const cursor = toysCollection
             .find(query) 
             .sort({created_at: -1})            
             .limit(5);
           const result = await cursor.toArray();
           res.send({ message: "success", data: result });
         } catch (error) {
           res.send({ message: error, data: [] });
         }

       
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



