const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

(async () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
  }
})();

let maximumRadius = 0;
if (canvas.height > canvas.width) {
  maximumRadius = canvas.width;
} else {
  maximumRadius = canvas.height;
}
screen.orientation.addEventListener("change", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (canvas.height > canvas.width) {
    maximumRadius = canvas.width;
  } else {
    maximumRadius = canvas.height;
  }
});

function renderPulse() {
  const gradient = canvasContext.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    maximumRadius
  );
  gradient.addColorStop(whiteStop * 0.8, "black");
  gradient.addColorStop(whiteStop, "white");
  gradient.addColorStop(whiteStop * 1.2, "black");
  canvasContext.fillStyle = gradient;
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);
  if (expanding) {
    if (whiteStop > 0.5) {
      expanding = false;
    } else {
      whiteStop += growthRate;
    }
  } else {
    if (whiteStop < growthRate) {
      expanding = true;
    } else {
      whiteStop -= growthRate;
    }
  }
  animationRequest = requestAnimationFrame(renderPulse);
}

function renderSnow() {
  const snowImageData = canvasContext.createImageData(
    canvas.width,
    canvas.height
  );
  for (let i = 0; i < snowImageData.data.length; i += 4) {
    const snow = Math.floor(Math.random() * 256);
    snowImageData.data[i] = snow;
    snowImageData.data[i + 1] = snow;
    snowImageData.data[i + 2] = snow;
    snowImageData.data[i + 3] = 64;
  }
  canvasContext.putImageData(snowImageData, 0, 0);
  animationRequest = requestAnimationFrame(renderSnow);
}

const canvasContext = canvas.getContext("2d");

const growthRate = 0.001;
let animationRequest;
let whiteStop = 0;
let expanding = true;

const frequencyButton = document.getElementById("frequencyControl");
const frequencyDisplay = document.getElementById("frequencyDisplay");
const frequencyOptions = document.getElementById("frequencyOptions");
const optionsButtons = frequencyOptions.querySelectorAll("button");
let filterFrequency = 20000;
const savedFilterFrequency = localStorage.getItem("filterFrequency");
if (savedFilterFrequency) {
  filterFrequency = parseInt(savedFilterFrequency);
  optionsButtons.forEach((button) => {
    if (filterFrequency === parseInt(button.getAttribute("frequency"))) {
      frequencyDisplay.textContent = button.textContent;
    }
  });
}
let audioContext;
let audioSource;
let biquadFilter;
let lastFilterFrequency = filterFrequency;
let audioSourceStarted = false;

optionsButtons.forEach((button) => {
  button.addEventListener("click", () => {
    frequencyDisplay.textContent = button.textContent;
    frequencyOptions.style.display = "none";
    filterFrequency = parseInt(button.getAttribute("frequency"));
    localStorage.setItem("filterFrequency", filterFrequency);
    if (filterFrequency !== lastFilterFrequency) {
      lastFilterFrequency = filterFrequency;
      if (typeof audioContext == "undefined") {
        // there is no context yet
        audioContext = new AudioContext();
        biquadFilter = audioContext.createBiquadFilter();
        biquadFilter.type = "lowpass";
        biquadFilter.frequency.value = filterFrequency;
        const audioBuffer = audioContext.createBuffer(
          2,
          audioContext.sampleRate * 10, // 10 seconds
          audioContext.sampleRate
        );
        audioSource = audioContext.createBufferSource();
        for (
          let channel = 0;
          channel < audioBuffer.numberOfChannels;
          channel++
        ) {
          const channelBuffer = audioBuffer.getChannelData(channel);
          for (let i = 0; i < audioBuffer.length; i++) {
            channelBuffer[i] = Math.random() * 2 - 1;
          }
        }
        audioSource.buffer = audioBuffer;
        audioSource.loop = true;
        audioSource.connect(biquadFilter);
        biquadFilter.connect(audioContext.destination);
      } else {
        // the context already exists
        biquadFilter.frequency.value = filterFrequency;
      }
    }
  });
});

frequencyButton.addEventListener("click", () => {
  if (getComputedStyle(frequencyOptions).display === "none") {
    frequencyOptions.style.display = "flex";
  } else {
    frequencyOptions.style.display = "none";
  }
});

canvas.addEventListener("click", () => {
  if (typeof audioContext === "undefined") {
    // there is no context yet
    audioContext = new AudioContext();
    biquadFilter = audioContext.createBiquadFilter();
    biquadFilter.type = "lowpass";
    biquadFilter.frequency.value = filterFrequency;
    const audioBuffer = audioContext.createBuffer(
      2,
      audioContext.sampleRate * 10, // 10 seconds
      audioContext.sampleRate
    );
    audioSource = audioContext.createBufferSource();
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelBuffer = audioBuffer.getChannelData(channel);
      for (let i = 0; i < audioBuffer.length; i++) {
        channelBuffer[i] = Math.random() * 2 - 1;
      }
    }
    audioSource.buffer = audioBuffer;
    audioSource.loop = true;
    audioSource.connect(biquadFilter);
    biquadFilter.connect(audioContext.destination);
    audioSource.start();
    audioSourceStarted = true;
    animationRequest = requestAnimationFrame(renderSnow);
  } else {
    // the context already exists
    if (!audioSourceStarted) {
      // the audio source needs to be started
      audioSource.start();
      audioSourceStarted = true;
      animationRequest = requestAnimationFrame(renderSnow);
    } else {
      // the audio source is running or suspended
      if (audioContext.state === "running") {
        audioContext.suspend();
        cancelAnimationFrame(animationRequest);
      } else {
        audioContext.resume();
        animationRequest = requestAnimationFrame(renderSnow);
      }
    }
  }
});

animationRequest = requestAnimationFrame(renderPulse);
