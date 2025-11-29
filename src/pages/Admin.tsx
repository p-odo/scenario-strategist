import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trash2, RefreshCw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Group {
  id: string;
  name: string;
  created_at: string;
}

interface Submission {
  id: string;
  prompt: string;
  ai_score: number | null;
  user_rating: number | null;
  created_at: string;
  group_id: string;
}

export default function Admin() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error('Admin access required');
      navigate('/');
      return;
    }

    if (isAdmin) {
      loadData();
      setupRealtimeSubscriptions();
    }
  }, [isAdmin, authLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsRes, submissionsRes] = await Promise.all([
        supabase.from('groups').select('*').order('created_at', { ascending: false }),
        supabase.from('copilot_submissions').select('*').order('created_at', { ascending: false }),
      ]);

      if (groupsRes.data) setGroups(groupsRes.data);
      if (submissionsRes.data) setSubmissions(submissionsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const groupsChannel = supabase
      .channel('admin-groups')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
        loadData();
      })
      .subscribe();

    const submissionsChannel = supabase
      .channel('admin-submissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'copilot_submissions' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(groupsChannel);
      supabase.removeChannel(submissionsChannel);
    };
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      const { error } = await supabase.from('groups').delete().eq('id', id);
      if (error) throw error;
      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    try {
      const { error } = await supabase.from('copilot_submissions').delete().eq('id', id);
      if (error) throw error;
      toast.success('Submission deleted successfully');
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>

      <Tabs defaultValue="groups" className="w-full">
        <TabsList>
          <TabsTrigger value="groups">Groups ({groups.length})</TabsTrigger>
          <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>All Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>{new Date(group.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Group</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{group.name}"? This will also delete all associated progress and choices.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteGroup(group.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Copilot Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prompt</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead>User Rating</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="max-w-md truncate">{submission.prompt}</TableCell>
                      <TableCell>{submission.ai_score?.toFixed(2) ?? 'N/A'}</TableCell>
                      <TableCell>{submission.user_rating ?? 'N/A'}</TableCell>
                      <TableCell>{new Date(submission.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Submission</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this submission?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSubmission(submission.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
