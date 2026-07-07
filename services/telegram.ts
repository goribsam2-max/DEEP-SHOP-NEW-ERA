import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const getTelegramConfig = async () => {
  try {
    const snap = await getDoc(doc(db, "settings", "platform"));
    if (snap.exists()) {
      const data = snap.data();
      let token = data.telegramToken || "8571639361:AAEuplHuF4mh6rkaCCWoC-D_c57Iho7rM8YY";
      if (token === "8236254617:AAFFTI9j4pl6U-8-pdJgZigWb2M75oBmyzg") {
        token = "8571639361:AAEuplHuF4mh6rkaCCWoC-D_c57Iho7rM8YY";
      }
      return {
        token,
        chatIds: (data.telegramChatId || "5494141897").split(',').map((id: string) => id.trim()).filter((id: string) => id),
      };
    }
  } catch (e) {
    console.error("Failed to fetch telegram config", e);
  }
  return {
    token: "8571639361:AAEuplHuF4mh6rkaCCWoC-D_c57Iho7rM8YY",
    chatIds: ["5494141897"]
  };
};

const sendToChats = async (message: string) => {
  const { token, chatIds } = await getTelegramConfig();
  if (!token || chatIds.length === 0) return null;
  
  const results = await Promise.all(
    chatIds.map(async (chatId) => {
      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "HTML",
          }),
        });
        return await response.json();
      } catch (e) {
        console.error("Telegram send error to chat", chatId, e);
        return null;
      }
    })
  );
  return results[0];
};

export const sendSystemAlertToTelegram = async (errorMsg: string, stacktrace?: string) => {
  try {
    const message = `
<b>🚨 SYSTEM ALERT / BUG REPORT</b>
━━━━━━━━━━━━━━━━━━
<b>Message:</b> ${errorMsg}
<b>Time:</b> ${new Date().toLocaleString('en-BD')}

<b>Stacktrace / Details:</b>
<pre>${(stacktrace || 'N/A').substring(0, 500)}</pre>
━━━━━━━━━━━━━━━━━━
<b>Check System Logs!</b>
`;
    return await sendToChats(message);
  } catch (error) {
    console.error("Telegram Notification Gateway Error:", error);
    return null;
  }
};

export const sendAffiliateRequestToTelegram = async (requestData: any) => {
  try {
    const methods = Array.isArray(requestData.promotionMethod) 
      ? requestData.promotionMethod.join(', ') : 'Not provided';

    const message = `
<b>🚀 NEW AFFILIATE PROGRAM REQUEST</b>
━━━━━━━━━━━━━━━━━━
<b>👤 APPLICANT DETAILS</b>
<b>User ID:</b> <code>${requestData.userId}</code>
<b>Full Name:</b> ${requestData.fullName || requestData.userName}
<b>Email:</b> ${requestData.email}
<b>Phone:</b> <code>${requestData.phone}</code>

<b>🔗 SOCIAL MEDIA / WEBSITE</b>
<b>Platform:</b> ${requestData.platform || 'N/A'}
<b>URL:</b> <i>${requestData.socialUrl || 'Not provided'}</i>
<b>Followers:</b> ${requestData.followerCount || 'N/A'}

<b>📈 STRATEGY</b>
<b>Methods:</b> ${methods}
<b>Additional:</b> ${requestData.additionalInfo || 'None'}

<b>📅 SYSTEM INFO</b>
<b>Applied Date:</b> ${requestData.createdAt ? new Date(requestData.createdAt).toLocaleString('en-BD') : new Date().toLocaleString('en-BD')}
━━━━━━━━━━━━━━━━━━
<b>Review in Admin Panel!</b>
`;

    return await sendToChats(message);
  } catch (error) {
    console.error("Telegram Notification Gateway Error:", error);
    return null;
  }
};

