



function addToCart(proId) {
  $.ajax({
    url: '/add-to-cart/' + proId,
    method: 'get',
    success: (response) => {
      if (response.status) {
        let count = $('#cart-count').html()
        count = parseInt(count) + 1
        $("#cart-count").html(count)
      }
    }
  })
}

function changeCount(cartId, proId, count, userId) {
  quantity = parseInt(document.getElementById(proId).innerHTML)
  $.ajax({
    url: '/change-product-quantity',
    data: {
      cart: cartId,
      product: proId,
      count: count,
      quantity: quantity,
      user: userId
    },
    method: 'post',
    success: (response) => {
      if (response.removeProduct == true) {
        alert('product removed from cart')
        location.reload()
      } else {
        document.getElementById(proId).innerHTML = quantity + count
        document.getElementById('total').innerHTML = response.total

      }
    }

  })
}

function remove(cartId, proId) {
  $.ajax({
    url: '/remove-product',
    data: {
      cart: cartId,
      product: proId,
    },
    method: 'post',
    success: (response) => {
      if (response) {
        alert('product removed from cart')
        location.reload()
      }

    }
  })
}

$('#checkout-form').submit((e) => {
  e.preventDefault()
  $.ajax({
    url: '/place-order',
    method: 'post',
    data: $('#checkout-form').serialize(),
    success: (response) => {
      //alert(response)
      if (response.codSuccess) {
        location.href = '/order-placed'
      } else {
        razorpayPayment(response)
      }
    }

  })
})

function razorpayPayment(order) {
  var options = {
    "key": "rzp_test_rw6po9I0SZ85DC", // Enter the Key ID generated from the Dashboard
    "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    "currency": "INR",
    "name": "shopping-cart",
    "description": "Test Transaction",
    "image": "https://example.com/your_logo",
    "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    "handler": function (response) {
      // alert(response.razorpay_payment_id);
      // alert(response.razorpay_order_id);
      // alert(response.razorpay_signature)  
      verifyPayment(response, order)
    },
    "prefill": {
      "name": "Gaurav Kumar",
      "email": "gaurav.kumar@example.com",
      "contact": "9000090000"
    },
    "notes": {
      "address": "Razorpay Corporate Office"
    },
    "theme": {
      "color": "#3399cc"
    }
  };
  var rzp1 = new Razorpay(options);

  rzp1.open();
}

function verifyPayment(payment, order) {
  $.ajax({
    url: '/verify-payment',
    data: {
      payment,
      order
    },
    method: 'post',
    success: (response) => {

      if (response.status) {
        location.href = '/order-placed'
      } else {
        alert('payment failed')
      }
    }
  })
}


$(document).ready(function () {
  $('#admin-view-products').DataTable();
});


function preventBack() {
  $.ajax({
    url: '/admin/logout',
    method: 'get',
    success: (response) => {
      if (response) {
        location.reload()
      }
    }
  })
}


