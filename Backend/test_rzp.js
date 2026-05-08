const Razorpay = require('razorpay');
const rzp = new Razorpay({key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_123', key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret'});
console.log(rzp.accounts.create.toString());
