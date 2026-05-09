const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.PLATFORM_STRIPE_SECRET_KEY);
const supabaseAdmin = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

// GENERATE $9.99/mo CHECKOUT SESSION
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const { orgId } = req.body;

    const { data: org } = await supabaseAdmin.from('organizations').select('*').eq('id', orgId).single();
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: process.env.STRIPE_MONTHLY_PRICE_ID, 
        quantity: 1,
      }],
      client_reference_id: orgId, // Tells the webhook who paid
      success_url: `${req.headers.origin}/?billing=success`,
      cancel_url: `${req.headers.origin}/?billing=canceled`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PLATFORM WEBHOOK: Listens for Stripe payments to unlock the account
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful subscription
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orgId = session.client_reference_id;

    if (orgId) {
      await supabaseAdmin.from('organizations').update({
        subscription_status: 'active',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription
      }).eq('id', orgId);
    }
  }

  // Handle cancellation
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    await supabaseAdmin.from('organizations').update({
      subscription_status: 'canceled'
    }).eq('stripe_subscription_id', subscription.id);
  }

  res.status(200).json({ received: true });
});

module.exports = router;