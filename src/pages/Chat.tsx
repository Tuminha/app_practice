import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { streamAssistant, getAssistantReply } from "@/lib/assistant";
import React from "react";

type ChatSession = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string | null;
};

type Message = {
  id: string;
  session_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

const Chat = () => {
  const { user, signOut } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId]
  );

  useEffect(() => {
    const loadSessions = async () => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("id,user_id,title,created_at,updated_at")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (!error && data) {
        setSessions(data as ChatSession[]);
        if (!activeId && data.length > 0) setActiveId(data[0].id);
      }
    };
    if (user) loadSessions();
  }, [user]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeId) return;
      setLoadingMsgs(true);
      const { data, error } = await supabase
        .from("messages")
        .select("id,session_id,user_id,role,content,created_at")
        .eq("session_id", activeId)
        .order("created_at", { ascending: true });
      if (!error && data) setMessages(data as Message[]);
      setLoadingMsgs(false);
    };
    loadMessages();
  }, [activeId]);

  const createSession = async () => {
    if (!user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title: "New Chat" })
      .select()
      .single();
    setCreating(false);
    if (!error && data) {
      setSessions((prev) => [data as ChatSession, ...prev]);
      setActiveId(data.id);
    }
  };

  const deleteSession = async (id: string) => {
    await supabase.from("messages").delete().eq("session_id", id);
    await supabase.from("chat_sessions").delete().eq("id", id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(sessions.find((s) => s.id !== id)?.id || null);
  };

  const sendMessage = async () => {
    if (!draft.trim() || !user) return;
    let sid = activeId;
    if (!sid) {
      // create a session on first send
      const { data } = await supabase
        .from("chat_sessions")
        .insert({ user_id: user.id, title: draft.slice(0, 40) })
        .select()
        .single();
      if (data) {
        sid = data.id;
        setSessions((prev) => [data as ChatSession, ...prev]);
        setActiveId(data.id);
      }
    }
    if (!sid) return;

    const { data: inserted } = await supabase
      .from("messages")
      .insert({
        session_id: sid,
        user_id: user.id,
        role: "user",
        content: draft.trim(),
      })
      .select()
      .single();
    if (inserted) setMessages((prev) => [...prev, inserted as Message]);
    setDraft("");

    // Optional: Update session title on first message
    if (activeSession && activeSession.title === "New Chat") {
      const newTitle = inserted?.content?.slice(0, 40) || "New Chat";
      await supabase.from("chat_sessions").update({ title: newTitle }).eq("id", sid);
      setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, title: newTitle } : s)));
    }

    // Assistant streaming reply (falls back to non-stream via getAssistantReply inside streamAssistant)
    if (inserted) {
      setTyping(true);
      let acc = "";
      const tempId = `temp-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          session_id: sid!,
          user_id: user.id,
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
        } as Message,
      ]);

      try {
        for await (const chunk of streamAssistant(inserted.content)) {
          acc += chunk;
          setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, content: acc } : m)));
        }
      } catch {
        // fallback to one-shot
        const reply = await getAssistantReply(inserted.content);
        acc = reply;
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, content: acc } : m)));
      }

      const { data: assistant } = await supabase
        .from("messages")
        .insert({
          session_id: sid,
          user_id: user.id,
          role: "assistant",
          content: acc,
        })
        .select()
        .single();
      if (assistant) setMessages((prev) => prev.map((m) => (m.id === tempId ? (assistant as Message) : m)));
      setTyping(false);
    }
  };

  return (
    <div className="h-screen grid grid-cols-12">
      {/* Sidebar */}
      <aside className="col-span-3 border-r border-border bg-card flex flex-col">
        <div className="p-3 flex gap-2">
          <Button className="w-full" onClick={createSession} disabled={creating}>
            <Plus className="w-4 h-4" /> New Chat
          </Button>
        </div>
        <Separator />
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between rounded-md px-2 py-2 cursor-pointer ${
                  activeId === s.id ? "bg-accent" : "hover:bg-accent/50"
                }`}
                onClick={() => setActiveId(s.id)}
              >
                <span className="text-sm truncate pr-2">{s.title}</span>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-xs text-muted-foreground px-2">No chats yet.</p>
            )}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-3">
          <Button variant="secondary" className="w-full" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="col-span-9 flex flex-col">
        <div className="px-6 py-4 border-b border-border">
          <h1 className="text-lg font-semibold">{activeSession?.title || "New Chat"}</h1>
        </div>
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {loadingMsgs && <p className="text-sm text-muted-foreground">Loading…</p>}
            {messages.map((m) => (
              <div key={m.id} className="flex">
                <div
                  className={`${
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-secondary text-secondary-foreground"
                  } rounded-lg px-3 py-2 max-w-[75%]`}
                >
                  <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                </div>
              </div>
            ))}
            {!messages.length && !loadingMsgs && (
              <p className="text-sm text-muted-foreground">Start the conversation by typing below.</p>
            )}
            {typing && (
              <div className="flex">
                <div className="mr-auto bg-secondary text-secondary-foreground rounded-lg px-3 py-2 max-w-[75%]">
                  <p className="text-sm">
                    <span className="inline-block animate-pulse">Assistant is typing…</span>
                  </p>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Textarea
              placeholder="Type your message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[48px]"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">Press Cmd/Ctrl+Enter to send</p>
        </div>
      </main>
    </div>
  );
};

export default Chat;
