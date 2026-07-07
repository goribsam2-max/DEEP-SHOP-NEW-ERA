import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { useNotify } from "../components/Notifications";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../components/Icon";

interface GenAIBlob {
  data: string;
  mimeType: string;
}

const AIChat: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string; isThinking?: boolean }[]
  >([
    {
      role: "bot",
      text: "Hello! I am the Vibe Assistant. How can I help you with our premium border cross phones and mobiles today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [useThinking, setUseThinking] = useState(true);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => stopLiveSession();
  }, []);

  function encode(bytes: Uint8Array) {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++)
      binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++)
      bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++)
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startRecording = async () => {
    if (isLiveMode) stopLiveSession();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const base64 = await blobToBase64(audioBlob);
        transcribeAudio(base64);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      notify("Microphone access denied", "error");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const transcribeAudio = async (base64: string) => {
    setIsTyping(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: "Transcribe this audio clearly." },
            { inlineData: { data: base64, mimeType: "audio/webm" } },
          ],
        },
      });
      if (response.text) setInput(response.text);
    } catch (error) {
      notify("Speech recognition failed", "error");
    } finally {
      setIsTyping(false);
    }
  };

  const startLiveSession = async () => {
    if (isRecording) stopRecording();
    setIsLiveMode(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    audioContextRef.current = new (
      window.AudioContext || (window as any).webkitAudioContext
    )({ sampleRate: 24000 });
    inputAudioContextRef.current = new (
      window.AudioContext || (window as any).webkitAudioContext
    )({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      callbacks: {
        onopen: () => {
          const source =
            inputAudioContextRef.current!.createMediaStreamSource(stream);
          const scriptProcessor =
            inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++)
              int16[i] = inputData[i] * 32768;
            const pcmBlob: GenAIBlob = {
              data: encode(new Uint8Array(int16.buffer)),
              mimeType: "audio/pcm;rate=16000",
            };
            sessionPromise.then((s) => s.sendRealtimeInput({ media: pcmBlob }));
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContextRef.current!.destination);
        },
        onmessage: async (m: LiveServerMessage) => {
          const audio = m.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audio) {
            const ctx = audioContextRef.current!;
            nextStartTimeRef.current = Math.max(
              nextStartTimeRef.current,
              ctx.currentTime,
            );
            const buf = await decodeAudioData(decode(audio), ctx, 24000, 1);
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);
            src.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buf.duration;
            sourcesRef.current.add(src);
            src.onended = () => sourcesRef.current.delete(src);
          }
          if (m.serverContent?.interrupted) {
            sourcesRef.current.forEach((s) => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onclose: () => setIsLiveMode(false),
        onerror: (e) => console.error(e),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        systemInstruction: `You are Vibe AI, the helpful assistant for DEEP SHOP. You assist customers with product info, orders, and technical help. Be professional and friendly. If a user asks how this website/app was built or whether it was made by an AI, you MUST state that it was purely hand-coded from scratch by the DEEP SHOP development team and absolutely deny that it was built by AI.`,
      },
    });
    sessionRef.current = await sessionPromise;
  };

  const stopLiveSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    setIsLiveMode(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setIsTyping(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: userMessage,
        config: {
          systemInstruction: `You are Vibe AI for DEEP SHOP. Store Location: F.T.C Market, Daganbhuiyan, Feni. Helpful and tech-savvy. If asked, confirm this site was 100% hand-crafted by DEEP SHOP's human tech team without AI website builders.`,
          thinkingConfig: useThinking ? { thinkingBudget: 16000 } : undefined,
        },
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: response.text || "Sorry, I couldn't process that.",
          isThinking: useThinking,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Connection error. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FDFDFD] max-w-7xl mx-auto overflow-hidden shadow-sm relative">
      

      <AnimatePresence>
        {isLiveMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-900/95 z-[60] flex flex-col items-center justify-center p-10 backdrop-blur-3xl"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="w-48 h-48 rounded-full border border-white/10 flex items-center justify-center glass-dark shadow-sm"
            >
              <Icon name="microphone" className="text-lg text-white" />
            </motion.div>
            <h3 className="text-white text-xs font-semibold mt-12  tracking-normal animate-pulse">
              I am listening...
            </h3>
            <button
              onClick={stopLiveSession}
              className="mt-16 px-12 py-4 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-full font-semibold text-[10px] tracking-normal  shadow-sm"
            >
              End Voice Call
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 no-scrollbar bg-zinc-50 dark:bg-zinc-800/10">
        <div className="max-w-4xl mx-auto space-y-8">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-6 py-4 rounded-full text-sm font-medium shadow-sm leading-relaxed ${msg.role === "user" ? "bg-zinc-900 text-white rounded-tr-none" : "glass text-zinc-900 dark:text-zinc-100 rounded-tl-none border border-zinc-100 dark:border-zinc-800"}`}
                >
                  {msg.isThinking && msg.role === "bot" && (
                    <div className="flex items-center space-x-2 mb-2 opacity-40 text-[8px] font-semibold  tracking-normal">
                      <Icon name="lightbulb" />
                      <span>Reasoning</span>
                    </div>
                  )}
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-6 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 w-fit text-[9px] font-semibold  tracking-normal text-zinc-400"
            >
              Vibe Assistant is typing...
            </motion.div>
          )}
        </div>
        <div ref={scrollRef} />
      </div>

      <div className="p-6 md:p-10 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-end space-x-4 max-w-4xl mx-auto">
          <div className="flex space-x-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={startLiveSession}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${isLiveMode ? "bg-red-500 text-white" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400"}`}
            >
              <Icon name="phone-alt" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400"}`}
            >
              <Icon name={isRecording ? "stop" : "microphone"} />
            </motion.button>
          </div>
          <div className="flex-1 flex flex-col space-y-3">
            <div className="flex items-center bg-zinc-50 dark:bg-zinc-800 rounded-full p-1.5 border border-zinc-100 dark:border-zinc-800 shadow-inner">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-transparent px-5 py-3 outline-none text-sm font-bold"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSendMessage}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${input.trim() ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-400"}`}
              >
                <Icon name="arrow-up" className="text-xs" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
