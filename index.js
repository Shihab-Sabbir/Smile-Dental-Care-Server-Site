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
            return res.status(403).send({ message: 'Forbidden access !' })
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
            const token = jwt.sign(data, process.env.SECRET, { expiresIn: '1h' });
            res.send({ token });
        });

        app.get('/services', async (req, res) => {
            const query = parseInt(req.query.limit);
            const data = serviceCollection.find({}).limit(query).sort({ _id: -1 });
            const services = await data.toArray();
            res.send(services);
        });
        app.get('/services/pagination', async (req, res) => {
            const limit = parseInt(req.query.limit);
            const page = parseInt(req.query.page);
            const allData = await serviceCollection.find({}).toArray();
            const length = allData.length;
            const data = serviceCollection.find({}).skip(page * limit).limit(limit).sort({ _id: -1 });
            const services = await data.toArray();
            res.send({ services, length });
        });
        app.get('/search', async (req, res) => {
            const limit = parseInt(req.query.limit);
            const page = parseInt(req.query.page);
            const search = req.query.search;
            const query = { $or: [{ description1: { $regex: search, $options: 'i' } }, { title: { $regex: search, $options: 'i' } }] };
            const data = serviceCollection.find(query).skip(page * limit).limit(limit).sort({ _id: -1 });
            const services = await data.toArray();
            const length = services.length;
            res.send({ services, length });
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
            const result = await reviewCollection.find(query).sort({ time: -1 }).toArray();
            res.send(result);
        });

        app.get('/review/user/:id', jwtVerification, async (req, res) => {
            const decoded = req.decoded;
            const id = req.params.id;
            if (decoded.uid !== id) {
                return res.status(403).send({ message: 'Forbidden access !' })
            }
            const query = { user: id };
            const result = await reviewCollection.find(query).sort({ time: -1 }).toArray();
            res.send(result);
        });

        app.delete('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        });

        app.put('/review/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const { Reviewtitle, comment, rating, time } = req.body;
            const option = { upsert: false };
            const updatedUser = {
                $set: {
                    Reviewtitle: Reviewtitle, comment: comment, rating: rating, time: time
                }
            }
            const result = await reviewCollection.updateOne(filter, updatedUser, option);
            res.send(result);
        })
        app.post('/add-service', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            console.log(result)
            res.send(result);
        })
    } finally {

    }
}
run().catch(err => console.log(err));

app.listen(port, () => {
    console.log('node is running on ', port);
})