export const sendOrderToTelegram = async (orderData: any) => {
  try {
    const itemsList = orderData.items
      .map((item: any) => `• ${item.name}\n  [Qty: ${item.quantity} | Price: ৳${item.priceAtPurchase}]`)
      .join("\n\n");

    const paymentDetails = `
<b>💳 PAYMENT DETAILS</b>
<b>Method:</b> ${orderData.paymentMethod}
<b>Option:</b> ${orderData.paymentOption || 'N/A'}
<b>TrxID:</b> <code>${orderData.transactionId || 'None'}</code>
`;

    const message = `
<b>🛍️ NEW ORDER CONFIRMED</b>
━━━━━━━━━━━━━━━━━━
<b>👤 CUSTOMER PROFILE</b>
<b>Name:</b> ${orderData.customerName}
<b>Phone:</b> <code>${orderData.contactNumber}</code>
<b>Address:</b> <i>${orderData.shippingAddress}</i>
<b>Customer IP:</b> <code>${orderData.ipAddress || 'Not Captured'}</code>

<b>📦 ORDERED ITEMS</b>
${itemsList}

━━━━━━━━━━━━━━━━━━
${paymentDetails}
<b>💰 BILLING SUMMARY</b>
<b>Total Amount:</b> ৳${orderData.total}

<b>📅 LOGISTICS INFO</b>
<b>Courier Service:</b> Steadfast Courier
<b>Order Status:</b> ${orderData.status}
<b>Order Date:</b> ${new Date(orderData.createdAt).toLocaleString('en-BD')}
━━━━━━━━━━━━━━━━━━
<b>🆔 INVOICE ID:</b>
<code>${orderData.id ? orderData.id.toUpperCase() : 'NEW_ENTRY'}</code>
`;

    return await sendToChats(message);
  } catch (error) {
    console.error("Telegram Notification Gateway Error:", error);
    return null;
  }
};

export const sendCreatorVideoToTelegram = async (data: any) => {
  try {
    const message = `
<b>📹 NEW CREATOR VIDEO SUBMITTED</b>
━━━━━━━━━━━━━━━━━━
<b>👤 CREATOR DETAILS</b>
<b>User Name:</b> ${data.userName}
<b>Code:</b> <code>${data.userCode || 'None'}</code>

<b>🎬 VIDEO DETAILS</b>
<b>Platform:</b> ${data.platform.toUpperCase()}
<b>Link:</b> ${data.videoUrl}
<b>Reward Claim:</b> ৳${data.rewardAmount}

<b>📅 SYSTEM INFO</b>
<b>Date:</b> ${new Date(data.createdAt).toLocaleString('en-BD')}
━━━━━━━━━━━━━━━━━━
<b>Review in Admin Panel!</b>
`;

    return await sendToChats(message);
  } catch (error) {
    console.error("Telegram Error:", error);
    return null;
  }
};

export const sendWithdrawalRequestToTelegram = async (data: any) => {
  try {
    const message = `
<b>💸 NEW WITHDRAWAL REQUEST</b>
━━━━━━━━━━━━━━━━━━
<b>👤 AFFILIATE DETAILS</b>
<b>User Name:</b> ${data.userName || 'Unknown'}

<b>💰 PAYOUT DETAILS</b>
<b>Amount:</b> ৳${data.amount}
<b>Method:</b> ${data.method.toUpperCase()}
<b>Account:</b> <code>${data.accountNumber}</code>

<b>📅 SYSTEM INFO</b>
<b>Date:</b> ${new Date(data.createdAt).toLocaleString('en-BD')}
━━━━━━━━━━━━━━━━━━
<b>Process via Admin Panel!</b>
`;

    return await sendToChats(message);
  } catch (error) {
    console.error("Telegram Error:", error);
    return null;
  }
};

export const sendDepositRequestToTelegram = async (data: any) => {
  try {
    const message = `
<b>🪙 NEW COIN DEPOSIT REQUEST</b>
━━━━━━━━━━━━━━━━━━
<b>👤 USER DETAILS</b>
<b>User ID:</b> <code>${data.userId}</code>
<b>User Email:</b> ${data.userEmail || 'Unknown'}

<b>💰 DEPOSIT DETAILS</b>
<b>Amount:</b> ${data.amount} VG Coins
<b>Payment Method:</b> ${data.method.toUpperCase()}
<b>Transaction ID:</b> <code>${data.trxId}</code>

<b>📅 SYSTEM INFO</b>
<b>Date:</b> ${new Date(data.createdAt).toLocaleString('en-BD')}
━━━━━━━━━━━━━━━━━━
<b>Process via Admin Panel!</b>
`;

    return await sendToChats(message);
  } catch (error) {
    console.error("Telegram Error:", error);
    return null;
  }
};

export const sendTicketToTelegram = async (data: any) => {
  try {
    const message = `
<b>🎫 NEW SUPPORT TICKET</b>
━━━━━━━━━━━━━━━━━━
<b>👤 USER INFO</b>
<b>Name:</b> ${data.userName || 'Unknown'}
<b>Email:</b> ${data.userEmail || 'Unknown'}

<b>📝 TICKET INFO</b>
<b>Subject:</b> ${data.subject}
<b>Message:</b>
<i>${data.message}</i>

<b>📅 SYSTEM INFO</b>
<b>Status:</b> ${data.status}
<b>Date:</b> ${new Date(data.createdAt).toLocaleString('en-BD')}
━━━━━━━━━━━━━━━━━━
<b>Reply via Admin Panel!</b>
`;

    return await sendToChats(message);
  } catch (error) {
    console.error("Telegram Error:", error);
    return null;
  }
};

