import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import ListItem from "./pages/ListItem";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import TradeDetail from "./pages/TradeDetail";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Favorites from "./pages/Favorites";

const queryClient = new QueryClient();

const App = () => {
  console.log('App component rendering...');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen pb-16 md:pb-0">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/trade/:id" element={<TradeDetail />} />
                  <Route path="/login" element={<Login />} />
                  
                  {/* Protected Routes - Require Authentication */}
                  <Route path="/list-item" element={
                    <ProtectedRoute>
                      <ListItem />
                    </ProtectedRoute>
                  } />
                  <Route path="/edit-item/:id" element={
                    <ProtectedRoute>
                      <ListItem />
                    </ProtectedRoute>
                  } />
                  <Route path="/messages" element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/favorites" element={
                    <ProtectedRoute>
                      <Favorites />
                    </ProtectedRoute>
                  } />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <MobileBottomNav />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
