if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service worker registered: ', registration);
    }).catch(registrationError => {
      console.log('Service worker registration failed: ', registrationError);
    });
}