import { formatPrice } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { handleCoinDeductionWithExpiry } from "../lib/coinExpiry";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { useNotify } from "../components/Notifications";
import { OrderStatus } from "../types";
import { sendOrderToTelegram } from "../services/telegram";
import { getProductCoinReward } from "../lib/coinRewards";
import { CustomSectionEmbed } from "../components/CustomSectionEmbed";
import { useTheme } from "../components/ThemeContext";
import { useLanguage } from "../components/LanguageContext";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Skeleton } from "../components/ui/skeleton";
import {
  CreditCard,
  Truck,
  Shield,
  MapPin,
  Lock,
  Check,
  ChevronLeft,
  Percent,
  X,
  Smartphone,
  ShoppingBag,
  Ticket,
  Copy,
  QrCode
} from "lucide-react";
import { cn } from "../lib/utils";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const notify = useNotify();
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const region = localStorage.getItem("user_region") || "BD";
  const isForeign = region === "IN" || region === "PK";

  // Local storage helper
  const getSavedState = (key: string, defaultValue: any) => {
    try {
      const item = localStorage.getItem(`vibe_checkout_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [items, setItems] = useState<any[]>([]);
  const isCodDisabledBySellers = items.some((item: any) => item.isCodEnabled === false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(() => getSavedState("currentStep", 1));
  const [userIp, setUserIp] = useState<string>("");
  const [settings, setSettings] = useState<any>(null);
  const [userCoins, setUserCoins] = useState<number>(0);
  const [resolvedAdvanceAmount, setResolvedAdvanceAmount] = useState<number | null>(null);

  // Address
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(() => getSavedState("selectedAddressId", null));
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(() => getSavedState("isAddingNewAddress", false));
  const [newAddress, setNewAddress] = useState(() => getSavedState("newAddress", {
    name: "",
    phone: "",
    altPhone: "",
    address: "",
  }));

  // Payment
  const prefMeth = localStorage.getItem("vibe_preferred_payment");
  const defaultBank =
    prefMeth === "bKash or Nagad" || prefMeth === "bKash" || prefMeth === "Nagad"
      ? "bangla_qr"
      : null;
  const defaultPaymentType =
    prefMeth === "Cash on Delivery" ? "cod" : prefMeth === "DP Coin" ? "vgcoin" : defaultBank ? "advance" : "cod";
  const [paymentType, setPaymentType] = useState<
    "cod" | "advance" | "vgcoin" | null
  >(() => getSavedState("paymentType", defaultPaymentType));
  const [advanceType, setAdvanceType] = useState<"full" | "delivery" | null>(() => getSavedState("advanceType", null));
  const [bankingMethod, setBankingMethod] = useState<"bangla_qr" | "bank" | null>(() => getSavedState("bankingMethod", defaultBank as any));
  const [bankingAccountName, setBankingAccountName] = useState(() => getSavedState("bankingAccountName", ""));
  const [bankingTrxId, setBankingTrxId] = useState(() => getSavedState("bankingTrxId", ""));

  // Promo & Gift
  const [couponCode, setCouponCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [isGift, setIsGift] = useState(() => getSavedState("isGift", false));
  const [giftNote, setGiftNote] = useState(() => getSavedState("giftNote", ""));
  const [affiliateRef, setAffiliateRef] = useState<string | null>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [claimedCouponsList, setClaimedCouponsList] = useState<any[]>([]);

  const [paymentSettings, setPaymentSettings] = useState<any>(null);

  useEffect(() => {
    if (isCodDisabledBySellers && paymentType === "cod") {
      setPaymentType("advance");
    }
  }, [isCodDisabledBySellers, paymentType]);

  useEffect(() => {
    localStorage.setItem("vibe_checkout_currentStep", JSON.stringify(currentStep));
    localStorage.setItem("vibe_checkout_selectedAddressId", JSON.stringify(selectedAddressId));
    localStorage.setItem("vibe_checkout_isAddingNewAddress", JSON.stringify(isAddingNewAddress));
    localStorage.setItem("vibe_checkout_newAddress", JSON.stringify(newAddress));
    localStorage.setItem("vibe_checkout_paymentType", JSON.stringify(paymentType));
    localStorage.setItem("vibe_checkout_advanceType", JSON.stringify(advanceType));
    localStorage.setItem("vibe_checkout_bankingMethod", JSON.stringify(bankingMethod));
    localStorage.setItem("vibe_checkout_bankingAccountName", JSON.stringify(bankingAccountName));
    localStorage.setItem("vibe_checkout_bankingTrxId", JSON.stringify(bankingTrxId));
    localStorage.setItem("vibe_checkout_isGift", JSON.stringify(isGift));
    localStorage.setItem("vibe_checkout_giftNote", JSON.stringify(giftNote));
  }, [currentStep, selectedAddressId, isAddingNewAddress, newAddress, paymentType, advanceType, bankingMethod, bankingAccountName, bankingTrxId, isGift, giftNote]);

  useEffect(() => {
    const fetchCoupons = async () => {
      if (!auth.currentUser) return;
      const userSnap = await import("firebase/firestore").then((m) =>
        m.getDoc(m.doc(db, "users", auth.currentUser!.uid)),
      );
      if (userSnap.exists()) {
        const claimedIds = userSnap.data().claimedCoupons || [];
        if (claimedIds.length > 0) {
          const { collection, query, documentId, where, getDocs } =
            await import("firebase/firestore");
          const chunked = claimedIds.slice(0, 10);
          const q = query(
            collection(db, "coupons"),
            where(documentId(), "in", chunked),
          );
          const snap = await getDocs(q);
          setClaimedCouponsList(
            snap.docs.map((d) => ({ id: d.id, ...d.data() })),
          );
        }
      }
    };
    fetchCoupons();
  }, []);

  useEffect(() => {
    const ref = localStorage.getItem("affiliateRef");
    if (ref) {
      setAffiliateRef(ref);
      setCouponCode(ref);
      setAppliedPromo({
        id: "affiliate",
        type: "percent",
        discount: 5,
        code: "REF-LINK",
      });
    }

    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((d) => setUserIp(d.ip))
      .catch(() => setUserIp("Unavailable"));

    const unsubSettings = onSnapshot(doc(db, "settings", "platform"), (doc) => {
      if (doc.exists()) setSettings(doc.data());
    });
    
    const unsubPaymentSettings = onSnapshot(doc(db, "settings", "payment_gateway"), (doc) => {
      if (doc.exists()) setPaymentSettings(doc.data());
    });

    const unsubPayments = onSnapshot(doc(db, "settings", "payments"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setPaymentSettings((prev: any) => ({...prev, ...data}));
      }
    });

    const cart = JSON.parse(localStorage.getItem("f_cart") || "[]");
    if (cart.length === 0) {
      navigate("/");
      return;
    }
    setItems(cart);

    if (isForeign) {
      setPaymentType("advance");
      setAdvanceType("full");
      setBankingMethod("bank");
    }

    if (auth.currentUser) {
      getDoc(doc(db, "users", auth.currentUser.uid)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUserCoins(data.coins || 0);
          if (data.addresses && Array.isArray(data.addresses)) {
            setSavedAddresses(data.addresses);
            if (data.addresses.length > 0)
              setSelectedAddressId(data.addresses[0].id);
          } else {
            setIsAddingNewAddress(true);
          }
        }
        setIsLoading(false);
      });
    } else {
      const localAddresses = JSON.parse(
        localStorage.getItem("vibe_shipping_addresses_v2") || "[]",
      );
      setSavedAddresses(localAddresses);
      if (localAddresses.length > 0) setSelectedAddressId(localAddresses[0].id);
      else setIsAddingNewAddress(true);
      setIsLoading(false);
    }
    return () => {
      unsubSettings();
      unsubPaymentSettings();
      unsubPayments();
    };
  }, [navigate]);

  useEffect(() => {
    const resolveAdvance = async () => {
      let totalAdvance = 0;
      try {
        const { getDoc, doc } = await import("firebase/firestore");
        for (const item of items) {
          let itemAdvance = null;
          
          // 1. Check if item has product-specific advanceAmount
          if (item.advanceAmount !== undefined && item.advanceAmount !== null && item.advanceAmount !== "") {
            itemAdvance = Number(item.advanceAmount);
          } else {
            // Fetch product doc to make sure we have latest
            const prodSnap = await getDoc(doc(db, "products", item.id));
            if (prodSnap.exists() && prodSnap.data().advanceAmount !== undefined && prodSnap.data().advanceAmount !== null && prodSnap.data().advanceAmount !== "") {
              itemAdvance = Number(prodSnap.data().advanceAmount);
            }
          }
          
          // 2. If not product-specific, check seller's defaultAdvanceAmount
          if (itemAdvance === null && item.sellerId) {
            const sellerSnap = await getDoc(doc(db, "users", item.sellerId));
            if (sellerSnap.exists() && sellerSnap.data().defaultAdvanceAmount !== undefined && sellerSnap.data().defaultAdvanceAmount !== null && sellerSnap.data().defaultAdvanceAmount !== "") {
              itemAdvance = Number(sellerSnap.data().defaultAdvanceAmount);
            }
          }
          
          // 3. Fallback to delivery charge if none is specified
          if (itemAdvance === null) {
            itemAdvance = settings?.deliveryCharge || 120;
          }
          
          totalAdvance += itemAdvance * (item.quantity || 1);
        }
        setResolvedAdvanceAmount(totalAdvance);
      } catch (err) {
        console.error("Error resolving advance amount:", err);
        // Fallback
        setResolvedAdvanceAmount(deliveryFee);
      }
    };
    
    if (items.length > 0) {
      resolveAdvance();
    }
  }, [items, settings]);

  const subtotal = items.reduce((a, c) => a + c.price * c.quantity, 0);
  const deliveryFee = settings?.deliveryCharge || 120;
  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === "percent")
      discount = Math.round(subtotal * (appliedPromo.discount / 100));
    else discount = appliedPromo.discount;
  }
  const total = subtotal + deliveryFee - discount;

  const handleSaveAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.address) {
      return notify("Please complete all required fields.", "error");
    }
    const newAddrObj = {
      id: Math.random().toString(36).substring(7),
      ...newAddress,
    };
    if (auth.currentUser) {
      try {
        const { setDoc } = await import("firebase/firestore");
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          { addresses: arrayUnion(newAddrObj) },
          { merge: true },
        );
        setSavedAddresses([...savedAddresses, newAddrObj]);
        setSelectedAddressId(newAddrObj.id);
        setIsAddingNewAddress(false);
        notify("Address saved.", "success");
      } catch (e) {
        notify("Error saving address.", "error");
      }
    } else {
      const newAddrs = [...savedAddresses, newAddrObj];
      setSavedAddresses(newAddrs);
      setSelectedAddressId(newAddrObj.id);
      setIsAddingNewAddress(false);
      localStorage.setItem(
        "vibe_shipping_addresses_v2",
        JSON.stringify(newAddrs),
      );
    }
  };

  const applyPromo = async () => {
    setCouponError("");
    if (!couponCode.trim()) return;
    try {
      const { query, where, getDocs, collection } =
        await import("firebase/firestore");
      // For typed-in codes, search promo_codes collection
      const q = query(
        collection(db, "promo_codes"),
        where("code", "==", couponCode.trim().toUpperCase()),
      );
      const snap = await getDocs(q);
      if (snap.empty) setCouponError("Invalid promo code");
      else {
        const c = snap.docs[0].data();
        if (!c.isActive) {
          setCouponError("Promo code inactive");
        } else if (c.expiresAt && c.expiresAt < Date.now()) {
          setCouponError("Promo code expired");
        } else if (c.minOrderAmount && subtotal < c.minOrderAmount) {
          setCouponError(`Minimum order amount is ${formatPrice(c.minOrderAmount)}`);
        } else if (c.maxUses && c.usedCount >= c.maxUses) {
          setCouponError("Promo code fully used");
        } else {
          setAppliedPromo({ id: snap.docs[0].id, ...c, isVoucher: false });
          notify("Promo code applied!", "success");
        }
      }
    } catch (e) {
      setCouponError("Error verifying promo code");
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setCouponCode("");
  };

  const placeOrder = async () => {
    if (!navigator.onLine) {
        window.dispatchEvent(new Event("showNetworkError"));
        return;
    }

    // Rate Limiting to prevent spam orders
    const lastOrder = localStorage.getItem("vibe_last_order");
    const now = Date.now();
    if (lastOrder && now - parseInt(lastOrder) < 1000 * 60) { // 1 minute limit per IP/Browser
       return notify("You are placing orders too quickly. Please wait a moment.", "error");
    }

    const activeAddress = savedAddresses.find(
      (a) => a.id === selectedAddressId,
    );
    if (!activeAddress) return notify("Address required", "error");

    if (paymentType === "vgcoin") {
      const coinCost = advanceType === "full" ? total : (resolvedAdvanceAmount ?? deliveryFee);
      if (userCoins < coinCost) {
        notify(`Not enough DP Coins. You need ${coinCost - userCoins} more coins. Please deposit.`, "error");
        navigate("/deposit", { state: { requiredDeposit: coinCost - userCoins } });
        return;
      }
    }

    setIsLoading(true);
    try {
      let paymentStr = "Cash on Delivery";
      let paymentOptStr = "N/A";
      let trxStr = "";

      if (paymentType === "advance") {
        paymentStr =
          bankingMethod === "bangla_qr"
            ? "bKash or Nagad"
            : "Bank Transfer";
        paymentOptStr =
          advanceType === "full" ? "Full Payment" : "Delivery Fee Advanced";
        trxStr = bankingTrxId.trim();
      } else if (paymentType === "vgcoin") {
        paymentStr = "DP Coins";
        paymentOptStr =
          advanceType === "full" ? "Full Payment" : "Delivery Fee Advanced";
        trxStr = `VGCOIN_${Date.now()}`;
      }

      const orderData = {
        userId: auth.currentUser?.uid || "guest",
        customerName: activeAddress.name,
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          priceAtPurchase: i.price,
          name: i.name,
          image: i.image,
        })),
        total: total,
        subTotal: subtotal,
        discount: discount,
        couponCode: appliedPromo ? appliedPromo.code : null,
        status: OrderStatus.PENDING,
        paymentMethod: paymentStr,
        paymentOption: paymentOptStr,
        accountNameSender: bankingAccountName.trim(),
        transactionId: trxStr,
        shippingAddress: activeAddress.address,
        contactNumber: activeAddress.phone,
        altNumber: activeAddress.altPhone || "",
        ipAddress: userIp,
        createdAt: Date.now(),
        isSuspicious: false,
        riskReason: "",
        isGift: isGift,
        giftNote: isGift ? giftNote : null,
        affiliateRef: affiliateRef || null,
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);

      if (orderData.affiliateRef) {
        try {
          const { increment } = await import("firebase/firestore");
          await updateDoc(doc(db, "users", orderData.affiliateRef), {
            walletBalance: increment(50),
          });
          await addDoc(collection(db, "affiliates_log"), {
            affiliateId: orderData.affiliateRef,
            orderId: docRef.id,
            customerName: activeAddress.name,
            commission: 50,
            createdAt: Date.now(),
          });
        } catch (e) {}
      }

      if (appliedPromo && appliedPromo.id !== "affiliate") {
        try {
          const { increment, arrayUnion } = await import("firebase/firestore");
          const collectionName = appliedPromo.isVoucher
            ? "coupons"
            : "promo_codes";
          await updateDoc(doc(db, collectionName, appliedPromo.id), {
            usedCount: increment(1),
            usedIPs: arrayUnion(userIp),
          });
        } catch (e) {}
      }

      if (paymentType === "vgcoin" && auth.currentUser) {
        try {
          const { increment } = await import("firebase/firestore");
          const coinCost = advanceType === "full" ? total : (resolvedAdvanceAmount ?? deliveryFee);
          await handleCoinDeductionWithExpiry(auth.currentUser.uid, coinCost);
        } catch (e) {
          console.error("Failed to deduct coins", e);
        }
      }

      // Grant coins for eligible products
      if (auth.currentUser) {
        let totalCoinsEarned = 0;
        for (const i of items) {
          const baseReward = (i.coinReward !== undefined && i.coinReward !== null && String(i.coinReward).trim() !== "") ? Number(i.coinReward) : getProductCoinReward(i.id);
          const reward = baseReward * i.quantity;
          totalCoinsEarned += reward;
        }
        if (totalCoinsEarned > 0) {
          try {
            const { increment, arrayUnion } = await import("firebase/firestore");
            const expiryAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
              coins: increment(totalCoinsEarned),
              coinBatches: arrayUnion({
                  id: Date.now().toString(),
                  amount: totalCoinsEarned,
                  expiresAt: expiryAt,
                  type: "reward"
              })
            });
          } catch (e) {
            console.error("Failed to add reward coins", e);
          }
        }
      }

      if (paymentType !== "advance") {
        await sendOrderToTelegram({ ...orderData, id: docRef.id });
      }

      // Email removed per user request

      localStorage.removeItem("f_cart");
      localStorage.setItem("vibe_last_order", Date.now().toString());

      if (paymentType === "advance") {
        navigate(`/payment/${docRef.id}`);
      } else {
        navigate(`/success?orderId=${docRef.id}`);
      }
    } catch (err: any) {
      notify("Order failed! Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step: number) => {
    if (step === 1) return !!selectedAddressId;
    if (step === 2) {
      if (paymentType === "cod") return true;
      if (paymentType === "advance") {
        return !!advanceType;
      }
      if (paymentType === "vgcoin") {
        return !!advanceType;
      }
      return false;
    }
    if (step === 3) return agreeToTerms;
    return false;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2 && paymentType === "advance") {
        placeOrder();
      } else {
        setCurrentStep((p) => Math.min(p + 1, 3));
      }
    } else notify("Please complete the required fields.", "error");
  };

  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 1));

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 flex flex-col gap-6 font-inter bg-zinc-50 dark:bg-[#000000]">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-50 dark:bg-[#000000] font-inter">
      <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-6 py-4 overflow-x-auto no-scrollbar mask-linear-fade pr-4">
          {[
            { step: 1, label: "Shipping", icon: Truck },
            { step: 2, label: "Payment", icon: CreditCard },
            { step: 3, label: "Review", icon: Check },
          ].map(({ step, label, icon: Icon }, index) => (
            <div key={step} className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-colors",
                    currentStep >= step
                      ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900"
                      : "border-zinc-300 dark:border-zinc-700 text-zinc-400",
                  )}
                >
                  {currentStep > step ? (
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-sm font-bold whitespace-nowrap",
                    currentStep >= step
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-400",
                  )}
                >
                  {label}
                </span>
              </div>
              {index < 2 && (
                <div
                  className={cn(
                    "w-4 sm:w-8 h-0.5",
                    currentStep > step
                      ? "bg-zinc-100 dark:bg-zinc-8000"
                      : "bg-zinc-200 dark:bg-zinc-800",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Step 1: Shipping */}
            {currentStep === 1 && (
              <Card className="rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-2">
                <CardHeader>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    <MapPin className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />{" "}
                    {t('Shipping Information') || 'Shipping Information'}
                  </h2>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  {savedAddresses.length > 0 ? (
                    <div className="space-y-3">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={cn(
                            "p-4 border-2 rounded-2xl cursor-pointer transition-all",
                            selectedAddressId === addr.id
                              ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 dark:bg-emerald-900/10"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                selectedAddressId === addr.id
                                  ? "border-zinc-900 dark:border-zinc-100"
                                  : "border-zinc-300",
                              )}
                            >
                              {selectedAddressId === addr.id && (
                                <div className="w-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-8000" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                {addr.name}
                              </div>
                              <div className="text-sm font-medium text-zinc-500">
                                {addr.phone}
                              </div>
                              <div className="text-sm mt-1 text-zinc-600 dark:text-zinc-400">
                                {addr.address}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full mt-2 border-dashed"
                        onClick={() => navigate('/shipping-address')}
                      >
                        + Add New Address
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <MapPin className="w-10 h-10 text-zinc-400 mb-3" />
                      <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">{t('No Address Found') || 'No Address Found'}</h3>
                      <p className="text-sm text-zinc-500 mb-4">{t('Please add a shipping address to continue.') || 'Please add a shipping address to continue.'}</p>
                      <Button onClick={() => navigate('/shipping-address')}>
                        {t('Add Shipping Address') || 'Add Shipping Address'}
                      </Button>
                    </div>
                  )}

                  {/* Gift Toggle */}
                  <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="gift"
                          checked={isGift}
                          onCheckedChange={(c) => setIsGift(!!c)}
                        />
                        <div>
                          <Label
                            htmlFor="gift"
                            className="font-bold text-base cursor-pointer"
                          >
                            Send as a Gift
                          </Label>
                          <p className="text-sm text-zinc-500">
                            Invoice will hide prices. COD disabled.
                          </p>
                        </div>
                      </div>
                      {isGift && (
                        <div className="space-y-2 ml-7">
                          <Label>Gift Note</Label>
                          <Input
                            placeholder="Happy Birthday!..."
                            value={giftNote}
                            onChange={(e) => setGiftNote(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-4 pb-2">
                  <Button
                    onClick={nextStep}
                    disabled={!validateStep(1)}
                    size="default"
                    className="text-xs sm:text-sm px-4 sm:px-6"
                  >
                    Continue
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <Card className="rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-2">
                <CardHeader>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    <CreditCard className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />{" "}
                    Payment Information
                  </h2>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {!isForeign && (
                      <button
                        disabled={isGift || isCodDisabledBySellers}
                        onClick={() => setPaymentType("cod")}
                        className={cn(
                          "flex flex-col items-center gap-3 p-6 border-2 rounded-2xl transition-colors",
                          paymentType === "cod"
                            ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 dark:bg-emerald-900/10"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                          (isGift || isCodDisabledBySellers) && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        <Truck className="h-8 w-8 text-zinc-700 dark:text-zinc-300" />
                        <div className="text-center">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            Cash on Delivery
                          </div>
                          <div className="text-xs font-semibold text-zinc-500 mt-1">
                            {isCodDisabledBySellers ? "Disabled by Seller" : "Pay at doorstep"}
                          </div>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setPaymentType("advance");
                        if (isForeign) {
                          setAdvanceType("full");
                          setBankingMethod("bank");
                        } else {
                          setBankingMethod("bangla_qr");
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center gap-3 p-6 border-2 rounded-2xl transition-colors",
                        paymentType === "advance"
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 dark:bg-emerald-900/10"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                      )}
                    >
                      <Smartphone className="h-8 w-8 text-zinc-700 dark:text-zinc-300" />
                      <div className="text-center">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {isForeign ? "Bank Transfer" : "bKash or Nagad"}
                        </div>
                        <div className="text-xs font-semibold text-zinc-500 mt-1">
                          {isForeign ? "Full Advance (1-2 months delivery)" : "bKash & Nagad Payment"}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentType("vgcoin")}
                      className={cn(
                        "flex flex-col items-center gap-3 p-6 border-2 rounded-2xl transition-colors",
                        paymentType === "vgcoin"
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-700",
                      )}
                    >
                      <div className="h-8 w-8 flex items-center justify-center font-bold text-lg text-amber-500 border-2 border-amber-500 rounded-full">
                        D
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-1">
                          Pay with DP Coin
                        </div>
                        <div className="text-xs font-bold text-amber-500 mt-1">
                          Balance: {formatPrice(userCoins)}
                        </div>
                      </div>
                    </button>
                  </div>

                  {paymentType === "cod" && (
                    <div className="flex flex-col gap-4 mt-4 border-2 border-[#00b2d6]/30 bg-[#f4fbff] dark:bg-[#00b2d6]/5 dark:border-[#00b2d6]/20 p-5 rounded-2xl animate-in fade-in slide-in-from-top-4">
                      <div className="flex items-center gap-2 mb-1 text-[#00b2d6]">
                        <div className="bg-[#00b2d6] text-white rounded-full p-0.5">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                           <Truck className="h-5 w-5 text-[#ce1274]" />
                           Cash on Delivery
                        </span>
                      </div>
                      <div className="space-y-3">
                         <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">Cash on Delivery (COD)</p>
                         <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                           <li>Upon delivery to your address, you may pay in cash directly to our courier.</li>
                           <li>Ensure your delivery status is marked as 'Out for Delivery' before agreeing to accept the parcel.</li>
                           <li>Verify that the airway bill clearly indicates the parcel is from DEEP SHOP before receiving it.</li>
                           <li>Before handing over payment to the courier, double-check the order number, sender information, and tracking number on the parcel for accuracy.</li>
                         </ul>
                      </div>
                    </div>
                  )}

                  {paymentType === "vgcoin" && (
                    <div className="flex flex-col gap-6 mt-4 border-t border-amber-100 dark:border-amber-900/30 pt-6 animate-in fade-in slide-in-from-top-4">
                      <div className="space-y-4">
                        <Label className="text-base text-zinc-900 dark:text-zinc-100">
                          {isForeign ? "Confirm Full Payment with Coins" : "Select Amount to Pay with Coins"}
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {!isForeign && (
                            <button
                              onClick={() => {
                                const reqAmt = resolvedAdvanceAmount ?? deliveryFee;
                                if (userCoins < reqAmt) {
                                  notify(
                                    `Not enough balance. You need ${formatPrice(reqAmt - userCoins)} more.`,
                                    "error",
                                  );
                                  navigate("/deposit", { state: { requiredDeposit: reqAmt - userCoins } });
                                  return;
                                }
                                setAdvanceType("delivery");
                              }}
                              className={cn(
                                "flex items-center justify-between p-4 border-2 rounded-xl text-left",
                                advanceType === "delivery"
                                  ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10"
                                  : "border-zinc-200 dark:border-zinc-800",
                              )}
                            >
                              <div>
                                <div className="font-bold">{resolvedAdvanceAmount !== null ? "Required Advance Booking" : "Delivery Fee Only"}</div>
                                <div className="text-xs text-zinc-500">
                                  Requires {formatPrice(resolvedAdvanceAmount ?? deliveryFee)}
                                </div>
                              </div>
                              <div className="font-bold px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-600 rounded-lg">
                                {formatPrice(resolvedAdvanceAmount ?? deliveryFee)}
                              </div>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (userCoins < total) {
                                notify(
                                  `Not enough balance. You need ${formatPrice(total - userCoins)} more.`,
                                  "error",
                                );
                                navigate("/deposit", { state: { requiredDeposit: total - userCoins } });
                                return;
                              }
                              setAdvanceType("full");
                            }}
                            className={cn(
                              "flex items-center justify-between p-4 border-2 rounded-xl text-left",
                              advanceType === "full" || isForeign
                                ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10"
                                : "border-zinc-200 dark:border-zinc-800",
                            )}
                          >
                            <div>
                              <div className="font-bold">Full Payment</div>
                              <div className="text-xs text-zinc-500">
                                Requires {formatPrice(total)}
                              </div>
                            </div>
                            <div className="font-bold px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-600 rounded-lg">
                              {formatPrice(total)}
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentType === "advance" && (
                    <div className="flex flex-col gap-6 mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-6 animate-in fade-in slide-in-from-top-4">
                      
                      {/* Advance Details Info */}
                      <div className="flex flex-col gap-4 border-2 border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-500/20 p-5 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400">
                          <div className="bg-indigo-600 dark:bg-indigo-500 text-white rounded-full p-0.5">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                          <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                             <Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                             Advance Payment
                          </span>
                        </div>
                        <div className="space-y-3">
                           <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">Advance Digital Payment</p>
                           <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                             <li>You can securely pay via bKash or Nagad.</li>
                             <li>Paying advance confirms your order immediately for faster processing.</li>
                             <li>Please do not share your bank OTP or PIN with anyone.</li>
                             <li>Save your transaction ID or take a screenshot for your reference.</li>
                           </ul>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-base text-zinc-900 dark:text-zinc-100">
                          Select Amount to Pay Now
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {!isForeign && (
                            <button
                              onClick={() => setAdvanceType("delivery")}
                              className={cn(
                                "flex items-center justify-between p-4 border-2 rounded-xl text-left",
                                advanceType === "delivery"
                                  ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 dark:bg-emerald-900/10"
                                  : "border-zinc-200 dark:border-zinc-800",
                              )}
                            >
                              <div>
                                <div className="font-bold">{resolvedAdvanceAmount !== null ? "Required Advance Booking" : "Delivery Fee Only"}</div>
                                <div className="text-xs text-zinc-500">
                                  Pay rest on arrival
                                </div>
                              </div>
                              <div className="font-bold px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                {formatPrice(resolvedAdvanceAmount ?? deliveryFee)}
                              </div>
                            </button>
                          )}
                          <button
                            onClick={() => setAdvanceType("full")}
                            className={cn(
                              "flex items-center justify-between p-4 border-2 rounded-xl text-left",
                              advanceType === "full" || isForeign
                                ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/50 dark:bg-emerald-900/10"
                                : "border-zinc-200 dark:border-zinc-800",
                            )}
                          >
                            <div>
                              <div className="font-bold">Full Payment</div>
                              <div className="text-xs text-zinc-500">
                                Secure entire order
                              </div>
                            </div>
                            <div className="font-bold px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                              {formatPrice(total)}
                            </div>
                          </button>
                        </div>
                      </div>


                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-4 pb-2">
                  <Button
                    variant="ghost"
                    className="text-xs sm:text-sm px-2 sm:px-4"
                    onClick={prevStep}
                  >
                    <ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    disabled={!validateStep(2)}
                    size="default"
                    className="text-xs sm:text-sm px-4 sm:px-6"
                  >
                    {paymentType === "advance" ? "Checkout" : "Review Order"}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <Card className="rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-2">
                <CardHeader>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    <Check className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />{" "}
                    Review Your Order
                  </h2>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-zinc-500">Shipping Details</Label>
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-sm font-medium">
                        <p>
                          {
                            savedAddresses.find(
                              (a) => a.id === selectedAddressId,
                            )?.name
                          }
                        </p>
                        <p>
                          {
                            savedAddresses.find(
                              (a) => a.id === selectedAddressId,
                            )?.phone
                          }
                        </p>
                        <p className="mt-2">
                          {
                            savedAddresses.find(
                              (a) => a.id === selectedAddressId,
                            )?.address
                          }
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-500">{t('Payment Details') || 'Payment Details'}</Label>
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-sm font-medium">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {paymentType === "cod"
                            ? "Cash on Delivery"
                            : paymentType === "vgcoin"
                              ? `VG Coins (${advanceType})`
                              : `${bankingMethod?.toUpperCase()} (${advanceType})`}
                        </p>
                        {paymentType === "advance" && (
                          <p className="mt-2 text-zinc-500">
                            TrxID: {bankingTrxId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(c) => setAgreeToTerms(!!c)}
                    />
                    <Label
                      htmlFor="terms"
                      className="text-sm font-bold leading-snug cursor-pointer mt-0.5"
                    >
                      I agree to the{" "}
                      <span className="underline text-zinc-800 dark:text-zinc-200">
                        Terms of Service
                      </span>{" "}
                      and{" "}
                      <span className="underline text-zinc-800 dark:text-zinc-200">
                        Privacy Policy
                      </span>
                      . Note: Returns are subjective to warranty policies.
                    </Label>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-row justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-4 pb-2 sm:gap-4 gap-2">
                  <Button
                    variant="ghost"
                    className="text-xs sm:text-sm px-2 sm:px-4"
                    onClick={prevStep}
                  >
                    <ChevronLeft className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Back
                  </Button>
                  <Button
                    onClick={placeOrder}
                    disabled={!validateStep(3) || isLoading}
                    size="default"
                    className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-lg shadow-black/10 dark:shadow-white/10 text-white dark:text-zinc-900 border-0 text-xs sm:text-sm px-4 sm:px-6 flex-1 sm:flex-none"
                  >
                    <Lock className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> {paymentType === 'advance' ? (t('Checkout & Pay') || 'Checkout & Pay') : (t('Place Order') || 'Complete Order')}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <Card className="rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <CardHeader className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="text-zinc-500 w-5 h-5" /> {t('Order Summary') || 'Order Summary'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-16 h-16 shrink-0 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 p-1">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                        />
                        <span className="absolute -top-2 -right-2 bg-zinc-900 text-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shadow-sm">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </div>
                        <div className="font-bold text-sm text-zinc-500 mt-1">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  {!appliedPromo ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => setShowCouponsModal(true)}
                          variant="outline"
                          className="w-full text-xs font-bold border-dashed border-zinc-300 dark:border-zinc-700 h-10 flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800"
                        >
                          <Ticket className="w-4 h-4" /> Select a Voucher
                        </Button>
                      </div>

                      <div className="flex items-center gap-4 px-2">
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400">
                          OR
                        </span>
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter Promo/Affiliate Code"
                            value={couponCode}
                            onChange={(e) =>
                              setCouponCode(e.target.value.toUpperCase())
                            }
                            className="h-10 text-xs"
                          />
                          <Button
                            onClick={applyPromo}
                            variant="outline"
                            size="sm"
                            className="h-10 text-xs shrink-0"
                          >
                            Apply
                          </Button>
                        </div>
                        {couponError && (
                          <div className="text-xs font-bold text-red-500">
                            {couponError}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/20 rounded-xl">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                            {appliedPromo.code}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-medium ml-6">
                          -
                          {appliedPromo.type === "percent"
                            ? `${appliedPromo.discount}%`
                            : `${formatPrice(appliedPromo.discount)}`}{" "}
                          OFF
                        </span>
                      </div>
                      <button
                        onClick={removePromo}
                        className="text-zinc-500 hover:text-red-500 bg-white dark:bg-zinc-800 rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {showCouponsModal && (
                  <div
                    className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowCouponsModal(false)}
                  >
                    <div
                      className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-6 pb-12 md:pb-6 shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                            My Vouchers
                          </h3>
                          <p className="text-xs text-zinc-500">
                            Select a voucher to apply to this order
                          </p>
                        </div>
                        <button
                          onClick={() => setShowCouponsModal(false)}
                          className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
                        {claimedCouponsList
                          .filter(
                            (c) => !(c.expiresAt && c.expiresAt < Date.now()),
                          )
                          .map((c, i) => {
                            const minMet =
                              !c.minOrderAmount || subtotal >= c.minOrderAmount;
                            return (
                              <div
                                key={i}
                                className={`relative rounded-xl border flex overflow-hidden ${minMet ? "border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900" : "border-zinc-200 bg-zinc-50 dark:bg-zinc-800/50 opacity-60"}`}
                              >
                                <div
                                  className={`w-[80px] flex flex-col justify-center items-center p-3 text-white ${minMet ? "bg-amber-500" : "bg-zinc-400 dark:bg-zinc-600"}`}
                                >
                                  <span className="text-xl font-black">
                                    {c.type === "percent"
                                      ? `${c.discount}%`
                                      : `${formatPrice(c.discount)}`}
                                  </span>
                                  <span className="text-[10px] font-bold">
                                    OFF
                                  </span>
                                </div>
                                <div className="flex-1 p-3 flex flex-col justify-center bg-white dark:bg-zinc-900">
                                  <div className="font-bold text-sm mb-0.5">
                                    {c.code}
                                  </div>
                                  <div className="text-[10px] text-zinc-500">
                                    {c.minOrderAmount > 0
                                      ? `Min purchase ${formatPrice(c.minOrderAmount)}`
                                      : "No minimum"}
                                  </div>
                                  {!minMet && (
                                    <div className="text-[10px] text-red-500 font-bold mt-1">
                                      Need {formatPrice(c.minOrderAmount - subtotal)} more
                                    </div>
                                  )}
                                </div>
                                <button
                                  disabled={!minMet}
                                  onClick={() => {
                                    setAppliedPromo({
                                      id: c.id,
                                      ...c,
                                      isVoucher: true,
                                    });
                                    setCouponCode(c.code);
                                    setShowCouponsModal(false);
                                    notify("Voucher applied!", "success");
                                  }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold px-4 py-2 rounded-full disabled:hidden"
                                >
                                  Use
                                </button>
                              </div>
                            );
                          })}
                        {claimedCouponsList.length === 0 && (
                          <div className="text-center py-10">
                            <Ticket className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                            <p className="text-sm font-medium text-zinc-500">
                              You don't have any vouchers
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-sm font-medium">
                  <div className="flex justify-between text-zinc-500">
                    <span>{t('Subtotal') || 'Subtotal'}</span>
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-zinc-800 dark:text-zinc-200 font-bold">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-500">
                    <span>{t('Delivery Fee') || 'Shipping'}</span>
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {formatPrice(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-500 font-bold">{t('Total') || 'Total'}</span>
                    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <CustomSectionEmbed location="checkout_bottom" />
    </div>
  );
}
