import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useGroupStore } from "@/hooks/useGroupStore";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input"; // Make sure you have this or use standard input
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileUp, X, CheckCircle2, ExternalLink } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface UploadTaskProps {
  task: any;
  tasks: any[];
}

export default function UploadTask({ task, tasks }: UploadTaskProps) {
  const { groupId, groupName } = useGroupStore();
  const navigate = useNavigate();
  
  // State for file handling
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSubmittedDialog, setShowSubmittedDialog] = useState(false);
  
  const currentTaskIndex = task.order_index - 1;

  // --- THE MISSING FUNCTION ---
  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (!groupId) {
      toast.error("Group ID missing.");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload File to Supabase Storage
      // Ensure you have a bucket named 'task_images' in Supabase Storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${groupId}/${task.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('task_images')
        .upload(fileName, uploadFile);

      if (uploadError) throw uploadError;

      // 2. Get the Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task_images')
        .getPublicUrl(fileName);

      // 3. Write to the NEW 'upload_submissions' table
      const { error: dbError } = await supabase
  .from('upload_submissions' as any) // <--- Add 'as any'
  .insert({
    group_id: groupId,
    task_id: task.id,
    image_url: publicUrl
  });

      if (dbError) throw dbError;

      // 4. Update Progress
      await supabase.from("group_progress").upsert({
          group_id: groupId,
          scenario_id: task.scenario_id,
          current_task: task.order_index + 1,
      });

      toast.success("Submission received!");
      setUploadFile(null);
      setShowSubmittedDialog(true);

    } catch (error: any) {
      console.error("Error uploading:", error);
      toast.error(error.message || "Failed to upload submission");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setUploadFile(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header groupName={groupName || undefined} />
      
      <div className="container mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            {tasks.map((t, index) => (
              <div key={t.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${index <= currentTaskIndex ? "" : "opacity-40"}`}>
                  {index < currentTaskIndex ? (
                    <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center text-success-foreground">✓</div>
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${index === currentTaskIndex ? "bg-primary" : "bg-muted"} flex items-center justify-center font-semibold`}>
                      {index + 1}
                    </div>
                  )}
                  <span className={index === currentTaskIndex ? "font-semibold" : "text-muted-foreground"}>{t.title}</span>
                </div>
                {index < tasks.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${index < currentTaskIndex ? "bg-success" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Task Title & Description */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary">{task.order_index}</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-primary mb-3">{task.title}</h2>
              <div className="prose-invert text-base text-muted-foreground max-w-none">
                <ReactMarkdown>{task.description || ""}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Copilot Link Button */}
        <div className="flex justify-center mb-8">
          <Button 
            variant="secondary"
            className="gap-2"
            onClick={() => window.open("https://m365.cloud.microsoft/chat/?FORM=undexpand&auth=2&internalredirect=CCM", "_blank")}
          >
            Open Microsoft Copilot <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        {/* Upload Interface (Replaces iframe) */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 border-dashed border-2 border-primary/20 bg-card/50 backdrop-blur-sm flex flex-col items-center justify-center min-h-[400px]">
            
            {!uploadFile ? (
              <div className="text-center space-y-4 w-full max-w-md">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Upload your Diagram / Architecture</h3>
                <p className="text-muted-foreground">
                  Drag and drop your file here, or click to browse.
                  <br />Supports JPG, PNG, PDF.
                </p>
                <div className="pt-4">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-8 rounded-md flex items-center justify-center font-medium transition-colors">
                      Browse Files
                    </div>
                    <Input 
                      id="file-upload" 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileChange} 
                      accept="image/*,application/pdf"
                    />
                  </Label>
                </div>
              </div>
            ) : (
              <div className="text-center w-full max-w-md">
                <div className="bg-background border rounded-lg p-6 mb-6 flex items-center gap-4 relative">
                  <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                    <FileUp className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left flex-1 overflow-hidden">
                    <p className="font-semibold truncate">{uploadFile.name}</p>
                    <p className="text-sm text-muted-foreground">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button 
                    onClick={clearFile}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:bg-destructive/90"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <Button 
                  onClick={handleUpload} 
                  size="lg" 
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? "Uploading..." : "Confirm & Submit Task"}
                </Button>
                
                <p className="text-sm text-muted-foreground mt-4">
                  Make sure this is the correct file before submitting.
                </p>
              </div>
            )}

          </Card>
        </div>
      </div>

      {/* Submitted Dialog */}
      <Dialog open={showSubmittedDialog} onOpenChange={setShowSubmittedDialog}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Submission Received!</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <p className="text-muted-foreground text-lg">
              Please wait for helper instructions before moving on to the next task.
            </p>
          </div>
          <Button 
            onClick={() => {
              setShowSubmittedDialog(false);
              window.scrollTo(0, 0);
              const nextTaskNumber = parseInt(task.order_index) + 1;
              if (nextTaskNumber <= tasks.length) {
                navigate(`/scenario/${task.scenario_id}/task/${nextTaskNumber}`);
              } else {
                navigate(`/scenario/${task.scenario_id}/complete`);
              }
            }}
            className="w-full"
            size="lg"
          >
            Next Task
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}