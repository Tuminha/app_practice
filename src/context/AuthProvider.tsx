import React from "react";
import { supabase } from "@/lib/supabase";

export type AuthUser = {
  id: string;
  email: string | null;
  name?: string | null;
  avatar_url?: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (u) {
        setUser({
          id: u.id,
          email: u.email ?? null,
          name: (u.user_metadata as any)?.name ?? null,
          avatar_url: (u.user_metadata as any)?.avatar_url ?? null,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(
        u
          ? {
              id: u.id,
              email: u.email ?? null,
              name: (u.user_metadata as any)?.name ?? null,
              avatar_url: (u.user_metadata as any)?.avatar_url ?? null,
            }
          : null
      );
      setLoading(false);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const redirectTo = import.meta.env.VITE_APP_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

