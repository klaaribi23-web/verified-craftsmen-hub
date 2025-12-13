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
  CheckCheck,
  FileText,
  Download,
  X,
  Loader2,
  ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { useMessaging, formatMessageTime } from "@/hooks/useMessaging";
import { cn, DEFAULT_AVATAR } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { QuoteMessageCard, parseQuoteFromMessage } from "@/components/chat/QuoteMessageCard";
import { useQuotes } from "@/hooks/useQuotes";
import { toast } from "sonner";

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
    uploadFile,
  } = useMessaging();

  const { updateQuoteStatus } = useQuotes();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Profile ID for message display
  const effectiveProfileId = currentProfileId;

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
        setShowNewConversation(false);
        toast.success("Fichier envoyé");
      } catch (error) {
        toast.error("Erreur lors de l'envoi du fichier");
      }
    } else if (newMessage.trim()) {
      sendMessage.mutate({ receiverId: selectedConversationId, content: newMessage.trim() });
      setNewMessage("");
      setShowNewConversation(false);
    }
  };

  const handleQuoteAction = async (quoteId: string, action: "accept" | "refuse") => {
    try {
      // Get artisan profile_id from the quote
      const { data: quote } = await supabase
        .from("quotes")
        .select("artisan_id")
        .eq("id", quoteId)
        .single();

      if (!quote) {
        toast.error("Devis introuvable");
        return;
      }

      const { data: artisan } = await supabase
        .from("artisans")
        .select("profile_id")
        .eq("id", quote.artisan_id)
        .single();

      if (!artisan?.profile_id) {
        toast.error("Artisan introuvable");
        return;
      }

      await updateQuoteStatus.mutateAsync({
        quoteId,
        status: action === "accept" ? "accepted" : "refused",
        artisanProfileId: artisan.profile_id,
      });

      toast.success(action === "accept" ? "Devis accepté avec succès" : "Devis refusé");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du devis");
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMessage = (message: { id: string; sender_id: string; content: string; is_read: boolean; created_at: string; attachment_url?: string | null; attachment_name?: string | null; attachment_type?: string | null }) => {
    const isOwn = message.sender_id === effectiveProfileId;
    const quoteData = parseQuoteFromMessage(message.content);
    const hasAttachment = !!message.attachment_url;

    if (quoteData.isQuote && quoteData.priceHt && quoteData.priceTtc) {
      // Determine quote status from message content
      let status: "pending" | "accepted" | "refused" = "pending";
      
      return (
        <div
          key={message.id}
          className={cn("flex", isOwn ? "justify-end" : "justify-start")}
        >
          <QuoteMessageCard
            quoteId={quoteData.quoteId || ""}
            description={quoteData.description || ""}
            priceHt={quoteData.priceHt}
            tvaRate={quoteData.tvaRate || 20}
            priceTtc={quoteData.priceTtc}
            status={status}
            createdAt={message.created_at}
            isOwn={isOwn}
            isArtisan={false}
            onAccept={() => handleQuoteAction(quoteData.quoteId || "", "accept")}
            onRefuse={() => handleQuoteAction(quoteData.quoteId || "", "refuse")}
          />
        </div>
      );
    }

    // Check for status messages
    const isAccepted = message.content.includes("✅ DEVIS ACCEPTÉ");
    const isRefused = message.content.includes("❌ DEVIS REFUSÉ");

    if (isAccepted || isRefused) {
      return (
        <div key={message.id} className="flex justify-center my-4">
          <div className={cn(
            "px-4 py-2 rounded-full text-sm font-medium",
            isAccepted 
              ? "bg-green-500/10 text-green-600 border border-green-500/20" 
              : "bg-red-500/10 text-red-600 border border-red-500/20"
          )}>
            {isAccepted ? "✅ Vous avez accepté ce devis" : "❌ Vous avez refusé ce devis"}
          </div>
        </div>
      );
    }

    // Render attachment if present
    if (hasAttachment) {
      const isImage = message.attachment_type?.startsWith('image/');
      return (
        <div
          key={message.id}
          className={cn("flex", isOwn ? "justify-end" : "justify-start")}
        >
          <div
            className={cn(
              "max-w-[70%] rounded-2xl px-4 py-2",
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted rounded-bl-md"
            )}
          >
            {isImage ? (
              <a href={message.attachment_url || "#"} target="_blank" rel="noopener noreferrer">
                <img 
                  src={message.attachment_url || ""} 
                  alt={message.attachment_name || "Image"} 
                  className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                />
              </a>
            ) : (
              <a 
                href={message.attachment_url || "#"} 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg mb-2",
                  isOwn ? "bg-primary-foreground/10" : "bg-card"
                )}
              >
                <FileText className="w-8 h-8 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{message.attachment_name}</p>
                </div>
                <Download className="w-4 h-4 flex-shrink-0" />
              </a>
            )}
            <p className="whitespace-pre-wrap">{message.content}</p>
            <div className={cn(
              "flex items-center justify-end gap-1 mt-1",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              <span className="text-xs">{formatMessageTime(message.created_at)}</span>
              {isOwn && (
                <div className="flex items-center gap-0.5">
                  {message.is_read ? (
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
        key={message.id}
        className={cn(
          "flex",
          isOwn ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "max-w-[70%] rounded-2xl px-4 py-2",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          <div className={cn(
            "flex items-center justify-end gap-1 mt-1",
            isOwn 
              ? "text-primary-foreground/70" 
              : "text-muted-foreground"
          )}>
            <span className="text-xs">
              {formatMessageTime(message.created_at)}
            </span>
            {isOwn && (
              <div className="flex items-center gap-0.5">
                {message.is_read ? (
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
        <ClientSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader 
          title="Messagerie" 
          subtitle="Échangez avec les artisans"
        />

        <main className="flex-1 p-2 md:p-6 overflow-hidden">
          <div className="max-w-6xl mx-auto h-[calc(100vh-180px)] md:h-[calc(100vh-200px)]">
            <div className="bg-card rounded-xl border border-border shadow-soft h-full flex overflow-hidden">
              {/* Conversations List - Hidden on mobile when chat is open */}
              <div className={cn(
                "w-full md:w-80 border-r border-border flex flex-col",
                mobileShowChat ? "hidden md:flex" : "flex"
              )}>
                <div className="p-3 md:p-4 border-b border-border">
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
                        onClick={() => handleSelectConversation(conv.participant_id)}
                        className={cn(
                          "w-full p-3 md:p-4 text-left border-b border-border transition-colors",
                          selectedConversationId === conv.participant_id 
                            ? "bg-muted" 
                            : "hover:bg-muted/50 active:bg-muted"
                        )}
                      >
                        <div className="flex gap-3">
                          <Avatar className="w-10 h-10 md:w-12 md:h-12 shrink-0">
                            <AvatarImage src={conv.participant_photo || DEFAULT_AVATAR} />
                            <AvatarFallback className="bg-primary/10">
                              <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium truncate text-sm md:text-base">{conv.participant_name}</p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatMessageTime(conv.last_message_time)}
                              </span>
                            </div>
                            <p className="text-xs md:text-sm text-muted-foreground truncate">
                              {conv.participant_role}
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground truncate mt-1">
                              {conv.last_message}
                            </p>
                          </div>
                          {conv.unread_count > 0 && (
                            <Badge className="bg-accent text-accent-foreground h-5 w-5 p-0 flex items-center justify-center shrink-0">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area - Full screen on mobile when open */}
              {(selectedConversation || showNewConversation) ? (
                <div className={cn(
                  "flex-1 flex flex-col",
                  mobileShowChat ? "flex" : "hidden md:flex"
                )}>
                  {/* Chat Header */}
                  <div className="p-3 md:p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="md:hidden shrink-0"
                        onClick={handleBackToList}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <Avatar className="w-8 h-8 md:w-10 md:h-10 shrink-0">
                        <AvatarImage src={selectedConversation?.participant_photo || artisanToContact?.photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10">
                          <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base truncate">
                          {selectedConversation?.participant_name || artisanNameFromUrl || artisanToContact?.business_name || "Nouvelle conversation"}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          {selectedConversation?.participant_role || "Artisan"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="hidden sm:flex">
                        <Phone className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-3 md:p-4">
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
                  <div className="p-2 md:p-4 border-t border-border">
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
                    <div className="flex gap-1 md:gap-2">
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
                        onKeyPress={(e) => e.key === "Enter" && !selectedFile && handleSendMessage()}
                        className="flex-1 text-sm md:text-base"
                        disabled={sendMessage.isPending || uploadFile.isPending}
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        variant="gold"
                        size="icon"
                        className="shrink-0"
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
                </div>
              ) : (
                <div className="flex-1 hidden md:flex items-center justify-center text-muted-foreground">
                  Sélectionnez une conversation
                </div>
              )}
            </div>
          </div>
          </main>
        </div>
      </div>
    </>
  );
};
