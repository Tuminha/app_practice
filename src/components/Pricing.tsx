import { Button } from "@/components/ui/button";
import { useBilling } from "@/context/BillingProvider";

const Pricing = () => {
  const { upgrade, manage, plan } = useBilling();

  return (
    <section className="py-20 px-6 bg-gradient-secondary">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground text-lg">Start free. Upgrade when you’re ready.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-border rounded-2xl p-8 bg-card/60">
            <h3 className="text-2xl font-semibold mb-2">Free</h3>
            <p className="text-4xl font-bold mb-4">$0<span className="text-base font-normal">/mo</span></p>
            <ul className="text-sm text-muted-foreground space-y-2 mb-6">
              <li>• Basic chat</li>
              <li>• Community support</li>
            </ul>
            <Button variant="secondary" className="w-full" onClick={() => window.location.assign('/')}>Current Plan</Button>
          </div>

          <div className="border border-border rounded-2xl p-8 bg-card">
            <h3 className="text-2xl font-semibold mb-2">Pro</h3>
            <p className="text-4xl font-bold mb-4">$19<span className="text-base font-normal">/mo</span></p>
            <ul className="text-sm text-muted-foreground space-y-2 mb-6">
              <li>• Streaming AI responses</li>
              <li>• Priority support</li>
              <li>• Early features access</li>
            </ul>
            {plan === 'pro' ? (
              <Button className="w-full" onClick={() => manage()}>Manage Billing</Button>
            ) : (
              <Button className="w-full" onClick={() => upgrade()}>Upgrade to Pro</Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;

