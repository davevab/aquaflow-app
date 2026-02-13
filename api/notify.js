// api/notify.js - Auto-detects INSERT (new order) vs UPDATE (driver assignment)
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

webpush.setVapidDetails(
    'mailto:aquaflow@gensan.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // Supabase sends: { type, table, record, old_record }
        const { type, record, old_record } = req.body;
        const order = record || req.body;

        let payload, query;

        if (type === 'INSERT') {
            // New order → notify owner subscriptions (driver_id is null)
            payload = JSON.stringify({
                title: '🔔 New Order Received!',
                body: `${order.customer_name || 'Customer'} — ${order.quantity || '?'} gal ₱${order.total_amount || ''}`,
                orderId: order.id || ''
            });
            query = supabase.from('push_subscriptions').select('subscription').is('driver_id', null);

        } else if (type === 'UPDATE' && order.driver_id && old_record && old_record.driver_id !== order.driver_id) {
            // Driver just got assigned → notify that specific driver only
            payload = JSON.stringify({
                title: '🚚 New Delivery Assigned!',
                body: `${order.customer_name || 'Customer'} — ${order.quantity || '?'} gal ₱${order.total_amount || ''}`,
                orderId: order.id || ''
            });
            query = supabase.from('push_subscriptions').select('subscription').eq('driver_id', order.driver_id);

        } else {
            return res.status(200).json({ message: 'No notification needed' });
        }

        const { data: subscriptions, error } = await query;
        if (error) return res.status(500).json({ error: 'Failed to fetch subscriptions' });
        if (!subscriptions || subscriptions.length === 0) return res.status(200).json({ message: 'No subscriptions' });

        const results = await Promise.allSettled(
            subscriptions.map(row => webpush.sendNotification(row.subscription, payload))
        );

        const sent   = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        // Clean up expired subscriptions (410 Gone)
        const expired = results
            .map((r, i) => r.status === 'rejected' && r.reason?.statusCode === 410 ? subscriptions[i].subscription.endpoint : null)
            .filter(Boolean);
        if (expired.length > 0) {
            await supabase.from('push_subscriptions').delete().in('endpoint', expired);
        }

        return res.status(200).json({ sent, failed });

    } catch (err) {
        console.error('Notification error:', err);
        return res.status(500).json({ error: err.message });
    }
};
