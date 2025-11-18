import Stripe from 'stripe';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Subscription plans configuration
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'USD',
    features: [
      'Limited swipes per week',
      'Basic matching',
      'Video connections'
    ]
  },
  premium: {
    name: 'Premium',
    price: 9.99,
    priceId: 'price_premium_monthly', // Replace with actual Stripe price ID
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited swipes',
      'Advanced filters',
      'Match history',
      'Priority support',
      'No ads'
    ]
  }
};

// @desc    Get available subscription plans
// @route   GET /api/subscription/plans
// @access  Public
export const getPlans = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        plans: PLANS
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's current subscription status
// @route   GET /api/subscription/status
// @access  Private
export const getSubscriptionStatus = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user.id,
      status: 'active'
    }).sort('-createdAt');

    const user = await User.findById(req.user.id).select('plan swipesThisWeek swipesResetDate');

    res.status(200).json({
      status: 'success',
      data: {
        currentPlan: user.plan,
        subscription: subscription || null,
        swipesUsed: user.swipesThisWeek,
        swipesLimit: user.plan === 'premium' ? 'unlimited' : parseInt(process.env.FREE_SWIPES_PER_WEEK || 10),
        swipesResetDate: user.swipesResetDate
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Subscribe to a plan
// @route   POST /api/subscription/subscribe
// @access  Private
export const subscribe = async (req, res, next) => {
  try {
    const { plan, paymentMethodId } = req.body;

    if (!plan || !['free', 'premium'].includes(plan)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid plan selected'
      });
    }

    if (plan === 'free') {
      return res.status(400).json({
        status: 'error',
        message: 'You are already on the free plan'
      });
    }

    const user = await User.findById(req.user.id);

    // Check if user already has premium
    if (user.plan === 'premium') {
      return res.status(400).json({
        status: 'error',
        message: 'You already have an active premium subscription'
      });
    }

    if (!paymentMethodId) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment method is required'
      });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      customerId = customer.id;
    } else {
      // Attach payment method to existing customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    }

    // Create subscription in Stripe
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: PLANS.premium.priceId }],
      expand: ['latest_invoice.payment_intent']
    });

    // Create subscription record
    const subscription = await Subscription.create({
      userId: user._id,
      plan: 'premium',
      status: 'active',
      stripeCustomerId: customerId,
      stripeSubscriptionId: stripeSubscription.id,
      startDate: new Date(),
      endDate: new Date(stripeSubscription.current_period_end * 1000),
      amount: PLANS.premium.price,
      currency: PLANS.premium.currency,
      autoRenew: true
    });

    // Update user's plan
    user.plan = 'premium';
    user.stripeCustomerId = customerId;
    await user.save();

    res.status(201).json({
      status: 'success',
      message: 'Subscription created successfully',
      data: {
        subscription,
        clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret
      }
    });
  } catch (error) {
    console.error('Stripe subscription error:', error);
    next(error);
  }
};

// @desc    Cancel subscription
// @route   POST /api/subscription/cancel
// @access  Private
export const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user.id,
      status: 'active'
    });

    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'No active subscription found'
      });
    }

    if (subscription.plan === 'free') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel free plan'
      });
    }

    // Cancel subscription in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update subscription record
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    await subscription.save();

    // Note: User keeps premium until end date
    // We'll need a cron job to downgrade users after endDate

    res.status(200).json({
      status: 'success',
      message: 'Subscription will be cancelled at the end of the billing period',
      data: {
        subscription,
        accessUntil: subscription.endDate
      }
    });
  } catch (error) {
    console.error('Stripe cancellation error:', error);
    next(error);
  }
};

// @desc    Webhook handler for Stripe events
// @route   POST /api/subscription/webhook
// @access  Public
export const handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// Helper functions for webhook handlers
async function handleSubscriptionUpdated(subscription) {
  const dbSubscription = await Subscription.findOne({
    stripeSubscriptionId: subscription.id
  });

  if (dbSubscription) {
    dbSubscription.status = subscription.status === 'active' ? 'active' : 'cancelled';
    dbSubscription.endDate = new Date(subscription.current_period_end * 1000);
    await dbSubscription.save();
  }
}

async function handleSubscriptionDeleted(subscription) {
  const dbSubscription = await Subscription.findOne({
    stripeSubscriptionId: subscription.id
  });

  if (dbSubscription) {
    dbSubscription.status = 'expired';
    await dbSubscription.save();

    // Downgrade user to free plan
    await User.findByIdAndUpdate(dbSubscription.userId, {
      plan: 'free'
    });
  }
}

async function handlePaymentSucceeded(invoice) {
  // Payment succeeded, subscription is active
  console.log('Payment succeeded for invoice:', invoice.id);
}

async function handlePaymentFailed(invoice) {
  // Payment failed, notify user
  console.log('Payment failed for invoice:', invoice.id);
  // TODO: Send notification to user
}

export default {
  getPlans,
  getSubscriptionStatus,
  subscribe,
  cancelSubscription,
  handleWebhook
};

