var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
var objectID=require('mongodb').ObjectId
const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_rw6po9I0SZ85DC',
    key_secret: '5Wq31bclj1MItbYttVfcnKNr',
  });



module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            if (!userData.name) {
                response.status = false
                resolve(response.status)

            } else if (!userData.password) {
                response.status = false
                resolve(response.status)

            } else if (!userData.email) {
                response.status = false
                resolve(response.status)
            }
            else {
                response.user = userData
                response.status = true
                userData.password = await bcrypt.hash(userData.password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(() => {
                    resolve(response)
                })
            }
        })
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {}
            let user = await (db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email }))
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log("logged in");
                        response.user = user
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
    },

    AddToCart:(proId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let proObj={
                item:new objectID(proId),
                quantity:1
            }
            let userCart= await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectID(userId)})
            if(userCart){
                let proExist= userCart.products.findIndex(product=>product.item==proId)
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({'products.item':new objectID(proId), user:new objectID(userId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })
                }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:new objectID(userId)},{$push:{products:proObj}}).then(()=>{resolve()})
            }


            }else{
                cartObj={
                    user:new objectID(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(()=>{
                    resolve()
                })
                }
            })   
        },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            const cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new objectID(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{item:'$products.item',quantity:'$products.quantity'}
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:"_id",
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product', 0]}
                    }
                }
                /*{
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,


                        let: { prodList: '$product' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ['$_id', "$$prodList"]
                                    }
                                }
                            }
                        ],
                        as: 'cartItems'
                    }
                }*/
            ]).toArray()
            console.log(cartItems)
            resolve(cartItems)
               })

    },
    getCartNo:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartCount=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectID(userId)})
            if (cart){
                cartCount=cart.products.length
            }
            resolve(cartCount)

        })

    },
    changeCartQuantity:(details)=>{
       //console.log('dsdsdsds')
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if((details.quantity==1)&&(details.count==-1)){
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:new objectID(details.cart)},
                {
                    $pull:{products:{item:new objectID(details.product)}}
                }
            ).then(()=>{
                resolve({removeProduct:true})
            })
            }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:new objectID(details.cart), 'products.item':new objectID(details.product)},
            {
                $inc:{'products.$.quantity':details.count}
            }
            ).then(()=>{
                resolve({status:true})
            })}
            
        })
    },
    removeProduct:(data)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:new objectID(data.cart)},
                {
                    $pull:{products:{item:new objectID(data.product)}}
                }).then(()=>{
                    resolve(true)
                })
        })
    },
    getTotal:(userId)=>{
        return new Promise(async (resolve, reject) => {
            const total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: new objectID(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{item:'$products.item',quantity:'$products.quantity'}
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:"_id",
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product', 0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity',{$toInt:'$product.price'}]}}
                    }
                }
                
            ]).toArray()
            console.log('total:'+total)
                
                if(total!=""){
                    resolve(total[0].total)

                }else{
                    resolve(0)
                }
             })


    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:new objectID(userId)})    
            resolve(cart.products)
        })  
    },

    placeorder:(order,products,total)=>{
        return new Promise((resolve, reject) => {
            console.log(order,products,total)
            let status=order['payment']==='cod'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    mobile:order.phone,
                    address:order.address,
                    pincode:order.pincode

                },
                userId:new objectID(order.id),
                products:products,
                status:status,
                paymentMethod:order['payment'],
                totalAmount:total,
                ddmmyy:( new Date().getDate() + '/' + (new Date().getMonth() + 1) + '/' +  new Date().getFullYear()+" "+new Date().getHours()+':'+new Date().getMinutes())
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:new objectID(order.id)})
                resolve(response.insertedId)
            })

        })

    },
    getOrderList:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let orders= await db.get().collection(collection.ORDER_COLLECTION).find({userId:new objectID(userId)}).toArray()    
            resolve(orders)
        })
        
    },
    getOrderedProducts:(id)=>{
        return new Promise(async (resolve, reject) => {
            const cartItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id:new objectID(id) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{item:'$products.item',quantity:'$products.quantity'}
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:"_id",
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product', 0]}
                    }
                }
               
            ]).toArray()
            console.log(cartItems)
            
            resolve(cartItems)
               }) 
    },

    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {        
            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
            };
            instance.orders.create(options, function (err, order) {
                if(err){
                    console.log(err)
                }else{
                    console.log("new order:",order);
                    resolve(order)

                }
            });
        })
    },

    verifyPayment:(details)=>{
        return new Promise((resolve, reject) => {
            const crypto= require('crypto')
            let hmac =crypto.createHmac('sha256','5Wq31bclj1MItbYttVfcnKNr')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },

    changePaymentStatus:(orderId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:new objectID(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
            ).then(()=>{
                resolve()
            })
        })
    }
}