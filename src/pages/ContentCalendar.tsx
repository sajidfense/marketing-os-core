import { useState, useMemo, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarRange,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Image,
  FileText,
  Video,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import type { ApiResponse } from '@/types';

type ContentType = 'blog' | 'social' | 'video' | 'email';

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: 'draft' | 'scheduled' | 'published';
  day: number; // day of month
}

interface ApiContentItem {
  id: string;
  title: string;
  content_type: ContentType;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_day: number;
  scheduled_month: number;
  scheduled_year: number;
  created_at: string;
  updated_at: string;
}

function mapApiItem(item: ApiContentItem): ContentItem {
  return {
    id: item.id,
    title: item.title,
    type: item.content_type,
    status: item.status,
    day: item.scheduled_day,
  };
}

const typeConfig: Record<ContentType, { icon: typeof FileText; color: string; label: string }> = {
  blog: { icon: FileText, color: '#6366F1', label: 'Blog' },
  social: { icon: MessageSquare, color: '#22C55E', label: 'Social' },
  video: { icon: Video, color: '#F59E0B', label: 'Video' },
  email: { icon: Image, color: '#EC4899', label: 'Email' },
};

const statusVariant: Record<string, 'success' | 'default' | 'secondary'> = {
  published: 'success',
  scheduled: 'default',
  draft: 'secondary',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ContentCalendar() {
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addType, setAddType] = useState<ContentType>('blog');
  const [addDay, setAddDay] = useState('');
  const [addStatus, setAddStatus] = useState<'draft' | 'scheduled'>('draft');

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Mon=0

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<ApiResponse<ApiContentItem[]>>('/content-items');
      if (res.success && res.data) {
        const filtered = res.data
          .filter(
            (item) =>
              item.scheduled_month === currentMonth + 1 &&
              item.scheduled_year === currentYear,
          )
          .map(mapApiItem);
        setContent(filtered);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load content items');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDayOfWeek, daysInMonth]);

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  }

  const contentByDay = useMemo(() => {
    const map: Record<number, ContentItem[]> = {};
    for (const item of content) {
      if (!map[item.day]) map[item.day] = [];
      map[item.day].push(item);
    }
    return map;
  }, [content]);

  const selectedItems = selectedDay ? contentByDay[selectedDay] ?? [] : [];

  const stats = useMemo(() => ({
    total: content.length,
    published: content.filter((c) => c.status === 'published').length,
    scheduled: content.filter((c) => c.status === 'scheduled').length,
    draft: content.filter((c) => c.status === 'draft').length,
  }), [content]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const dayNum = parseInt(addDay, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > daysInMonth) {
      toast.error(`Day must be between 1 and ${daysInMonth}`);
      return;
    }
    try {
      const res = await api.post<ApiResponse<ApiContentItem>>('/content-items', {
        title: addTitle,
        content_type: addType,
        status: addStatus,
        scheduled_day: dayNum,
        scheduled_month: currentMonth + 1,
        scheduled_year: currentYear,
      });
      if (res.success && res.data) {
        setContent((prev) => [...prev, mapApiItem(res.data!)]);
      }
      setShowAdd(false);
      setAddTitle('');
      setAddDay('');
      setAddType('blog');
      setAddStatus('draft');
      toast.success('Content added to calendar');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create content item');
    }
  }

  function openAddForDay(day: number) {
    setAddDay(String(day));
    setShowAdd(true);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Content Calendar"
        description="Plan and schedule your content pipeline"
        actions={
          <div className="flex gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
              {(['calendar', 'list'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors capitalize',
                    view === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/ai/blog-planner')}>
              <Sparkles className="h-3.5 w-3.5" />
              Generate Post
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5" />
              New Content
            </Button>
          </div>
        }
      />

      {/* Add Content Dialog */}
      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <DialogHeader>
          <DialogTitle>New Content</DialogTitle>
          <DialogDescription>Schedule a new content piece for the calendar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input value={addTitle} onChange={(e) => setAddTitle(e.target.value)} placeholder="e.g. Instagram Carousel - Product Tips" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select
                value={addType}
                onChange={(e) => setAddType(e.target.value as ContentType)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Day of Month *</label>
              <Input type="number" min={1} max={daysInMonth} value={addDay} onChange={(e) => setAddDay(e.target.value)} placeholder={`1-${daysInMonth}`} required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <div className="flex gap-2">
              {(['draft', 'scheduled'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAddStatus(s)}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                    addStatus === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" size="sm" className="gap-2" disabled={!addTitle.trim() || !addDay}>
              <Plus className="h-3.5 w-3.5" />
              Add Content
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Loading state */}
      {loading && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-10" />
              </Card>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            <Card className="lg:col-span-3 p-4">
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-[72px] rounded-lg" />
                ))}
              </div>
            </Card>
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {!loading && content.length === 0 && (
        <EmptyState
          icon={CalendarRange}
          title="No content yet"
          description="Create your first post to start building your content calendar."
          actionLabel="New Content"
          onAction={() => setShowAdd(true)}
        />
      )}

      {/* Stats */}
      {!loading && content.length > 0 && (
        <>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: stats.total, color: '#6366F1' },
            { label: 'Published', value: stats.published, color: '#22C55E' },
            { label: 'Scheduled', value: stats.scheduled, color: '#3B82F6' },
            { label: 'Drafts', value: stats.draft, color: '#64748B' },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold tabular-nums mt-0.5" style={{ color: s.color }}>{s.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-sm font-semibold">{MONTHS[currentMonth]} {currentYear}</h2>
            <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <CardContent className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const items = day ? contentByDay[day] ?? [] : [];
                const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
                const isSelected = day === selectedDay;

                return (
                  <button
                    key={i}
                    disabled={!day}
                    onClick={() => day && setSelectedDay(isSelected ? null : day)}
                    className={cn(
                      'relative flex flex-col items-start rounded-lg p-1.5 min-h-[72px] text-left transition-all duration-150',
                      day ? 'hover:bg-muted/50 cursor-pointer' : 'cursor-default',
                      isSelected && 'bg-primary/5 border border-primary/20',
                      isToday && !isSelected && 'bg-muted/30',
                    )}
                  >
                    {day && (
                      <>
                        <span className={cn(
                          'text-xs tabular-nums mb-1',
                          isToday ? 'font-bold text-primary' : 'text-muted-foreground',
                        )}>
                          {day}
                        </span>
                        <div className="flex flex-wrap gap-0.5">
                          {items.slice(0, 3).map((item) => {
                            const tc = typeConfig[item.type];
                            return (
                              <div
                                key={item.id}
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: tc.color }}
                                title={item.title}
                              />
                            );
                          })}
                          {items.length > 3 && (
                            <span className="text-[8px] text-muted-foreground">+{items.length - 3}</span>
                          )}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detail panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {selectedDay ? `${MONTHS[currentMonth]} ${selectedDay}` : 'Select a day'}
            </h3>
            {selectedDay && (
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => openAddForDay(selectedDay)}>
                <Plus className="h-3 w-3" />
                Add
              </Button>
            )}
          </div>

          {selectedItems.length > 0 ? (
            selectedItems.map((item) => {
              const tc = typeConfig[item.type];
              const Icon = tc.icon;
              return (
                <Card
                  key={item.id}
                  className="p-3 hover:border-primary/20 transition-colors cursor-pointer"
                  onClick={() => item.type === 'blog' ? navigate(`/blog/${item.id}`) : undefined}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${tc.color}15`, color: tc.color }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant={statusVariant[item.status]} className="text-[9px]">{item.status}</Badge>
                        <span className="text-[10px] text-muted-foreground capitalize">{item.type}</span>
                        {item.type === 'blog' && (
                          <span className="text-[9px] text-primary">Edit →</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                {selectedDay ? 'No content scheduled' : 'Click a date to view content'}
              </p>
              {selectedDay && (
                <Button variant="ghost" size="sm" className="mt-3 text-xs gap-1" onClick={() => openAddForDay(selectedDay)}>
                  <Plus className="h-3 w-3" />
                  Add content
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
