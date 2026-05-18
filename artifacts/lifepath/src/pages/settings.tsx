import { useState, useEffect } from "react";
import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { data: user, isLoading } = useGetMe();
  const updateMe = useUpdateMe();
  const { toast } = useToast();
  
  const [name, setName] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
    }
  }, [user]);

  const handleSave = () => {
    updateMe.mutate(
      { data: { name } },
      {
        onSuccess: () => {
          toast({ title: "Settings saved" });
        }
      }
    );
  };

  if (isLoading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-20 w-full" /></div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-24">
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Name</label>
          <Input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-card border-border h-12"
          />
        </div>

        <Button onClick={handleSave} disabled={updateMe.isPending} className="w-full sm:w-auto">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
