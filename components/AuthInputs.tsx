import React, { useState, useRef, useEffect } from "react";
import { Input } from "./ui/input";
import { AtSign, Phone, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

const ALLOWED_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com"];
const COUNTRY_CODES = [
  {
    code: "+880",
    name: "Bangladesh",
    flag: (
      <svg
        className="w-5 h-auto rounded-sm shrink-0"
        viewBox="0 0 30 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="30" height="20" fill="#F5F5F5" />
        <path d="M30 0H0V20H30V0Z" fill="#496E2D" />
        <path
          d="M12.8266 14.3477C15.228 14.3477 17.1746 12.401 17.1746 9.99969C17.1746 7.59835 15.228 5.65167 12.8266 5.65167C10.4252 5.65167 8.47852 7.59835 8.47852 9.99969C8.47852 12.401 10.4252 14.3477 12.8266 14.3477Z"
          fill="#D80027"
        />
      </svg>
    ),
  },
  {
    code: "+91",
    name: "India",
    flag: (
      <svg
        className="w-5 h-auto rounded-sm shrink-0"
        viewBox="0 0 30 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="30" height="20" fill="#F5F5F5" />
        <path d="M30 0H0V20H30V0Z" fill="#F0F0F0" />
        <path d="M30 0H0V6.66665H30V0Z" fill="#FF9811" />
        <path d="M30 13.3334H0V20H30V13.3334Z" fill="#6DA544" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M15 7.5C16.3807 7.5 17.5 8.61929 17.5 10C17.5 11.3807 16.3807 12.5 15 12.5C13.6193 12.5 12.5 11.3807 12.5 10C12.5 8.61929 13.6193 7.5 15 7.5ZM13.7373 10.9189C13.9909 11.2669 14.384 11.5064 14.835 11.5537L14.5176 10.835L13.7373 10.9189ZM15.1641 11.5537C15.6152 11.5066 16.0079 11.2669 16.2617 10.9189L15.4814 10.835L15.1641 11.5537ZM13.5723 9.36621C13.4861 9.56 13.4375 9.77425 13.4375 10C13.4375 10.2254 13.4864 10.4392 13.5723 10.6328L14.0361 10L13.5723 9.36621ZM15.9639 10L16.4268 10.6328C16.5128 10.4391 16.5625 10.2256 16.5625 10C16.5625 9.7741 16.513 9.5601 16.4268 9.36621L15.9639 10ZM14.835 8.44531C14.3843 8.49261 13.991 8.73251 13.7373 9.08008L14.5176 9.16504L14.835 8.44531ZM15.4814 9.16504L16.2617 9.08008C16.0079 8.73251 15.615 8.49233 15.1641 8.44531L15.4814 9.16504Z"
          fill="#0052B4"
        />
      </svg>
    ),
  },
  {
    code: "+92",
    name: "Pakistan",
    flag: (
      <svg
        className="w-5 h-auto rounded-sm shrink-0"
        viewBox="0 0 30 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="30" height="20" fill="#F5F5F5" />
        <path
          d="M23.0581 4.99121L24.0842 6.09715L25.4531 5.46312L24.7183 6.7807L25.7444 7.8867L24.2642 7.59502L23.5295 8.91266L23.3494 7.41479L21.8691 7.12312L23.2381 6.48914L23.0581 4.99121Z"
          fill="#F0F0F0"
        />
        <path d="M30 0.000732422H0V20H30V0.000732422Z" fill="#F0F0F0" />
        <path d="M30 0H7.5V19.9999H30V0Z" fill="#496E2D" />
        <path
          d="M21.2046 12.5074C19.3861 13.8214 16.8465 13.4124 15.5325 11.5938C14.2184 9.7752 14.6275 7.23572 16.4462 5.92178C17.0132 5.51209 17.6503 5.26993 18.2985 5.18567C17.0514 4.99917 15.7334 5.28018 14.6306 6.07693C12.3924 7.69421 11.8889 10.8197 13.5062 13.058C15.1234 15.2962 18.249 15.7997 20.4873 14.1823C21.5901 13.3856 22.2707 12.2225 22.4851 10.9799C22.2016 11.5688 21.7717 12.0976 21.2046 12.5074Z"
          fill="#F0F0F0"
        />
        <path
          d="M21.1282 5.13025L22.1527 6.23426L23.5192 5.60134L22.7857 6.91657L23.8101 8.0207L22.3324 7.72961L21.5988 9.04502L21.4191 7.54967L19.9414 7.25852L21.308 6.6256L21.1282 5.13025Z"
          fill="#F0F0F0"
        />
      </svg>
    ),
  },
];

interface AuthInputsProps {
  authType: "email" | "phone";
  setAuthType: (type: "email" | "phone") => void;
  email: string;
  setEmail: (val: string) => void;
  countryCode: string;
  setCountryCode: (val: string) => void;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
}

export const AuthInputs: React.FC<AuthInputsProps> = ({
  authType,
  setAuthType,
  email,
  setEmail,
  countryCode,
  setCountryCode,
  phoneNumber,
  setPhoneNumber,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getEmailSuggestions = () => {
    if (!email) return [];
    if (email.includes("@")) {
      const [username, domainPart] = email.split("@");
      if (!username) return [];
      return ALLOWED_DOMAINS.filter((d) => d.startsWith(domainPart)).map(
        (d) => `${username}@${d}`,
      );
    }
    return ALLOWED_DOMAINS.map((d) => `${email}@${d}`);
  };

  const suggestions = getEmailSuggestions();
  const selectedCountry =
    COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

  return (
    <div className="space-y-3">
      <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 pl-1 rounded-xl">
        <button
          type="button"
          onClick={() => setAuthType("email")}
          className={cn(
            "flex-1 text-xs font-semibold py-2 rounded-lg transition-colors",
            authType === "email"
              ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
          )}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setAuthType("phone")}
          className={cn(
            "flex-1 text-xs font-semibold py-2 rounded-lg transition-colors",
            authType === "phone"
              ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300",
          )}
        >
          Phone Number
        </button>
      </div>

      {authType === "email" ? (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Email Address
          </label>
          <div className="relative h-max" ref={containerRef}>
            <Input
              placeholder="name@gmail.com"
              className="peer ps-10 h-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              required
            />
            <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3.5 peer-disabled:opacity-50">
              <AtSign className="size-4" aria-hidden="true" />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                    onClick={() => {
                      setEmail(suggestion);
                      setShowSuggestions(false);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-[10px] text-zinc-500 pl-1">
            Real emails only (Gmail, Yahoo, Outlook, iCloud)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Phone Number
          </label>
          <div className="flex gap-2 relative">
            <div className="relative" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className="h-12 px-3 flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none"
              >
                {selectedCountry.flag}
                <span className="text-zinc-800 dark:text-zinc-200">
                  {selectedCountry.code}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-0.5" />
              </button>

              {showCountryDropdown && (
                <div className="absolute z-20 w-[180px] top-full left-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  {COUNTRY_CODES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCountryCode(c.code);
                        setShowCountryDropdown(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors text-left",
                        countryCode === c.code
                          ? "bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
                      )}
                    >
                      {c.flag}
                      <div className="flex flex-col">
                        <span className="text-[13px] leading-tight">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-zinc-500 leading-tight">
                          {c.code}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative h-max flex-1">
              <Input
                placeholder={
                  countryCode === "+880"
                    ? "17xxxxxxxx"
                    : countryCode === "+91"
                      ? "9xxxxxxxxx"
                      : "3xxxxxxxxx"
                }
                className="peer ps-10 h-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl flex-1 w-full"
                type="tel"
                value={phoneNumber}
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/\D/g, ""))
                }
                required
              />
              <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3.5 peer-disabled:opacity-50">
                <Phone className="size-4" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
