import { useGetRooms, useGetSessionStats, getGetRoomsQueryKey } from "@workspace/api-client-react";
import { Users, Clock, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function BodyDoubling() {
  const { data: rooms, isLoading: roomsLoading } = useGetRooms();
  const { data: stats, isLoading: statsLoading } = useGetSessionStats();

  if (roomsLoading || statsLoading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-24">
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold">Body Doubling</h1>
        <p className="text-muted-foreground text-lg">Virtual focus rooms to anchor your attention.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-card rounded-2xl border border-border text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalHoursThisWeek}h</div>
            <div className="text-xs text-muted-foreground uppercase mt-1">Focus This Week</div>
          </div>
          <div className="p-4 bg-card rounded-2xl border border-border text-center">
            <div className="text-2xl font-bold">{stats.totalSessionsThisWeek}</div>
            <div className="text-xs text-muted-foreground uppercase mt-1">Sessions</div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="font-display font-semibold text-xl">Active Rooms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms?.map(room => (
            <div key={room.id} className="p-5 bg-card rounded-2xl border border-border hover:border-primary/50 transition-all flex items-center justify-between group">
              <div>
                <h3 className="font-semibold text-lg">{room.name}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {room.presenceCount}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {room.currentSessionMinutes || 25}m</span>
                </div>
              </div>
              <Button size="icon" className="rounded-full w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                <Play className="w-5 h-5 ml-1" />
              </Button>
            </div>
          ))}
          {rooms?.length === 0 && (
            <div className="p-8 col-span-2 text-center bg-card rounded-2xl border border-border text-muted-foreground">
              No active rooms. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
