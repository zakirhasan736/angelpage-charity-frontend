'use client';

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { ScrollText } from 'lucide-react';
import { EmptyState, humanizeStatus, RowSkeleton, StatusPill, Toolbar } from '@/components/dashboard/DashKit';

interface AuditEntry {
  _id: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

const AdminAuditLogPanel = () => {
  const { data: session } = useSession() || {};
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.token) return;
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/audit-logs`,
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      setLogs(res.data.logs || []);
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    load();
  }, [load]);

  const [q, setQ] = useState('');
  if (loading) return <RowSkeleton rows={5} />;

  const term = q.trim().toLowerCase();
  const visible = logs.filter(l => !term || `${l.action} ${l.actorRole} ${l.entityType} ${l.entityId}`.toLowerCase().includes(term));

  return (
    <div className="audit-log-panel">
      <p className="mb-4 text-[13px] text-[#6B686E]">Every admin action: payouts, escrow releases, dispute decisions, approvals.</p>
      <Toolbar search={q} onSearch={setQ} placeholder="Search actions, roles or IDs" />
      {visible.length === 0 ? (
        <EmptyState icon={ScrollText} title={logs.length ? 'No entries match' : 'No audit entries yet'} />
      ) : (
        <ol className="relative space-y-2 before:absolute before:top-2 before:bottom-2 before:left-[19px] before:w-px before:bg-[#ECE8EE]">
          {visible.map(log => (
            <li key={log._id} className="relative flex items-start gap-3 rounded-2xl bg-white p-3 pl-0 ring-1 ring-transparent hover:ring-[#ECE8EE]">
              <span className="relative z-10 ml-[11px] mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white ring-4 ring-white">
                <span className="h-2.5 w-2.5 rounded-full bg-[#611192]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-[#0B0112]">
                  <span className="font-semibold">{humanizeStatus(log.action)}</span>
                  <span className="text-[#6B686E]">
                    {' '}
                    on {log.entityType}
                    {log.entityId ? ` #${String(log.entityId).slice(-8)}` : ''}
                  </span>
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-[#8A888C]">
                  <StatusPill status={humanizeStatus(log.actorRole)} tone="purple" />
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default AdminAuditLogPanel;
