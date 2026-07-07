import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useNotify } from '../../components/Notifications';
import { uploadToImgbb } from '../../services/imgbb';
import { Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';
import { getDocs, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const ManagePushNotifications: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const notify = useNotify();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSend = async () => {
    if (!title || !body) {
      notify('Title and Description are required', 'error');
      return;
    }
    
    setLoading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadToImgbb(imageFile);
      }

      // call backend endpoint to dispatch Push / FCM
      const usersSnap = await getDocs(collection(db, "users"));
      const fcmTokens = usersSnap.docs.map((doc: any) => doc.data().fcmToken).filter(Boolean);
      
      const userSubscriptions = usersSnap.docs.map((doc: any) => doc.data().webPushSub).filter(Boolean);

      

      const res = await fetch('/api/send-push-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           title, body, image: imageUrl, link,
           fcmTokens, subscriptions: userSubscriptions
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send');
      }

      // Log success to push_notifications collection
      await addDoc(collection(db, "push_notifications"), {
        title,
        body,
        image: imageUrl || "",
        link: link || "",
        sentAt: serverTimestamp(),
        successCount: data.tokensCount || 0
      });

      notify(`Push notification sent successfully to ${data.tokensCount || 0} users!`, 'success');
      setTitle('');
      setBody('');
      setLink('');
      setImageFile(null);
      setImagePreview('');

    } catch (err: any) {
      notify(err.message || 'Error sending push notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
         <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Push Notifications</h1>
         <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Send web push notifications to all registered users.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="E.g., Mega Sale Alert!" 
              className="bg-white dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description (Body)</label>
            <Textarea 
              value={body} 
              onChange={e => setBody(e.target.value)} 
              placeholder="E.g., Get 50% off on all accessories today." 
              className="bg-white dark:bg-zinc-900"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notification Link (Optional)</label>
            <Input 
              value={link} 
              onChange={e => setLink(e.target.value)} 
              placeholder="E.g., /product/123 or https://..." 
              className="bg-white dark:bg-zinc-900"
            />
          </div>

          <div>
             <label className="block text-sm font-medium mb-1">Attached Image (Optional)</label>
             <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  id="notif-image" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
                <label 
                  htmlFor="notif-image" 
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-md cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                >
                  <ImageIcon size={18} />
                  <span className="text-sm font-medium">Upload Image</span>
                </label>
             </div>
             {imagePreview && (
                <div className="mt-4 relative inline-block">
                   <img src={imagePreview} className="h-32 rounded-lg object-cover" alt="Preview"/>
                   <button onClick={() => {setImageFile(null); setImagePreview('');}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs">✕</button>
                </div>
             )}
          </div>

          <div className="pt-4">
            <Button onClick={handleSend} disabled={loading} className="w-full sm:w-auto flex items-center gap-2">
               {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
               {loading ? 'Sending...' : 'Send Push Notification'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default ManagePushNotifications;
