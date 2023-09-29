var express = require('express');
var router = express.Router();
var productHelpers = require('../helpers/product-helpers')
const verifyLogin = (req, res, next) => {
  if (req.session.adminloggedIn) {
    next()
  } else {
    res.redirect('admin/admin-login')
  }
}

/* GET users listing. */
router.get('/', function (req, res, next) {
  if (req.session.adminloggedIn) {
    productHelpers.getAllProducts().then((products) => {
      res.render('admin/view-products', { admin: true, products })
    })
  } else {
    res.redirect('admin/admin-login')
  }
});

router.get('/admin-login', (req, res) => {
  if (req.session.adminloggedIn) {
    res.redirect('/admin')
  } else {
    res.render('admin/admin-login', { loginErr: req.session.adminloginErr, admin: true })
  }
})

router.post('/admin-login', (req, res) => {
  //console.log(req.body)
  productHelpers.AdminLogin(req.body).then((response) => {
    console.log(response)
    if (response.status) {
      req.session.admin = response.admin
      req.session.adminloggedIn = true;
      res.redirect('/admin')
    } else {
      req.session.adminloginErr = "invalid username or password"
      res.redirect('/admin/admin-login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.admin = null
  req.session.adminloggedIn = false
  res.redirect('/admin/admin-login')
  preventBack()
})

router.get('/add-products', verifyLogin, function (req, res) {
  res.render('admin/add-products')
})


router.post('/add-products', function (req, res) {
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.image
    image.mv('./public/product-images/' + id + '.png', (err) => {
      if (!err)
        res.render('admin/add-products')
      else
        console.log(err)
    })
  })
})

router.get('/delete-product', verifyLogin, (req, res) => {
  let proId = req.query.id
  //or router.get('/delete-product:id'),(.....)=>{
  //  let proId=req.params.id}
  productHelpers.deleteProduct(proId).then(() => {
    res.redirect('/admin')
  })
})

router.get('/edit-products', verifyLogin, async (req, res) => {
  let product = await productHelpers.getProductDetails(req.query.id)
  res.render('admin/edit-products', { product })
})

router.post('/edit-products', (req, res) => {
  productHelpers.updateProductDetails(req.query.id, req.body).then(() => {
    res.redirect('/admin')
    let image = req.files.image
    image.mv('./public/product-images/' + req.query.id + '.png')
  })
})

module.exports = router;
