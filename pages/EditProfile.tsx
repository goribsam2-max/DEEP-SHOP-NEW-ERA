import React, { useState, useEffect, useId, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNotify } from "../components/Notifications";
import { uploadToImgbb } from "../services/imgbb";
import { useCharacterLimit } from "../components/hooks/use-character-limit";
import { useImageUpload } from "../components/hooks/use-image-upload";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Check, ImagePlus, X, ChevronLeft, Loader2 } from "lucide-react";

export default function EditProfile() {
  const navigate = useNavigate();
  const notify = useNotify();
  const id = useId();
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  
  // Use custom image hook for states, but we'll also handle the firebase integration.
  const [defaultAvatar, setDefaultAvatar] = useState("");
  const [defaultBg, setDefaultBg] = useState("");

  const maxLength = 180;
  const {
    value: bio,
    characterCount,
    handleChange: handleBioChange,
    maxLength: limit,
  } = useCharacterLimit({
    maxLength,
    initialValue: "",
  });

  const {
    previewUrl: bgPreview,
    fileInputRef: bgInputRef,
    handleThumbnailClick: handleBgClick,
    handleFileChange: handleBgChange,
    handleRemove: handleBgRemove,
  } = useImageUpload();

  const {
    previewUrl: avatarPreview,
    fileInputRef: avatarInputRef,
    handleThumbnailClick: handleAvatarClick,
    handleFileChange: handleAvatarChange,
  } = useImageUpload();

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const d = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (d.exists()) {
          const data = d.data();
          const nameParts = (data.displayName || "").split(" ");
          setFirstName(nameParts[0] || "");
          setLastName(nameParts.slice(1).join(" ") || "");
          setUsername(data.username || "");
          setWebsite(data.website || "");
          // Initialize bio using synthetic event
          handleBioChange({ target: { value: data.bio || "" } } as any);
          setDefaultAvatar(data.photoURL || "");
          setDefaultBg(data.profileBg || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop");
        }
      } else {
          navigate("/");
      }
      setLoading(false);
    };
    fetchUserData();
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setUpdating(true);

    try {
      let finalAvatarUrl = defaultAvatar;
      let finalBgUrl = defaultBg;

      // the previewURL is localObjectURL, so if they changed, we must upload the ACTUAL file from the ref
      if (avatarInputRef.current?.files?.[0]) {
        notify("Uploading avatar...", "info");
        finalAvatarUrl = await uploadToImgbb(avatarInputRef.current.files[0]);
      }

      if (bgInputRef.current?.files?.[0]) {
        notify("Uploading background...", "info");
        // if user uploaded new
        finalBgUrl = await uploadToImgbb(bgInputRef.current.files[0]);
      } else if (!bgPreview && !defaultBg) { // user removed bg
        finalBgUrl = "";
      }

      const newDisplayName = `${firstName} ${lastName}`.trim();

      await updateProfile(auth.currentUser, { 
          displayName: newDisplayName,
          photoURL: finalAvatarUrl
      });

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        displayName: newDisplayName,
        username,
        website,
        bio,
        photoURL: finalAvatarUrl,
        profileBg: finalBgUrl
      });

      notify("Profile updated successfully!", "success");
      navigate("/profile");
    } catch (err) {
      notify("Failed to update profile", "error");
    } finally {
      setUpdating(false);
    }
  };

  const [hideDefaultBg, setHideDefaultBg] = useState(false);
  const currentBgImage = bgPreview || (!hideDefaultBg ? defaultBg : null);

  const onBgRemove = () => {
    handleBgRemove();
    setHideDefaultBg(true);
    setDefaultBg("");
  };

  const currentAvatarImage = avatarPreview || defaultAvatar || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=000&color=fff`;

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-inter pb-20">
      <div className="max-w-2xl mx-auto md:py-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 md:px-0 mb-4">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Edit Profile</h1>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-none md:rounded-2xl border-y md:border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {/* Background Image Upload */}
            <div className="h-48 md:h-64 relative group">
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-muted">
                    {currentBgImage ? (
                    <img
                        className="h-full w-full object-cover"
                        src={currentBgImage}
                        alt="Profile background"
                    />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-tr from-zinc-200 to-zinc-400 dark:from-zinc-800 dark:to-zinc-700" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                        <button
                            type="button"
                            className="z-10 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-offset-2 transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
                            onClick={handleBgClick}
                        >
                            <ImagePlus size={16} strokeWidth={2} />
                        </button>
                        {(currentBgImage) && (
                            <button
                            type="button"
                            className="z-10 flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white outline-offset-2 transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
                            onClick={onBgRemove}
                            >
                            <X size={16} strokeWidth={2} />
                            </button>
                        )}
                    </div>
                </div>
                <input
                    type="file"
                    ref={bgInputRef}
                    onChange={handleBgChange}
                    className="hidden"
                    accept="image/*"
                />
            </div>

            {/* Avatar Upload */}
            <div className="-mt-16 px-6 sm:px-10 relative z-20 mb-6">
                <div className="relative inline-flex flex-col group">
                    <div className="relative flex size-32 items-center justify-center overflow-hidden rounded-full border-4 border-white dark:border-zinc-900 bg-muted shadow-lg">
                        <img
                            src={currentAvatarImage}
                            className="h-full w-full object-cover"
                            alt="Avatar"
                        />
                        <button
                            type="button"
                            className="absolute inset-0 m-auto flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70"
                            onClick={handleAvatarClick}
                        >
                            <ImagePlus size={18} strokeWidth={2} />
                        </button>
                        <input
                            type="file"
                            ref={avatarInputRef}
                            onChange={handleAvatarChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="px-6 sm:px-10 pb-10">
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="flex flex-col gap-6 sm:flex-row">
                        <div className="flex-1 space-y-2">
                        <Label htmlFor={`${id}-first-name`}>First name</Label>
                        <Input
                            id={`${id}-first-name`}
                            placeholder="Matt"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            type="text"
                            required
                        />
                        </div>
                        <div className="flex-1 space-y-2">
                        <Label htmlFor={`${id}-last-name`}>Last name</Label>
                        <Input
                            id={`${id}-last-name`}
                            placeholder="Welsh"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            type="text"
                            required
                        />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${id}-username`}>Username</Label>
                        <div className="relative">
                        <Input
                            id={`${id}-username`}
                            className="peer pe-9"
                            placeholder="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            type="text"
                        />
                        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
                            {username.length > 2 && <Check size={16} strokeWidth={2} className="text-emerald-500" aria-hidden="true" />}
                        </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${id}-website`}>Website</Label>
                        <div className="flex rounded-lg shadow-sm shadow-black/5">
                        <span className="z-10 inline-flex items-center rounded-s-lg border border-input bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-muted-foreground">
                            https://
                        </span>
                        <Input
                            id={`${id}-website`}
                            className="-ms-px rounded-s-none shadow-none"
                            placeholder="yourwebsite.com"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            type="text"
                        />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`${id}-bio`}>Biography</Label>
                        <Textarea
                        id={`${id}-bio`}
                        placeholder="Write a few sentences about yourself"
                        value={bio}
                        maxLength={maxLength}
                        onChange={handleBioChange}
                        aria-describedby={`${id}-description`}
                        />
                        <p
                        id={`${id}-description`}
                        className="mt-2 text-right text-xs text-muted-foreground tabular-nums flex items-center justify-end"
                        >
                        {limit - characterCount} characters left
                        </p>
                    </div>

                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={updating}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updating}>
                            {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {updating ? "Saving..." : "Save changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}
