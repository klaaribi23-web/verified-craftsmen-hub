import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  Paperclip,
  Search,
  Phone,
  MoreVertical,
  User,
  Check,
  CheckCheck
} from "lucide-react";
import { useMessaging, formatMessageTime } from "@/hooks/useMessaging";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ClientMessaging = () => {
  const [searchParams] = useSearchParams();
  const artisanIdFromUrl = searchParams.get("artisan");
  const artisanNameFromUrl = searchParams.get("name");

  const {
    currentProfileId,
    conversations,
    conversationsLoading,
    useConversationMessages,
    sendMessage,
    markAsRead,
  } = useMessaging();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch artisan profile for new conversation
  const { data: artisanToContact } = useQuery({
    queryKey: ["artisan-to-contact", artisanIdFromUrl],
    queryFn: async () => {
      if (!artisanIdFromUrl) return null;
      
      const { data, error } = await supabase
        .from("artisans")
        .select("id, business_name, photo_url, profile_id")
        .eq("id", artisanIdFromUrl)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!artisanIdFromUrl
  });

  const selectedConversation = conversations.find(c => c.participant_id === selectedConversationId);
  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(selectedConversationId);

  // Handle URL params for new conversation
  useEffect(() => {
    if (artisanToContact?.profile_id) {
      // Check if conversation already exists
      const existingConv = conversations.find(c => c.participant_id === artisanToContact.profile_id);
      if (existingConv) {
        setSelectedConversationId(existingConv.participant_id);
        setShowNewConversation(false);
      } else {
        setShowNewConversation(true);
        setSelectedConversationId(artisanToContact.profile_id);
      }
    }
  }, [artisanToContact, conversations]);

  // Auto-select first conversation if no URL param
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId && !artisanIdFromUrl) {
      setSelectedConversationId(conversations[0].participant_id);
    }
  }, [conversations, selectedConversationId, artisanIdFromUrl]);

  // Mark messages as read when selecting conversation
  useEffect(() => {
    if (selectedConversationId && selectedConversation?.unread_count > 0) {
      markAsRead.mutate(selectedConversationId);
    }
  }, [selectedConversationId]);

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversationId) {
      sendMessage.mutate({ receiverId: selectedConversationId, content: newMessage.trim() });
      setNewMessage("");
      setShowNewConversation(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <ClientSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Messagerie" 
          subtitle="Échangez avec les artisans"
        />

        <main className="flex-1 p-6 overflow-hidden">
          <div className="max-w-6xl mx-auto h-[calc(100vh-200px)]">
            <div className="bg-card rounded-xl border border-border shadow-soft h-full flex overflow-hidden">
              {/* Conversations List */}
              <div className="w-80 border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Rechercher..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  {conversationsLoading ? (
                    <div className="p-4 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="w-12 h-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>Aucune conversation</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.participant_id}
                        onClick={() => setSelectedConversationId(conv.participant_id)}
                        className={cn(
                          "w-full p-4 text-left border-b border-border transition-colors",
                          selectedConversationId === conv.participant_id 
                            ? "bg-muted" 
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={conv.participant_photo || undefined} />
                            <AvatarFallback className="bg-primary/10">
                              <User className="w-5 h-5 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium truncate">{conv.participant_name}</p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatMessageTime(conv.last_message_time)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.participant_role}
                            </p>
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {conv.last_message}
                            </p>
                          </div>
                          {conv.unread_count > 0 && (
                            <Badge className="bg-accent text-accent-foreground h-5 w-5 p-0 flex items-center justify-center">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area */}
              {(selectedConversation || showNewConversation) ? (
                <div className="flex-1 flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedConversation?.participant_photo || artisanToContact?.photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10">
                          <User className="w-5 h-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedConversation?.participant_name || artisanNameFromUrl || artisanToContact?.business_name || "Nouvelle conversation"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation?.participant_role || "Artisan"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messagesLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                              <Skeleton className="h-16 w-48 rounded-2xl" />
                            </div>
                          ))}
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p>Aucun message. Commencez la conversation !</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              message.sender_id === currentProfileId ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2",
                                message.sender_id === currentProfileId
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted rounded-bl-md"
                              )}
                            >
                              <p>{message.content}</p>
                              <div className={cn(
                                "flex items-center justify-end gap-1 mt-1",
                                message.sender_id === currentProfileId 
                                  ? "text-primary-foreground/70" 
                                  : "text-muted-foreground"
                              )}>
                                <span className="text-xs">
                                  {formatMessageTime(message.created_at)}
                                </span>
                                {message.sender_id === currentProfileId && (
                                  message.is_read ? (
                                    <CheckCheck className="w-4 h-4" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <Input 
                        placeholder="Écrire un message..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1"
                        disabled={sendMessage.isPending}
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        variant="gold"
                        disabled={!newMessage.trim() || sendMessage.isPending}
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Sélectionnez une conversation
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};