var Camera = (function() {
  var video = window.document.querySelector('video');
  var canvas = window.document.querySelector('canvas');
  var card = window.document.querySelector('.mdl-card.card-canvas');
  var _shoot = window.document.querySelector('#shoot');
  var _reset = window.document.querySelector('#reset');
  var _save = window.document.querySelector('#save');
  var context = canvas.getContext('2d');
  var picture = null;
  var streaming = false;
  navigator.getUserMedia = (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia
  );

  window.removeEventListener('resize', resizeHandler);
  window.addEventListener('resize', resizeHandler);

  video.removeEventListener('canplay', handleCanPlay);
  video.addEventListener('canplay', handleCanPlay);

  navigator.getUserMedia({audio: false, video: true}, handleStream, handleError);

  _shoot.removeEventListener('click', handleShoot);
  _shoot.addEventListener('click', handleShoot);

  _reset.removeEventListener('click', reset);
  _reset.addEventListener('click', reset);

  _save.removeEventListener('click', save);
  _save.addEventListener('click', save);

  return {
    shoot: shoot,
    setPicture: setPicture,
    getPicture: getPicture
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
  function handleShoot(Event) {
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
  function reset(event) {
    if(!event.defaultPrevented) {
      event.preventDefault();

      setPicture(null);
    }
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
    } else {
      _reset.setAttribute('disabled', 'disabled');
      _save.setAttribute('disabled', 'disabled');
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
  function save(event) {
    if(!event.defaultPrevented) {
      event.preventDefault();

      try {
        var pictures = JSON.parse(window.localStorage.getItem('pictures'));
        if(!pictures) {
          pictures = [];
        }

        var data = getPicture();
        pictures.push({
          latitude: data.position.coords.latitude,
          longitude: data.position.coords.longitude,
          date: data.date.toString(),
          image: data.image.src
        });

        window.localStorage.setItem('pictures', JSON.stringify(pictures));
      } catch(error) {
        handleError(error);
      }
    }
  }
} ());