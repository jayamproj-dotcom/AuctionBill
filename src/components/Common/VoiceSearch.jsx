import React, { useEffect, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Mic, MicOff, XCircle } from "lucide-react";
import "./VoiceSearch.css";
import { toast } from "react-toastify";

const VoiceSearch = ({ onResult, language = "en-IN", placeholder = "Speak to search..." }) => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      return;
    }
  }, [browserSupportsSpeechRecognition]);

  useEffect(() => {
    if (transcript) {
      onResult(transcript);
    }
  }, [transcript, onResult]);

  useEffect(() => {
    if (listening) {
      setShowPulse(true);
    } else {
      setShowPulse(false);
    }
  }, [listening]);

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "microphone" }).then((permission) => {
        permission.onchange = () => {
          console.log("Microphone permission changed:", permission.state);
        };
      });
    }
  }, []);

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  const handleToggleListening = async () => {
    if (listening) {
      SpeechRecognition.stopListening();
      return;
    }

    try {
      // Check permission using the Permissions API if available
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: "microphone" });

        if (permission.state === "granted") {
          startVoiceSearch();
        } else if (permission.state === "prompt") {
          // Triggers browser popup
          await navigator.mediaDevices.getUserMedia({ audio: true });
          startVoiceSearch();
        } else if (permission.state === "denied") {
          toast.error("Microphone access is blocked. Please enable it in browser settings.");
          toast.info("Click the 🔒 icon in the address bar to allow microphone access.", { autoClose: 6000 });
        }
      } else {
        // Fallback for browsers that don't support Permissions API for microphone
        if (!isMicrophoneAvailable) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        startVoiceSearch();
      }
    } catch (err) {
      console.error("Microphone permission error:", err);
      toast.error("Microphone permission error. Please ensure you have a working microphone.");
    }
  };

  const startVoiceSearch = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: false, language });
  };

  return (
    <div className="voice-search-container">
      <button
        type="button"
        className={`voice-search-btn ${listening ? "listening" : ""} ${showPulse ? "pulse" : ""}`}
        onClick={handleToggleListening}
        title={listening ? "Stop Listening" : "Start Voice Search"}
      >
        {listening ? <Mic size={18} color="#ef4444" /> : <Mic size={18} />}
        {listening && <span className="listening-indicator"></span>}
      </button>
      
      {listening && (
        <div className="voice-search-status">
          <div className="status-dot"></div>
          <span>{transcript || "Listening..."}</span>
          <button type="button" className="close-voice" onClick={() => SpeechRecognition.stopListening()}>
             <XCircle size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceSearch;
