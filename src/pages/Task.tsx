import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Import ALL your task components here
import StandardChoiceTask from "./task-types/StandardChoiceTask";
import UploadTask from "./task-types/UploadTask";
import CopilotTask from "./task-types/CopilotTask"; // Make sure this file exists
import MCQTask from "./task-types/MCQTask";         // Make sure this file exists

export default function Task() {
  const { scenarioId, taskNumber } = useParams();
  const navigate = useNavigate();
  const [taskData, setTaskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveTask() {
      if (!scenarioId || !taskNumber) return;

      // Fetch scenario and tasks
      const [scenarioResult, tasksResult] = await Promise.all([
        supabase.from("scenarios").select("*").eq("id", scenarioId).single(),
        supabase.from("tasks").select("*, options(*)").eq("scenario_id", scenarioId).order("order_index")
      ]);

      if (tasksResult.error || !tasksResult.data) {
        toast.error("Could not load tasks");
        return;
      }

      let tasks = tasksResult.data;
      const scenario = scenarioResult.data;

      // SWAP LOGIC FOR SCENARIO 1: Swap Task 1 (Choice) and Task 2 (Upload)
      if (scenario && (scenario.name.includes("Scenario 1") || scenario.order_index === 1)) {
        const t1 = tasks.find(t => t.order_index === 1);
        const t2 = tasks.find(t => t.order_index === 2);
        
        if (t1 && t2) {
          // Swap order_index
          const temp = t1.order_index;
          t1.order_index = t2.order_index;
          t2.order_index = temp;
          
          // Re-sort
          tasks.sort((a, b) => a.order_index - b.order_index);
        }
      }

      const currentTask = tasks.find((t) => t.order_index === parseInt(taskNumber));

      if (!currentTask) {
        toast.error("Task not found");
        navigate("/home");
        return;
      }

      const taskWithType = currentTask as any;

      // UPDATE: Set data for rendering instead of navigating away
      switch (taskWithType.task_type) {
        case "COPILOT":
          setTaskData({ ...currentTask, type: 'COPILOT', allTasks: tasks });
          break;

        case "MCQ":
          setTaskData({ ...currentTask, type: 'MCQ', allTasks: tasks });
          break;

        case "UPLOAD":
          setTaskData({ ...currentTask, type: 'UPLOAD', allTasks: tasks });
          break;

        case "CHOICE":
        default:
          setTaskData({ ...currentTask, type: 'CHOICE', allTasks: tasks });
          break;
      }
      setLoading(false);
    }

    resolveTask();
  }, [scenarioId, taskNumber, navigate]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );
  }

  // RENDER LOGIC: Directly show the correct component based on type
  if (taskData?.type === 'COPILOT') {
    return <CopilotTask task={taskData} tasks={taskData.allTasks} />;
  }
  
  if (taskData?.type === 'MCQ') {
    return <MCQTask task={taskData} tasks={taskData.allTasks} />;
  }

  if (taskData?.type === 'UPLOAD') {
    return <UploadTask task={taskData} tasks={taskData.allTasks} />;
  }

  // Default to Standard Choice
  return <StandardChoiceTask task={taskData} tasks={taskData.allTasks} />;
}