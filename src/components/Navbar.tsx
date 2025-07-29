import { useState } from "react";
import { Search, Menu, X, User, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold text-foreground">Barter.com</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for items to trade..."
                className="pl-10 bg-background border-border focus:ring-primary"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/browse">
              <Button variant="ghost" className="text-foreground hover:text-primary">
                Browse Trades
              </Button>
            </Link>
            <Link to="/list-item">
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                List Item
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="ghost" size="icon">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search for items to trade..."
              className="pl-10 bg-background border-border"
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link to="/browse">
              <Button variant="ghost" className="w-full justify-start">
                Browse Trades
              </Button>
            </Link>
            <Link to="/list-item">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                List Item
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <MessageCircle className="h-4 w-4" />
                Messages
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <User className="h-4 w-4" />
                Profile
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};