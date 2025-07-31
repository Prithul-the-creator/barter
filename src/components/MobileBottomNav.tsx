import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Search, 
  Plus, 
  Heart,
  Package,
  MessageCircle,
  User 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/browse", label: "Browse", icon: Search },
    ...(user ? [
      { href: "/list-item", label: "List", icon: Plus },
      { href: "/favorites", label: "Favorites", icon: Heart },
      { href: "/offers", label: "Offers", icon: Package },
      { href: "/messages", label: "Messages", icon: MessageCircle },
      { href: "/profile", label: "Profile", icon: User },
    ] : [])
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <Link key={item.href} to={item.href}>
            <Button
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center justify-center h-12 w-12 p-0 ${
                location.pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}