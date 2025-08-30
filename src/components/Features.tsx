import { Shield, Zap, Users } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "Secure by Design",
      description: "Industry-standard OAuth 2.0 implementation with Google's security protocols."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Quick authentication flow that gets users into your app in seconds."
    },
    {
      icon: Users,
      title: "User Friendly",
      description: "Familiar Google login interface that users trust and recognize."
    }
  ];

  return (
    <section className="py-20 px-6 bg-gradient-secondary">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Why Choose Google OAuth?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Implement secure, reliable authentication that your users will love
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:shadow-soft transition-all duration-300 hover:scale-105"
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;