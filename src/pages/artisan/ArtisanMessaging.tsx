import { useState, useEffect, useRef } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Send, 
  Paperclip, 
  Image,
  MoreVertical,
  Phone,
  Video,
  User,
  Check,
  CheckCheck,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessaging, formatMessageTime } from "@/hooks/useMessaging";
import { QuoteForm } from "@/components/quotes/QuoteForm";
import { QuoteMessageCard, parseQuoteFromMessage } from "@/components/chat/QuoteMessageCard";
import Navbar from "@/components/layout/Navbar";

export const ArtisanMessaging = () => {
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
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(c => c.participant_id === selectedConversationId);
  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(selectedConversationId);

  // Profile ID for message display
  const effectiveProfileId = currentProfileId;

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].participant_id);
    }
  }, [conversations, selectedConversationId]);

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
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMessage = (msg: { id: string; sender_id: string; content: string; is_read: boolean; created_at: string }) => {
    const isOwn = msg.sender_id === effectiveProfileId;
    const quoteData = parseQuoteFromMessage(msg.content);

    if (quoteData.isQuote && quoteData.priceHt && quoteData.priceTtc) {
      return (
        <div
          key={msg.id}
          className={cn("flex", isOwn ? "justify-end" : "justify-start")}
        >
          <QuoteMessageCard
            quoteId={quoteData.quoteId || ""}
            description={quoteData.description || ""}
            priceHt={quoteData.priceHt}
            tvaRate={quoteData.tvaRate || 20}
            priceTtc={quoteData.priceTtc}
            status="pending"
            createdAt={msg.created_at}
            isOwn={isOwn}
            isArtisan={true}
          />
        </div>
      );
    }

    // Check for status messages
    const isAccepted = msg.content.includes("✅ DEVIS ACCEPTÉ");
    const isRefused = msg.content.includes("❌ DEVIS REFUSÉ");

    if (isAccepted || isRefused) {
      return (
        <div key={msg.id} className="flex justify-center my-4">
          <div className={cn(
            "px-4 py-2 rounded-full text-sm font-medium",
            isAccepted 
              ? "bg-green-500/10 text-green-600 border border-green-500/20" 
              : "bg-red-500/10 text-red-600 border border-red-500/20"
          )}>
            {isAccepted ? "✅ Devis accepté par le client" : "❌ Devis refusé par le client"}
          </div>
        </div>
      );
    }

    return (
      <div
        key={msg.id}
        className={cn("flex", isOwn ? "justify-end" : "justify-start")}
      >
        <div
          className={cn(
            "max-w-md rounded-2xl px-4 py-3",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border rounded-bl-md"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          <div className={cn(
            "flex items-center justify-end gap-1 mt-1",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            <span className="text-xs">{formatMessageTime(msg.created_at)}</span>
            {isOwn && (
              <div className="flex items-center gap-0.5">
                {msg.is_read ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-blue-400" />
                    <span className="text-xs ml-1">Vu</span>
                  </>
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ArtisanSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Messagerie" 
          subtitle="Communiquez avec vos clients"
        />

        <main className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-border bg-card flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher..." 
                  className="pl-10 bg-muted/50"
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
                      "w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left",
                      selectedConversationId === conv.participant_id && "bg-muted"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={conv.participant_photo || undefined} />
                        <AvatarFallback className="bg-primary/10">
                          <User className="w-6 h-6 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{conv.participant_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(conv.last_message_time)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge className="bg-accent text-accent-foreground border-0 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedConversation.participant_photo || undefined} />
                      <AvatarFallback className="bg-primary/10">
                        <User className="w-5 h-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{selectedConversation.participant_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.participant_role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="gold" 
                      size="sm"
                      onClick={() => setShowQuoteForm(true)}
                      className="gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Proposer un devis
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-6 bg-muted/30">
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
                      messages.map(renderMessage)
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-border bg-card">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Image className="w-5 h-5" />
                    </Button>
                    <Input
                      placeholder="Écrire un message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      disabled={sendMessage.isPending}
                    />
                    <Button 
                      variant="gold" 
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessage.isPending}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Sélectionnez une conversation pour commencer
              </div>
            )}
          </div>
        </main>

        {/* Quote Form Modal */}
          {selectedConversationId && selectedConversation && (
            <QuoteForm
              open={showQuoteForm}
              onOpenChange={setShowQuoteForm}
              conversationId={selectedConversationId}
              clientId={selectedConversationId}
              clientName={selectedConversation.participant_name}
            />
          )}
        </div>
      </div>
    </>
  );
};
