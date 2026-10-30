import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog } from '../components/ui/dialog';
import { api } from '../lib/api';
import { SessionSummary } from '../lib/types';
import { COPY } from '../lib/copy';
import {
  History as HistoryIcon,
  Trash2,
  FileText,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const list = await api.listSessions();
      setSessions(list);
    } catch (err) {
      console.warn('Failed listing sessions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleOpenReport = async (sessionId: string) => {
    try {
      const report = await api.getReport(sessionId);
      navigate('/report', { state: { report } });
    } catch (err) {
      console.warn('Could not load report for session', sessionId, err);
    }
  };

  const handleDeleteOne = async (sessionId: string) => {
    try {
      await api.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (err) {
      console.warn('Failed deleting session', sessionId, err);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await api.deleteAllSessions();
      setSessions([]);
      setShowDeleteAllModal(false);
    } catch (err) {
      console.warn('Failed erasing all sessions', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Delete All Confirmation Dialog */}
      <Dialog
        open={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        className="max-w-md text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <h3 className="font-heading font-bold text-xl text-stone-900 mb-2">
          {COPY.history.confirmDeleteAllTitle}
        </h3>

        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
          {COPY.history.confirmDeleteAllMsg}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="danger"
            size="md"
            onClick={handleDeleteAll}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? 'Erasing...' : COPY.history.confirmDeleteButton}
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setShowDeleteAllModal(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {COPY.history.cancelButton}
          </Button>
        </div>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
            Local Data Management
          </span>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-stone-900">
            {COPY.history.title}
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            {COPY.history.subtitle}
          </p>
        </div>

        {sessions.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteAllModal(true)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>{COPY.history.deleteAll}</span>
          </Button>
        )}
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-4">
            <HistoryIcon className="w-7 h-7" />
          </div>
          <h3 className="font-heading font-bold text-lg text-stone-900 mb-1">
            {COPY.history.emptyTitle}
          </h3>
          <p className="text-stone-500 text-xs sm:text-sm max-w-sm mx-auto mb-6">
            {COPY.history.emptySubtitle}
          </p>
          <Link to="/consent">
            <Button size="md" className="gap-2">
              <span>Start New Screening</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((item) => (
            <Card
              key={item.session_id}
              className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-stone-300 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-stone-900">
                    {item.nickname || 'Participant'}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(item.created_at).toLocaleDateString()} at{' '}
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-stone-300">·</span>
                    <span className="font-mono text-[11px] text-stone-400">
                      ID: {item.session_id.substring(0, 12)}...
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100">
                <Button
                  size="sm"
                  onClick={() => handleOpenReport(item.session_id)}
                  className="px-4"
                >
                  {COPY.history.openReport}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteOne(item.session_id)}
                  className="text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                  aria-label={`Delete session ${item.nickname}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
