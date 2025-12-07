import { useState } from "react";
import { ClientSidebar } from "@/components/client-dashboard/ClientSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Paperclip,
  Search,
  Phone,
  MoreVertical
} from "lucide-react";

const conversations = [
  {
    id: 1,
    artisan: {
      name: "Jean-Pierre Martin",
      trade: "Plombier",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    mission: "Réparation fuite salle de bain",
    lastMessage: "Je peux passer demain matin vers 9h si cela vous convient.",
    time: "Il y a 2h",
    unread: 2
  },
  {
    id: 2,
    artisan: {
      name: "Marc Lefebvre",
      trade: "Électricien",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    mission: "Installation tableau électrique",
    lastMessage: "Le travail est terminé, merci pour votre confiance !",
    time: "Hier",
    unread: 0
  }
];

const messages = [
  {
    id: 1,
    sender: "artisan",
    content: "Bonjour, j'ai bien reçu votre demande concernant la fuite dans votre salle de bain.",
    time: "10:30"
  },
  {
    id: 2,
    sender: "artisan",
    content: "Pouvez-vous me donner plus de détails sur l'emplacement exact de la fuite ?",
    time: "10:31"
  },
  {
    id: 3,
    sender: "client",
    content: "Bonjour, merci pour votre réponse rapide ! La fuite se situe sous le lavabo, au niveau du siphon je pense.",
    time: "10:45"
  },
  {
    id: 4,
    sender: "artisan",
    content: "D'accord, je vois. C'est probablement un joint usé. Je peux passer demain matin vers 9h si cela vous convient.",
    time: "11:00"
  }
];

export const ClientMessaging = () => {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Logic to send message
      setNewMessage("");
    }
  };

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
                    />
                  </div>
                </div>
                
                <ScrollArea className="flex-1">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left border-b border-border transition-colors ${
                        selectedConversation?.id === conv.id 
                          ? "bg-muted" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex gap-3">
                        <img 
                          src={conv.artisan.photo} 
                          alt={conv.artisan.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate">{conv.artisan.name}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {conv.time}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.mission}
                          </p>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {conv.lastMessage}
                          </p>
                        </div>
                        {conv.unread > 0 && (
                          <Badge className="bg-accent text-accent-foreground h-5 w-5 p-0 flex items-center justify-center">
                            {conv.unread}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </ScrollArea>
              </div>

              {/* Chat Area */}
              {selectedConversation ? (
                <div className="flex-1 flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={selectedConversation.artisan.photo} 
                        alt={selectedConversation.artisan.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{selectedConversation.artisan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.artisan.trade} • {selectedConversation.mission}
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
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === "client" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              message.sender === "client"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p>{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender === "client" 
                                ? "text-primary-foreground/70" 
                                : "text-muted-foreground"
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
                      />
                      <Button onClick={handleSendMessage} variant="gold">
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
