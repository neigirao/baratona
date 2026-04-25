import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function EventCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[16/7] w-full rounded-none" />
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-8 w-24 mt-2" />
      </CardContent>
    </Card>
  );
}

export function EventCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BarCardSkeleton() {
  return (
    <Card className="overflow-hidden flex flex-col">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <CardContent className="py-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export function BarCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <BarCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function EventLandingSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-in fade-in">
      <Skeleton className="h-64 w-full rounded-none" />
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-7 flex-1" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>
        <BarCardSkeletonGrid count={4} />
      </div>
    </div>
  );
}
