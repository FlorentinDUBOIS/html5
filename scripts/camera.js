var Camera = (function() {
  var video = window.document.querySelector('video');
  var canvas = window.document.querySelector('canvas');
  var card = window.document.querySelector('.mdl-card.card-canvas');
  var _shoot = window.document.querySelector('#shoot');
  var _reset = window.document.querySelector('#reset');
  var _save = window.document.querySelector('#save');
  var _position = window.document.querySelector('#position');
  var _date = window.document.querySelector('#date');
  var _list = window.document.querySelector('#list');
  var _map = window.document.querySelector('.map-container');
  var map = L.map('map').setView([48.4083867,-4.5696402], 12);
  var context = canvas.getContext('2d');
  var picture = null;
  var streaming = false;
  var db = new Dexie('cameraStore');

  navigator.getUserMedia = (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
  );

  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  db.version(1).stores({
    images: 'date,longitude,latitude,src'
  });

  db
    .open()
    .catch(handleError)
    .then(function() {
      db.images.each(function(image) {
        addImageToMap(
          image.latitude,
          image.longitude,
          image.src,
          image.date
        );
      });
    });

  window.removeEventListener('resize', resizeHandler);
  window.addEventListener('resize', resizeHandler);

  video.removeEventListener('canplay', handleCanPlay);
  video.addEventListener('canplay', handleCanPlay);

  navigator.getUserMedia({audio: false, video: true}, handleStream, handleError);

  _shoot.removeEventListener('click', handleShoot);
  _shoot.addEventListener('click', handleShoot);

  _reset.removeEventListener('click', handleReset);
  _reset.addEventListener('click', handleReset);

  _save.removeEventListener('click', handleSave);
  _save.addEventListener('click', handleSave);

  window.setTimeout(resizeHandler, 1000);

  return {
    shoot: shoot,
    reset: reset,
    save: save
  };

  /////////////////

  /**
   * handle resize event
   * @param {Event} event event object that is create
   */
  function resizeHandler(event) {
    if(event) {
      if(!event.defaultPrevented) {
        event.preventDefault();
      }
    }

    canvas.setAttribute('width', card.offsetWidth);
    canvas.setAttribute('height', card.offsetWidth * 0.70754);

    _map.style.width = card.offsetWidth + 'px';
    _map.style.height = (card.offsetWidth * 0.70754) + 'px';
  }

  /**
   * handle stream given by getUserMedia
   * @param {any} stream strem
   */
  function handleStream(stream) {
    video.src = window.URL.createObjectURL(stream);
    video.play();

    window.requestAnimationFrame(animate);
  }

  /**
   * handle error
   * @param {Error} error the error
   */
  function handleError(error) {
    console.error(error);
  }

  /**
   * handle event can play of video
   * @param {Event} event event object
   */
  function handleCanPlay(event) {
    if(!event.defaultPrevented) {
      event.preventDefault();

      streaming = true;
    }
  }

  /**
   * animate the canvas
   */
  function animate() {
    if(!getPicture()) {
      if (streaming) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      context.beginPath();
      context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 8, 0, 2 * Math.PI);

      context.moveTo(canvas.width * 3/8, canvas.height * 4/8);
      context.lineTo(canvas.width * 3/8 - 50, canvas.height * 4/8);

      context.moveTo(canvas.width * 5/8, canvas.height * 4/8);
      context.lineTo(canvas.width * 5/8 + 50, canvas.height * 4/8);

      context.moveTo(canvas.width * 4/8, canvas.height * 2.58/8);
      context.lineTo(canvas.width * 4/8, canvas.height * 2.58/8 - 50);

      context.moveTo(canvas.width * 4/8, canvas.height * 5.4/8);
      context.lineTo(canvas.width * 4/8, canvas.height * 5.4/8 + 50);

      context.lineWidth = 2;
      context.strokeStyle = 'red';
      context.stroke();
    } else {
      context.drawImage(getPicture().image, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
    }

    window.requestAnimationFrame(animate);
  }

  /**
   * handle shoot
   * @param {Event} event click on button shoot
   */
  function handleShoot(event) {
    if(!event.defaultPrevented) {
      event.preventDefault();

      shoot()
        .catch(handleError)
        .then(function(data) {
          setPicture(data);
        });
    }
  }

  /**
   * take a picture
   * @return {PromiseLike<any>} a promise with an object contains the picture and metadata
   */
  function shoot() {
    return new Promise(function(resolve, reject) {
      window.navigator.geolocation.getCurrentPosition(function(position) {
        var image = new Image();

        context.drawImage(video, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
        image.src = canvas.toDataURL();

        notify({
          title: 'Snapshot',
          body: 'Successfully took picture'
        });

        resolve({
          position: position,
          image: image,
          date: Date.now()
        });
      }, reject);
    });
  }

  /**
   * handle the click of button reset
   * @param {Event} event click event
   */
  function handleReset(event) {
    if(!event.defaultPrevented) {
      event.preventDefault();

      reset();
    }
  }

  /**
   * reset
   */
  function reset() {
    setPicture(null);
  }

  /**
   * set the picture to show
   * @param {any} image to show
   */
  function setPicture(data) {
    picture = data;
    if(data) {
      _reset.removeAttribute('disabled');
      _save.removeAttribute('disabled');
      _list.removeAttribute('hidden');
      _date.innerText = new Date(data.date).toLocaleString(navigator.language);
      _save.setAttribute('href', picture.image.src);
      _position.innerText = data.position.coords.longitude + ';' + data.position.coords.latitude;
    } else {
      _reset.setAttribute('disabled', 'disabled');
      _save.setAttribute('disabled', 'disabled');
      _list.setAttribute('hidden', 'hidden');
      _save.removeAttribute('href');
    }
  }

  /**
   * get picture
   */
  function getPicture() {
    return picture;
  }

  /**
   * save in local storage
   * @param {Event} event click on the button save
   */
  function handleSave(event) {
    save(getPicture());
  }

  /**
   * save
   * @param {any} data object with data to save
   */
  function save(data) {
    addImageToMap(
      data.position.coords.latitude,
      data.position.coords.longitude,
      data.image.src,
      data.date
    );

    db
      .images
      .put({
        latitude: data.position.coords.latitude,
        longitude: data.position.coords.longitude,
        date: data.date,
        src: data.image.src
      })
      .catch(handleError)
      .then(function() {
        notify({
          title: 'Saved!',
          body: 'Successfully saved the image'
        });
      });
}

  /**
   * notify
   * @param {any} message notification
   */
  function notify(message) {
    Notification.requestPermission().then(function(permission) {
      if (permission === 'granted') {
        new Notification(message.title, {
          body: message.body,
          icon: 'data:image/x-icon;base64,AAABAAEAEBAAAAAAAABoBQAAFgAAACgAAAAQAAAAIAAAAAEACAAAAAAAAAEAAAAAAAAAAAAAAAEAAAAAAAAAAAAAy8vLAAEDAAAROkkABAAAAAACBgAFAwAAIVJsALOliAAFAwkAT/T3AJTK/wAcTewAsOzvAB5I7wAfTuYA0LeiAHr6/wAnU+MAJ1HmABtHVQDHgAAA6+b3AMh9CQDm9/QA3d3dACNMWwArVfsA+e3oAO/w+gB+dHYAAAABAPLz8QA8X28ALmbmAPP09AAAAgcABAABAPT09ADg3eYABQABAEvy+wBNeY8AAQIQAAcACgD3+foAAAsQAOHn8gA8a+wA/f39AF/1+wAsUecAYfX7ADBfcAAkRlMA7+/vAL2yngDu8/IAbPT4AMC0mwDKysoAAAACAAEAAgArY/AAAAUIAAMEBQCJfmgAxLunALamjQD8/PsA+v3+AKjK7wAzWmsAau/zAO/o9gAGPUwAOv36AKfY/gAAAAMAxNXIAAACAADDtJwAAQMDADJp6AAJAgkABAUSACRO4AATSFIAvKWLAJF+aQD8/PwA/vz8AKWafQAgUfsAm5ubACFEWAApT/UAv+/yAOzu7gCj1PwAvbCaACBf+ADv8/QAAAAEALHS/wAGAAQABgIBAC5q7AAHAgEAHk3eAPf39wDN9/gAmc3xAAcHBwDp6ekAGUdZAJOEagAdS1MAL0ztAC1U6gC4s6QANU3nAAACAgCwn40AttfrABVN6AAtYfYAsqGKAAQCAgAHAAUAn87jAFd3jQC7pocA+fv7APv7+wCmvP4AJUzuANbW1gCampoA3vb/ANr//wAkR1EAv7KZAKyihQCas/YAAAEAAAAEAAAAAAYAAAUDAAQBAACupogAHUfgAAUBAAAACgAABwEAAAEECQAHBAAA8/v8ACJI7AD4+/wAzfv9ABhBUgAsReMA/vr5ACNR7ADm5PcAGEZYAB1EUgD///8ALE7sAGH2+gAoY/UA9/DuAAEBAQCwooYAAwIEAAAIBAAwYvIAGkjtAOPj4wAJBQQAHU/nAAgJBwAVRFMAH2FzAAwIBAD++P0AJVPhAP77/QDV1dUApKCBAGLz+wAfRFwAZfX4ABgLDQApVP8ARniKAMK1mwDv9/IAAAECAAMBAgC2oYQABwECAJqQfwDf6vAA5urnAP7+/gDg8vYA//7+AChU5QCdh24AwvX3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqDFyiQAqB3M+X06IJBlaqKg8XooAoaaNyrASXW2ST6gxAYpeAIM1Hpl5DH6rMFDOqM6zvQC+0lnDh8wYJ2XRZ6jOMaitxLi/YH27a4sipJOoqIZxrVgQf56sSs0ckA+Tzm6bdEI7OMu1pVaxP1MbkzeTfENkUZUoEy8WHWbPopMJp0jHtrkLgrIzqQ52d5cfVzaTugCdFWhNFy1jJWmBAMg9xiMAr4AhVZxBwFSfRs5bqJTCdbcDSQpLFBooeryo0ECgKxHBOqoyNClMLHAAqJFhb5p4j5YIhMlcewJHDa2t01IgtI7Fxa6uRAaFLoytqAWjYiZsbGpqmASoOUUAqAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
        });
      }
    });
  }

  /**
   * add an image to map
   * @param {number} latitude latitude
   * @param {number} longitude longitude
   * @param {string} src source
   * @param {Date} date date
   */
  function addImageToMap(latitude, longitude, src, date) {
    L.marker([
      latitude,
      longitude
    ])
    .bindPopup(
      L.popup()
       .setLatLng(L.latLng(
          latitude,
          longitude
       ))
       .setContent(
         '<div style="width: 300px; height: 240px">' +
            '<img style="width: 100%; height: auto" src="' + src + '" />' +
            '<p> Date: ' + new Date(date).toLocaleString(navigator.language) + '<p>' +
         '</div>'
       )
    )
    .addTo(map);

    map.setView([
      latitude,
      longitude
    ], 13);
  }
} ());
