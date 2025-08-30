import { Button } from "@/components/ui/button";
import { useBilling } from "@/context/BillingProvider";
import React from "react";

const Settings = () => {
  const { plan, upgrade, manage } = useBilling();
  const [customerId, setCustomerId] = React.useState<string>("");
  React.useEffect(() => {
    const cid = window.localStorage.getItem('billing_customer_id') || '';
    setCustomerId(cid);
  }, []);
  const saveCustomerId = () => {
    window.localStorage.setItem('billing_customer_id', customerId.trim());
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-medium mb-2">Billing</h2>
        <p className="text-sm text-muted-foreground mb-4">Current plan: <span className="font-medium uppercase">{plan}</span></p>
        <div className="flex gap-2 flex-wrap items-center">
          <Button onClick={upgrade}>Upgrade to Pro</Button>
          <Button variant="secondary" onClick={() => manage(customerId || undefined)}>Manage Billing</Button>
          <input
            placeholder="Stripe customer ID (optional)"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
          <Button variant="ghost" onClick={saveCustomerId}>Save</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">If you leave the customer ID blank, the app will use VITE_STRIPE_CUSTOMER_ID from your env when available.</p>
      </section>

      <section className="border rounded-lg p-4">
        <h2 className="text-lg font-medium mb-2">Preferences</h2>
        <p className="text-sm text-muted-foreground">More settings coming soon.</p>
      </section>
    </div>
  );
};

export default Settings;
