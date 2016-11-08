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
  var context = canvas.getContext('2d');
  var picture = null;
  var streaming = false;
  var db = new Dexie('cameraStore');

  db.version(1).stores({
    images: 'latitude,longitude,date,src'
  });

  db.open().catch(handleError);

  navigator.getUserMedia = (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mediaDevices.getUserMedia ||
    navigator.msGetUserMedia
  );

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
    if(!event.defaultPrevented) {
      event.preventDefault();

      canvas.setAttribute('width', card.offsetWidth);
      canvas.setAttribute('height', card.offsetWidth * 0.70754);
    }
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
   * @param {any} image image to show
   */
  function setPicture(data) {
    picture = data;

    if(data) {
      _reset.removeAttribute('disabled');
      _save.removeAttribute('disabled');
      _list.removeAttribute('hidden');
      _date.innerText = data.date.toString();
      _position.innerText = data.position.coords.longitude + ';' + data.position.coords.latitude;
    } else {
      _reset.setAttribute('disabled', 'disabled');
      _save.setAttribute('disabled', 'disabled');
      _list.setAttribute('hidden', 'hidden');
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
    if(!event.defaultPrevented) {
      event.preventDefault();

      save(getPicture());
    }
  }

  /**
   * save
   * @param {any} data object with data to save
   */
  function save(data) {
    db.images.put({
      latitude: data.position.coords.latitude,
      longitude: data.position.coords.longitude,
      date: data.date,
      src: data.image.src
    }).catch(handleError);
  }
} ());