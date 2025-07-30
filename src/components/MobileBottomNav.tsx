import { Home, Search, Plus, MessageCircle, User, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Browse", path: "/browse" },
  { icon: Plus, label: "List", path: "/list-item", isPrimary: true },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: Heart, label: "Favorites", path: "/favorites" },
  { icon: User, label: "Profile", path: "/profile" }
];

export const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          if (item.isPrimary) {
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="gradient"
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-medium"
                >
                  <Icon className="h-6 w-6" />
                </Button>
              </Link>
            );
          }

          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center py-2 px-3 min-w-[60px]">
              <Icon 
                className={`h-6 w-6 mb-1 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`} 
              />
              <span 
                className={`text-xs ${
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};