

const { MongoClient } = require('mongodb');
const state = {
    db: null
}
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'shopping';

module.exports.connect = async function (done) {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    state.db = client.db(dbName);
    // the following code examples can be pasted here...

    return 'done.';
}

module.exports.get = function () {
    return state.db
}
//in app.js:

//db.connect().then(console.log).catch(console.error)

