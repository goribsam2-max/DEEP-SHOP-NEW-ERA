"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { cn } from "../lib/utils";

const steps = [
  { id: "personal", title: "Personal Info" },
  { id: "social", title: "Social Reach" },
  { id: "strategy", title: "Strategy" },
  { id: "agreement", title: "Agreement" },
];

export interface AffiliateFormData {
  fullName: string;
  phone: string;
  email: string;
  platform: string;
  socialUrl: string;
  followerCount: string;
  promotionMethod: string[];
  primaryAudience: string;
  additionalInfo: string;
  agreeToTerms: boolean;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const contentVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
};

export const AffiliateOnboardingForm = ({
  initialData,
  onSubmit,
  isSubmitting,
}: {
  initialData: { fullName: string; phone: string; email: string };
  onSubmit: (data: AffiliateFormData) => void;
  isSubmitting: boolean;
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AffiliateFormData>({
    fullName: initialData.fullName || "",
    phone: initialData.phone || "",
    email: initialData.email || "",
    platform: "",
    socialUrl: "",
    followerCount: "",
    promotionMethod: [],
    primaryAudience: "",
    additionalInfo: "",
    agreeToTerms: false,
  });

  const updateFormData = (field: keyof AffiliateFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMethod = (method: string) => {
    setFormData((prev) => {
      const methods = [...prev.promotionMethod];
      if (methods.includes(method)) {
        return { ...prev, promotionMethod: methods.filter((m) => m !== method) };
      } else {
        return { ...prev, promotionMethod: [...methods, method] };
      }
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.fullName.trim() !== "" && formData.phone.trim() !== "";
      case 1:
        return formData.platform !== "" && formData.socialUrl.trim() !== "" && formData.followerCount !== "";
      case 2:
        return formData.promotionMethod.length > 0;
      case 3:
        return formData.agreeToTerms;
      default:
        return true;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      {/* Progress indicator */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className={cn(
                  "w-4 h-4 rounded-full cursor-pointer transition-colors duration-300",
                  index < currentStep
                    ? "bg-zinc-900 dark:bg-white"
                    : index === currentStep
                      ? "bg-zinc-900 dark:bg-white ring-4 ring-zinc-900/20 dark:ring-white/20"
                      : "bg-zinc-200 dark:bg-zinc-800",
                )}
                onClick={() => {
                  if (index <= currentStep) {
                    setCurrentStep(index);
                  }
                }}
                whileTap={{ scale: 0.95 }}
              />
              <motion.span
                className={cn(
                  "text-xs mt-1.5 hidden sm:block",
                  index === currentStep
                    ? "text-zinc-900 dark:text-white font-medium"
                    : "text-zinc-500 dark:text-zinc-400",
                )}
              >
                {step.title}
              </motion.span>
            </motion.div>
          ))}
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
          <motion.div
            className="h-full bg-zinc-900 dark:bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border shadow-md rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
              >
                {/* Step 1: Personal Info */}
                {currentStep === 0 && (
                  <>
                    <CardHeader>
                      <CardTitle>Tell us about yourself</CardTitle>
                      <CardDescription>
                        We need some basic info to get started.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          placeholder="John Doe"
                          value={formData.fullName}
                          onChange={(e) =>
                            updateFormData("fullName", e.target.value)
                          }
                          className="transition-all duration-300 focus:ring-2 focus:ring-zinc-900/20"
                        />
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="01XXXXXXXXX"
                          value={formData.phone}
                          onChange={(e) =>
                            updateFormData("phone", e.target.value)
                          }
                          className="transition-all duration-300 focus:ring-2 focus:ring-zinc-900/20"
                        />
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          disabled
                          className="bg-zinc-100 dark:bg-zinc-800/50 cursor-not-allowed text-zinc-500"
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 2: Social Media Reach */}
                {currentStep === 1 && (
                  <>
                    <CardHeader>
                      <CardTitle>Your Audience</CardTitle>
                      <CardDescription>
                        Where will you be promoting our products?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="platform">
                          Primary Platform
                        </Label>
                        <Select
                          value={formData.platform}
                          onValueChange={(value) =>
                            updateFormData("platform", value)
                          }
                        >
                          <SelectTrigger
                            id="platform"
                            className="transition-all duration-300 focus:ring-2 focus:ring-zinc-900/20"
                          >
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="website">Website / Blog</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="socialUrl">
                          Profile / Channel / Website URL
                        </Label>
                        <Input
                          id="socialUrl"
                          placeholder={
                            formData.platform === 'tiktok' ? "https://tiktok.com/@yourprofile" : 
                            formData.platform === 'youtube' ? "https://youtube.com/@yourchannel" : 
                            formData.platform === 'facebook' ? "https://facebook.com/yourpage" : 
                            "https://instagram.com/yourprofile"
                          }
                          value={formData.socialUrl}
                          onChange={(e) =>
                            updateFormData("socialUrl", e.target.value)
                          }
                          className="transition-all duration-300 focus:ring-2 focus:ring-zinc-900/20"
                        />
                      </motion.div>

                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label htmlFor="followerCount">
                          Audience Size
                        </Label>
                        <Select
                          value={formData.followerCount}
                          onValueChange={(value) =>
                            updateFormData("followerCount", value)
                          }
                        >
                          <SelectTrigger
                            id="followerCount"
                            className="transition-all duration-300 focus:ring-2 focus:ring-zinc-900/20"
                          >
                            <SelectValue placeholder="Select audience size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="under-1k">Under 1k</SelectItem>
                            <SelectItem value="1k-10k">1k - 10k</SelectItem>
                            <SelectItem value="10k-50k">10k - 50k</SelectItem>
                            <SelectItem value="50k-100k">50k - 100k</SelectItem>
                            <SelectItem value="100k+">100k+</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 3: Marketing Strategy */}
                {currentStep === 2 && (
                  <>
                    <CardHeader>
                      <CardTitle>Strategy</CardTitle>
                      <CardDescription>
                        How do you plan to refer customers to our store?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div variants={fadeInUp} className="space-y-2">
                        <Label>Select your promotion methods</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            "Product Reviews & Unboxings",
                            "Social Media Stories & Reels",
                            "Blog Posts & Articles",
                            "Discount / Coupon Sites",
                            "Direct Recommendations",
                          ].map((method, index) => (
                            <motion.div
                              key={method}
                              className="flex items-center space-x-3 rounded-md border p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              transition={{ duration: 0.2 }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                  delay: 0.05 * index,
                                  duration: 0.3,
                                },
                              }}
                              onClick={() => toggleMethod(method)}
                            >
                              <Checkbox
                                id={`method-${index}`}
                                checked={formData.promotionMethod.includes(method)}
                                onCheckedChange={() => toggleMethod(method)}
                              />
                              <Label
                                htmlFor={`method-${index}`}
                                className="cursor-pointer w-full text-sm font-medium"
                              >
                                {method}
                              </Label>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                      <motion.div variants={fadeInUp} className="space-y-2 pt-2">
                        <Label htmlFor="additionalInfo">
                          Additional Strategy Details (Optional)
                        </Label>
                        <Textarea
                          id="additionalInfo"
                          placeholder="Tell us a bit more about how you plan to share your affiliate code..."
                          value={formData.additionalInfo}
                          onChange={(e) =>
                            updateFormData("additionalInfo", e.target.value)
                          }
                          className="min-h-[80px] transition-all duration-300 focus:ring-2 focus:ring-zinc-900/20"
                        />
                      </motion.div>
                    </CardContent>
                  </>
                )}

                {/* Step 4: Agreement */}
                {currentStep === 3 && (
                  <>
                    <CardHeader>
                      <CardTitle>Terms & Agreement</CardTitle>
                      <CardDescription>
                        Review our affiliate terms before joining
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      
                      <motion.div variants={fadeInUp} className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-600 dark:text-zinc-400 space-y-4">
                        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Affiliate Program Rules:</h4>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>You will receive a unique code to share with your audience giving them 5% OFF.</li>
                          <li>You will earn a commission per successful (delivered) order placed using your code.</li>
                          <li>Commission drops to your wallet automatically and can be withdrawn.</li>
                          <li>Any fraudulent activity or fake orders will result in an immediate ban.</li>
                        </ul>
                      </motion.div>

                      <motion.div variants={fadeInUp} className="pt-4 flex items-start space-x-3">
                         <Checkbox
                            id="terms"
                            checked={formData.agreeToTerms}
                            onCheckedChange={(checked) => updateFormData("agreeToTerms", checked)}
                            className="mt-1"
                          />
                          <Label
                            htmlFor="terms"
                            className="cursor-pointer text-sm font-medium leading-loose"
                          >
                            I confirm that all the information provided is accurate and I agree to the Affiliate Terms and Conditions.
                          </Label>
                      </motion.div>

                    </CardContent>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <CardFooter className="flex justify-end p-6 sm:px-8 border-t border-zinc-100 dark:border-zinc-800">
              {currentStep > 0 && false && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex items-center gap-1 transition-all duration-300 rounded-xl"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                </motion.div>
              )}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  onClick={
                    currentStep === steps.length - 1 ? handleSubmit : nextStep
                  }
                  disabled={!isStepValid() || isSubmitting}
                  className={cn(
                    "flex items-center gap-1 transition-all duration-300 rounded-xl px-6",
                    currentStep === steps.length - 1 ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black" : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black",
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...
                    </>
                  ) : (
                    <>
                      {currentStep === steps.length - 1 ? "Submit Application" : "Continue"}
                      {currentStep === steps.length - 1 ? (
                         <></>
                      ) : (
                        <ChevronRight className="h-4 w-4 ml-1" />
                      )}
                    </>
                  )}
                </Button>
              </motion.div>
            </CardFooter>
          </div>
        </Card>
      </motion.div>

    </div>
  );
};
