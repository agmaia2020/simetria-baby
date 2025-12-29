import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import PatientRegistration from "./pages/PatientRegistration";
import MeasurementsRegistration from "./pages/MeasurementsRegistration";
import PatientsList from "./pages/PatientsList";
import PatientEvolution from "./pages/PatientEvolution";
import UserProfile from "./pages/UserProfile";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import Debug from "./pages/Debug";
import LandingPage from "./pages/LandingPage";
import PatientGallery from "@/pages/PatientGallery";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Landing Page - Pública */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Autenticação */}
            <Route path="/auth/:type?" element={<AuthPage />} />
            
            {/* Rotas Protegidas */}
            <Route 
              path="/home" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cadastro-paciente" 
              element={
                <ProtectedRoute>
                  <PatientRegistration />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cadastro-medidas" 
              element={
                <ProtectedRoute>
                  <MeasurementsRegistration />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lista-pacientes" 
              element={
                <ProtectedRoute>
                  <PatientsList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/evolucao-paciente" 
              element={
                <ProtectedRoute>
                  <PatientEvolution />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/perfil" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/debug" 
              element={
                <ProtectedRoute>
                  <Debug />
                </ProtectedRoute>
              } 
            />
            <Route path="/galeria-paciente" element={<PatientGallery />} />
            
            {/* Páginas Públicas */}
            <Route path="/termos-de-servico" element={<TermsOfServicePage />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;