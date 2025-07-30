import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  MessageCircle, 
  ArrowLeft,
  Clock,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { chatApi } from "@/lib/api";
import { ConversationWithDetails, MessageWithDetails } from "@/types/database";
import { supabase } from "@/lib/supabase";

interface ChatProps {
  itemId: string;
  receiverId: string;
  onClose: () => void;
  conversation?: ConversationWithDetails; // Optional conversation data if already available
}

export const Chat = ({ itemId, receiverId, onClose, conversation: initialConversation }: ChatProps) => {
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Load conversation
  useEffect(() => {
    const loadConversation = async () => {
      try {
        setLoading(true);
        console.log('Loading conversation for itemId:', itemId, 'receiverId:', receiverId);
        
        // If we already have conversation data, use it
        if (initialConversation) {
          console.log('Using provided conversation data:', initialConversation);
          setConversation(initialConversation);
          // Mark messages as read even when using initial conversation data
          await chatApi.markAsRead(initialConversation.id);
          setLoading(false);
          return;
        }
        
        // First, check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current user:', user?.id);
        
        if (!user) {
          console.error('No authenticated user found');
          toast({
            title: "Error",
            description: "You must be logged in to start a conversation.",
            variant: "destructive",
          });
          return;
        }
        
        const conv = await chatApi.getOrCreateConversation(itemId, receiverId);
        console.log('Conversation result:', conv);
        setConversation(conv);
        
        if (conv) {
          // Mark messages as read
          await chatApi.markAsRead(conv.id);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        toast({
          title: "Error",
          description: "Failed to load conversation. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [itemId, receiverId, toast, initialConversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        async (payload) => {
          // Reload conversation to get new messages
          const updatedConversation = await chatApi.getConversation(conversation.id);
          if (updatedConversation) {
            setConversation(updatedConversation);
            // Mark as read if we're the receiver
            const { data: { user } } = await supabase.auth.getUser();
            if (user && payload.new.receiver_id === user.id) {
              await chatApi.markAsRead(conversation.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation]);

  const handleSendMessage = async () => {
    if (!message.trim() || !conversation) return;

    try {
      setSending(true);
      const newMessage = await chatApi.sendMessage(conversation.id, message.trim());
      
      if (newMessage) {
        setMessage("");
        // Reload conversation to get updated messages
        const updatedConversation = await chatApi.getConversation(conversation.id);
        if (updatedConversation) {
          setConversation(updatedConversation);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading conversation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Error</h3>
              <p className="text-muted-foreground mb-4">Failed to load conversation</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isInitiator = conversation.initiator_id === currentUserId;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-lg">Chat about {conversation.item.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  with {isInitiator ? conversation.receiver.full_name || conversation.receiver.username : conversation.initiator.full_name || conversation.initiator.username}
                </p>
              </div>
            </div>
            <Badge variant="outline">
              <MessageCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
                <p className="text-muted-foreground">
                  Send a message to discuss this item with the owner.
                </p>
              </div>
            ) : (
                             conversation.messages.map((msg) => {
                 const isOwnMessage = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!isOwnMessage && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={msg.sender.avatar_url || undefined} />
                          <AvatarFallback>
                            {msg.sender.full_name?.[0] || msg.sender.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`rounded-lg px-3 py-2 ${
                        isOwnMessage 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <span className="text-xs opacity-70">
                            {formatTime(msg.created_at)}
                          </span>
                          {isOwnMessage && (
                            msg.is_read ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t p-4 flex-shrink-0">
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={sending}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!message.trim() || sending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 