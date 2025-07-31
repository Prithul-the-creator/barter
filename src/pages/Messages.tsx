import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Clock, 
  CheckCircle,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { chatApi } from "@/lib/api";
import { ConversationWithDetails } from "@/types/database";
import { Chat } from "@/components/Chat";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { checkAuthAndRedirect } from "@/lib/utils";

export default function Messages() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await checkAuthAndRedirect(navigate);
      if (!isAuthenticated) return;
    };
    
    checkAuth();
  }, [navigate]);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await chatApi.getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error loading conversations:', error);
        toast({
          title: "Error",
          description: "Failed to load conversations. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [toast]);

  // Real-time subscription for conversation updates
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('conversation-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        async () => {
          // Refresh conversations when messages are marked as read
          try {
            const data = await chatApi.getConversations();
            setConversations(data);
          } catch (error) {
            console.error('Error refreshing conversations:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const handleOpenChat = (conversation: ConversationWithDetails) => {
    setSelectedConversation(conversation);
    setShowChat(true);
  };

  const handleCloseChat = async () => {
    setShowChat(false);
    setSelectedConversation(null);
    
    // Refresh conversations to update unread counts
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getUnreadCount = (conversation: ConversationWithDetails) => {
    return conversation.messages.filter(msg => !msg.is_read && msg.receiver_id === currentUserId).length;
  };

  const getLastMessage = (conversation: ConversationWithDetails) => {
    if (conversation.messages.length === 0) return null;
    return conversation.messages[conversation.messages.length - 1];
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading conversations...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/browse" className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Messages
          </h1>
          <p className="text-muted-foreground">
            Your conversations with other users
          </p>
        </div>

        {/* Conversations List */}
        {conversations.length > 0 ? (
          <div className="space-y-4">
                         {conversations.map((conversation) => {
               const lastMessage = getLastMessage(conversation);
               const unreadCount = getUnreadCount(conversation);
               const isInitiator = conversation.initiator_id === currentUserId;
               const otherUser = isInitiator ? conversation.receiver : conversation.initiator;

              return (
                <Card 
                  key={conversation.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOpenChat(conversation)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Item Image */}
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        {conversation.item.images && conversation.item.images.length > 0 ? (
                          <img 
                            src={conversation.item.images[0].image_url} 
                            alt={conversation.item.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-muted-foreground text-xs">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {conversation.item.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.updated_at)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={otherUser.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {otherUser.full_name?.[0] || otherUser.username?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {otherUser.full_name || otherUser.username || 'Unknown User'}
                          </span>
                        </div>

                        {lastMessage ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground truncate">
                              {lastMessage.content}
                            </span>
                            {lastMessage.is_read ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No messages yet
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No conversations yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start trading by contacting item owners. Your conversations will appear here.
              </p>
              <Link to="/browse">
                <Button className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Browse Items
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

                        {/* Chat Modal */}
                  {showChat && selectedConversation && (
                    <Chat
                      itemId={selectedConversation.item.id}
                      receiverId={selectedConversation.receiver_id}
                      onClose={handleCloseChat}
                      conversation={selectedConversation}
                    />
                  )}
    </div>
  );
} 