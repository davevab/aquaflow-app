// api/notify.js - Vercel Serverless Function
// Triggered by Supabase webhook on new order insert
// Sends Web Push notifications to all subscribed devices

const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

webpush.setVapidDetails(
    'mailto:aquaflow@gensan.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // service role key for server-side access
);

module.exports = async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const order = req.body.record || req.body;

        // Build notification payload
        const customerName = order.customer_name || 'Customer';
        const quantity     = order.quantity || '?';
        const total        = order.total_amount ? '₱' + order.total_amount : '';
        const paymentMethod = order.payment_method === 'gcash' ? 'GCash' : 'COD';

        const payload = JSON.stringify({
            title: '🔔 New Order Received!',
            body: `${customerName} — ${quantity} gal ${total} (${paymentMethod})`,
            orderId: order.id || Date.now().toString()
        });

        // Get all push subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('subscription');

        if (error) {
            console.error('Error fetching subscriptions:', error);
            return res.status(500).json({ error: 'Failed to fetch subscriptions' });
        }

        if (!subscriptions || subscriptions.length === 0) {
            return res.status(200).json({ message: 'No subscriptions found' });
        }

        // Send push to all subscribed devices
        const results = await Promise.allSettled(
            subscriptions.map(row =>
                webpush.sendNotification(row.subscription, payload)
            )
        );

        const sent    = results.filter(r => r.status === 'fulfilled').length;
        const failed  = results.filter(r => r.status === 'rejected').length;

        // Clean up expired subscriptions (410 Gone)
        const expiredIndices = results
            .map((r, i) => r.status === 'rejected' && r.reason?.statusCode === 410 ? i : -1)
            .filter(i => i >= 0);

        if (expiredIndices.length > 0) {
            const expiredSubs = expiredIndices.map(i => subscriptions[i].subscription.endpoint);
            await supabase
                .from('push_subscriptions')
                .delete()
                .in('endpoint', expiredSubs);
        }

        return res.status(200).json({ sent, failed });

    } catch (err) {
        console.error('Notification error:', err);
        return res.status(500).json({ error: err.message });
    }
};
