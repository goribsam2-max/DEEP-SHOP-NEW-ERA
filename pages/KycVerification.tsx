import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { uploadToImgbb } from "../services/imgbb";
import { useNotify } from "../components/Notifications";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { 
  Shield, Camera, Check, User, Calendar, CreditCard, Eye, EyeOff, 
  ArrowLeft, ArrowRight, Sparkles, AlertCircle, RefreshCw, Loader2, Video, ChevronLeft
} from "lucide-react";



type KycStep = "info" | "nid-front" | "nid-back" | "face-liveness" | "processing" | "success";

export default function KycVerification() {
  const navigate = useNavigate();
  const notify = useNotify();
  const [currentStep, setCurrentStep] = useState<KycStep>("info");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Step 1 Form Data
  const [nidName, setNidName] = useState("");
  const [dob, setDob] = useState("");

  // Images as Blobs or Files
  const [nidFrontFile, setNidFrontFile] = useState<File | null>(null);
  const [nidFrontPreview, setNidFrontPreview] = useState<string>("");
  const [nidBackFile, setNidBackFile] = useState<File | null>(null);
  const [nidBackPreview, setNidBackPreview] = useState<string>("");
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string>("");

  // Camera settings
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraMode, setCameraMode] = useState<"user" | "environment">("environment");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Face Liveness Stages
  const [livenessStage, setLivenessStage] = useState<"ready" | "look-straight" | "blink" | "look-right" | "look-left" | "completed">("ready");
  const [livenessProgress, setLivenessProgress] = useState(0);

  // Initialize or Clean up camera stream
  const startCamera = async (mode: "user" | "environment") => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setCameraMode(mode);
    } catch (err) {
      console.error("Camera access failed:", err);
      notify("Could not access camera. Please upload file instead or allow camera permissions.", "error");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    // Stop camera when step changes or wizard closes
    return () => {
      stopCamera();
    };
  }, [currentStep]);

  // Capture Image from Video
  const capturePhoto = (target: "front" | "back" | "face") => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `${target}_capture.jpg`, { type: "image/jpeg" });
          const previewUrl = URL.createObjectURL(blob);
          if (target === "front") {
            setNidFrontFile(file);
            setNidFrontPreview(previewUrl);
          } else if (target === "back") {
            setNidBackFile(file);
            setNidBackPreview(previewUrl);
          } else if (target === "face") {
            setFaceFile(file);
            setFacePreview(previewUrl);
          }
          stopCamera();
        }
      }, "image/jpeg", 0.9);
    }
  };

  // Face Liveness Simulator Sequence
  useEffect(() => {
    if (currentStep !== "face-liveness" || livenessStage === "ready" || livenessStage === "completed") return;

    let interval: NodeJS.Timeout;
    if (livenessStage === "look-straight") {
      setLivenessProgress(0);
      interval = setInterval(() => {
        setLivenessProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setLivenessStage("blink");
            return 100;
          }
          return p + 10;
        });
      }, 200);
    } else if (livenessStage === "blink") {
      setLivenessProgress(0);
      interval = setInterval(() => {
        setLivenessProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setLivenessStage("look-right");
            return 100;
          }
          return p + 15;
        });
      }, 250);
    } else if (livenessStage === "look-right") {
      setLivenessProgress(0);
      interval = setInterval(() => {
        setLivenessProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setLivenessStage("look-left");
            return 100;
          }
          return p + 12;
        });
      }, 220);
    } else if (livenessStage === "look-left") {
      setLivenessProgress(0);
      interval = setInterval(() => {
        setLivenessProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            // Auto Capture and Finish
            capturePhoto("face");
            setLivenessStage("completed");
            return 100;
          }
          return p + 10;
        });
      }, 200);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep, livenessStage]);

  // Handle final submission to Firebase & Imgbb
  const handleSubmitKyc = async () => {
    const user = auth.currentUser;
    if (!user) {
      notify("Please log in to submit verification", "error");
      return;
    }

    if (!nidFrontFile || !nidBackFile || !faceFile) {
      notify("Please upload all 3 files for verification", "error");
      return;
    }

    setCurrentStep("processing");
    setLoading(true);

    try {
      setUploadProgress("Uploading Front NID Card...");
      const frontUrl = await uploadToImgbb(nidFrontFile);

      setUploadProgress("Uploading Back NID Card...");
      const backUrl = await uploadToImgbb(nidBackFile);

      setUploadProgress("Uploading Facial Biometric File...");
      const faceUrl = await uploadToImgbb(faceFile);

      setUploadProgress("Scanning & Securing Identity Record...");
      
      const docRef = doc(db, "kyc_requests", user.uid);
      await setDoc(docRef, {
        uid: user.uid,
        email: user.email || "",
        nidName,
        dob,
        nidFrontUrl: frontUrl,
        nidBackUrl: backUrl,
        faceUrl: faceUrl,
        status: "pending",
        createdAt: Date.now()
      });

      // Update User Record Status
      await updateDoc(doc(db, "users", user.uid), {
        kycStatus: "pending",
        nidOwnerName: nidName,
      });

      setCurrentStep("success");
      notify("KYC Documents submitted successfully", "success");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error(err);
      notify("Verification Upload Failed. Please try again.", "error");
      setCurrentStep("info");
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-inter pb-20">
      <div className="max-w-2xl mx-auto md:py-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 md:px-0 mb-4">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">KYC Verification</h1>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-none md:rounded-2xl border-y md:border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col">

        {/* Header bar */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white leading-tight">DEEP Verification</h3>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">KYC Compliance Portal</p>
            </div>
          </div>
          
        </div>

        {/* Step Indicator */}
        {currentStep !== "processing" && currentStep !== "success" && (
          <div className="px-6 pt-4 flex gap-1 items-center">
            {(["info", "nid-front", "nid-back", "face-liveness"] as const).map((step, idx) => {
              const stepLabels = ["Info", "NID Front", "NID Back", "Biometric"];
              const stepIndex = ["info", "nid-front", "nid-back", "face-liveness"].indexOf(currentStep);
              const isActive = currentStep === step;
              const isCompleted = stepIndex > idx;

              return (
                <div key={step} className="flex-1 flex flex-col gap-1">
                  <div className={`h-1 rounded-full transition-all duration-300 ${isCompleted ? "bg-emerald-500" : isActive ? "bg-[#EF8020] animate-pulse" : "bg-zinc-100 dark:bg-zinc-800"}`} />
                  <span className={`text-[9px] font-bold text-center ${isActive ? "text-zinc-800 dark:text-zinc-100" : "text-zinc-400"}`}>
                    {stepLabels[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Personal Info */}
            {currentStep === "info" && (
              <motion.div 
                key="info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">Identity Details</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Please provide your complete name as listed on your National Identity Card (NID) and select your correct date of birth.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Full Name (As written on NID)</label>
                    <div className="relative">
                      <Input 
                        placeholder="MD. ABDUR RAHMAN"
                        className="ps-10 h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl"
                        value={nidName}
                        onChange={(e) => setNidName(e.target.value.toUpperCase())}
                      />
                      <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Date of Birth</label>
                    <div className="relative">
                      <Input 
                        type="date"
                        className="ps-10 h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                      />
                      <Calendar className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-400" />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    disabled={!nidName || !dob}
                    onClick={() => setCurrentStep("nid-front")}
                    className="w-full bg-[#EF8020] hover:bg-[#EF8020]/90 text-white font-bold py-6 rounded-xl flex items-center justify-center gap-2"
                  >
                    Proceed to Front NID <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: NID Front Side */}
            {currentStep === "nid-front" && (
              <motion.div 
                key="nid-front"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">Front of NID Card</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Capture or upload a clear, well-lit photograph showing the front of your National Identity Card.
                  </p>
                </div>

                {cameraActive && cameraMode === "environment" ? (
                  <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    {/* Scanner Guide Overlay */}
                    <div className="absolute inset-0 border-[3px] border-emerald-500/50 m-6 rounded-xl pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] bg-emerald-500 text-white font-bold px-3 py-1 rounded-full uppercase tracking-wider">Position Front of NID Inside Here</span>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      <Button onClick={() => capturePhoto("front")} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-4 font-bold shadow-lg flex items-center gap-2">
                        <Camera className="w-5 h-5" /> Capture Snapshot
                      </Button>
                      <Button onClick={stopCamera} variant="outline" className="bg-black/40 hover:bg-black/60 border-zinc-700 text-white rounded-xl">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nidFrontPreview ? (
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                        <img src={nidFrontPreview} alt="NID Front Preview" className="w-full h-full object-contain" />
                        <button 
                          onClick={() => { setNidFrontPreview(""); setNidFrontFile(null); }}
                          className="absolute top-3 right-3 bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow"
                        >
                          Reset
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button 
                          onClick={() => startCamera("environment")}
                          className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl transition"
                        >
                          <Camera className="w-8 h-8 text-zinc-400 mb-2" />
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Open Device Camera</span>
                          <span className="text-[10px] text-zinc-400 mt-1">Take instant picture</span>
                        </button>

                        <label className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl transition cursor-pointer">
                          <CreditCard className="w-8 h-8 text-zinc-400 mb-2" />
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Upload NID Photo</span>
                          <span className="text-[10px] text-zinc-400 mt-1">Select from browser library</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNidFrontFile(file);
                                setNidFrontPreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-4 justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep("info")} className="rounded-xl border-zinc-200 dark:border-zinc-800">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button 
                    disabled={!nidFrontFile}
                    onClick={() => setCurrentStep("nid-back")}
                    className="bg-[#EF8020] hover:bg-[#EF8020]/90 text-white font-bold px-6 rounded-xl flex items-center gap-2"
                  >
                    Proceed to Back NID <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: NID Back Side */}
            {currentStep === "nid-back" && (
              <motion.div 
                key="nid-back"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">Back of NID Card</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Now capture or upload a clear photo showing the back of your National Identity Card containing addresses.
                  </p>
                </div>

                {cameraActive && cameraMode === "environment" ? (
                  <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    <div className="absolute inset-0 border-[3px] border-emerald-500/50 m-6 rounded-xl pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] bg-emerald-500 text-white font-bold px-3 py-1 rounded-full uppercase tracking-wider">Position Back of NID Inside Here</span>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      <Button onClick={() => capturePhoto("back")} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-4 font-bold shadow-lg flex items-center gap-2">
                        <Camera className="w-5 h-5" /> Capture Snapshot
                      </Button>
                      <Button onClick={stopCamera} variant="outline" className="bg-black/40 hover:bg-black/60 border-zinc-700 text-white rounded-xl">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {nidBackPreview ? (
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                        <img src={nidBackPreview} alt="NID Back Preview" className="w-full h-full object-contain" />
                        <button 
                          onClick={() => { setNidBackPreview(""); setNidBackFile(null); }}
                          className="absolute top-3 right-3 bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow"
                        >
                          Reset
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button 
                          onClick={() => startCamera("environment")}
                          className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl transition"
                        >
                          <Camera className="w-8 h-8 text-zinc-400 mb-2" />
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Open Device Camera</span>
                          <span className="text-[10px] text-zinc-400 mt-1">Take instant picture</span>
                        </button>

                        <label className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl transition cursor-pointer">
                          <CreditCard className="w-8 h-8 text-zinc-400 mb-2" />
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Upload Back Photo</span>
                          <span className="text-[10px] text-zinc-400 mt-1">Select from browser library</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setNidBackFile(file);
                                setNidBackPreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-4 justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep("nid-front")} className="rounded-xl border-zinc-200 dark:border-zinc-800">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button 
                    disabled={!nidBackFile}
                    onClick={() => {
                      setCurrentStep("face-liveness");
                      setLivenessStage("ready");
                    }}
                    className="bg-[#EF8020] hover:bg-[#EF8020]/90 text-white font-bold px-6 rounded-xl flex items-center gap-2"
                  >
                    Proceed to Liveness <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Face Biometric Liveness */}
            {currentStep === "face-liveness" && (
              <motion.div 
                key="face-liveness"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-center"
              >
                <div className="space-y-1.5">
                  <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">Facial Liveness Check</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
                    Biometric face verification checks presence. Follow instructions: look straight, blink, look right, look left.
                  </p>
                </div>

                <div className="flex justify-center my-3 relative">
                  {cameraActive && cameraMode === "user" ? (
                    <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-emerald-500 shadow-2xl bg-black">
                      <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
                      
                      {/* Biometric Circle Guides */}
                      <div className="absolute inset-0 rounded-full border-4 border-dashed border-white/40 animate-[spin_12s_linear_infinite] pointer-events-none" />
                      
                      {/* Interactive Instruction Overlay */}
                      <div className="absolute inset-x-0 bottom-3 flex flex-col items-center">
                        <div className="bg-black/85 text-white px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase flex items-center gap-1.5 shadow-md">
                          {livenessStage === "look-straight" && (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                              Look Straight
                            </>
                          )}
                          {livenessStage === "blink" && (
                            <>
                              <Eye className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
                              Blink Your Eyes
                            </>
                          )}
                          {livenessStage === "look-right" && (
                            <>
                              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                              Turn Right
                            </>
                          )}
                          {livenessStage === "look-left" && (
                            <>
                              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                              Turn Left
                            </>
                          )}
                          {livenessStage === "completed" && (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              Liveness Saved!
                            </>
                          )}
                        </div>
                      </div>

                      {/* Progress Circle Indicator */}
                      {livenessStage !== "ready" && livenessStage !== "completed" && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90">
                            <circle 
                              cx="112" 
                              cy="112" 
                              r="104" 
                              className="stroke-zinc-100/10 fill-none stroke-[4]"
                            />
                            <circle 
                              cx="112" 
                              cy="112" 
                              r="104" 
                              className="stroke-emerald-500 fill-none stroke-[4] transition-all duration-200"
                              strokeDasharray="653"
                              strokeDashoffset={653 - (653 * livenessProgress) / 100}
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 w-full">
                      {facePreview ? (
                        <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-emerald-500 mx-auto bg-zinc-50 dark:bg-zinc-950 shadow-lg">
                          <img src={facePreview} alt="Face Preview" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => { setFacePreview(""); setFaceFile(null); }}
                            className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] uppercase font-bold px-2.5 py-1 rounded-full shadow"
                          >
                            Reset
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <button 
                            onClick={() => startCamera("user")}
                            className="w-full max-w-sm flex items-center justify-center gap-2 p-6 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl transition"
                          >
                            <Video className="w-5 h-5 text-[#EF8020]" />
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Start Liveness Scanner Video</span>
                          </button>
                          
                          <label className="w-full max-w-sm flex items-center justify-center gap-2 p-6 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl transition cursor-pointer">
                            <Camera className="w-5 h-5 text-zinc-400" />
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Or Upload Portrait Snapshot</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setFaceFile(file);
                                  setFacePreview(URL.createObjectURL(file));
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {cameraActive && livenessStage === "ready" && (
                  <Button 
                    onClick={() => setLivenessStage("look-straight")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-full inline-flex items-center gap-2"
                  >
                    Start Liveness Tasks <Sparkles className="w-4 h-4 text-yellow-300" />
                  </Button>
                )}

                <div className="flex gap-2 pt-4 justify-between">
                  <Button variant="outline" onClick={() => { stopCamera(); setCurrentStep("nid-back"); }} className="rounded-xl border-zinc-200 dark:border-zinc-800">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button 
                    disabled={!faceFile}
                    onClick={handleSubmitKyc}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/15"
                  >
                    Submit Verification <Shield className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Processing / Uploading */}
            {currentStep === "processing" && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-6"
              >
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-[#EF8020]/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-[#EF8020] border-t-transparent animate-spin" />
                  <Shield className="absolute inset-0 m-auto w-8 h-8 text-[#EF8020] animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">Uploading Secure Documents</h4>
                  <p className="text-xs text-zinc-500 font-mono tracking-tight bg-zinc-50 dark:bg-zinc-850 py-2.5 px-4 rounded-xl max-w-sm mx-auto">
                    {uploadProgress}
                  </p>
                </div>
                <p className="text-[10px] text-zinc-400 max-w-xs mx-auto">
                  Files are uploaded through end-to-end encrypted tunnels. ImgBB secure cloud API saves the image endpoints.
                </p>
              </motion.div>
            )}

            {/* Step 6: Success State */}
            {currentStep === "success" && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-10 h-10 stroke-[3]" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">KYC Verification Submitted!</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                    Thank you! Your documents and biometric liveness scan have been safely dispatched to our compliance officers. Verification requests are processed within <span className="font-bold text-zinc-900 dark:text-white">24 hours</span>.
                  </p>
                </div>
                
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-start gap-3 text-left max-w-sm mx-auto">
                  <AlertCircle className="w-5 h-5 text-[#EF8020] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 block">Review Period Security</span>
                    <span className="text-[10px] text-zinc-500 leading-relaxed block mt-0.5">
                      Your products and stories can still be listed in our catalog, but will display unverified tags until the check completes successfully.
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={() => navigate(-1)} className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold px-8 py-5 rounded-xl">Return to Profile</Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
    </div>
  );
};
