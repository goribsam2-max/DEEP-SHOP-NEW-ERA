
import React, { useState, createContext, useContext } from 'react';
import { gooeyToast, GooeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';
import { Modal } from './ui/modal';
import { showIsland } from './ui/dynamic-island';

type ToastType = 'success' | 'error' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface AlertOptions {
  title: string;
  message: string;
  buttonText?: string;
  onClose?: () => void;
}

interface PromptOptions {
  title: string;
  message: string;
  placeholder?: string;
  onConfirm: (val: string) => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
}

interface FullScreenInfoOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  buttonText?: string;
}

interface ToastContextType {
  notify: (message: string, type?: ToastType, description?: string) => void;
  confirm: (options: ConfirmOptions) => void;
  alert: (options: AlertOptions) => void;
  prompt: (options: PromptOptions) => void;
  fullScreenInfo: (options: FullScreenInfoOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const cleanErrorMessage = (msg: string | any): { title: string; description?: string } => {
  if (!msg) return { title: "Unexpected Error", description: "An unexpected error occurred. Please try again later." };
  
  const msgStr = typeof msg === 'string' ? msg : (msg.message || "An unexpected error occurred.");
  const m = msgStr.toLowerCase();
  
  if (m.includes("auth/user-not-found") || m.includes("auth/wrong-password") || m.includes("auth/invalid-credential")) {
    return { title: "Authentication Failed", description: "Invalid credentials provided. Please check your details and try again." };
  }
  if (m.includes("auth/email-already-in-use")) {
    return { title: "Account Exists", description: "This email is already associated with an account. Please log in instead." };
  }
  if (m.includes("auth/weak-password")) {
    return { title: "Weak Password", description: "Please use a stronger password with a mix of numbers and symbols." };
  }
  if (m.includes("permission-denied") || m.includes("missing or insufficient permissions")) {
    return { title: "Access Denied", description: "You do not have permission to access this resource or perform this action." };
  }
  if (m.includes("network-request-failed") || m.includes("offline")) {
    return { title: "Network Error", description: "Please check your internet connection and try again." };
  }
  if (m.includes("quota-exceeded")) {
    return { title: "Service Busy", description: "Our servers are experiencing high traffic. Please try again later." };
  }
  if (m.includes("requires-recent-login")) {
    return { title: "Authentication Required", description: "For your security, please log out and log back in to perform this action." };
  }
  
  // Generic fallback to strip technical jargon
  if (m.includes("firebase") || m.includes("firestore") || m.includes("internal error")) {
    return { title: "System Error", description: "We encountered an internal issue. Our team has been notified." };
  }
  
  // Clean up any remaining FirebaseError prefix
  const cleanedText = msgStr.replace(/FirebaseError:\s*/gi, '').trim();
  
  // If it's a short string, use it as title. Otherwise, default title and use it as description.
  if (cleanedText.length < 40) {
    return { title: cleanedText };
  }
  return { title: "Action Failed", description: cleanedText };
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);
  const [alertModal, setAlertModal] = useState<AlertOptions | null>(null);
  const [promptModal, setPromptModal] = useState<PromptOptions | null>(null);
  const [fullScreenModal, setFullScreenModal] = useState<FullScreenInfoOptions | null>(null);
  
  const [promptVal, setPromptVal] = useState("");

  const notify = (message: string, type: ToastType = 'info', description?: string) => {
    let finalTitle = message;
    let finalDesc = description;

    if (type === 'error') {
      const errorData = cleanErrorMessage(message);
      finalTitle = errorData.title;
      if (!finalDesc) finalDesc = errorData.description;
    }

    const config = {
      preset: 'bouncy' as const,
      showProgress: true,
      description: finalDesc || undefined
    };

    // Use Dynamic Island for success and simple info messages for an Apple-like feel
    if (type === 'success') {
      if (finalTitle.toLowerCase().includes('cart')) {
         showIsland({ state: 'cart_add', title: finalTitle, subtitle: finalDesc });
      } else {
         showIsland({ state: 'success', title: finalTitle, subtitle: finalDesc });
      }
      return; 
    } else if (type === 'info') {
      showIsland({ state: 'notification', title: finalTitle, subtitle: finalDesc });
      return;
    }

    // Fallback to gooey toast for errors
    if (type === 'error') gooeyToast.error(finalTitle, config);
    else gooeyToast.info(finalTitle, config);
  };

  const confirm = (options: ConfirmOptions) => setConfirmModal(options);
  const alert = (options: AlertOptions) => setAlertModal(options);
  const prompt = (options: PromptOptions) => {
    setPromptVal("");
    setPromptModal(options);
  };
  const fullScreenInfo = (options: FullScreenInfoOptions) => setFullScreenModal(options);

  return (
    <ToastContext.Provider value={{ notify, confirm, alert, prompt, fullScreenInfo }}>
      {children}
      <GooeyToaster position="top-right" showProgress closeButton="top-right" />
      
      <Modal.Modal zIndex={200000} active={!!confirmModal} onClickOutside={() => { confirmModal?.onCancel?.(); setConfirmModal(null); }}>
        <Modal.Body className="bg-white dark:bg-zinc-900 border-none">
          <Modal.Title className="text-zinc-900 dark:text-zinc-100">{confirmModal?.title}</Modal.Title>
          <Modal.Subtitle className="text-zinc-500 dark:text-zinc-400">{confirmModal?.message}</Modal.Subtitle>
        </Modal.Body>
        <Modal.Actions className="bg-white dark:bg-zinc-900 border-none">
          <Modal.Action variant="unstyled" onClick={() => { confirmModal?.onCancel?.(); setConfirmModal(null); }}>
            {confirmModal?.cancelText || 'Cancel'}
          </Modal.Action>
          <Modal.Action className="bg-black dark:bg-white text-white dark:text-black" onClick={() => { confirmModal?.onConfirm(); setConfirmModal(null); }}>
            {confirmModal?.confirmText || 'Confirm'}
          </Modal.Action>
        </Modal.Actions>
      </Modal.Modal>

      <Modal.Modal zIndex={200000} active={!!alertModal} onClickOutside={() => { alertModal?.onClose?.(); setAlertModal(null); }}>
        <Modal.Body className="bg-white dark:bg-zinc-900 border-none">
          <Modal.Title className="text-zinc-900 dark:text-zinc-100">{alertModal?.title}</Modal.Title>
          <Modal.Subtitle className="text-zinc-500 dark:text-zinc-400">{alertModal?.message}</Modal.Subtitle>
        </Modal.Body>
        <Modal.Actions className="bg-white dark:bg-zinc-900 border-none">
          <Modal.Action className="bg-black dark:bg-white text-white dark:text-black" onClick={() => { alertModal?.onClose?.(); setAlertModal(null); }}>
            {alertModal?.buttonText || 'OK'}
          </Modal.Action>
        </Modal.Actions>
      </Modal.Modal>

      <Modal.Modal zIndex={200000} active={!!promptModal} onClickOutside={() => { promptModal?.onCancel?.(); setPromptModal(null); }}>
        <Modal.Body className="bg-white dark:bg-zinc-900 border-none">
          <Modal.Title className="text-zinc-900 dark:text-zinc-100">{promptModal?.title}</Modal.Title>
          <Modal.Subtitle className="text-zinc-500 dark:text-zinc-400">{promptModal?.message}</Modal.Subtitle>
          <div className="mt-4">
            <input
              type="text"
              className="w-full px-4 py-3 border rounded-xl dark:bg-zinc-800 dark:border-zinc-700 dark:text-white outline-none focus:ring-2 focus:ring-zinc-500"
              placeholder={promptModal?.placeholder || "Enter reason..."}
              value={promptVal}
              onChange={(e) => setPromptVal(e.target.value)}
            />
          </div>
        </Modal.Body>
        <Modal.Actions className="bg-white dark:bg-zinc-900 border-none">
          <Modal.Action variant="unstyled" onClick={() => { promptModal?.onCancel?.(); setPromptModal(null); }}>
            {promptModal?.cancelText || 'Cancel'}
          </Modal.Action>
          <Modal.Action className="bg-black dark:bg-white text-white dark:text-black" onClick={() => { 
            if (promptModal?.required && !promptVal.trim()) return notify("Please enter a value", "error");
            promptModal?.onConfirm(promptVal); 
            setPromptModal(null); 
          }}>
            {promptModal?.confirmText || 'Submit'}
          </Modal.Action>
        </Modal.Actions>
      </Modal.Modal>

      {!!fullScreenModal && (
        <div 
           className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-900/40 backdrop-blur-md p-6"
           style={{ zIndex: 200000 }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-10 w-full max-w-lg shadow-2xl text-center flex flex-col items-center animate-stagger-1 border border-zinc-100 dark:border-zinc-800">
            {fullScreenModal.type === 'success' && (
              <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                <i className="fas fa-check text-4xl text-green-600 dark:text-green-400"></i>
              </div>
            )}
            {fullScreenModal.type === 'error' && (
              <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                <i className="fas fa-times text-4xl text-red-600 dark:text-red-400"></i>
              </div>
            )}
            <h2 className="text-3xl font-bold mb-4 font-outfit text-zinc-900 dark:text-white">{fullScreenModal.title}</h2>
            <p className="text-lg text-zinc-500 font-medium mb-10 leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{fullScreenModal.message}</p>
            <button onClick={() => { fullScreenModal.onClose(); setFullScreenModal(null); }} className="w-full max-w-xs py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-bold text-sm tracking-wide shadow-lg hover:opacity-90 transition-opacity">
              {fullScreenModal.buttonText || 'Continue'}
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useNotify = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useNotify must be used within ToastProvider");
  return context.notify;
};

export const useConfirm = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useConfirm must be used within ToastProvider");
  return context.confirm;
};

export const useAlert = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useAlert must be used within ToastProvider");
  return context.alert;
};

export const usePromptModal = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("usePrompt must be used within ToastProvider");
  return context.prompt;
};

export const useFullScreenInfo = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useFullScreenInfo must be used within ToastProvider");
  return context.fullScreenInfo;
};
