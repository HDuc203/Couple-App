import {
  BookOpen,
  Heart,
  Home,
  Image as ImageIcon,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { AppTab } from "@/types/app";

export const navItems: Array<{
  id: AppTab;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "home", label: "Home", icon: Home },
  { id: "journal", label: "Nhật ký", icon: BookOpen },
  { id: "album", label: "Album", icon: ImageIcon },
  { id: "love", label: "Tình yêu", icon: Heart },
  { id: "settings", label: "Cài đặt", icon: Settings },
];
