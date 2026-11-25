'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  ADMIN_ROLE_DESCRIPTIONS,
  getAdminRoleLabel,
  getTabsForRole,
  isAdminRole,
} from '@/constants/adminPanels';

const AdminRoleBanner = ({
  role,
  permissions,
}: {
  role?: string;
  permissions?: string[];
}) => {
  if (!isAdminRole(role)) return null;

  const tabs = getTabsForRole(role, permissions);
  const description = role ? ADMIN_ROLE_DESCRIPTIONS[role] : '';

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl bg-[#FCF7FE] px-4 py-3 ring-1 ring-[#F0E4F8]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#611192]">
        <ShieldCheck className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[#0B0112]">
          {getAdminRoleLabel(role)} <span className="font-normal text-[#8A888C]">· {tabs.length} panel{tabs.length === 1 ? '' : 's'}</span>
        </p>
        {description ? <p className="truncate text-[12px] text-[#6B686E]">{description}</p> : null}
      </div>
    </div>
  );
};

export default AdminRoleBanner;
