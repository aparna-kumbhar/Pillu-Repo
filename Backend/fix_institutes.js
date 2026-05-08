require('dotenv').config();
const mongoose = require('mongoose');
const Institute = require('./Models/Institute');
const razorpay = require('./Config/razorpayConfig');

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/coaching_db";

async function run() {
  await mongoose.connect(MONGO_URI);
  const institutes = await Institute.find({ 'razorpayDetails.accountId': null });
  console.log(`Found ${institutes.length} institutes without accountId.`);
  
  for (let inst of institutes) {
    if (!inst.bankAccount || !inst.bankAccount.accountHolderName) {
      console.log(`Skipping ${inst.instituteId} - no bank details.`);
      continue;
    }
    try {
      const accountPayload = {
        email: inst.email || "admin@example.com",
        phone: inst.phone || "0000000000",
        type: "route",
        reference_id: `inst_${Date.now()}`,
        legal_business_name: inst.bankAccount.accountHolderName,
        business_type: "individual",
        contact_name: inst.adminName || inst.bankAccount.accountHolderName || "Admin",
        profile: {
          category: "education",
          subcategory: "coaching",
          addresses: {
            registered: {
              street1: "N/A", city: "N/A", state: "MH", postal_code: "400001", country: "IN"
            }
          }
        }
      };
      const accountResponse = await razorpay.accounts.create(accountPayload);
      inst.razorpayDetails.accountId = accountResponse.id;
      await inst.save();
      console.log(`✅ Updated institute ${inst.instituteId} with accountId: ${accountResponse.id}`);
    } catch (e) {
      console.error(`❌ Failed to update ${inst.instituteId}:`, e.error?.description || e.message);
    }
  }
  process.exit(0);
}
run();
