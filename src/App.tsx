import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import GroupSelection from "./pages/GroupSelection";
import Home from "./pages/Home";
import ScenarioConfirmation from "./pages/ScenarioConfirmation";
import Task from "./pages/Task"; // The new "Master" Task component
import Complete from "./pages/Complete";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 1. Entry & Home */}
          <Route path="/" element={<GroupSelection />} />
          <Route path="/home" element={<Home />} />
          
          {/* 2. Scenario Start */}
          <Route path="/scenario/:scenarioId" element={<ScenarioConfirmation />} />
          
          {/* 3. The Unified Task Route 
              This single route now handles:
              - Standard Choice Tasks
              - Upload Tasks
              - MCQ Tasks
              - Copilot Tasks
              (Logic inside Task.tsx determines which sub-component to render)
          */}
          <Route path="/scenario/:scenarioId/task/:taskNumber" element={<Task />} />
          
          {/* 4. Scenario Completion */}
          <Route path="/scenario/:scenarioId/complete" element={<Complete />} />
          
          {/* 5. Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
