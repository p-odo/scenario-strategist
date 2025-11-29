import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GroupSelection from "./pages/GroupSelection";
import Home from "./pages/Home";
import ScenarioConfirmation from "./pages/ScenarioConfirmation";
import Task from "./pages/Task";
import OptionConfirmation from "./pages/OptionConfirmation";
import CopilotTask from "./pages/CopilotTask";
import Complete from "./pages/Complete";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GroupSelection />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/home" element={<Home />} />
          <Route path="/scenario/:scenarioId" element={<ScenarioConfirmation />} />
          <Route path="/scenario/:scenarioId/task/:taskNumber" element={<Task />} />
          <Route path="/scenario/:scenarioId/task/:taskNumber/option/:optionId" element={<OptionConfirmation />} />
          <Route path="/scenario/:scenarioId/copilot" element={<CopilotTask />} />
          <Route path="/scenario/:scenarioId/complete" element={<Complete />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
