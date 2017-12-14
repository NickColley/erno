var hasNativePE = window.PointerEvent || window.MSPointerEvent;
if (!hasNativePE) {
  import(/* webpackChunkName: "pepjs"*/ 'pepjs')
}

import { ENV } from '../constants.js'

import Wakelock from './wakelock.js'
const wakelock = new Wakelock()

import Scrambo from 'scrambo'
import './style.css'

const APP_DEBUG = ENV === 'development';
const MOVEMENT_THRESHOLD = 5;
const STARTING_THRESHOLD = 1000;
const READY_THRESHOLD = 100;

const COLOURS = [
  'green', 'blue', 'red', 'orange', 'yellow', 'white'
];

function randomColor() {
  return COLOURS[Math.floor(Math.random() * COLOURS.length)]
}

function hashCode(string) {
  var hash = 0, i, chr, len;
    /* istanbul ignore if */
  if (string.length === 0) return hash;
  for (i = 0, len = string.length; i < len; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}


function debug (attributes) {
  if (APP_DEBUG) {
    console.log(attributes)
  }
}

function bodyOrContext(element) {
  var activeElement = document.activeElement;
  return (
    activeElement === element ||
    activeElement === document.body
  )
}

var announce = ''

function Timer(callback) {
  var usingPointer = false;
  function addKeyListener(context, keyCode, handleDown, handleUp) {
    var isKeydown = false // Ensure repeat keys are not triggered

    document.addEventListener('keydown', event => {
      usingPointer = false;
      if (event.keyCode === keyCode && bodyOrContext(context)) {
        event.preventDefault();
        if (isKeydown) {
          return;
        }
        handleDown(event);
        context.focus();
      }
      isKeydown = true;
    }, false)
    document.addEventListener('keyup', event => {
      usingPointer = false;
      isKeydown = false;
      if (event.keyCode === keyCode && bodyOrContext(context)) {
        event.preventDefault();
        handleUp(event);
        context.focus();
      }
    }, false)
  }

  var readyTime = -1
  var startTime = -1
  var endTime = -1
  var currentTime = -1

  var state = 'idle'

  var $root = document.documentElement
  var $timer = document.querySelector('.js-timer')
  var $announcer = document.querySelector('.js-announcer')

  var timerOriginalClassName = $timer.className.slice(0)

  $timer.addEventListener('pointerdown', handlePointerDown)
  $timer.addEventListener('pointercancel', handlePointerCancel)
  $timer.addEventListener('pointerup', handlePointerUp)

  // NVDA uses clicks not keyevents (http://unobfuscated.blogspot.co.uk/2013/05/event-handlers-and-screen-readers.html)
  $timer.addEventListener('click', handleClick)

  addKeyListener($timer, 32, handlePointerDown, handlePointerUp)
  addKeyListener($timer, 13, handlePointerDown, handlePointerUp)

  if (window.DeviceMotionEvent) {
    window.addEventListener("devicemotion", function(event) {
      var movement = Math.abs(event.acceleration.z)

      var hasWaitedAfterStarting = ((currentTime - startTime) > STARTING_THRESHOLD)

      if (movement >= MOVEMENT_THRESHOLD) {
        if (state === 'running' && hasWaitedAfterStarting) {
          callback(currentTime - startTime)
          stopTimer()
          debug('DeviceMotionEvent:down:stopTimer()')
        }
      }
    }, true);
  }

  function handleClick () {
    if (usingPointer) {
      return
    }
    if (state === 'running') {
      callback(currentTime - startTime)
      stopTimer()
      debug('click:stopTimer()')
    } else if (state === 'idle') {
      startTimer()
      debug('click:startTimer()')
    }
  }

  function handlePointerDown () {
    usingPointer = true;
    if (state === 'running') {
      callback(currentTime - startTime)
      stopTimer()
      debug('down:stopTimer()')
    } else {
      readyTimer()
      debug('down:readyTimer()')
    }
  }

  function handlePointerCancel () {
    usingPointer = true;
    stopTimer()
    debug('cancel:stopTimer()')
  }

  function handlePointerUp (event) {
    usingPointer = true;
    // See if they have waited after first pressing down
    var hasWaitedBeforeStarting = ((currentTime - readyTime) > READY_THRESHOLD)
    hasWaitedBeforeStarting = true
    if (state === 'ready' && hasWaitedBeforeStarting) {
      startTimer()
      debug('up:startTimer()')
    } else {
      stopTimer()
      debug('up:stopTimer()')
    }
  }

  function readyTimer () {
    state = 'ready'
    announce = 'timer ready'
    readyTime = currentTime
    startTime = 0
    endTime = 0
  }

  function startTimer () {
    state = 'running'
    announce = 'timer running'
    startTime = currentTime
    wakelock.start()
  }

  function stopTimer () {
    state = 'idle'
    endTime = currentTime
    wakelock.stop()
  }

  function getTimestamp () {
    var hasPerformanceApi = (
      window.performance &&
      window.performance.now &&
      window.performance.timing &&
      window.performance.timing.navigationStart
    )
    if (hasPerformanceApi) {
      return window.performance.now() + window.performance.timing.navigationStart
    }
    return Date.now()
  }

  function updateCurrentTime () {
    currentTime = getTimestamp()
  }

  function render () {
    if (state === 'ready') {
      $timer.innerHTML = formatTimestamp(0)
    } else if (state === 'running') {
      $timer.innerHTML = formatTimestamp(
        currentTime - startTime
      )
    }
    $timer.className = `${timerOriginalClassName} timer--${state}`
    $announcer.innerHTML = announce
  }

  (function renderLoop () {
    updateCurrentTime()
    render()
    window.requestAnimationFrame(renderLoop)
  })()
}

function formatTimestamp (timestamp) {
  return (timestamp / 1000).toFixed(3)
}

var $scrambleOutput = document.querySelector('.js-scramble-output')
var scrambleSeed = $scrambleOutput.getAttribute('data-seed');
var threebythree = new Scrambo();
var currentScramble

function renderScramble () {
  currentScramble = threebythree.get()
  $scrambleOutput.innerHTML = currentScramble
}

var times = JSON.parse(window.localStorage.getItem('times')) || []
var $timesOutput = document.querySelector('.js-times-output')
function renderTimes () {
  const averageOfFive = 5;

  function renderTimes (time) {
    return `
      <details>
        <summary>
          ${time.timestamp}
          <span class="visually-hidden">time</span>
        </summary>
        ${time.scramble}
        <br/>
        <button id="${time.id}" class="js-delete-button button--danger">Delete time</button>
      </details>
    `
  }

  var chunkedTimes = chunkArray(times, averageOfFive)
    .map(chunk => {
      if (chunk.length === averageOfFive) {
        return `<li>
          <details>
            <summary>
              ${averageArray(chunk.map(time => time.timestamp))} (average of five)
              <span class="visually-hidden">time</span>
            </summary>
            <ul>
              ${chunk.map(renderTimes).join('')}
            </ul>
          </details>
        </li>`
      }
      return `<li>${chunk.map(renderTimes).join('')}</li>`
    })

  let deleteAllButtonHTML = `
    <button class="js-delete-all-button button--danger">Delete all times</button>
  `

  $timesOutput.innerHTML = `
    ${chunkedTimes.reverse().join('')}
    ${(times.length > 1) ? deleteAllButtonHTML : ''}
  `
}

function averageArray(array) {
  var length = array.length;
  // TODO: Change from this hacky way to ensure no floats
  var decimalPlaceBuffer = 3;
  var bufferToInteger = 10 * decimalPlaceBuffer;
  var arraySum = 0;
  for (var i = 0; i < length; i++){
    arraySum += parseInt(array[i] * bufferToInteger, 10);
  }

  return ((arraySum / length) / bufferToInteger).toFixed(decimalPlaceBuffer);
}

function chunkArray (array, size) {
  var chunkedArray = [];
  for (var i = 0, length = array.length; i < length; i += size) {
    chunkedArray.push(
      array.slice(i, i + size)
    );
  }
  return chunkedArray;
}


// TODO: Use scramble and draw actual scramble
function randomiseCube() {
  const logoCubies = document.querySelectorAll('.logo__cubie');

  const middleCubieIndex = 4

  Array.prototype.forEach.call(logoCubies, (logoCubie, index) => {
    const isMiddleCubie = index === middleCubieIndex
    const cubieColor = isMiddleCubie ? 'green' : randomColor()
    logoCubie.setAttribute('class', `logo__cubie logo__cubie--${cubieColor}`);
  })
}


var $dialog = document.querySelector('.js-dialog')

var hasNativeDialog = window.HTMLDialogElement !== undefined;
var canUseDialog = hasNativeDialog;
if (hasNativeDialog) {
  addDialogListener();
} else {
  import(/* webpackChunkName: "dialog-polyfill"*/ 'dialog-polyfill')
    .then(dialogPolyfill => {
      dialogPolyfill.registerDialog($dialog);
      addDialogListener();
    })
    .catch(error => {
      console.error(error)
    })
}

function addDialogListener () {
  canUseDialog = true;
  $dialog.addEventListener('close', function (event) {
    if ($dialog.returnValue !== 'true') {
      return;
    }
    deleteAllTimes();
  });
}

function deleteAllTimes () {
  times = [];
  window.localStorage.setItem('times', JSON.stringify(times))
  announce = 'all times deleted'
  renderTimes()
}

document.addEventListener('click', event => {
  const target = event.target
  if (!target) {
    return;
  }
  if (target.classList.contains('js-delete-button')){
    const id = target.id
    times = times.filter(time => time.id !== id);
    window.localStorage.setItem('times', JSON.stringify(times))
    announce = 'time deleted'
    renderTimes()
  }
  if (target.classList.contains('js-delete-all-button')){
    if (canUseDialog) {
      $dialog.showModal();
      $dialog.querySelector('.js-dialog-description').focus();
    } else {
      deleteAllTimes();
    }
  }
})

document.addEventListener('DOMContentLoaded', () => {
  randomiseCube()
  if ($scrambleOutput.textContent.includes('{{', '}}')) {
    renderScramble()
  }
  renderTimes()

  Timer(timestamp => {
    times.push(
      {
        id: uuidv4(),
        scramble: currentScramble,
        timestamp: formatTimestamp(timestamp)
      }
    )
    window.localStorage.setItem('times', JSON.stringify(times))
    renderScramble()
    renderTimes()
    randomiseCube()
  })
})
