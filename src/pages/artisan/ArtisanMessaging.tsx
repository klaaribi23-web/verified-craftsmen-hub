import { useState } from "react";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  CheckCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const conversations = [
  {
    id: 1,
    client: "Marie Martin",
    lastMessage: "Parfait, je vous attends demain à 9h",
    time: "Il y a 5 min",
    unread: 2,
    avatar: null,
    online: true,
  },
  {
    id: 2,
    client: "Pierre Durand",
    lastMessage: "Merci pour le devis, je réfléchis",
    time: "Il y a 1h",
    unread: 0,
    avatar: null,
    online: false,
  },
  {
    id: 3,
    client: "Sophie Bernard",
    lastMessage: "Les travaux sont terminés ?",
    time: "Hier",
    unread: 0,
    avatar: null,
    online: false,
  },
  {
    id: 4,
    client: "Laurent Petit",
    lastMessage: "Pouvez-vous m'envoyer une photo ?",
    time: "Il y a 2 jours",
    unread: 0,
    avatar: null,
    online: true,
  },
];

const messages = [
  {
    id: 1,
    sender: "client",
    text: "Bonjour, j'ai une fuite sous l'évier qui est assez importante.",
    time: "14:30",
    read: true,
  },
  {
    id: 2,
    sender: "artisan",
    text: "Bonjour Marie, pouvez-vous m'envoyer une photo de la fuite ?",
    time: "14:32",
    read: true,
  },
  {
    id: 3,
    sender: "client",
    text: "Voici la photo, l'eau coule en continu depuis ce matin.",
    time: "14:35",
    read: true,
    hasImage: true,
  },
  {
    id: 4,
    sender: "artisan",
    text: "Je vois le problème. C'est probablement le joint du siphon. Je peux passer demain matin à 9h, est-ce que ça vous convient ?",
    time: "14:40",
    read: true,
  },
  {
    id: 5,
    sender: "client",
    text: "Parfait, je vous attends demain à 9h",
    time: "14:42",
    read: false,
  },
];

export const ArtisanMessaging = () => {
  const [selectedConv, setSelectedConv] = useState(conversations[0]);
  const [newMessage, setNewMessage] = useState("");

  return (
    <div className="flex min-h-screen bg-background">
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
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left",
                    selectedConv.id === conv.id && "bg-muted"
                  )}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{conv.client}</span>
                      <span className="text-xs text-muted-foreground">{conv.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <Badge className="bg-accent text-accent-foreground border-0 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                      {conv.unread}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  {selectedConv.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-card" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{selectedConv.client}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConv.online ? "En ligne" : "Hors ligne"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
            <div className="flex-1 overflow-auto p-6 space-y-4 bg-muted/30">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.sender === "artisan" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-md rounded-2xl px-4 py-3",
                      msg.sender === "artisan"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border rounded-bl-md"
                    )}
                  >
                    {msg.hasImage && (
                      <div className="w-48 h-32 bg-muted rounded-lg mb-2 flex items-center justify-center">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-sm">{msg.text}</p>
                    <div className={cn(
                      "flex items-center justify-end gap-1 mt-1",
                      msg.sender === "artisan" ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      <span className="text-xs">{msg.time}</span>
                      {msg.sender === "artisan" && (
                        msg.read ? (
                          <CheckCheck className="w-4 h-4" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
                  onKeyPress={(e) => e.key === "Enter" && setNewMessage("")}
                />
                <Button variant="gold" size="icon">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
