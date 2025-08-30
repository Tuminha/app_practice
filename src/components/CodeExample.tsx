const CodeExample = () => {
  const codeSnippet = `// Example Google OAuth implementation
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="your-client-id">
      <LoginButton />
    </GoogleOAuthProvider>
  );
}

function LoginButton() {
  const handleLogin = (response) => {
    console.log('Login successful:', response);
    // Handle the login response
  };

  return (
    <GoogleLogin
      onSuccess={handleLogin}
      onError={() => console.log('Login failed')}
    />
  );
}`;

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Implementation Preview
          </h2>
          <p className="text-xl text-muted-foreground">
            See how simple it is to integrate Google OAuth into your application
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          <div className="bg-muted/50 px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-sm text-muted-foreground font-mono">
                google-auth-example.tsx
              </span>
            </div>
          </div>
          <div className="p-6 overflow-x-auto">
            <pre className="text-sm text-foreground font-mono leading-relaxed">
              <code>{codeSnippet}</code>
            </pre>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            <strong>Note:</strong> To implement actual Google OAuth functionality, you'll need to connect your project to Supabase 
            for secure backend authentication handling.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CodeExample;