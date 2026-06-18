import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Building2, CalendarCheck, FileBarChart, UserCircle } from "lucide-react";

type NavItem = { name: string; href: string; icon: React.ElementType };
interface NavProps { items?: NavItem[]; className?: string }

const DEFAULT_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Hospitals", href: "/hospitals", icon: Building2 },
  { name: "Appointments", href: "/appointments", icon: CalendarCheck },
  { name: "Reports", href: "/reports", icon: FileBarChart },
  { name: "Profile", href: "/profile", icon: UserCircle },
];

export const SwipeMaskNav = ({ items = DEFAULT_ITEMS, className }: NavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className={cn(
      "flex gap-1 border border-white/5 rounded-full p-1.5",
      "bg-black/40 backdrop-blur-2xl shadow-xl",
      className
    )}>
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;
        return (
          <button
            key={item.name}
            onClick={() => navigate(item.href)}
            className={cn(
              "relative px-4 py-2 rounded-full transition-colors duration-300 flex items-center gap-2",
            )}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {isActive && (
              <motion.div
                layoutId="nav-active-pill"
                className="absolute inset-0 bg-primary rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon className={cn(
              "relative z-10 w-4 h-4 transition-colors duration-300",
              isActive ? "text-primary-foreground" : "text-muted-foreground"
            )} />
            <span className={cn(
              "relative z-10 text-sm font-medium transition-colors duration-300 hidden sm:inline",
              isActive ? "text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
            )}>
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
