import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NavBar = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm font-semibold tracking-wide">
            Auth Playground
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email || "User"} />
                    <AvatarFallback>
                      {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm hidden sm:inline">{user.name || user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/chat")}>Chat</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
                  {(import.meta as any).env?.VITE_ADMIN_TOKEN ? (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>Admin</DropdownMenuItem>
                  ) : null}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={signInWithGoogle} variant="secondary">Sign in</Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavBar;
