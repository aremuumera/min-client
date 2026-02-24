import {
  Home,
  PieChart,
  Receipt,
  CreditCard,
  ShoppingBag,
  MessageCircle,
  Star,
  Settings,
  Users,
  Layout,
  FileText,
  FileWarning,
  Truck,
  Lock,
  Link as LinkIcon,
  ChevronDown,
  LogOut,
  Mail,
  User,
  GraduationCap,
  Briefcase,
  Globe,
  Plus,
  Calculator
} from 'lucide-react';

export const icons = {
  'address-book': Users,
  'align-left': Layout,
  'calendar-check': GraduationCap, // Placeholder/Alternative
  'chart-pie': PieChart,
  'chats-circle': MessageCircle,
  'credit-card': CreditCard,
  'currency-eth': Globe, // Placeholder/Alternative
  'envelope-simple': Mail,
  'file-dashed': FileText,
  'file-x': FileWarning,
  'graduation-cap': GraduationCap,
  'read-cv-logo': FileText,
  'share-network': Globe,
  'shopping-bag-open': ShoppingBag,
  'shopping-cart-simple': ShoppingBag,
  'sign-out': LogOut,
  'text-align-left': Layout,
  'warning-diamond': FileWarning,
  'receipt-long': Receipt,
  'favorite-border': Star,
  'star-border': Star,
  cube: Briefcase, // Placeholder/Alternative
  file: FileText,
  house: Home,
  kanban: Layout,
  link: LinkIcon,
  lock: Lock,
  receipt: Receipt,
  truck: Truck,
  upload: Plus, // Placeholder/Alternative
  gear: Settings,
  users: Users,
  calculator: Calculator,
};

export type IconName = keyof typeof icons;
