import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

export function StatCard({ title, value, helper, icon: Icon }: { title: string; value: string; helper: string; icon: LucideIcon }) {
  return (
    <Card className="surface border-white/10 bg-white/5 text-white">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-slate-300">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{helper}</p>
        </div>
        <div className="rounded-2xl bg-blue-500/20 p-3 text-blue-300">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
