const recordToggleButton = document.getElementById("record-toggle");
const transcriptArea = document.getElementById("transcript");
const copyButton = document.getElementById("copy-text");
const viewNotesButton = document.getElementById("view-notes");
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.interimResults = true;

let finalTranscript = '';
let mediaRecorder;
let audioChunks = [];

recognition.onresult = event => {
    let interimTranscript = '';
    for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            finalTranscript += transcript + '. ';
        } else {
            interimTranscript += transcript;
        }
    }
    transcriptArea.value = finalTranscript + interimTranscript;
};

recognition.onend = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        recognition.start();
    }
};

function saveRecording(text) {
    let notes = JSON.parse(localStorage.getItem('voiceNotes')) || [];
    notes.push({
        text,
        date: new Date().toLocaleString()
    });
    localStorage.setItem('voiceNotes', JSON.stringify(notes));
}

function drawVisualizer(audioContext, analyzer) {
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function renderFrame() {
        analyzer.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / (bufferLength * 2)) * 1;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] * 5;
            ctx.fillStyle = 'rgb(' + (barHeight + 200) + ',50,50)';
            ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
            x += barWidth + 1;
        }

        x = canvas.width;
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] * 5;
            ctx.fillStyle = 'rgb(' + (barHeight + 200) + ',50,50)';
            x -= (barWidth + 1);
            ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        }

        requestAnimationFrame(renderFrame);
    }

    renderFrame();
}

window.addEventListener('DOMContentLoaded', () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyzer = audioContext.createAnalyser();
            source.connect(analyzer);
            analyzer.fftSize = 256;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawVisualizer(audioContext, analyzer);
        }).catch(error => {
            console.error("Error accessing media devices: ", error);
        });
});

const languageSelect = document.getElementById("language-select");

languageSelect.addEventListener("change", () => {
    recognition.lang = languageSelect.value;
});

recordToggleButton.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        recognition.stop();

        recordToggleButton.innerHTML = '<i class="fa-solid fa-microphone"></i>';

        mediaRecorder.addEventListener("stop", () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            saveRecording(finalTranscript, audioBlob);
            finalTranscript = '';
            audioChunks = [];
        });
    } else {
        recognition.lang = languageSelect.value;

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();

                recordToggleButton.innerHTML = '<i class="fa-regular fa-microphone"></i>';

                mediaRecorder.addEventListener('dataavailable', event => {
                    audioChunks.push(event.data);
                });

                recognition.start();
            }).catch(error => {
                console.error("Error accessing media devices: ", error);
            });
    }
});

copyButton.addEventListener("click", () => {
    transcriptArea.select();
    document.execCommand("copy");
});

viewNotesButton.addEventListener("click", () => {
    window.location.href = "view-notes.html";
});

function scrollToBottom() {
    transcriptArea.scrollTop = transcriptArea.scrollHeight;
}

recognition.onresult = event => {
    let interimTranscript = '';
    for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            finalTranscript += transcript + '. ';
        } else {
            interimTranscript += transcript;
        }
    }
    transcriptArea.value = finalTranscript + interimTranscript;
    scrollToBottom();
};

if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
    alert("This browser does not support voice recognition.");
}

recognition.onend = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        recognition.start();
    }
};