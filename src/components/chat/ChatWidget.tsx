import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessaging, formatMessageTime } from "@/hooks/useMessaging";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, 
  X, 
  Send, 
  ArrowLeft, 
  Archive, 
  MoreVertical,
  Loader2,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ChatWidgetProps {
  defaultOpen?: boolean;
  defaultArtisanId?: string; // This is the artisan.id, not profile_id
  defaultArtisanName?: string;
  defaultArtisanPhoto?: string;
}

export const ChatWidget = ({ 
  defaultOpen = false, 
  defaultArtisanId,
  defaultArtisanName,
  defaultArtisanPhoto
}: ChatWidgetProps) => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<{
    id: string;
    name: string;
    photo: string | null;
    role: string;
    lastSeen?: string;
  } | null>(null);
  const [messageText, setMessageText] = useState("");
  const [archivedConversations, setArchivedConversations] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [artisanProfileId, setArtisanProfileId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    currentProfileId,
    conversations,
    conversationsLoading,
    useConversationMessages,
    sendMessage,
    markAsRead,
  } = useMessaging();

  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(selectedConversation);

  // Fetch artisan's profile_id when defaultArtisanId changes
  useEffect(() => {
    const fetchArtisanProfileId = async () => {
      if (!defaultArtisanId) return;
      
      const { data } = await supabase
        .from("artisans")
        .select("profile_id")
        .eq("id", defaultArtisanId)
        .single();
      
      if (data?.profile_id) {
        setArtisanProfileId(data.profile_id);
      }
    };

    fetchArtisanProfileId();
  }, [defaultArtisanId]);

  // Auto-open with default artisan
  useEffect(() => {
    if (defaultOpen && artisanProfileId && defaultArtisanName) {
      setIsOpen(true);
      // Find if conversation exists
      const existingConv = conversations.find(c => c.participant_id === artisanProfileId);
      if (existingConv) {
        setSelectedConversation(existingConv.participant_id);
        setSelectedParticipant({
          id: existingConv.participant_id,
          name: existingConv.participant_name,
          photo: existingConv.participant_photo,
          role: existingConv.participant_role,
        });
      } else {
        // Start new conversation
        setSelectedConversation(artisanProfileId);
        setSelectedParticipant({
          id: artisanProfileId,
          name: defaultArtisanName,
          photo: defaultArtisanPhoto || null,
          role: "Artisan",
        });
      }
    }
  }, [defaultOpen, artisanProfileId, defaultArtisanName, defaultArtisanPhoto, conversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when opening conversation
  useEffect(() => {
    if (selectedConversation && currentProfileId) {
      markAsRead.mutate(selectedConversation);
    }
  }, [selectedConversation, currentProfileId]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      await sendMessage.mutateAsync({
        receiverId: selectedConversation,
        content: messageText.trim(),
      });
      setMessageText("");
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message");
    }
  };

  const handleArchive = (conversationId: string) => {
    if (archivedConversations.includes(conversationId)) {
      setArchivedConversations(archivedConversations.filter(id => id !== conversationId));
      toast.success("Conversation désarchivée");
    } else {
      setArchivedConversations([...archivedConversations, conversationId]);
      toast.success("Conversation archivée");
    }
  };

  const openConversation = (conv: typeof conversations[0]) => {
    setSelectedConversation(conv.participant_id);
    setSelectedParticipant({
      id: conv.participant_id,
      name: conv.participant_name,
      photo: conv.participant_photo,
      role: conv.participant_role,
    });
  };

  const filteredConversations = conversations.filter(c => 
    showArchived 
      ? archivedConversations.includes(c.participant_id)
      : !archivedConversations.includes(c.participant_id)
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  // If not logged in, show login prompt
  if (!authLoading && !user) {
    return (
      <>
        {/* Floating button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center z-50"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {totalUnread}
            </span>
          )}
        </button>

        {/* Login prompt */}
        {isOpen && (
          <div className="fixed bottom-24 right-6 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground">
              <span className="font-semibold">Messages</span>
              <button onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Connectez-vous pour discuter</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Créez un compte ou connectez-vous pour envoyer des messages aux artisans.
              </p>
              <Button onClick={() => navigate("/auth")} className="w-full">
                Se connecter
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center z-50"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageSquare className="h-6 w-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary p-4 flex items-center gap-3 text-primary-foreground">
            {selectedConversation && selectedParticipant ? (
              <>
                <button 
                  onClick={() => {
                    setSelectedConversation(null);
                    setSelectedParticipant(null);
                  }}
                  className="hover:bg-white/10 rounded-full p-1"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedParticipant.photo || undefined} />
                  <AvatarFallback className="bg-white/20 text-xs">
                    {selectedParticipant.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{selectedParticipant.name}</p>
                  <p className="text-xs opacity-80">
                    Dernière connexion: Aujourd'hui
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hover:bg-white/10 rounded-full p-1">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleArchive(selectedConversation)}>
                      <Archive className="h-4 w-4 mr-2" />
                      {archivedConversations.includes(selectedConversation) ? "Désarchiver" : "Archiver"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5" />
                <span className="font-semibold flex-1">Messages</span>
                <button 
                  onClick={() => setShowArchived(!showArchived)}
                  className={`text-xs px-2 py-1 rounded ${showArchived ? 'bg-white/20' : 'hover:bg-white/10'}`}
                >
                  <Archive className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Content */}
          {selectedConversation && selectedParticipant ? (
            // Messages view
            <>
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Commencez la conversation !</p>
                    <p className="text-sm">Envoyez votre premier message à {selectedParticipant.name}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === currentProfileId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted rounded-bl-sm"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {formatMessageTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message input */}
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Écrire un message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessage.isPending}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // Conversations list
            <ScrollArea className="flex-1">
              {conversationsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 px-4">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">
                    {showArchived ? "Aucune conversation archivée" : "Aucune conversation"}
                  </p>
                  <p className="text-sm mt-1">
                    {showArchived 
                      ? "Les conversations archivées apparaîtront ici" 
                      : "Vos conversations avec les artisans apparaîtront ici"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="p-3 hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3 group"
                      onClick={() => openConversation(conv)}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conv.participant_photo || undefined} />
                          <AvatarFallback className="bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold truncate">{conv.participant_name}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(conv.last_message_time)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-0.5">{conv.participant_role}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.last_message}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="opacity-0 group-hover:opacity-100 hover:bg-muted rounded-full p-1">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(conv.participant_id);
                          }}>
                            <Archive className="h-4 w-4 mr-2" />
                            {archivedConversations.includes(conv.participant_id) ? "Désarchiver" : "Archiver"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
