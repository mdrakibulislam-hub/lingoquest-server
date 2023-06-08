const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.port || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// ::::::::::: MIDDLEWARES ::::::::::::
app.use(cors());
app.use(express.json());


// ::::::::::::::: MONGODB :::::::::::::::

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

        app.get('/instructor/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await instructorsapi.findOne(query);
            res.send(result)
        });

        app.get('/allclasses/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const filter = { "instructorEmail": email };
            const result = await classesapi.find(filter).toArray();
            res.send(result);
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