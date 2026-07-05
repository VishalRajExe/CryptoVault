import client from './client';

// Maps to com.vishal.controller.PaymentController + the deposit-completion
// endpoint on WalletController. The full Razorpay flow is:
//   1. createPaymentOrder('RAZORPAY', amount) -> { payment_url }
//      (this also creates a PENDING PaymentOrder row server-side)
//   2. redirect the browser to payment_url (Razorpay's hosted checkout)
//   3. Razorpay redirects back to {FRONTEND_URL}/wallet/{orderId}?... on success
//   4. that page must call completeDeposit(orderId, paymentId) to verify the
//      payment with Razorpay's API and actually credit the wallet - simply
//      landing back on the callback URL does NOT credit funds by itself.

export const createPaymentOrder = (paymentMethod, amount) =>
  client.post(`/api/payment/${paymentMethod}/amount/${amount}`).then((r) => r.data);

export const completeDeposit = (orderId, paymentId) =>
  client
    .put('/api/wallet/deposit', null, { params: { order_id: orderId, payment_id: paymentId } })
    .then((r) => r.data);
