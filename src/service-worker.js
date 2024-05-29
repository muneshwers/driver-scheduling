console.log("Service worker here")

self.addEventListener('message', (event) => {
  let notification = event.data;
  let userSession = event.data.data.loggedUser;
  let driverNotify = event.data.data.driverName;
  let userType = event.data.data.userType;
  const options = {
    icon: '../static/dispatch.png'
  }

  console.log(options);

  console.log(`User logged in is ${userSession} as ${userType}. Driver notified is ${driverNotify}.`)
  if (userSession == driverNotify) {
      self.registration.showNotification(
      notification.title,
      notification.options
    ).catch((error) => {
      console.log(error);
    });
  }
});

self.addEventListener('push', (event) => {
  console.log('Received a push message', event.data.text());

  const payload = JSON.parse(event.data.text()) ?? 'no payload';

  const title = payload.title;
  const body = payload.body;
  const icon = '/dispatch.png';
  const tag = 'simple-push-demo-notification-tag';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      tag: tag
    })
  );

  // event.waitUntil(resubscribeToPush());
});


// async function resubscribeToPush() {
//   return self.registration.pushManager.getSubscription()
//     .then(function(subscription) {
//       if (subscription) {
//         return subscription.unsubscribe();
//       }
//     })
//     .then(async function() {
//       const res = await fetch('/api/vapidPubKey');
//       const { data } = await res.json();
//       return self.registration.pushManager.subscribe({
//         userVisibleOnly: true,
//         applicationServerKey: data
//       });
//     })
//     .then(function(subscription) {
//       console.log('Resubscribed to push notifications:', subscription);
//       sendSubscriptionToServer(subscription);
//     })
//     .catch(function(error) {
//       console.error('Failed to resubscribe:', error);
//     });
// }

//   const sendSubscriptionToServer = async (subscription) => {
//       try {
//           const res = await fetch('/api/addSubscription', {
//               method: 'POST',
//               headers: {
//                   'Content-Type': 'application/json'
//               },
//               body: JSON.stringify({ subscription, userId: userInfo.id })
//           });
//           if(!res.ok) throw new Error(`Error saving subscription on server: ${res.statusText} (${res.status})`);
//       } catch (error) {
//           console.error("Error saving subscription on server: ", error);
//           unsubscribe();
//       }
//   }