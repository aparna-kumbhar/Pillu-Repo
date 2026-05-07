// filepath: /Users/aryanbhoge/Desktop/Pillu-Repo/Backend/Config/razorpayConfig.js
const Razorpay = require("razorpay");

let razorpay = null;

// Validate that required environment variables are set
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
	console.warn('⚠️ WARNING: Razorpay credentials not configured in environment variables');
	console.warn('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
	console.warn('RAZORPAY_KEY_ID:', keyId ? '✅ Set' : '❌ Missing');
	console.warn('RAZORPAY_KEY_SECRET:', keySecret ? '✅ Set' : '❌ Missing');
} else {
	// Initialize Razorpay only if credentials are available
	try {
		razorpay = new Razorpay({
			key_id: keyId,
			key_secret: keySecret,
		});
		console.log('✅ Razorpay initialized successfully');
	} catch (error) {
		console.error('❌ Failed to initialize Razorpay:', error.message);
	}
}

module.exports = razorpay;
