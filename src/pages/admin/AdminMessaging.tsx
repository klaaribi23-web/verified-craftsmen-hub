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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Send,
  Phone,
  User,
  Check,
  CheckCheck,
  Star,
  Users,
  Briefcase,
  MessageCircle,
  MoreVertical,
  Archive,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMessaging, formatMessageTime } from "@/hooks/useMessaging";
import { cn, DEFAULT_AVATAR } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { VoiceMessage } from "@/components/chat/VoiceMessage";

interface ArtisanContact {
  id: string;
  profile_id: string | null;
  business_name: string;
  photo_url: string | null;
  city: string;
}

interface ClientContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  city: string | null;
  user_id: string;
}

const AdminMessaging = () => {
  const [searchParams] = useSearchParams();
  const artisanProfileIdFromUrl = searchParams.get("artisan");

  const {
    currentProfileId,
    conversations,
    conversationsLoading,
    useConversationMessages,
    sendMessage,
    markAsRead,
    archivedConversationIds,
    archiveConversation,
    unarchiveConversation,
    deleteConversation,
  } = useMessaging();

  const [activeTab, setActiveTab] = useState<"artisans" | "clients">("artisans");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedContactInfo, setSelectedContactInfo] = useState<{ name: string; photo: string | null; role: string } | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all active artisans
  const { data: allArtisans = [], isLoading: artisansLoading } = useQuery({
    queryKey: ['all-artisans-for-messaging'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artisans')
        .select('id, profile_id, business_name, photo_url, city')
        .eq('status', 'active')
        .order('business_name', { ascending: true });
      
      if (error) {
        console.error('Error fetching artisans:', error);
        return [];
      }
      return data as ArtisanContact[];
    },
  });

  // Fetch all clients
  const { data: allClients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['all-clients-for-messaging'],
    queryFn: async () => {
      // Get all client role users
      const { data: clientRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'client');
      
      if (rolesError || !clientRoles?.length) return [];
      
      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, city, user_id')
        .in('user_id', clientRoles.map(r => r.user_id))
        .order('last_name', { ascending: true });
      
      if (profilesError) {
        console.error('Error fetching clients:', profilesError);
        return [];
      }
      return profiles as ClientContact[];
    },
  });

  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(selectedConversationId);

  // Get unread count for a participant
  const getUnreadCount = (participantId: string) => {
    const conv = conversations.find(c => c.participant_id === participantId);
    return conv?.unread_count || 0;
  };

  // Get last message for a participant
  const getLastMessage = (participantId: string) => {
    const conv = conversations.find(c => c.participant_id === participantId);
    return conv ? { message: conv.last_message, time: conv.last_message_time } : null;
  };

  // Handle URL param
  useEffect(() => {
    if (artisanProfileIdFromUrl) {
      setSelectedConversationId(artisanProfileIdFromUrl);
      const artisan = allArtisans.find(a => a.profile_id === artisanProfileIdFromUrl);
      if (artisan) {
        setSelectedContactInfo({ 
          name: artisan.business_name, 
          photo: artisan.photo_url, 
          role: 'Artisan' 
        });
      }
    }
  }, [artisanProfileIdFromUrl, allArtisans]);

  // Mark messages as read when selecting conversation
  useEffect(() => {
    if (selectedConversationId) {
      const unread = getUnreadCount(selectedConversationId);
      if (unread > 0) {
        markAsRead.mutate(selectedConversationId);
      }
    }
  }, [selectedConversationId]);

  // Scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter artisans based on search
  const filteredArtisans = allArtisans.filter(artisan =>
    artisan.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artisan.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter clients based on search
  const filteredClients = allClients.filter(client => {
    const fullName = `${client.first_name || ''} ${client.last_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
      client.city?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelectArtisan = (artisan: ArtisanContact) => {
    if (!artisan.profile_id) return;
    setSelectedConversationId(artisan.profile_id);
    setSelectedContactInfo({
      name: artisan.business_name,
      photo: artisan.photo_url,
      role: 'Artisan'
    });
  };

  const handleSelectClient = (client: ClientContact) => {
    setSelectedConversationId(client.id);
    setSelectedContactInfo({
      name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Client',
      photo: client.avatar_url,
      role: 'Client'
    });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversationId) {
      sendMessage.mutate({ receiverId: selectedConversationId, content: newMessage.trim() });
      setNewMessage("");
    }
  };

  const handleArchiveToggle = () => {
    if (selectedConversationId) {
      if (archivedConversationIds.includes(selectedConversationId)) {
        unarchiveConversation.mutate(selectedConversationId);
      } else {
        archiveConversation.mutate(selectedConversationId);
      }
    }
  };

  const handleDeleteConversation = () => {
    if (selectedConversationId) {
      deleteConversation.mutate(selectedConversationId);
      setSelectedConversationId(null);
      setSelectedContactInfo(null);
      setDeleteDialogOpen(false);
    }
  };

  const renderMessage = (message: { 
    id: string; 
    sender_id: string; 
    content: string; 
    is_read: boolean; 
    created_at: string;
    attachment_url?: string | null;
    attachment_type?: string | null;
    attachment_name?: string | null;
  }) => {
    const isOwn = message.sender_id === currentProfileId;
    const isVoice = message.attachment_type?.startsWith('audio/');

    // Parse voice duration from content
    const durationMatch = message.content.match(/(\d+)s/);
    const duration = durationMatch ? parseInt(durationMatch[1]) : 0;

    if (isVoice && message.attachment_url) {
      return (
        <div
          key={message.id}
          className={cn("flex", isOwn ? "justify-end" : "justify-start")}
        >
          <div className="flex flex-col">
            <VoiceMessage 
              audioUrl={message.attachment_url} 
              duration={duration}
              isOwn={isOwn} 
            />
            <div className={cn(
              "flex items-center justify-end gap-1 mt-1 px-2",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              <span className="text-xs">
                {formatMessageTime(message.created_at)}
              </span>
              {isOwn && (
                message.is_read ? (
                  <CheckCheck className="w-4 h-4 text-blue-400" />
                ) : (
                  <Check className="w-4 h-4" />
                )
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
            "max-w-[70%] rounded-lg p-3",
            isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          <p className="text-sm">{message.content}</p>
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
              message.is_read ? (
                <CheckCheck className="w-4 h-4 text-blue-400" />
              ) : (
                <Check className="w-4 h-4" />
              )
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
        <AdminSidebar />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Messagerie</h1>
          <p className="text-muted-foreground mt-1">Communiquez avec les artisans et clients</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Contacts List with Tabs */}
          <Card className="col-span-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "artisans" | "clients")} className="flex flex-col h-full">
              <TabsList className="w-full grid grid-cols-2 m-2">
                <TabsTrigger value="artisans" className="gap-2">
                  <Briefcase className="w-4 h-4" />
                  Artisans
                </TabsTrigger>
                <TabsTrigger value="clients" className="gap-2">
                  <Users className="w-4 h-4" />
                  Clients
                </TabsTrigger>
              </TabsList>

              <div className="px-4 pb-3 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={showArchived ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="w-full justify-start gap-2"
                >
                  <Archive className="w-4 h-4" />
                  {showArchived ? "Conversations actives" : "Conversations archivées"}
                </Button>
              </div>

              <TabsContent value="artisans" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  {artisansLoading ? (
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
                  ) : filteredArtisans.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun artisan trouvé</p>
                    </div>
                  ) : (
                    filteredArtisans.map((artisan) => {
                      const lastMsg = artisan.profile_id ? getLastMessage(artisan.profile_id) : null;
                      const unread = artisan.profile_id ? getUnreadCount(artisan.profile_id) : 0;
                      const isSelected = selectedConversationId === artisan.profile_id;
                      
                      return (
                        <button
                          key={artisan.id}
                          onClick={() => handleSelectArtisan(artisan)}
                          disabled={!artisan.profile_id}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 border-b border-border transition-colors",
                            isSelected && "bg-muted",
                            !artisan.profile_id && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={artisan.photo_url || DEFAULT_AVATAR} />
                            <AvatarFallback className="bg-primary/10">
                              <User className="w-5 h-5 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-foreground truncate">{artisan.business_name}</p>
                              {lastMsg && (
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(lastMsg.time)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{artisan.city}</p>
                            {lastMsg ? (
                              <p className="text-sm text-muted-foreground truncate">{lastMsg.message}</p>
                            ) : (
                              <Badge variant="outline" className="text-xs mt-1">Nouveau</Badge>
                            )}
                          </div>
                          {unread > 0 && (
                            <Badge className="bg-primary">{unread}</Badge>
                          )}
                        </button>
                      );
                    })
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="clients" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  {clientsLoading ? (
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
                  ) : filteredClients.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun client trouvé</p>
                    </div>
                  ) : (
                    filteredClients.map((client) => {
                      const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Client';
                      const lastMsg = getLastMessage(client.id);
                      const unread = getUnreadCount(client.id);
                      const isSelected = selectedConversationId === client.id;
                      
                      return (
                        <button
                          key={client.id}
                          onClick={() => handleSelectClient(client)}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 border-b border-border transition-colors",
                            isSelected && "bg-muted"
                          )}
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={client.avatar_url || DEFAULT_AVATAR} />
                            <AvatarFallback className="bg-primary/10">
                              <User className="w-5 h-5 text-primary" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-foreground truncate">{fullName}</p>
                              {lastMsg && (
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(lastMsg.time)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{client.city || 'Localisation non renseignée'}</p>
                            {lastMsg ? (
                              <p className="text-sm text-muted-foreground truncate">{lastMsg.message}</p>
                            ) : (
                              <Badge variant="outline" className="text-xs mt-1">Nouveau</Badge>
                            )}
                          </div>
                          {unread > 0 && (
                            <Badge className="bg-primary">{unread}</Badge>
                          )}
                        </button>
                      );
                    })
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Chat Area */}
          <Card className="col-span-1 lg:col-span-2 flex flex-col">
            {selectedConversationId && selectedContactInfo ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <p className="text-xs text-muted-foreground mb-1">Vous écrivez en tant que:</p>
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-primary">ADMIN</p>
                        <Star className="w-4 h-4 text-gold fill-gold" />
                      </div>
                    </div>
                    <div className="h-8 w-px bg-border mx-2" />
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedContactInfo.photo || DEFAULT_AVATAR} />
                      <AvatarFallback className="bg-primary/10">
                        <User className="w-5 h-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-muted-foreground">Destinataire:</p>
                      <p className="font-medium text-foreground">
                        {selectedContactInfo.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedContactInfo.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Appeler
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={handleArchiveToggle}>
                          <Archive className="w-4 h-4 mr-2" />
                          {archivedConversationIds.includes(selectedConversationId!) 
                            ? "Désarchiver" 
                            : "Archiver"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteDialogOpen(true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
                      <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                        <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
                        <p className="text-lg font-medium">Aucun message</p>
                        <p className="text-sm">Commencez la conversation !</p>
                      </div>
                    ) : (
                      messages.map((message) => renderMessage(message))
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
              <CardContent className="flex-1 flex flex-col items-center justify-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Sélectionnez une conversation</p>
                <p className="text-sm text-muted-foreground">Choisissez un artisan ou un client pour commencer</p>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer la conversation ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Tous les messages seront définitivement supprimés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      </div>
    </>
  );
};

export default AdminMessaging;
