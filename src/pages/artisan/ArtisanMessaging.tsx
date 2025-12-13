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
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Video,
  User,
  Check,
  CheckCheck,
  FileText,
  Download,
  X,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { cn, DEFAULT_AVATAR } from "@/lib/utils";
import { useMessaging, formatMessageTime } from "@/hooks/useMessaging";
import { QuoteForm } from "@/components/quotes/QuoteForm";
import { QuoteMessageCard, parseQuoteFromMessage } from "@/components/chat/QuoteMessageCard";
import Navbar from "@/components/layout/Navbar";
import { toast } from "sonner";

export const ArtisanMessaging = () => {
  const {
    currentProfileId,
    conversations,
    conversationsLoading,
    useConversationMessages,
    sendMessage,
    markAsRead,
    uploadFile,
  } = useMessaging();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 10 Mo)");
      return;
    }

    setSelectedFile(file);
    if (isImage && file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSendMessage = async () => {
    if (!selectedConversationId) return;

    if (selectedFile) {
      try {
        await uploadFile.mutateAsync({ file: selectedFile, receiverId: selectedConversationId });
        clearSelectedFile();
        toast.success("Fichier envoyé");
      } catch (error) {
        toast.error("Erreur lors de l'envoi du fichier");
      }
    } else if (newMessage.trim()) {
      sendMessage.mutate({ receiverId: selectedConversationId, content: newMessage.trim() });
      setNewMessage("");
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMessage = (msg: { id: string; sender_id: string; content: string; is_read: boolean; created_at: string; attachment_url?: string | null; attachment_name?: string | null; attachment_type?: string | null }) => {
    const isOwn = msg.sender_id === effectiveProfileId;
    const quoteData = parseQuoteFromMessage(msg.content);
    const hasAttachment = !!msg.attachment_url;

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

    // Render attachment if present
    if (hasAttachment) {
      const isImage = msg.attachment_type?.startsWith('image/');
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
            {isImage ? (
              <a href={msg.attachment_url || "#"} target="_blank" rel="noopener noreferrer">
                <img 
                  src={msg.attachment_url || ""} 
                  alt={msg.attachment_name || "Image"} 
                  className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                />
              </a>
            ) : (
              <a 
                href={msg.attachment_url || "#"} 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg mb-2",
                  isOwn ? "bg-primary-foreground/10" : "bg-muted"
                )}
              >
                <FileText className="w-8 h-8 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{msg.attachment_name}</p>
                </div>
                <Download className="w-4 h-4 flex-shrink-0" />
              </a>
            )}
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

  // Handle conversation selection with mobile view switch
  const handleSelectConversation = (participantId: string) => {
    setSelectedConversationId(participantId);
    setMobileShowChat(true);
  };

  const handleBackToList = () => {
    setMobileShowChat(false);
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

        <main className="flex-1 flex overflow-hidden p-2 md:p-0">
          <div className="flex-1 flex bg-card md:bg-transparent rounded-xl md:rounded-none border md:border-0 overflow-hidden">
            {/* Conversations List - Hidden on mobile when chat is open */}
            <div className={cn(
              "w-full md:w-80 border-r border-border bg-card flex flex-col",
              mobileShowChat ? "hidden md:flex" : "flex"
            )}>
              <div className="p-3 md:p-4 border-b border-border">
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
                      onClick={() => handleSelectConversation(conv.participant_id)}
                      className={cn(
                        "w-full p-3 md:p-4 flex items-start gap-3 hover:bg-muted/50 active:bg-muted transition-colors text-left",
                        selectedConversationId === conv.participant_id && "bg-muted"
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="w-10 h-10 md:w-12 md:h-12">
                          <AvatarImage src={conv.participant_photo || DEFAULT_AVATAR} />
                          <AvatarFallback className="bg-primary/10">
                            <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-foreground text-sm md:text-base truncate">{conv.participant_name}</span>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">
                            {formatMessageTime(conv.last_message_time)}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">{conv.last_message}</p>
                      </div>
                      {conv.unread_count > 0 && (
                        <Badge className="bg-accent text-accent-foreground border-0 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs shrink-0">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </button>
                  ))
                )}
              </ScrollArea>
            </div>

            {/* Chat Area - Full screen on mobile when open */}
            <div className={cn(
              "flex-1 flex flex-col",
              mobileShowChat ? "flex" : "hidden md:flex"
            )}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="h-14 md:h-16 border-b border-border bg-card px-3 md:px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="md:hidden shrink-0"
                        onClick={handleBackToList}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <Avatar className="w-8 h-8 md:w-10 md:h-10 shrink-0">
                        <AvatarImage src={selectedConversation.participant_photo || DEFAULT_AVATAR} />
                        <AvatarFallback className="bg-primary/10">
                          <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm md:text-base truncate">{selectedConversation.participant_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedConversation.participant_role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button 
                        variant="gold" 
                        size="sm"
                        onClick={() => setShowQuoteForm(true)}
                        className="gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3"
                      >
                        <FileText className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Proposer un</span> devis
                      </Button>
                      <Button variant="ghost" size="icon" className="hidden sm:flex">
                        <Phone className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hidden sm:flex">
                        <Video className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-3 md:p-6 bg-muted/30">
                    <div className="space-y-3 md:space-y-4">
                      {messagesLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                              <Skeleton className="h-16 w-48 rounded-2xl" />
                            </div>
                          ))}
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                          <p>Aucun message. Commencez la conversation !</p>
                        </div>
                      ) : (
                        messages.map(renderMessage)
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* File Preview */}
                  {selectedFile && (
                    <div className="p-3 md:p-4 border-t border-border bg-muted/50">
                      <div className="flex items-center gap-3 p-2 bg-card rounded-lg border">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" className="w-12 h-12 md:w-16 md:h-16 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-muted rounded flex items-center justify-center">
                            <FileText className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(1)} Ko
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={clearSelectedFile}>
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="p-2 md:p-4 border-t border-border bg-card">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, false)}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                    />
                    <input
                      type="file"
                      ref={imageInputRef}
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, true)}
                      accept="image/*"
                    />
                    <div className="flex items-center gap-1 md:gap-2">
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="shrink-0 hidden sm:flex" onClick={() => imageInputRef.current?.click()}>
                        <ImageIcon className="w-5 h-5" />
                      </Button>
                      <Input
                        placeholder="Écrire un message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 text-sm md:text-base"
                        onKeyPress={(e) => e.key === "Enter" && !selectedFile && handleSendMessage()}
                        disabled={sendMessage.isPending || uploadFile.isPending}
                      />
                      <Button 
                        variant="gold" 
                        size="icon"
                        className="shrink-0"
                        onClick={handleSendMessage}
                        disabled={(!newMessage.trim() && !selectedFile) || sendMessage.isPending || uploadFile.isPending}
                      >
                        {uploadFile.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 hidden md:flex items-center justify-center text-muted-foreground">
                  Sélectionnez une conversation pour commencer
                </div>
              )}
            </div>
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
