const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_CONTACT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPush(subscription, payload) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
  } catch (err) {
    if (err.statusCode === 410) throw Object.assign(err, { expired: true });
    throw err;
  }
}

module.exports = { sendPush };
