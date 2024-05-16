console.log("Service worker here")

self.addEventListener('message', (event) => {
  let notification = event.data;
  let userSession = event.data.data.loggedUser;
  let driverNotify = event.data.data.driverName;
  let userType = event.data.data.userType;
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

self.addEventListener('sync', (event) => {
  console.log("Sync event", event);
  if (event.tag === 'syncTrips') {
    event.waitUntil(sendTripNotif());
  }
})

const sendTripNotif = () => {

}