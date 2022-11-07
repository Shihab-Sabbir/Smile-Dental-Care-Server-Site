const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
require('dotenv').config()

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.send('hello world');
})

function jwtVerification(req, res, next) {
    const authHeaders = req.headers.authorization;
    if (!authHeaders) {
        return res.status(401).send({ message: 'unauthorized access !' })
    }
    const token = authHeaders.split(' ')[1];
    jwt.verify(token, process.env.SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access !' })
        }
        else {
            req.decoded = decoded;
            next();
        }
    });
}

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@testing.wbduv4j.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const serviceCollection = client.db('Assignment11').collection('treatments');
        const reviewCollection = client.db('Assignment11').collection('review');
        console.log('mongo db connect');

        app.post('/jwt', (req, res) => {
            const data = req.body;
            const token = jwt.sign(data, process.env.SECRET, { expiresIn: '1d' });
            res.send({ token });
        });

        app.get('/services', async (req, res) => {
            const query = {};
            const allData = serviceCollection.find(query);
            const services = await allData.toArray();
            res.send(services);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review)
            res.send(result);
        });

        app.get('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { serviceId: id }
            const result = await reviewCollection.find(query).sort({time:-1}).toArray();
            res.send(result);
        });

        app.get('/review/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { user: id };
            const result = await reviewCollection.find(query).sort({ time: -1 }).toArray();
            console.log(id,query,result)
            res.send(result);
        });

        // app.put('/services/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: ObjectId(id) };
        //     const service = req.body;
        //     const option = { upsert: true };
        //     const updatedUser = {
        //         $set: {
        //             name: user.name,
        //             job: user.job
        //         }
        //     }
        //     const result = await serviceCollection.updateOne(filter, updatedUser, option);
        //     res.send(result);
        // })

        // app.delete('/services/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) }
        //     const result = await serviceCollection.deleteOne(query);
        //     res.send(result);
        // });

        //order collections
        // app.get('/orders', jwtVerification, async (req, res) => {
        //     let query = {};
        //     if (req.query.uid === req.decoded.uid) {
        //         query = { uid: req.query.uid }
        //     }
        //     else {
        //         return res.status(401).send({ message: 'unauthorized access !' })
        //     }
        //     const cursor = orderCollection.find(query);
        //     const allOrders = await cursor.toArray();
        //     res.send(allOrders);
        // })

        // app.post('/orders', async (req, res) => {
        //     const order = req.body;
        //     const result = await orderCollection.insertOne(order);
        //     res.send(result);
        // })
        // app.get('/orders/count', async (req, res) => {
        //     const uid = req.query.uid;
        //     const query = { uid: uid };
        //     const result = await orderCollection.find(query).toArray();
        //     const productCount = result.length;
        //     res.send({ productCount });
        // })
        // app.delete('/orders/:id', (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const result = orderCollection.deleteOne(query);
        //     res.send(result);
        // })
        // app.patch('/orders/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: ObjectId(id) };
        //     const { status } = req.body;
        //     const updatedOrder = {
        //         $set: {
        //             status: status
        //         }
        //     }
        //     const result = await orderCollection.updateOne(filter, updatedOrder);
        //     res.send(result);
        //     console.log(result)
        // })

        //products

        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product)
            res.send(result);
        });
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product);
        })
        app.get('/products', async (req, res) => {
            const query = {};
            const product = await productCollection.find(query).toArray();
            res.send(product);
        })


        //admin
        app.get('/admin', async (req, res) => {
            const admin = req.headers.email;
            if (admin === 'admin@example.com') {
                const cursor = orderCollection.find({});
                const result = await cursor.toArray();
                res.send(result);
            }
            else {
                res.status(401).send({ message: 'unauthorized access!' })
            }
        })
        //search
        app.get('/search', async (req, res) => {
            const search = req.query.search;
            const query = { title: { $regex: search, $options: 'i' } }; // option is for case insensitive
            const result1 = await productCollection.find(query).toArray();
            const result2 = await serviceCollection.find(query).toArray();
            const finalData = [...result1, ...result2];
            res.send(finalData);
        })
        // appointment
        app.post('/appointment', async (req, res) => {
            const appointment = req.body;
            const result = await appointmentCollection.insertOne(appointment);
            res.send(result);
        });
        app.patch('/appointment/:id', async (req, res) => {
            const status = req.body.status;
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const updatedAppointment = {
                $set: {
                    status: status
                }
            }
            const result = await appointmentCollection.updateOne(query, updatedAppointment);
            res.send(result);
        })
        app.get('/appointment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { uid: id };
            const result = await appointmentCollection.find(query).toArray();
            res.send(result);
        })
        app.get('/appointment', async (req, res) => {
            const query = {};
            const result = await appointmentCollection.find(query).toArray();
            res.send(result);
        })
        app.delete('/appointment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await appointmentCollection.deleteOne(query);
            res.send(result);
        })
    } finally {

    }
}
run().catch(err => console.log(err));

app.listen(port, () => {
    console.log('node is running on ', port);
})
