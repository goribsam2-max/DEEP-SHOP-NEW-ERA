import React from 'react';
import * as LucideIcons from 'lucide-react';

export type IconName = string;

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: IconName;
  className?: string;
  solid?: boolean;
}

const formatNameToPascal = (str: string) => {
  return str.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

const customIconMapping: Record<string, keyof typeof LucideIcons> = {
  'bars': 'Menu',
  'instagram': 'Camera',
  'user-shield': 'Shield',
  'envelope': 'Mail',
  'file-contract': 'FileText',
  'file-alt': 'FileText',
  'times': 'X',
  'spinner-third': 'Loader2',
  'spinner': 'Loader',
  'circle-notch': 'Loader2',
  'sync-alt': 'RefreshCw',
  'money-bill': 'Banknote',
  'money-bill-wave': 'Banknote',
  'coins': 'Coins',
  'wallet': 'Wallet',
  'receipt': 'Receipt',
  'credit-card': 'CreditCard',
  'credit-card-front': 'CreditCard',
  'bullhorn': 'Megaphone',
  'chart-line': 'LineChart',
  'rocket': 'Rocket',
  'tag': 'Tag',
  'check': 'Check',
  'check-circle': 'CheckCircle',
  'times-circle': 'XCircle',
  'exclamation-circle': 'AlertCircle',
  'exclamation-triangle': 'AlertTriangle',
  'info-circle': 'Info',
  'arrow-left': 'ArrowLeft',
  'arrow-right': 'ArrowRight',
  'arrow-up': 'ArrowUp',
  'arrow-down': 'ArrowDown',
  'arrow-down-left': 'ArrowDownLeft',
  'chevron-left': 'ChevronLeft',
  'chevron-right': 'ChevronRight',
  'chevron-up': 'ChevronUp',
  'chevron-down': 'ChevronDown',
  'microphone': 'Mic',
  'lightbulb': 'Lightbulb',
  'phone-alt': 'Phone',
  'phone': 'Phone',
  'eye': 'Eye',
  'eye-slash': 'EyeOff',
  'bell': 'Bell',
  'bell-slash': 'BellOff',
  'medal': 'Medal',
  'award': 'Award',
  'crown': 'Crown',
  'link': 'Link',
  'expand-alt': 'Maximize2',
  'star': 'Star',
  'star-outline': 'Star', // We'll just map it to Star, but wait, Lucide's Star is outlined by default unless `fill` is used. Wait.
  'stars': 'Sparkles',
  'box': 'Package',
  'box-open': 'PackageOpen',
  'box-check': 'PackageCheck',
  'newspaper': 'Newspaper',
  'twitter': 'MessageCircle',
  'facebook': 'Facebook',
  'facebook-f': 'Facebook',
  'envelope-open-text': 'MailOpen',
  'google': 'Globe',
  'whatsapp': 'MessageCircle', // Fallback
  'plus': 'Plus',
  'ellipsis-h': 'MoreHorizontal',
  'layer-plus': 'Layers',
  'edit': 'Edit2',
  'pen': 'Pen',
  'trash': 'Trash2',
  'trash-alt': 'Trash2',
  'shopping-cart': 'ShoppingCart',
  'shopping-bag': 'ShoppingBag',
  'store-slash': 'Store',
  'map-marker': 'MapPin',
  'map-marker-alt': 'MapPin',
  'save': 'Save',
  'percent': 'Percent',
  'gift': 'Gift',
  'truck': 'Truck',
  'truck-fast': 'Truck',
  'truck-moving': 'Truck',
  'motorcycle': 'Bike',
  'mobile': 'Smartphone',
  'mobile-alt': 'Smartphone',
  'copy': 'Copy',
  'user': 'User',
  'list-ol': 'ListOrdered',
  'image': 'Image',
  'images': 'Images',
  'cloud-upload': 'CloudUpload',
  'print': 'Printer',
  'camera': 'Camera',
  'ticket-alt': 'Ticket',
  'bolt': 'Zap',
  'share-alt': 'Share2',
  'shield-check': 'ShieldCheck',
  'shield-alt': 'Shield',
  'search': 'Search',
  'search-plus': 'ZoomIn',
  'history': 'History',
  'headset': 'Headphones',
  'comment-alt-lines': 'MessageSquare',
  'paper-plane': 'Send',
  'pause': 'Pause',
  'gem': 'Gem',
  'quote-right': 'Quote',
  'heart': 'Heart',
  'cog': 'Settings',
  'sign-out-alt': 'LogOut',
  'lock': 'Lock',
  'unlock': 'Unlock',
  'smile': 'Smile',
  'frown': 'Frown',
  'hourglass-half': 'Hourglass',
  'ban': 'Ban',
  'cubes': 'Boxes',
  'boxes': 'Boxes',
  'users-cog': 'Users',
  'users': 'Users',
  'comment-dots': 'MessageSquare',
  'sliders-h': 'Sliders',
  'ticket': 'Ticket',
  'undo': 'Undo',
  'id-badge': 'Contact',
  'file-invoice-dollar': 'Receipt',
  'file-csv': 'FileSpreadsheet',
  'trend-up': 'TrendingUp',
  'shield': 'Shield',
  'inbox': 'Inbox',
  'video': 'Video',
  'clock': 'Clock',
}

const Icon: React.FC<IconProps> = ({ name, className = '', solid = false, ...props }) => {
  const pascalName = (customIconMapping[name] || formatNameToPascal(name)) as keyof typeof LucideIcons;
  const LucideIcon = LucideIcons[pascalName] as React.FC<any> | undefined;

  const hasSize = /\b(w-\d+|w-\[.*?\]|w-auto|w-full|w-screen|w-min|w-max|w-fit|size-\d+|size-\[.*?\]|h-\d+|h-\[.*?\]|h-auto|h-full|h-screen|h-min|h-max|h-fit|text-(xs|sm|base|lg|[2-9]xl|\[.*?\]))\b/.test(className);
  
  const finalClass = hasSize ? className : `${className} w-5 h-5`.trim();
  const hasWidthClass = /\b(w-\d+|w-\[.*?\]|w-auto|w-full|w-screen|w-min|w-max|w-fit|size-\d+|size-\[.*?\])\b/.test(finalClass);

  if (!LucideIcon) {
    if (name !== 'default') {
      console.warn(`Icon ${name} not found in Lucide (pascal: ${pascalName})`);
    }
    return null;
  }

  return (
    <span 
      className={`inline-flex shrink-0 items-center justify-center [&>svg]:w-full [&>svg]:h-full ${hasWidthClass ? '' : 'w-[1em] h-[1em]'} ${finalClass}`}
      {...props}
    >
      <LucideIcon strokeWidth={solid ? 3 : 2} fill={solid ? "currentColor" : "none"} />
    </span>
  );
};

export default Icon;
