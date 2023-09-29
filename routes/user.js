var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
var userHelpers = require('../helpers/user-helpers')

const verifyLogin = (req, res, next) => {
  if (req.session.userloggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}


/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  if (user) {
    cartCount = await userHelpers.getCartNo(user._id)
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user, cartCount })
  });
});

router.get('/login', function (req, res, next) {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { loginErr: req.session.userloginErr })
    req.session.userloginErr = false
  }



});
router.get('/signup', function (req, res, next) {
  res.render('user/signup', { loginErr: req.session.userloginErr })
  req.session.userloginErr = false
});

router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    //console.log(response)
    if (response.status) {
      req.session.user = response.user
      req.session.userloggedIn = true;
      res.redirect('/')
    } else {
      req.session.userloginErr = "please fill all fields"
      res.redirect('/signup')
    }
  })
})

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.userloggedIn = true;
      res.redirect('/')
    } else {
      req.session.userloginErr = "invalid username or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userloggedIn = false
  res.redirect('/')
})

router.get('/cart', verifyLogin, async (req, res) => {
  let user = req.session.user
  console.log(user)
  let products = await userHelpers.getCartProducts(req.session.user._id)
  // let total=0
  // if(total.length>0){
  let total = await userHelpers.getTotal(req.session.user._id)
  // } 
  //console.log(products)
  res.render('user/cart', { user, products, total })
})

router.get('/add-to-cart/:id', (req, res) => {
  console.log('api called')
  userHelpers.AddToCart(req.params.id, req.session.user._id).then(() => {
    //res.redirect('/')
    res.json({ status: true })
  })

})
router.post('/change-product-quantity', (req, res, next) => {
  //console.log('api called')
  userHelpers.changeCartQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotal(req.body.user)
    res.json(response)
    //console.log(response.total)
  })
})

router.post('/remove-product', (req, res, next) => {
  userHelpers.removeProduct(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/place-order', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotal(req.session.user._id)
  res.render("user/place-order", { total, user: req.session.user })
})

router.post('/place-order', async (req, res) => {
  let products = await userHelpers.getCartProductList(req.body.id)
  let total = await userHelpers.getTotal(req.body.id)
  userHelpers.placeorder(req.body, products, total).then((orderId) => {
    if (req.body['payment'] == 'cod') {
      res.json({ codSuccess: true })
    } else {
      userHelpers.generateRazorpay(orderId, total).then((response) => {
        res.json(response)

      })
    }
  })
})

router.get('/order-placed', (req, res) => {
  res.render('user/order-placed')
})

router.get('/view-orders', verifyLogin, async (req, res) => {
  let orders = await userHelpers.getOrderList(req.session.user._id)
  res.render('user/view-orders', { orders, user: req.session.user })
  //console.log("pro:"+products)
})

router.get('/view-ordered-products/:id', async (req, res) => {
  console.log(req.params.id)
  let orderProducts = await userHelpers.getOrderedProducts(req.params.id)
  res.render('user/view-ordered-products', { orderProducts })
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment success!!!')
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false, errMsj: "" })
  })
})


module.exports = router;
