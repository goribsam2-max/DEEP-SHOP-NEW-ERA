import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { Notification, UserProfile } from "../types";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { useFullScreenInfo } from "../components/Notifications";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function timeAgo(dateParam: Date | string | number) {
  if (!dateParam) {
    return null;
  }
  
  // if not a date object, try to parse
  const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
  const today = new Date();
  
  // @ts-ignore
  const seconds = Math.round((today - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const isToday = today.toDateString() === date.toDateString();
  
  if (seconds < 60) {
    return 'Just now';
  } else if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (isToday) {
    const hours = Math.floor(minutes / 60);
    return `${hours} hours ago`;
  }
  
  return date.toLocaleDateString();
}

function NotificationItemView({ notification, onRead }: { notification: Notification, onRead: () => void }) {
  return (
    <div 
      className="w-full py-4 px-4 sm:px-6 first:pt-4 last:pb-4 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onRead}
    >
      <div className="flex gap-3 relative">
        <Avatar className="size-11">
          <AvatarImage
            src={notification.image || undefined}
            alt="Notification image"
            className="object-cover ring-1 ring-border"
          />
          <AvatarFallback>
            <Icon
              name={notification.type === 'ticket' ? 'ticket-alt' : 'bell'}
              className="text-muted-foreground"
            />
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col space-y-2">
          <div className="w-full items-start">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="font-medium text-foreground">{notification.title}</span>
                </div>
                {!notification.isRead && (
                  <div className="size-1.5 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-8000"></div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground shrink-0 pl-1">
                  {timeAgo(notification.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {notification.message && (
            <div className="rounded-lg bg-muted p-2.5 text-sm tracking-[-0.006em] text-foreground">
              {notification.message}
            </div>
          )}

          {notification.link && (
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onRead(); }}>
                {notification.type === 'ticket' ? 'Open Ticket' : 'View Details'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const navigate = useNavigate();
  const fullScreenInfo = useFullScreenInfo();

  useEffect(() => {
    const fetchUser = async () => {
      if (!auth.currentUser) return;
      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (snap.exists()) setUserProfile(snap.data() as UserProfile);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!auth.currentUser || !userProfile) return;

    // Query notifications
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allNotifs = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Notification,
      );

      const filtered = allNotifs.filter((n) => {
        const isTargeted =
          n.userId === auth.currentUser?.uid || n.userId === "all";
        const isFresh =
          n.createdAt > (userProfile.registrationDate || userProfile.createdAt);
        return isTargeted && isFresh;
      });

      setNotifications(filtered);
      setLoading(false);
    });

    return unsubscribe;
  }, [userProfile]);

  const markAsRead = async (notif: Notification) => {
    if (!notif.isRead && notif.id) {
      try {
        await updateDoc(doc(db, "notifications", notif.id), { isRead: true });
      } catch (e) {
        console.warn("Could not mark notif as read");
      }
    }

    if (notif.variant === "approved-affiliate" || notif.title === "Affiliate Application Approved" || notif.title === "Withdrawal Completed") {
      fullScreenInfo({
        title: notif.title,
        message: notif.message,
        type: "success",
        buttonText: "Awesome",
        onClose: () => {}
      });
      return;
    }

    if (notif.variant === "rejected-affiliate" || notif.variant === "rejected-withdrawal" || notif.title === "Affiliate Application Rejected" || notif.title === "Withdrawal Rejected") {
      fullScreenInfo({
        title: notif.title,
        message: notif.message,
        type: "error",
        buttonText: "Understood",
        onClose: () => {}
      });
      return;
    }

    if (notif.link) {
      navigate(notif.link);
    } else if (notif.type === 'ticket') {
      navigate('/help-center');
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter((n) => !n.isRead && n.id);
    if (unreadNotifs.length === 0) return;
    try {
      await Promise.all(
        unreadNotifs.map((n) =>
          updateDoc(doc(db, "notifications", n.id), { isRead: true })
        )
      );
    } catch (e) {
      console.warn("Could not mark all as read");
    }
  };

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((n) => !n.isRead);
      case "tickets":
        return notifications.filter((n) => n.type === "ticket");
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const ticketCount = notifications.filter((n) => n.type === "ticket").length;

  return (
    <div className="max-w-[600px] mx-auto px-4 py-10 pb-[120px] md:pb-10 min-h-screen bg-background relative overflow-hidden flex flex-col items-center">
      

      <Card className="flex w-full flex-col gap-6 p-4 shadow-none md:p-8 relative z-10 bg-card/60 backdrop-blur-xl border-border/50">
        <CardHeader className="p-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl leading-none font-semibold tracking-tight text-foreground">
              Your notifications
            </h3>
            <div className="flex items-center gap-2">
              <Button className="size-8" variant="ghost" size="icon" onClick={markAllAsRead} title="Mark all as read">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  className="size-4.5 text-muted-foreground"
                >
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M15.493 6.935a.75.75 0 0 1 .072 1.058l-7.857 9a.75.75 0 0 1-1.13 0l-3.143-3.6a.75.75 0 0 1 1.13-.986l2.578 2.953l7.292-8.353a.75.75 0 0 1 1.058-.072m5.025.085c.3.285.311.76.025 1.06l-8.571 9a.75.75 0 0 1-1.14-.063l-.429-.563a.75.75 0 0 1 1.076-1.032l7.978-8.377a.75.75 0 0 1 1.06-.026"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
              <Button className="size-8" variant="ghost" size="icon" onClick={() => navigate('/profile')} title="Settings">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  className="size-4.5 text-muted-foreground"
                >
                  <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                    <path d="M12 8.25a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5M9.75 12a2.25 2.25 0 1 1 4.5 0a2.25 2.25 0 0 1-4.5 0" />
                    <path d="M11.975 1.25c-.445 0-.816 0-1.12.02a2.8 2.8 0 0 0-.907.19a2.75 2.75 0 0 0-1.489 1.488c-.145.35-.184.72-.2 1.122a.87.87 0 0 1-.415.731a.87.87 0 0 1-.841-.005c-.356-.188-.696-.339-1.072-.389a2.75 2.75 0 0 0-2.033.545a2.8 2.8 0 0 0-.617.691c-.17.254-.356.575-.578.96l-.025.044c-.223.385-.408.706-.542.98c-.14.286-.25.568-.29.88a2.75 2.75 0 0 0 .544 2.033c.231.301.532.52.872.734a.87.87 0 0 1 .426.726a.87.87 0 0 1-.426.726c-.34.214-.64.433-.872.734a2.75 2.75 0 0 0-.545 2.033c.041.312.15.594.29.88c.135.274.32.595.543.98l.025.044c.222.385.408.706.578.96c.177.263.367.5.617.69a2.75 2.75 0 0 0 2.033.546c.376-.05.716-.2 1.072-.389a.87.87 0 0 1 .84-.005a.86.86 0 0 1 .417.731c.015.402.054.772.2 1.122a2.75 2.75 0 0 0 1.488 1.489c.29.12.59.167.907.188c.304.021.675.021 1.12.021h.05c.445 0 .816 0 1.12-.02c.318-.022.617-.069.907-.19a2.75 2.75 0 0 0 1.489-1.488c.145-.35.184-.72.2-1.122a.87.87 0 0 1 .415-.732a.87.87 0 0 1 .841.006c.356.188.696.339 1.072.388a2.75 2.75 0 0 0 2.033-.544c.25-.192.44-.428.617-.691c.17-.254.356-.575.578-.96l.025-.044c.223-.385.408-.706.542-.98c.14-.286.25-.569.29-.88a2.75 2.75 0 0 0-.544-2.033c-.231-.301-.532-.52-.872-.734a.87.87 0 0 1-.426-.726c0-.278.152-.554.426-.726c.34-.214.64-.433.872-.734a2.75 2.75 0 0 0 .545-2.033a2.8 2.8 0 0 0-.29-.88a18 18 0 0 0-.543-.98l-.025-.044a18 18 0 0 0-.578-.96a2.8 2.8 0 0 0-.617-.69a2.75 2.75 0 0 0-2.033-.546c-.376.05-.716.2-1.072.389a.87.87 0 0 1-.84.005a.87.87 0 0 1-.417-.731c-.015-.402-.054-.772-.2-1.122a2.75 2.75 0 0 0-1.488-1.489c-.29-.12-.59-.167-.907-.188c-.304-.021-.675-.021-1.12-.021zm-1.453 1.595c.077-.032.194-.061.435-.078c.247-.017.567-.017 1.043-.017s.796 0 1.043.017c.241.017.358.046.435.078c.307.127.55.37.677.677c.04.096.073.247.086.604c.03.792.439 1.555 1.165 1.974s1.591.392 2.292.022c.316-.167.463-.214.567-.227a1.25 1.25 0 0 1 .924.247c.066.051.15.138.285.338c.139.206.299.483.537.895s.397.69.506.912c.107.217.14.333.15.416a1.25 1.25 0 0 1-.247.924c-.064.083-.178.187-.48.377c-.672.422-1.128 1.158-1.128 1.996s.456 1.574 1.128 1.996c.302.19.416.294.48.377c.202.263.29.595.247.924c-.01.083-.044.2-.15.416c-.109.223-.268.5-.506.912s-.399.689-.537.895c-.135.2-.219.287-.285.338a1.25 1.25 0 0 1-.924.247c-.104-.013-.25-.06-.567-.227c-.7-.37-1.566-.398-2.292.021s-1.135 1.183-1.165 1.975c-.013.357-.046.508-.086.604a1.25 1.25 0 0 1-.677.677c-.077.032-.194.061-.435.078c-.247.017-.567.017-1.043.017s-.796 0-1.043-.017c-.241-.017-.358-.046-.435-.078a1.25 1.25 0 0 1-.677-.677c-.04-.096-.073-.247-.086-.604c-.03-.792-.439-1.555-1.165-1.974s-1.591-.392-2.292-.022c-.316.167-.463.214-.567.227a1.25 1.25 0 0 1-.924-.247c-.066-.051-.15-.138-.285-.338a17 17 0 0 1-.537-.895c-.238-.412-.397-.69-.506-.912c-.107-.217-.14-.333-.15-.416a1.25 1.25 0 0 1 .247-.924c.064-.083.178-.187.48-.377c.672-.422 1.128-1.158 1.128-1.996s-.456-1.574-1.128-1.996c-.302-.19-.416-.294-.48-.377a1.25 1.25 0 0 1-.247-.924c.01-.083.044-.2.15-.416c.109-.223.268-.5.506-.912s.399-.689.537-.895c.135-.2.219-.287.285-.338a1.25 1.25 0 0 1 .924-.247c.104.013.25.06.567.227c.7.37 1.566.398 2.292-.022c.726-.419 1.135-1.182 1.165-1.974c.013-.357.046-.508.086-.604c.127-.307.37-.55.677-.677" />
                  </g>
                </svg>
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full flex-col justify-start"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <TabsList className="bg-transparent p-0 [&_button]:gap-1.5 justify-start gap-4">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none border-b-2 border-transparent px-1 pb-2 pt-1"
                >
                  View all
                  <Badge variant="secondary" className="ml-1 bg-muted">{notifications.length}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="unread"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none border-b-2 border-transparent px-1 pb-2 pt-1"
                >
                  Unread
                  <Badge variant="secondary" className="ml-1 bg-muted">{unreadCount}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="tickets"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none border-b-2 border-transparent px-1 pb-2 pt-1"
                >
                  Support <Badge variant="secondary" className="ml-1 bg-muted">{ticketCount}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </CardHeader>

        <CardContent className="h-full p-0">
          <div className="space-y-0 divide-y divide-dashed divide-border -mx-4 sm:mx-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                <NotificationItemView
                  key={notif.id}
                  notification={notif}
                  onRead={() => markAsRead(notif)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2.5 py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="m13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <p className="text-sm font-medium tracking-[-0.006em] text-foreground">
                  No notifications yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  New alerts will appear here after they are sent.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
};

export default NotificationsPage;
