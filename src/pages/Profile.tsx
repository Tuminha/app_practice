import { useAuth } from "@/context/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBilling } from "@/context/BillingProvider";

const Profile = () => {
  const { user } = useAuth();
  const { plan, manage } = useBilling();
  if (!user) return null;

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email || "User"} />
          <AvatarFallback>
            {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-medium">{user.name || "Unnamed"}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
        </div>
      </div>
      <div className="mt-6 border rounded-lg p-4">
        <p className="text-sm">Subscription: <span className="font-medium uppercase">{plan}</span></p>
        {plan === 'pro' ? (
          <button className="text-sm underline mt-2" onClick={() => manage()}>Manage billing</button>
        ) : null}
      </div>
    </div>
  );
};

export default Profile;
