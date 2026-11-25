'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import moment from 'moment';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Check, Users, X } from 'lucide-react';
import { ConfirmDialog, SectionCard, StatusPill, Toolbar } from '@/components/dashboard/DashKit';
import Pagination from '@/components/elements/Pagination';

interface User {
  id: string;
  fullName: string;
  email: string;
  signedUp: string;
  userId?: string;
  profileImage: string;
  type: 'USER' | 'CHARITY';
  canBlog?: boolean;
  verified?: boolean;
  totalPages?: string;
  totalRecords?: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  duration: string;
  profileImage: string;
  userId?: string;
  charityId?: string;

  role: 'USER' | 'CHARITY';
  canBlog?: boolean;
  verified?: boolean;
}
interface UserApiResponse {
  users: UserResponse[];
  totalPages: number;
  totalRecords: number;
}
const UsersTable: React.FC = () => {
  const { data: session } = useSession() || {};
  const [users, setUsers] = useState<User[]>([]); // Store all users (combined list)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]); // Store selected users
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalFilteredRecords, setTotalFilteredRecords] = useState(0); // Total filtered users count
  const usersPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      if (!session?.token) return;

      try {
        const response = await axios.get<UserApiResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/users/overview`,
          {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
            params: {
              page: currentPage,
              limit: usersPerPage,
              searchTerm,
              statusFilter,
              sessionFilter,
            },
          }
        );

        const formattedUsers = response.data.users.map(user => ({
          id: user.id,
          fullName: user.name,
          email: user.email,
          signedUp: user.duration,
          profileImage: user.profileImage,
          userId: user.userId || user.charityId || 'N/A',
          type: user.role,
          canBlog: user.canBlog || false,
          verified: user.verified || false,
        }));

        setUsers(formattedUsers);
        setTotalPages(response.data?.totalPages);
        setTotalFilteredRecords(response.data?.totalRecords);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [session?.token, currentPage, searchTerm, statusFilter, sessionFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSessionFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSessionFilter(e.target.value);
  };

  const handleStatusFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setStatusFilter(e.target.value);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedUsers([]); // Reset selected users on page change
  };

  // Updated handleSelectAll function
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]); // Deselect all
    } else {
      setSelectedUsers(users.map(user => user.id)); // Select only users on the current page
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.type === statusFilter);
    }

    if (sessionFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (sessionFilter === 'last7days') {
          return (
            user.signedUp?.toLowerCase().includes('day') ||
            user.signedUp?.toLowerCase().includes('week')
          );
        }
        if (sessionFilter === '1month') {
          return user.signedUp?.toLowerCase().includes('month');
        }
        return true;
      });
    }
 if (sessionFilter === 'all') {
   filtered = filtered.sort((a, b) => {
     // Parse 'signedUp' using moment.js
     const dateA = moment(a.signedUp, 'x'); // Parse the relative date string to moment
     const dateB = moment(b.signedUp, 'x'); // Parse the relative date string to moment

     return dateB.isBefore(dateA) ? -1 : 1; // Sort descending (most recent first)
   });
 }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.fullName?.toLowerCase().includes(lowerSearchTerm) ||
          user.email?.toLowerCase().includes(lowerSearchTerm) ||
          user.id?.toLowerCase().includes(lowerSearchTerm) ||
          user.signedUp?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    return filtered;
  }, [users, statusFilter, sessionFilter, searchTerm]);

  // Slice the filtered users for the current page
  // const currentUsers = filteredUsers.slice(
  //   (currentPage - 1) * usersPerPage,
  //   currentPage * usersPerPage
  // );

  const startCount = (currentPage - 1) * usersPerPage + 1;
  const endCount = Math.min(currentPage * usersPerPage, filteredUsers.length);

  const handleBulkVerify = async (verified: boolean) => {
    if (!session?.token || !selectedUsers.length) return;
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/bulk/verified`,
        { userIds: selectedUsers, verified },
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      setUsers(users.map(u =>
        selectedUsers.includes(u.id) ? { ...u, verified } : u
      ));
      setSelectedUsers([]);
    } catch (error) {
      console.error('Bulk verify failed:', error);
    }
  };

  const handleDeleteUsers = async () => {
    if (!session?.token) return; // Ensure token exists

    try {
      await Promise.all(
        selectedUsers.map(userId =>
          axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${session.token}`, // Token for authorization
              },
            }
          )
        )
      );
      setUsers(users.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error deleting users:', error);
    }
  };

  const handleToggleVerified = async (user: User) => {
    if (!session?.token) return;
    const next = !user.verified;
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${user.id}/verified`,
        { role: user.type, verified: next },
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, verified: next } : u))
      );
    } catch {
      console.error('Failed to update verification');
    }
  };

  const handleToggleCanBlog = async (user: User) => {
    if (!session?.token) return;
    const next = !user.canBlog;
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/blog/admin/can-blog/${user.id}`,
        { role: user.type, canBlog: next },
        { headers: { Authorization: `Bearer ${session.token}` } }
      );
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, canBlog: next } : u))
      );
    } catch {
      console.error('Failed to update blog permission');
    }
  };

  const allSelected = users.length > 0 && selectedUsers.length === users.length;
  const toggleOne = (id: string) => setSelectedUsers(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const Switch = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} className={`relative h-6 w-10 shrink-0 rounded-full transition ${on ? 'bg-[#611192]' : 'bg-[#DCD5E0]'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );

  const Box = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={onChange} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition ${checked ? 'bg-[#611192] text-white' : 'bg-white ring-1 ring-[#CFC6D5] hover:ring-[#611192]'}`}>
      {checked ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
    </button>
  );

  return (
    <SectionCard icon={Users} title="People" description="Members and charities on Angelpage. Verify accounts and control who can blog." className="mt-5">
      <Toolbar
        search={searchTerm}
        onSearch={v => {
          setSearchTerm(v);
          setCurrentPage(1);
        }}
        placeholder="Search name, email or ID"
        value={statusFilter}
        onFilter={v => {
          setStatusFilter(v);
          setCurrentPage(1);
        }}
        filters={[
          { id: 'all', label: 'Everyone' },
          { id: 'USER', label: 'Individuals' },
          { id: 'CHARITY', label: 'Charities' },
        ]}
        trailing={
          <select aria-label="Signed up" value={sessionFilter} onChange={handleSessionFilterChange} className="h-10! w-auto! py-0! text-[13px]! sm:w-full!">
            <option value="all">Any sign-up date</option>
            <option value="last7days">Last 7 days</option>
            <option value="1month">About a month ago</option>
          </select>
        }
      />

      {selectedUsers.length ? (
        <div className="sticky top-2 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-[#0B0112] px-4 py-2.5 text-white shadow-lg">
          <span className="mr-auto text-[13px] font-medium">{selectedUsers.length} selected</span>
          <button type="button" onClick={() => handleBulkVerify(true)} className="h-9 rounded-lg px-3 text-[13px] font-medium hover:bg-white/10">
            Verify
          </button>
          <button type="button" onClick={() => handleBulkVerify(false)} className="h-9 rounded-lg px-3 text-[13px] font-medium hover:bg-white/10">
            Unverify
          </button>
          <button type="button" onClick={() => setConfirmDelete(true)} className="h-9 rounded-lg bg-[#C0143C] px-3 text-[13px] font-medium">
            Delete
          </button>
          <button type="button" onClick={() => setSelectedUsers([])} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10" aria-label="Clear selection">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}

      {/* desktop table */}
      <div className="overflow-x-auto rounded-2xl ring-1 ring-[#ECE8EE] md:hidden">
        <table className="w-full min-w-[760px] text-left text-[13.5px]">
          <thead>
            <tr>
              <th className="w-10 px-4">
                <Box checked={allSelected} onChange={handleSelectAll} label="Select all on this page" />
              </th>
              <th className="px-3">Name</th>
              <th className="px-3">Type</th>
              <th className="px-3">Joined</th>
              <th className="px-3 text-center">Verified</th>
              <th className="px-3 text-center">Can blog</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={`border-t border-[#F3EFF5] ${selectedUsers.includes(user.id) ? 'bg-[#FAF5FD]' : ''}`}>
                <td className="px-4">
                  <Box checked={selectedUsers.includes(user.id)} onChange={() => toggleOne(user.id)} label={`Select ${user.fullName}`} />
                </td>
                <td className="px-3">
                  <div className="flex items-center gap-3">
                    <Image src={user.profileImage || '/images/icons/elisp-profile-default-img.svg'} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#0B0112]">{user.fullName}</p>
                      <p className="truncate text-[12px] text-[#8A888C]">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3">
                  <StatusPill status={user.type === 'CHARITY' ? 'Charity' : 'Individual'} tone={user.type === 'CHARITY' ? 'purple' : 'blue'} />
                </td>
                <td className="px-3 text-[#6B686E]">{user.signedUp}</td>
                <td className="px-3">
                  <div className="flex justify-center">
                    <Switch on={!!user.verified} onClick={() => handleToggleVerified(user)} label={`Verified: ${user.fullName}`} />
                  </div>
                </td>
                <td className="px-3">
                  <div className="flex justify-center">
                    <Switch on={!!user.canBlog} onClick={() => handleToggleCanBlog(user)} label={`Can blog: ${user.fullName}`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* phone / tablet cards */}
      <ul className="hidden space-y-2 md:block">
        {users.map(user => (
          <li key={user.id} className={`rounded-2xl p-3.5 ring-1 ${selectedUsers.includes(user.id) ? 'bg-[#FAF5FD] ring-[#D9B8F0]' : 'bg-white ring-[#ECE8EE]'}`}>
            <div className="flex items-center gap-3">
              <Box checked={selectedUsers.includes(user.id)} onChange={() => toggleOne(user.id)} label={`Select ${user.fullName}`} />
              <Image src={user.profileImage || '/images/icons/elisp-profile-default-img.svg'} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[#0B0112]">{user.fullName}</p>
                <p className="truncate text-[12px] text-[#8A888C]">{user.email}</p>
              </div>
              <StatusPill status={user.type === 'CHARITY' ? 'Charity' : 'Individual'} tone={user.type === 'CHARITY' ? 'purple' : 'blue'} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#F3EFF5] pt-3 text-[12.5px] text-[#6B686E]">
              <span>Joined {user.signedUp}</span>
              <span className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  Verified <Switch on={!!user.verified} onClick={() => handleToggleVerified(user)} label="Verified" />
                </span>
                <span className="flex items-center gap-2">
                  Blog <Switch on={!!user.canBlog} onClick={() => handleToggleCanBlog(user)} label="Can blog" />
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>

      {users.length === 0 ? <p className="rounded-2xl bg-[#FAF8FB] px-4 py-8 text-center text-[13.5px] text-[#6B686E]">No people match.</p> : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[12.5px] text-[#8A888C]">
          {totalFilteredRecords ? `Showing ${startCount}–${Math.max(startCount, startCount + users.length - 1)} of ${totalFilteredRecords}` : ''}
        </span>
        {totalPages > 1 ? <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} /> : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${selectedUsers.length} account${selectedUsers.length === 1 ? '' : 's'}?`}
        body="Their profiles, listings and messages are removed. This can’t be undone."
        confirmLabel="Delete accounts"
        onConfirm={async () => {
          await handleDeleteUsers();
          setConfirmDelete(false);
        }}
        onClose={() => setConfirmDelete(false)}
      />
    </SectionCard>
  );
};

export default UsersTable;
