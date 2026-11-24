const micBtn = document.getElementById("mic-btn");
const reactor = document.getElementById("reactor");
const statusText = document.getElementById("status-text");
const chatLog = document.getElementById("chat-log");
const textInput = document.getElementById("text-input");
const sendBtn = document.getElementById("send-btn");

// API Key Modal Elements
const apiModal = document.getElementById("api-modal");
const keyBtn = document.getElementById("key-btn");
const saveKeyBtn = document.getElementById("save-key-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const apiKeyInput = document.getElementById("api-key-input");

// 1. Live Clock & Battery Stats
setInterval(() => {
  const now = new Date();
  document.getElementById("clock").innerText = now.toLocaleTimeString();
}, 1000);

if ("getBattery" in navigator) {
  navigator.getBattery().then((battery) => {
    const updateBattery = () => {
      document.getElementById("battery").innerText = `PWR: ${Math.round(battery.level * 100)}%`;
    };
    updateBattery();
    battery.addEventListener("levelchange", updateBattery);
  });
}

// 2. Text-to-Speech (J.A.R.V.I.S. Voice)
function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  // Prefer a British or deep English voice if available
  const jarvisVoice = voices.find(v => v.lang.includes("en-GB")) || voices.find(v => v.lang.includes("en"));
  if (jarvisVoice) utterance.voice = jarvisVoice;
  utterance.pitch = 0.95;
  utterance.rate = 1.02;

  utterance.onstart = () => reactor.classList.add("active");
  utterance.onend = () => reactor.classList.remove("active");
  window.speechSynthesis.speak(utterance);
}

// 3. Log Messages to HUD
function addLog(sender, message, isUser = false) {
  const p = document.createElement("p");
  p.className = isUser ? "user-msg" : "ai-msg";
  p.innerText = `[${sender}]: ${message}`;
  chatLog.appendChild(p);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// 4. Command Processor (Local Actions + Gemini AI)
async function processCommand(command) {
  const cleanCmd = command.toLowerCase().trim();
  addLog("BOSS", command, true);

  // Built-in Quick Commands
  if (cleanCmd.includes("open youtube")) {
    const reply = "Opening YouTube protocols now, Boss.";
    addLog("J.A.R.V.I.S.", reply);
    speak(reply);
    window.open("https://youtube.com", "_blank");
    return;
  }
  if (cleanCmd.includes("open google")) {
    const reply = "Accessing Google mainframe.";
    addLog("J.A.R.V.I.S.", reply);
    speak(reply);
    window.open("https://google.com", "_blank");
    return;
  }
  if (cleanCmd.includes("open github")) {
    const reply = "Launching your GitHub repository interface.";
    addLog("J.A.R.V.I.S.", reply);
    speak(reply);
    window.open("https://github.com", "_blank");
    return;
  }

  // Ask Gemini AI if API Key is set
  const apiKey = localStorage.getItem("GEMINI_API_KEY");
  if (!apiKey) {
    const reply = "Sir, please configure your Gemini API key using the API button to enable full cognitive intelligence.";
    addLog("J.A.R.V.I.S.", reply);
    speak(reply);
    return;
  }

  statusText.innerText = "PROCESSING NEURAL QUERY...";
  try {
    const response = await fetch(
      `https://googleapis.com{apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are J.A.R.V.I.S., Tony Stark's futuristic AI assistant. Answer concisely in 1-2 short sentences, with a smart, slightly witty tone, calling the user 'Boss' or 'Sir'. No markdown symbols like asterisks. User says: ${command}`
            }]
          }]
        })
      }
    );
    const data = await response.json();
    const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I encountered a slight interference in the network, Sir.";
    addLog("J.A.R.V.I.S.", aiReply);
    speak(aiReply);
  } catch (err) {
    const errMsg = "Unable to reach external servers, Boss. Check your API key or connection.";
    addLog("J.A.R.V.I.S.", errMsg);
    speak(errMsg);
  } finally {
    statusText.innerText = "SYSTEM READY";
  }
}

// 5. Speech Recognition (Voice Input)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;

  micBtn.addEventListener("click", () => {
    recognition.start();
    statusText.innerText = "LISTENING TO VOICE INPUT...";
    reactor.classList.add("active");
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    processCommand(transcript);
  };

  recognition.onerror = () => {
    statusText.innerText = "VOICE INPUT INTERRUPTED. TRY AGAIN.";
    reactor.classList.remove("active");
  };

  recognition.onend = () => {
    reactor.classList.remove("active");
  };
} else {
  statusText.innerText = "VOICE API NOT SUPPORTED IN THIS BROWSER (USE CHROME/EDGE)";
}

// Text Input Handlers
sendBtn.addEventListener("click", () => {
  if (textInput.value.trim()) {
    processCommand(textInput.value);
    textInput.value = "";
  }
});

textInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && textInput.value.trim()) {
    processCommand(textInput.value);
    textInput.value = "";
  }
});

// API Key Modal Handlers
keyBtn.addEventListener("click", () => {
  apiKeyInput.value = localStorage.getItem("GEMINI_API_KEY") || "";
  apiModal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => apiModal.classList.add("hidden"));

saveKeyBtn.addEventListener("click", () => {
  localStorage.setItem("GEMINI_API_KEY", apiKeyInput.value.trim());
  apiModal.classList.add("hidden");
  addLog("SYSTEM", "Gemini API key encrypted and saved locally.");
  speak("Neural network upgraded, Boss.");
});
