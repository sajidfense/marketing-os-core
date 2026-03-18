import { useState, useEffect, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  CalendarCheck,
  Plus,
  Loader2,
  Trash2,
  X,
  Clock,
  Download,
  Search,
} from 'lucide-react';
import { api, ApiError } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { exportToCSV } from '@/lib/export';
import type { Booking, ApiResponse } from '@/types';

const statusBadge: Record<Booking['status'], 'default' | 'success' | 'warning' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'warning',
  confirmed: 'success',
  completed: 'default',
  cancelled: 'destructive',
};

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');

  const fetchBookings = async () => {
    try {
      const result = await api.get<ApiResponse<Booking[]>>('/bookings');
      if (result.success && result.data) {
        setBookings(result.data);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load bookings';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post<ApiResponse<Booking>>('/bookings', {
        title,
        scheduled_at: scheduledAt || null,
        notes: notes || null,
      });
      toast.success('Booking created');
      setTitle('');
      setScheduledAt('');
      setNotes('');
      setShowForm(false);
      await fetchBookings();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create booking';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/bookings/${id}`);
      toast.success('Booking deleted');
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete booking';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    exportToCSV(bookings, 'bookings', [
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'scheduled_at', label: 'Scheduled At' },
      { key: 'notes', label: 'Notes' },
      { key: 'created_at', label: 'Created' },
    ]);
    toast.success('Bookings exported');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const filtered = bookings.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-7 w-32 mb-2" /><Skeleton className="h-4 w-56" /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5"><Skeleton className="h-5 w-32 mb-3" /><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-3 w-full" /></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Manage your scheduled bookings"
        actions={
          <>
            {bookings.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            )}
            <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
              {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showForm ? 'Cancel' : 'New Booking'}
            </Button>
          </>
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Booking</CardTitle>
            <CardDescription>Schedule a new booking</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Title *</label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Booking title" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="scheduledAt" className="text-sm font-medium">Scheduled Date & Time</label>
                <Input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" />
              </div>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {submitting ? 'Creating...' : 'Create Booking'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {bookings.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search bookings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
      )}

      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings yet"
          description="Create your first booking to start scheduling."
          actionLabel="Create Booking"
          onAction={() => setShowForm(true)}
        />
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">No bookings match your search.</div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Title</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Scheduled</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Notes</th>
                  <th className="px-5 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => (
                  <tr key={booking.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{booking.title}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusBadge[booking.status]}>{booking.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(booking.scheduled_at)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground max-w-[200px] truncate">
                      {booking.notes || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(booking.id)} disabled={deletingId === booking.id} className="h-7 w-7">
                        {deletingId === booking.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
