import { Navbar } from "@/components/Navbar";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturedTrades } from "@/components/FeaturedTrades";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Star, Users, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-trading.jpg";

const stats = [
  { icon: Users, label: "Active Traders", value: "50K+" },
  { icon: Star, label: "Successful Trades", value: "200K+" },
  { icon: Shield, label: "Trust Rating", value: "4.9/5" },
  { icon: Zap, label: "Avg. Match Time", value: "< 2hrs" }
];

const Index = () => {
  return (
    <div className="bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Trade Smarter.{" "}
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    Live Better.
                  </span>
                </h1>
                <h2 className="text-xl md:text-2xl text-foreground/80 font-medium">
                  Welcome to the Future of Commerce.
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                  Join the revolution where cash is optional. Trade items you don't need for things you want. 
                  It's sustainable, social, and surprisingly simple.
                </p>
              </div>

              {/* Hero search */}
              <div className="bg-background rounded-2xl p-6 shadow-medium border border-border">
                <p className="text-sm font-medium text-foreground mb-3">
                  What are you looking for?
                </p>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <Input
                      placeholder="Search for items to trade..."
                      className="pl-10 h-12 text-base border-border"
                    />
                  </div>
                  <Button size="lg" className="h-12 px-6 gap-2 shadow-medium hover:shadow-strong">
                    Search
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/browse">
                  <Button variant="gradient" size="lg" className="w-full sm:w-auto gap-2">
                    Start Trading
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/list-item">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    List Your First Item
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero image */}
            <div className="relative">
              <div className="relative z-10">
                <img
                  src={heroImage}
                  alt="People trading items"
                  className="w-full rounded-2xl shadow-strong"
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-accent rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-gradient-primary rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
        </div>

        {/* Stats section */}
        <div className="bg-background/50 backdrop-blur-sm border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-accent rounded-xl mb-3">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
      <FeaturedTrades />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Start Your Trading Journey?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of smart traders who have discovered a better way to get what they want 
            without spending money.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/browse">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
                Browse Trades
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/list-item">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                List Your Item
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
