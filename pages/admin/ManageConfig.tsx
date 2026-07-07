import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useNotify } from "../../components/Notifications";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../../components/Icon";

const ManageConfig: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "firebase",
  );

  const [configs, setConfigs] = useState({
    firebaseApiKey: "AIzaSyBYDcBuYZEH38mwWoCqTmyImGIYqlXteZ4",
    telegramToken: "8571639361:AAEuplHuF4mh6rkaCCWoC-D_c57Iho7rM8YY",
    telegramChatId: "5494141897",
    oneSignalAppId: "29c39d8a-7be8-404a-8a33-5616086735fa",
    oneSignalApiKey: "",
    googleClientId: "",
    facebookAppId: "",
    appleServiceId: "",
    googleLogin: true,
    facebookLogin: false,
    appleLogin: false,
    deliveryCharge: 150,
    storeOpen: true,
    mysteryBoxActive: true,
    storeNotice: "",
    dealEndTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    bkashNumber: "01778953114",
    bkashIcon: "https://i.ibb.co.com/8m5LntYV/b-Kash-app-logo.png",
    nagadNumber: "01778953114",
    nagadIcon: "https://i.ibb.co.com/RkG7cbs0/Nagad-Logo-wine.png",
    bankName: "Example Bank Ltd.",
    bankAccountName: "Vibe Gadget",
    bankAccountNumber: "000000000000",
    bankRoutingNumber: "BR0000",
    bankAccountType: "Current",
    bankAddress: "Dhaka, Bangladesh",
    affiliateMinWithdrawal: 50,
    affiliateTier1Threshold: 3,
    affiliateTier1Commission: 50,
    affiliateTier2Threshold: 10,
    affiliateTier2Commission: 100,
    affiliateTier3Threshold: 20,
    affiliateTier3Commission: 150,
    affiliateTier4Threshold: 30,
    affiliateTier4Commission: 200,
    pwaPopupStyle: "style1",
    pwaPopupIcon: "",
    customerHotline: "+8801778953114",
    whatsappNumber: "+8801778953114",
    facebookPageUrl: "https://facebook.com/deepshop.top",
    facebookPageName: "DEEP SHOP Facebook Page",
  });

  const [voiceBotOptions, setVoiceBotOptions] = useState<any[]>([
    {
      id: "opt1",
      text: "Welcome message sunte chai",
      responseAudioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      responseDuration: 15
    },
    {
      id: "opt2",
      text: "Apnader service gulo ki ki?",
      responseAudioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      responseDuration: 10
    }
  ]);

  useEffect(() => {
    getDoc(doc(db, "settings", "platform")).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.telegramToken === "8236254617:AAFFTI9j4pl6U-8-pdJgZigWb2M75oBmyzg") {
          data.telegramToken = "8571639361:AAEuplHuF4mh6rkaCCWoC-D_c57Iho7rM8YY";
        }
        setConfigs((prev) => ({ ...prev, ...data }));
      }
    });
    getDoc(doc(db, "settings", "voiceBot")).then((snap) => {
      if (snap.exists() && snap.data().options) {
        setVoiceBotOptions(snap.data().options);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "platform"), configs);
      await setDoc(doc(db, "settings", "voiceBot"), { options: voiceBotOptions });
      notify("Settings saved successfully", "success");
    } catch (e) {
      notify("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-800">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800 animate-fade-in relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="flex items-center justify-between mb-12 relative z-10 animate-stagger-1">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-xl md:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-1.5 text-shine">
              App Settings
            </h1>
            <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-normal">
              Manage Connections and Keys
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-12 max-w-4xl mx-auto relative z-10">
        <AccordionSection
          id="firebase"
          title="Firebase Settings"
          icon="fire"
          expanded={expandedSection === "firebase"}
          onToggle={() =>
            setExpandedSection(
              expandedSection === "firebase" ? null : "firebase",
            )
          }
        >
          <Field
            label="API Key"
            value={configs.firebaseApiKey}
            onChange={(v: string) =>
              setConfigs({ ...configs, firebaseApiKey: v })
            }
          />
        </AccordionSection>

        <AccordionSection
          id="onesignal"
          title="Notification Settings"
          icon="bell"
          expanded={expandedSection === "onesignal"}
          onToggle={() =>
            setExpandedSection(
              expandedSection === "onesignal" ? null : "onesignal",
            )
          }
        >
          <Field
            label="OneSignal App ID"
            value={configs.oneSignalAppId}
            onChange={(v: string) =>
              setConfigs({ ...configs, oneSignalAppId: v })
            }
          />
          <Field
            label="REST API Key"
            value={configs.oneSignalApiKey}
            onChange={(v: string) =>
              setConfigs({ ...configs, oneSignalApiKey: v })
            }
            placeholder="XXXX"
          />
        </AccordionSection>

        <AccordionSection
          id="telegram"
          title="Telegram Alerts"
          icon="telegram-plane"
          expanded={expandedSection === "telegram"}
          onToggle={() =>
            setExpandedSection(
              expandedSection === "telegram" ? null : "telegram",
            )
          }
        >
          <Field
            label="Bot Token"
            value={configs.telegramToken}
            onChange={(v: string) =>
              setConfigs({ ...configs, telegramToken: v })
            }
          />
          <Field
            label="Chat IDs (comma separated for multiple staff)"
            value={configs.telegramChatId}
            onChange={(v: string) =>
              setConfigs({ ...configs, telegramChatId: v })
            }
          />
        </AccordionSection>

        <AccordionSection
          id="store"
          title="Global Store Config"
          icon="store"
          expanded={expandedSection === "store"}
          onToggle={() =>
            setExpandedSection(expandedSection === "store" ? null : "store")
          }
        >
          <div className="space-y-6">
            <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <Toggle
                label="Store Open (Accepting Orders)"
                active={configs.storeOpen}
                onToggle={() =>
                  setConfigs({ ...configs, storeOpen: !configs.storeOpen })
                }
              />
              {!configs.storeOpen && (
                <p className="text-[10px]  font-bold text-red-500 mt-4 tracking-normal px-1">
                  Orders are currently paused
                </p>
              )}
            </div>

            <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <Toggle
                label="Enable Mystery Box Feature"
                active={configs.mysteryBoxActive ?? true}
                onToggle={() =>
                  setConfigs({
                    ...configs,
                    mysteryBoxActive: !(configs.mysteryBoxActive ?? true),
                  })
                }
              />
              <p className="text-[10px]  font-bold text-zinc-500 mt-4 tracking-normal px-1">
                Controls Mystery Box visibility
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400  mb-2 block tracking-normal">
                Base Delivery Charge (৳)
              </label>
              <input
                type="number"
                value={configs.deliveryCharge || 0}
                onChange={(e) =>
                  setConfigs({
                    ...configs,
                    deliveryCharge: Number(e.target.value),
                  })
                }
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm font-medium outline-none border border-transparent focus:border-zinc-900 transition-all font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400  mb-2 block tracking-normal">
                Global Store Notice (Optional)
              </label>
              <textarea
                value={configs.storeNotice || ""}
                onChange={(e) =>
                  setConfigs({ ...configs, storeNotice: e.target.value })
                }
                placeholder="E.g., Expect 2 days delay due to weather."
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm font-medium outline-none border border-transparent focus:border-zinc-900 transition-all min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400  mb-2 block tracking-normal">
                Flash Deal End Time
              </label>
              <input
                type="datetime-local"
                value={configs.dealEndTime || ""}
                onChange={(e) =>
                  setConfigs({ ...configs, dealEndTime: e.target.value })
                }
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm font-medium outline-none border border-transparent focus:border-zinc-900 transition-all font-mono"
              />
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          id="payment"
          title="Payment Settings"
          icon="credit-card"
          expanded={expandedSection === "payment"}
          onToggle={() =>
            setExpandedSection(expandedSection === "payment" ? null : "payment")
          }
        >
          <div className="space-y-6">
            <Field
              label="bKash Number"
              value={configs.bkashNumber}
              onChange={(v: string) =>
                setConfigs({ ...configs, bkashNumber: v })
              }
              placeholder="017..."
            />
            <Field
              label="bKash Icon URL"
              value={configs.bkashIcon}
              onChange={(v: string) => setConfigs({ ...configs, bkashIcon: v })}
              placeholder="https://..."
            />
            <Field
              label="Nagad Number"
              value={configs.nagadNumber}
              onChange={(v: string) =>
                setConfigs({ ...configs, nagadNumber: v })
              }
              placeholder="017..."
            />
            <Field
              label="Nagad Icon URL"
              value={configs.nagadIcon}
              onChange={(v: string) => setConfigs({ ...configs, nagadIcon: v })}
              placeholder="https://..."
            />

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-700">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">Bank Details (For Foreign Orders)</h3>
              <div className="space-y-4">
                <Field
                  label="Bank Name"
                  value={configs.bankName}
                  onChange={(v: string) => setConfigs({ ...configs, bankName: v })}
                />
                <Field
                  label="Account Name"
                  value={configs.bankAccountName}
                  onChange={(v: string) => setConfigs({ ...configs, bankAccountName: v })}
                />
                <Field
                  label="Account Number"
                  value={configs.bankAccountNumber}
                  onChange={(v: string) => setConfigs({ ...configs, bankAccountNumber: v })}
                />
                <Field
                  label="Routing Number"
                  value={configs.bankRoutingNumber}
                  onChange={(v: string) => setConfigs({ ...configs, bankRoutingNumber: v })}
                />
                <Field
                  label="Account Type (Current / Savings)"
                  value={configs.bankAccountType}
                  onChange={(v: string) => setConfigs({ ...configs, bankAccountType: v })}
                />
                <Field
                  label="Bank Address"
                  value={configs.bankAddress}
                  onChange={(v: string) => setConfigs({ ...configs, bankAddress: v })}
                />
              </div>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          id="affiliate"
          title="Affiliate Settings"
          icon="money-bill-wave"
          expanded={expandedSection === "affiliate"}
          onToggle={() =>
            setExpandedSection(
              expandedSection === "affiliate" ? null : "affiliate",
            )
          }
        >
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-400  mb-2 block tracking-normal">
                Minimum Withdrawal (৳)
              </label>
              <input
                type="number"
                value={configs.affiliateMinWithdrawal ?? 50}
                onChange={(e) =>
                  setConfigs({
                    ...configs,
                    affiliateMinWithdrawal: Number(e.target.value),
                  })
                }
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm font-medium outline-none border border-transparent focus:border-zinc-900 transition-all font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400  mb-2 block tracking-normal">
                  T1 Target
                </label>
                <input
                  type="number"
                  value={configs.affiliateTier1Threshold ?? 3}
                  onChange={(e) =>
                    setConfigs({
                      ...configs,
                      affiliateTier1Threshold: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400  mb-2 block tracking-normal">
                  T1 Commission (৳)
                </label>
                <input
                  type="number"
                  value={configs.affiliateTier1Commission ?? 50}
                  onChange={(e) =>
                    setConfigs({
                      ...configs,
                      affiliateTier1Commission: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400  mb-2 block tracking-normal">
                  T2 Target
                </label>
                <input
                  type="number"
                  value={configs.affiliateTier2Threshold ?? 10}
                  onChange={(e) =>
                    setConfigs({
                      ...configs,
                      affiliateTier2Threshold: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400  mb-2 block tracking-normal">
                  T2 Commission (৳)
                </label>
                <input
                  type="number"
                  value={configs.affiliateTier2Commission ?? 100}
                  onChange={(e) =>
                    setConfigs({
                      ...configs,
                      affiliateTier2Commission: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400  mb-2 block tracking-normal">
                  T3 Target
                </label>
                <input
                  type="number"
                  value={configs.affiliateTier3Threshold ?? 20}
                  onChange={(e) =>
                    setConfigs({
                      ...configs,
                      affiliateTier3Threshold: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400  mb-2 block tracking-normal">
                  T3 Commission (৳)
                </label>
                <input
                  type="number"
                  value={configs.affiliateTier3Commission ?? 150}
                  onChange={(e) =>
                    setConfigs({
                      ...configs,
                      affiliateTier3Commission: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400  mb-2 block tracking-normal">
                  T4 Target
                </label>
                <input
                  type="number"
                  value={configs.affiliateTier4Threshold ?? 30}
                  onChange={(e) =>
                    setConfigs({
                      ...configs,
                      affiliateTier4Threshold: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400  mb-2 block tracking-normal">
                  T4 Commission (৳)
                </label>
                <input
                  type="number"
                  value={configs.affiliateTier4Commission ?? 200}
                  onChange={(e) =>
                    setConfigs({
                      ...configs,
                      affiliateTier4Commission: Number(e.target.value),
                    })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          id="voiceBot"
          title="Voice Bot Settings"
          icon="microphone"
          expanded={expandedSection === "voiceBot"}
          onToggle={() =>
            setExpandedSection(expandedSection === "voiceBot" ? null : "voiceBot")
          }
        >
          <div className="space-y-6">
            {voiceBotOptions.map((opt, idx) => (
              <div key={opt.id} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Option {idx + 1}</h4>
                  <button onClick={() => setVoiceBotOptions(voiceBotOptions.filter((_, i) => i !== idx))} className="text-red-500 text-xs font-bold hover:underline">Remove</button>
                </div>
                <Field
                  label="Button Text (User asks)"
                  value={opt.text}
                  onChange={(v: string) => {
                    const newOpts = [...voiceBotOptions];
                    newOpts[idx].text = v;
                    setVoiceBotOptions(newOpts);
                  }}
                />
                <Field
                  label="Response Audio File URL (GitHub raw link, mp3 etc)"
                  value={opt.responseAudioSrc}
                  onChange={(v: string) => {
                    const newOpts = [...voiceBotOptions];
                    newOpts[idx].responseAudioSrc = v;
                    setVoiceBotOptions(newOpts);
                  }}
                />
                <div>
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block tracking-normal">Duration (seconds)</label>
                    <input type="number" 
                      className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                      value={opt.responseDuration} 
                      onChange={(e) => {
                          const newOpts = [...voiceBotOptions];
                          newOpts[idx].responseDuration = Number(e.target.value);
                          setVoiceBotOptions(newOpts);
                      }} />
                </div>
              </div>
            ))}
            <button
              onClick={() => setVoiceBotOptions([...voiceBotOptions, { id: Date.now().toString(), text: "New Option", responseAudioSrc: "", responseDuration: 10 }])}
              className="w-full py-3 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              + Add Voice Option
            </button>
          </div>
        </AccordionSection>

        <AccordionSection
          id="contact"
          title="Contact Information"
          icon="headset"
          expanded={expandedSection === "contact"}
          onToggle={() =>
            setExpandedSection(expandedSection === "contact" ? null : "contact")
          }
        >
          <div className="space-y-4">
            <Field
              label="Customer Hotline Number"
              value={configs.customerHotline}
              onChange={(v: string) => setConfigs({ ...configs, customerHotline: v })}
            />
            <Field
              label="WhatsApp Number"
              value={configs.whatsappNumber}
              onChange={(v: string) => setConfigs({ ...configs, whatsappNumber: v })}
            />
            <Field
              label="Facebook Page Name"
              value={configs.facebookPageName}
              onChange={(v: string) => setConfigs({ ...configs, facebookPageName: v })}
            />
            <Field
              label="Facebook Page URL"
              value={configs.facebookPageUrl}
              onChange={(v: string) => setConfigs({ ...configs, facebookPageUrl: v })}
            />
          </div>
        </AccordionSection>

        <AccordionSection
          id="pwa"
          title="PWA Popup Settings"
          icon="download"
          expanded={expandedSection === "pwa"}
          onToggle={() =>
            setExpandedSection(expandedSection === "pwa" ? null : "pwa")
          }
        >
          <div className="space-y-6">
            <Field
              label="App Icon URL (Leave blank for default 'V' logo)"
              value={configs.pwaPopupIcon}
              onChange={(v: string) =>
                setConfigs({ ...configs, pwaPopupIcon: v })
              }
              placeholder="https://example.com/icon.png"
            />
            <div>
              <label className="text-[10px] font-bold text-zinc-400 mb-2 block tracking-normal">
                Popup Style Template
              </label>
              <select
                value={configs.pwaPopupStyle || "style1"}
                onChange={(e) =>
                  setConfigs({ ...configs, pwaPopupStyle: e.target.value })
                }
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700"
              >
                <option value="style1">Style 1 - Default Compact Mobile Card</option>
                <option value="style2">Style 2 - Floating Pill</option>
                <option value="style3">Style 3 - Classic Bottom Banner</option>
                <option value="style4">Style 4 - Modern Floating Action Button (FAB)</option>
                <option value="style5">Style 5 - Top Notification Bar</option>
                <option value="style6">Style 6 - Full Screen Bottom Sheet</option>
                <option value="style7">Style 7 - Minimalist Text only</option>
                <option value="style8">Style 8 - Neon Glowing Card</option>
                <option value="style9">Style 9 - Glassmorphism Floating</option>
                <option value="style10">Style 10 - Tech Border Animation</option>
              </select>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          id="auth"
          title="Login Options & Auth Domain"
          icon="key"
          expanded={expandedSection === "auth"}
          onToggle={() =>
            setExpandedSection(expandedSection === "auth" ? null : "auth")
          }
        >
          <div className="space-y-8">
            <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Professional Custom Auth Domain</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 tracking-normal">
                Normally Firebase uses <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">project-id.firebaseapp.com</code>. For a professional look (e.g., <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">auth.yourdomain.com</code>), follow these steps:
              </p>
              <ul className="text-xs text-zinc-600 dark:text-zinc-300 list-decimal pl-4 space-y-1.5 mb-4">
                <li>Go to Firebase Console &gt; Hosting &gt; Add Custom Domain (e.g., auth.yourdomain.com).</li>
                <li>Verify your domain ownership via TXT/A records in your DNS provider (Cloudflare, cPanel, etc).</li>
                <li>Go to Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains &amp; add <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">auth.yourdomain.com</code>.</li>
                <li>Finally, add your custom domain in the <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">firebase.ts</code> file in the code: <br/><code className="bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded mt-1 inline-block">authDomain: "auth.yourdomain.com"</code></li>
              </ul>
            </div>

            <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <Toggle
                label="Google Login"
                active={configs.googleLogin}
                onToggle={() =>
                  setConfigs({ ...configs, googleLogin: !configs.googleLogin })
                }
              />
              {configs.googleLogin && (
                <div className="mt-4 space-y-3">
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">To enable Google Login, simply go to Firebase Console &gt; Authentication &gt; Sign-in method Add Google. It automatically works without additional Client IDs for Web.</p>
                  <Field
                    label="Google Client ID (Optional for Web, needed for Android)"
                    value={configs.googleClientId}
                    onChange={(v: string) =>
                      setConfigs({ ...configs, googleClientId: v })
                    }
                    placeholder="apps.googleusercontent.com"
                  />
                </div>
              )}
            </div>

            <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <Toggle
                label="Facebook Login"
                active={configs.facebookLogin}
                onToggle={() =>
                  setConfigs({
                    ...configs,
                    facebookLogin: !configs.facebookLogin,
                  })
                }
              />
              {configs.facebookLogin && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-xs space-y-1">
                    <strong className="block mb-1">How to enable Facebook Login:</strong>
                    1. Go to <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="underline">Meta for Developers</a> and Create an App.<br/>
                    2. Add "Facebook Login" product to the app.<br/>
                    3. Under Facebook Login &gt; Settings, add your Firebase OAuth redirect URI: <code className="bg-blue-100 dark:bg-blue-800 px-1">https://your-auth-domain.com/__/auth/handler</code><br/>
                    4. Copy the App ID and App Secret from App Settings &gt; Basic.<br/>
                    5. Go to Firebase Console &gt; Authentication &gt; Sign-in method &gt; Facebook.<br/>
                    6. Paste the App ID and App Secret there to activate it!
                  </div>
                  <Field
                    label="Facebook App ID (For Reference)"
                    value={configs.facebookAppId}
                    onChange={(v: string) =>
                      setConfigs({ ...configs, facebookAppId: v })
                    }
                  />
                </div>
              )}
            </div>

            <div className="p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <Toggle
                label="Apple Login"
                active={configs.appleLogin}
                onToggle={() =>
                  setConfigs({ ...configs, appleLogin: !configs.appleLogin })
                }
              />
              {configs.appleLogin && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-700/50 text-zinc-800 dark:text-zinc-300 rounded-xl text-xs space-y-1">
                     <strong className="block mb-1">How to enable Apple Login:</strong>
                     1. Enroll in the <a href="https://developer.apple.com/" target="_blank" rel="noreferrer" className="underline">Apple Developer Program</a> ($99/yr).<br/>
                     2. Create an App ID and Service ID in your Apple portal.<br/>
                     3. Register your Firebase OAuth URI as a Return URL.<br/>
                     4. Create a Private Key for "Sign in with Apple".<br/>
                     5. Go to Firebase Console &gt; Auth &gt; Sign-in method &gt; Apple.<br/>
                     6. Enter Service ID, Apple Team ID, Key ID, and the Private Key.
                  </div>
                  <Field
                    label="Apple Service ID (For Reference)"
                    value={configs.appleServiceId}
                    onChange={(v: string) =>
                      setConfigs({ ...configs, appleServiceId: v })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </AccordionSection>
      </div>

      <div className="flex justify-center max-w-4xl mx-auto relative z-10 w-full mb-8 pt-4">
        <button
          disabled={saving}
          onClick={handleSave}
          className="w-full md:w-auto px-12 py-4 bg-zinc-900 border-none text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-full font-bold tracking-wide shadow-xl active:scale-95 transition-all outline-none! hover-lift disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Icon name="spinner-third" className="animate-spin mr-2" /> Saving...
            </>
          ) : (
            <>
              <Icon name="save" className="mr-2 hidden md:block" /> Save All Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const AccordionSection = ({
  title,
  icon,
  children,
  expanded,
  onToggle,
}: any) => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
    <button
      onClick={onToggle}
      className={`w-full px-6 md:px-8 py-5 md:py-6 flex items-center justify-between transition-colors ${expanded ? "bg-zinc-50 dark:bg-zinc-800/50" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}
    >
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${expanded ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
            <Icon name={icon as any} className="text-lg" />
        </div>
        <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
      </div>
      <Icon
        name={expanded ? "chevron-up" : "chevron-down"}
        className={`text-sm text-zinc-400 transition-transform ${expanded ? "" : ""}`}
      />
    </button>
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="px-6 md:px-8 pb-8 pt-4 space-y-6">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Field = ({ label, value, onChange, placeholder }: any) => (
  <div>
    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block tracking-normal">
      {label}
    </label>
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
    />
  </div>
);

const Toggle = ({ label, active, onToggle }: any) => (
  <div className="flex justify-between items-center">
    <span className="text-xs font-bold">{label}</span>
    <div
      onClick={onToggle}
      className={`w-12 h-7 rounded-full transition-all relative cursor-pointer p-1 ${active ? "bg-zinc-900" : "bg-zinc-200"}`}
    >
      <motion.div
        animate={{ x: active ? 20 : 0 }}
        className="w-5 h-5 bg-zinc-50 dark:bg-zinc-800 rounded-full shadow-sm"
      />
    </div>
  </div>
);

export default ManageConfig;
