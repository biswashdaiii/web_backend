import { EsewaPaymentGateway, EsewaCheckStatus } from "esewajs";
import { Transaction } from '../models/transaction.model.js';

export const EsewaInitiatePayment = async (req, res) => {
  console.log("Received payment initiation request:", req.body);

  const { amount, appointmentId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }
  if (!appointmentId) {
    return res.status(400).json({ error: "Invalid appointmentId" });
  }

  try {
    const reqPayment = await EsewaPaymentGateway(
      amount,
      0,
      0,
      0,
      appointmentId,
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
        product_id: appointmentId,
        amount,
      });
      await transaction.save();
      console.log("Transaction saved successfully");
      return res.json({
        url: reqPayment.request.res.responseUrl,
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
  const { product_id } = req.body; // This remains product_id to match transaction.product_id
  try {
    // Find transaction by product_id (which is appointmentId)
    const transaction = await Transaction.findOne({ product_id });
    if (!transaction) {
      return res.status(400).json({ message: "Transaction not found" });
    }

    const paymentStatusCheck = await EsewaCheckStatus(
      transaction.amount,
      transaction.product_id,
      process.env.MERCHANT_ID,
      process.env.ESEWAPAYMENT_STATUS_CHECK_URL
    );

    if (paymentStatusCheck.status === 200) {
      // Update transaction status from the payment check
      transaction.status = paymentStatusCheck.data.status;
      await transaction.save();

      return res.status(200).json({ message: "Transaction status updated successfully" });
    }
  } catch (error) {
    console.error("Error updating transaction status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
