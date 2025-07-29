import { ListIcon, Search, Handshake } from "lucide-react";

const steps = [
  {
    icon: ListIcon,
    title: "List Your Item",
    description: "Upload photos and describe what you want to trade. Set your preferences for what you'd like in return.",
    step: "01"
  },
  {
    icon: Search,
    title: "Find Your Match",
    description: "Browse through thousands of items or let our smart matching system find perfect trade opportunities for you.",
    step: "02"
  },
  {
    icon: Handshake,
    title: "Finalize the Deal",
    description: "Chat with other traders, negotiate terms, and complete your trade safely through our secure platform.",
    step: "03"
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-20 bg-gradient-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How Barter.com Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trading made simple. Join thousands of users who have discovered the joy of bartering.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative text-center group"
              >
                {/* Step number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center shadow-medium">
                  <span className="text-primary-foreground font-bold text-lg">
                    {step.step}
                  </span>
                </div>

                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 bg-background rounded-2xl shadow-medium flex items-center justify-center group-hover:shadow-strong transition-smooth">
                  <Icon className="h-10 w-10 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Connector line (except last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-6 lg:-right-12 w-12 lg:w-24 h-0.5 bg-gradient-to-r from-primary to-accent"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};