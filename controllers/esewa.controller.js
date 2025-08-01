import { EsewaPaymentGateway, EsewaCheckStatus } from "esewajs";
import { Transaction } from '../models/transaction.model.js';
import { v4 as uuidv4 } from 'uuid'; // ✅ Add this at the top

export const EsewaInitiatePayment = async (req, res) => {
  console.log("Received payment initiation request:", req.body);

  const { amount, appointmentId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }
  if (!appointmentId) {
    return res.status(400).json({ error: "Invalid appointmentId" });
  }

  const transaction_uuid = uuidv4(); // ✅ This generates a unique ID every time

  try {
    const reqPayment = await EsewaPaymentGateway(
      amount,
      0,
      0,
      0,
      transaction_uuid, // ✅ pass this instead of appointmentId here
      process.env.MERCHANT_ID,
      process.env.ESEWA_SECRET,
      process.env.SUCCESS_URL,
      process.env.FAILURE_URL,
      process.env.ESEWAPAYMENT_URL,
      undefined,
      undefined
    );

    console.log("eSewa response:", reqPayment);

    if (!reqPayment) {
      return res.status(400).json({ error: "Error sending data to eSewa" });
    }

    if (reqPayment.status === 200) {
      const transaction = new Transaction({
        product_id: appointmentId, // still store original appointment
        transaction_uuid,          // ✅ store uuid for status check later
        amount,
      });
      await transaction.save();
      console.log("Transaction saved successfully");
      return res.json({
        url: reqPayment.request.res.responseUrl,
         formFields: reqPayment.formData,
      });
    } else {
      return res.status(400).json({ error: "Failed to initiate payment" });
    }
  } catch (error) {
    console.error("Esewa payment initiation error:", error);
    return res.status(400).json({ error: "Exception while initiating payment" });
  }
};



export const paymentStatus = async (req, res) => {
  const { transaction_uuid } = req.body;
  console.log("paymentStatus called with UUID:", transaction_uuid);
  try {
    const transaction = await Transaction.findOne({ transaction_uuid });
    console.log("Found transaction:", transaction);
    if (!transaction) {
      return res.status(400).json({ message: "Transaction not found" });
    }

    console.log("Checking payment status for:", {
      amount: transaction.amount,
      transaction_uuid: transaction.transaction_uuid,
      merchant_id: process.env.MERCHANT_ID,
      status_url: process.env.ESEWAPAYMENT_STATUS_CHECK_URL,
    });

    const paymentStatusCheck = await EsewaCheckStatus(
      transaction.amount,
      transaction.transaction_uuid,
      process.env.MERCHANT_ID,
      process.env.ESEWAPAYMENT_STATUS_CHECK_URL
    );

    console.log("eSewa status check response:", paymentStatusCheck);

    if (paymentStatusCheck.status === 200) {
      transaction.status = paymentStatusCheck.data.status;
      await transaction.save();

      return res.status(200).json({ message: "Transaction status updated successfully" });
    } else {
      // Handle unexpected status code from eSewa here
      return res.status(400).json({ message: "eSewa returned error status", data: paymentStatusCheck.data });
    }
  } catch (error) {
    console.error("Error updating transaction status:", error.response?.data || error.message);
    res.status(500).json({ message: "Server error", error: error.response?.data || error.message });
  }
};

