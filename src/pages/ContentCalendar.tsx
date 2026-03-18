import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { cn } from '@/lib/utils';

type ContentType = 'blog' | 'social' | 'video' | 'email';

interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  status: 'draft' | 'scheduled' | 'published';
  day: number; // day of month
}

const typeConfig: Record<ContentType, { icon: typeof FileText; color: string }> = {
  blog: { icon: FileText, color: '#6366F1' },
  social: { icon: MessageSquare, color: '#22C55E' },
  video: { icon: Video, color: '#F59E0B' },
  email: { icon: Image, color: '#EC4899' },
};

const statusVariant: Record<string, 'success' | 'default' | 'secondary'> = {
  published: 'success',
  scheduled: 'default',
  draft: 'secondary',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Mock content for the current month
const mockContent: ContentItem[] = [
  { id: '1', title: 'Product Launch Blog', type: 'blog', status: 'published', day: 3 },
  { id: '2', title: 'Instagram Carousel', type: 'social', status: 'published', day: 5 },
  { id: '3', title: 'Demo Video', type: 'video', status: 'scheduled', day: 8 },
  { id: '4', title: 'Newsletter #12', type: 'email', status: 'scheduled', day: 10 },
  { id: '5', title: 'Case Study Post', type: 'blog', status: 'draft', day: 12 },
  { id: '6', title: 'TikTok Tutorial', type: 'video', status: 'draft', day: 14 },
  { id: '7', title: 'LinkedIn Article', type: 'social', status: 'scheduled', day: 17 },
  { id: '8', title: 'SEO Blog Post', type: 'blog', status: 'draft', day: 19 },
  { id: '9', title: 'Reels - BTS', type: 'video', status: 'draft', day: 22 },
  { id: '10', title: 'Twitter Thread', type: 'social', status: 'scheduled', day: 24 },
  { id: '11', title: 'Product Update Email', type: 'email', status: 'draft', day: 26 },
  { id: '12', title: 'Month Recap Blog', type: 'blog', status: 'draft', day: 28 },
];

export default function ContentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Mon=0

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
    for (const item of mockContent) {
      if (!map[item.day]) map[item.day] = [];
      map[item.day].push(item);
    }
    return map;
  }, []);

  const selectedItems = selectedDay ? contentByDay[selectedDay] ?? [] : [];

  const stats = useMemo(() => ({
    total: mockContent.length,
    published: mockContent.filter((c) => c.status === 'published').length,
    scheduled: mockContent.filter((c) => c.status === 'scheduled').length,
    draft: mockContent.filter((c) => c.status === 'draft').length,
  }), []);

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
            <Button size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              New Content
            </Button>
          </div>
        }
      />

      {/* Stats */}
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
          <h3 className="text-sm font-semibold text-muted-foreground">
            {selectedDay ? `${MONTHS[currentMonth]} ${selectedDay}` : 'Select a day'}
          </h3>

          {selectedItems.length > 0 ? (
            selectedItems.map((item) => {
              const tc = typeConfig[item.type];
              const Icon = tc.icon;
              return (
                <Card key={item.id} className="p-3 hover:border-primary/20 transition-colors cursor-pointer">
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
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
