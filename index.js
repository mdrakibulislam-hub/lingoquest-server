const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.port || 5000;

// ::::::::::: MIDDLEWARES ::::::::::::
app.use(cors());
app.use(express.json());

console.log(process.env.DB_PASS);

// ::::::::::::::: MONGODB :::::::::::::::

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eqiwocl.mongodb.net/?retryWrites=true&w=majority`;

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
        await client.connect();

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const classesapi = client.db('lingoquest').collection('lingoquest-classes');

        const instructorsapi = client.db('lingoquest').collection('lingoquest-instructors')


        app.get('/allclasses', async (req, res) => {
            const classes = await classesapi.find({}).toArray();
            res.send(classes)
        })

        app.get('/instructors', async (req, res) => {
            const instructors = await instructorsapi.find({}).toArray();
            res.send(instructors)
        })





    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.json({ status: "The server started succesfully" });
})



app.listen(port, () => {
    console.log(`server is running on por number ${port}`);
})