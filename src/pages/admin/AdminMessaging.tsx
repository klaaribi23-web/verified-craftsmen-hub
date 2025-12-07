import { useState } from "react";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Send,
  Phone
} from "lucide-react";

interface Artisan {
  id: string;
  name: string;
  category: string;
  photo: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  phone: string;
}

interface Message {
  id: string;
  sender: "admin" | "artisan";
  content: string;
  time: string;
}

const artisans: Artisan[] = [
  { id: "1", name: "Jean Dupont", category: "Plombier", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", lastMessage: "Merci pour votre aide !", lastMessageTime: "10:30", unread: 2, phone: "0612345678" },
  { id: "2", name: "Pierre Martin", category: "Électricien", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", lastMessage: "D'accord, je comprends.", lastMessageTime: "Hier", unread: 0, phone: "0623456789" },
  { id: "3", name: "Marie Bernard", category: "Peintre", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", lastMessage: "Pouvez-vous m'aider ?", lastMessageTime: "Lun", unread: 1, phone: "0634567890" },
];

const messages: Message[] = [
  { id: "1", sender: "artisan", content: "Bonjour, j'ai une question concernant mon profil.", time: "09:15" },
  { id: "2", sender: "admin", content: "Bonjour Jean, bien sûr ! Comment puis-je vous aider ?", time: "09:20" },
  { id: "3", sender: "artisan", content: "Je n'arrive pas à modifier ma zone d'intervention.", time: "09:25" },
  { id: "4", sender: "admin", content: "Pas de souci, je vais vérifier cela pour vous. Pouvez-vous me donner plus de détails sur le problème ?", time: "09:30" },
  { id: "5", sender: "artisan", content: "Merci pour votre aide !", time: "10:30" },
];

const AdminMessaging = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(artisans[0]);
  const [newMessage, setNewMessage] = useState("");

  const filteredArtisans = artisans.filter((artisan) =>
    artisan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In real app, send message to backend
      setNewMessage("");
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Messagerie</h1>
          <p className="text-muted-foreground mt-1">Communiquez avec les artisans</p>
        </div>

        <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Artisans List */}
          <Card className="col-span-1">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un artisan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-70px)]">
              {filteredArtisans.map((artisan) => (
                <div
                  key={artisan.id}
                  onClick={() => setSelectedArtisan(artisan)}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 border-b border-border ${
                    selectedArtisan?.id === artisan.id ? "bg-muted" : ""
                  }`}
                >
                  <img
                    src={artisan.photo}
                    alt={artisan.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground truncate">{artisan.name}</p>
                      <span className="text-xs text-muted-foreground">{artisan.lastMessageTime}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{artisan.category}</p>
                    <p className="text-sm text-muted-foreground truncate">{artisan.lastMessage}</p>
                  </div>
                  {artisan.unread > 0 && (
                    <Badge className="bg-primary">{artisan.unread}</Badge>
                  )}
                </div>
              ))}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="col-span-2 flex flex-col">
            {selectedArtisan ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedArtisan.photo}
                      alt={selectedArtisan.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-foreground">{selectedArtisan.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedArtisan.category}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCall(selectedArtisan.phone)}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Appeler
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === "admin" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender === "admin"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}>
                            {message.time}
                          </p>
                        </div>
                      </div>
                    ))}
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
                    />
                    <Button onClick={handleSendMessage} className="px-6">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Sélectionnez un artisan pour commencer</p>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminMessaging;
