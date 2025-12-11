import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Send,
  Phone,
  User,
  Check,
  CheckCheck
} from "lucide-react";
import { useMessaging, formatMessageTime } from "@/hooks/useMessaging";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";

const AdminMessaging = () => {
  const [searchParams] = useSearchParams();
  const artisanIdFromUrl = searchParams.get("artisan");

  const {
    currentProfileId,
    conversations,
    conversationsLoading,
    useConversationMessages,
    sendMessage,
    markAsRead,
  } = useMessaging();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(c => c.participant_id === selectedConversationId);
  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(selectedConversationId);

  // Handle artisan selection from URL parameter
  useEffect(() => {
    if (artisanIdFromUrl && conversations.length > 0) {
      // Check if there's an existing conversation with this artisan
      const existingConv = conversations.find(c => c.participant_id === artisanIdFromUrl);
      if (existingConv) {
        setSelectedConversationId(artisanIdFromUrl);
      } else {
        // If no existing conversation, we need to create one by sending a message
        // For now, just set the artisan as selected (will show empty chat)
        setSelectedConversationId(artisanIdFromUrl);
      }
    }
  }, [artisanIdFromUrl, conversations]);

  // Auto-select first conversation if none selected and no URL param
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

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversationId) {
      sendMessage.mutate({ receiverId: selectedConversationId, content: newMessage.trim() });
      setNewMessage("");
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Messagerie</h1>
          <p className="text-muted-foreground mt-1">Communiquez avec les artisans et clients</p>
        </div>

        <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="col-span-1">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-70px)]">
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
                  <div
                    key={conv.participant_id}
                    onClick={() => setSelectedConversationId(conv.participant_id)}
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 border-b border-border",
                      selectedConversationId === conv.participant_id && "bg-muted"
                    )}
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conv.participant_photo || undefined} />
                      <AvatarFallback className="bg-primary/10">
                        <User className="w-5 h-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground truncate">{conv.participant_name}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(conv.last_message_time)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{conv.participant_role}</p>
                      <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge className="bg-primary">{conv.unread_count}</Badge>
                    )}
                  </div>
                ))
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="col-span-2 flex flex-col">
            {selectedConversationId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedConversation?.participant_photo || undefined} />
                      <AvatarFallback className="bg-primary/10">
                        <User className="w-5 h-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {selectedConversation?.participant_name || "Nouvelle conversation"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation?.participant_role || "Artisan"}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Appeler
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                            <Skeleton className="h-16 w-48 rounded-lg" />
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
                              "max-w-[70%] rounded-lg p-3",
                              message.sender_id === currentProfileId
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            )}
                          >
                            <p className="text-sm">{message.content}</p>
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
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Écrivez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[50px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sendMessage.isPending}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      className="px-6"
                      disabled={!newMessage.trim() || sendMessage.isPending}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Sélectionnez une conversation pour commencer</p>
              </CardContent>
            )}
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminMessaging;