const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.port || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// ::::::::::: MIDDLEWARES ::::::::::::
app.use(cors());
app.use(express.json());

// ::::::::::::::: verify authentication via JWT ::::::::::::::
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: "Unauthorized access" });
    }
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: "Unauthorized access" })
        }
        req.decoded = decoded;
        next();
    })
}







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
        const allusersapi = client.db('lingoquest').collection('allusers')
        const cartsapi = client.db('lingoquest').collection('cart')


        // :::::::::::::::::::: verify admin via jwt :::::::::::::::

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            console.log(email);
            const query = { email: email }
            console.log(query);
            const user = await allusersapi.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }


        // :::::::::::::::::::: verify instructor via jwt :::::::::::::::

        const verifyInstructor = async (req, res, next) => {
            const email = req.decoded.email;
            console.log(email);
            const query = { email: email }
            console.log(query);
            const user = await allusersapi.findOne(query);
            if (user?.role !== 'instructor') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }


        // ::::::::::: JWT for security ::::::::::::
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })

            res.send({ token })
        })

        // :::::::::::::: get all classes for admin api ::::::::::::::::::
        app.get('/allclassesforadmin', async (req, res) => {
            const classes = await classesapi.find({}).toArray();
            res.send(classes)
        })


        // :::::::::::::: get classes which are approved api ::::::::::::::::::
        app.get('/allclasses', async (req, res) => {
            const classes = await classesapi.find({ status: "approved" }).toArray();
            res.send(classes)
        })



        // :::::::::::::: get instructors api ::::::::::::::::::
        app.get('/instructors', async (req, res) => {
            const instructors = await instructorsapi.find({}).toArray();
            res.send(instructors)
        })


        // :::::::::::::: get specific instructor's data by id api ::::::::::::::::::
        app.get('/instructor/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: new ObjectId(id) };
            const result = await instructorsapi.findOne(query);
            res.send(result)
        });


        // :::::::::::::: get classes by instructor api ::::::::::::::::::
        app.get('/allclasses/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const filter = { instructorEmail: email, status: "approved" };
            const result = await classesapi.find(filter).toArray();
            res.send(result);
        })


        // :::::::::::::: post user login data to allusers api ::::::::::::::::::
        app.post("/allusers", async (req, res) => {
            const email = req.body.email;
            console.log(email);
            const emailFind = await allusersapi.findOne({ email: email });
            if (emailFind) { return res.status(409).send({ message: "User already exist" }) }
            const body = req.body;
            console.log(body);
            const result = await allusersapi.insertOne(body);
            res.send(result)

        })


        // :::::::::::::: post data to cart api ::::::::::::::::::
        app.post("/cart", async (req, res) => {
            const body = req.body;
            console.log(body);
            const result = await cartsapi.insertOne(body)
            res.send(result)
        });



        // :::::::::::::: get user role api ::::::::::::::::::
        app.get("/users/role/:email", async (req, res) => {
            const email = req.params.email
            console.log(email);
            const query = { "email": email }
            const user = await allusersapi.findOne(query);
            const result = user?.role || { message: "user not found" }
            res.send(result)
        })


        // :::::::::::::: get selected classes by email api ::::::::::::::::::
        app.get("/user/selectedclasses/:email", async (req, res) => {
            const email = req.params.email
            console.log(email);
            const query = { "email": email }
            const result = await cartsapi.find(query).toArray();
            res.send(result)
        })

        // :::::::::::::: get all users api ::::::::::::::::::
        app.get("/user", verifyJWT, verifyAdmin, async (req, res) => {
            const result = await allusersapi.find({}).toArray();
            res.send(result)
        })


        // :::::::::::::: make user role to admin request ::::::::::::
        app.patch("/updaterole/admin/:id", async (req, res) => {
            const id = req.params.id
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: "admin"
                },
            }
            const result = await allusersapi.updateOne(filter, updateDoc);
            res.send(result)

        })

        // ::::::::::::::: make user role to instructor request ::::::::::::::
        app.patch("/updaterole/instructor/:id", async (req, res) => {
            const id = req.params.id
            console.log(id);
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: "instructor"
                }
            }
            const result = await allusersapi.updateOne(filter, updateDoc);
            res.send(result)
        })

        // :::::::::::::::: post instructor data to instructor db collection :::::::::::
        app.post("/instructor", async (req, res) => {
            const instructorDetails = req.body;
            console.log(instructorDetails);
            const result = await instructorsapi.insertOne(instructorDetails);
            res.send(result);
        })


        // ::::::::::::::: pending class reject status update api :::::::::::::
        app.patch("/classes/reject/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: "reject"
                }
            }
            const result = await classesapi.updateOne(filter, updateDoc);
            res.send(result)
        })

        // ::::::::::::: pending class approve status update api :::::::::::::
        app.patch("/classes/approved/:id", async (req, res) => {
            const id = req.params.id
            console.log(id);
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: "approved"
                }
            }
            const result = await classesapi.updateOne(filter, updateDoc);
            res.send(result)
        })


        // ::::::::::::: admin class feedback request :::::::::::::
        app.patch("/sendfeedback/class/:id", async (req, res) => {
            const id = req.params.id;
            const feedback = req.body.userFeedback;
            console.log(id, feedback);
            const filter = { _id: new ObjectId(id) }
            const updateFeedback = {
                $set: { adminsFeedback: feedback }
            }
            const result = await classesapi.updateOne(filter, updateFeedback)
            res.send(result)
        })



        //:::::::::::::: add class to database collection ::::::::::::
        app.post("/allclasses", async (req, res) => {
            const classData = req.body
            console.log(classData);
            const result = await classesapi.insertOne(classData);
            res.send(result)
        })


        // ::::::::::::::::::: get instructor all class ::::::::::::::::::::::
        app.get("/classes/all/instructor/:email", async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const filter = { instructorEmail: email };
            const result = await classesapi.find(filter).toArray();
            res.send(result)
        })


        // :::::::::::::::::: handle instructor class delete ::::::::::::::::
        app.delete("/allclasses/delete/:id", async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const result = await classesapi.deleteOne(filter);
            res.send(result)
        })

        // :::::::::::::: selected class delete api :::::::::::::
        app.delete("/user/selectedclasses/:id", async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const result = await cartsapi.deleteOne(filter);
            res.send(result)
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