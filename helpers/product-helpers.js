var db = require('../config/connection')
var collection = require('../config/collection')
const { response } = require('express')
var objectID = require('mongodb').ObjectId
const bcrypt = require('bcrypt')

module.exports = {
    addProduct: (product, callback) => {
        db.get().collection('shopping').insertOne(product).then((data) => {
            callback(data.insertedId.toString())
        }
        )
    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },

    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: new objectID(proId) }).then(response)
            resolve(response)
        })
    },

    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new objectID(proId) }).then((product) => {
                resolve(product)
            })
        })
    },

    updateProductDetails: (proId, productDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).
                updateOne({ _id: new objectID(proId) }, {
                    $set: {
                        name: productDetails.name,
                        category: productDetails.category,
                        description: productDetails.description,
                        price: productDetails.price

                    }
                }).then(() => {
                    resolve()
                })
        })
    },

    AdminLogin: (data) => {
        return new Promise(async (resolve, reject) => {

            let response = {}
            let admin = await (db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: data.email }))
            if (admin) {

                bcrypt.compare(data.password, admin.password).then((status) => {
                    if (status) {
                        console.log("logged in");
                        response.admin = admin
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('login failed');

                        resolve({ status: false })
                    }
                })
            } else {
                console.log('enter valid email');
                resolve({ status: false })
            }


        })
    }




}