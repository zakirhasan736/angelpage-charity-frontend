'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import AccountSettings from '@/components/account/AccountSettings';

/** Account tab: profile, sign-in, addresses and billing in one place. */
const UsersAccountInfoMain = () => {
  const router = useRouter();
  return <AccountSettings role="user" onDeleteTab={() => router.replace('?tab=delete', { scroll: false })} />;
};

export default UsersAccountInfoMain;
