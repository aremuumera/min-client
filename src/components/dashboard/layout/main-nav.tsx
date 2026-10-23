
"use client";

import React, { useState } from 'react';
import { Bell, Menu, Search, User as UserIcon } from 'lucide-react';
import { usePopover } from '@/hooks/use-popover';
import { useDialog } from '@/hooks/use-dialog';
import { useChat } from '@/providers/chat-provider';
import { MobileNav } from './mobile-nav';
import { NotificationsPopover } from './notifications-popover';
import { UserPopover } from './user-popover';
import { NavItemConfig } from '@/config/dashboard-config';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import { cn } from '@/utils/helper';
import { Chip } from '@/components/ui/chip';

interface MainNavProps {
    items: NavItemConfig[];
    isCollapsed?: boolean;
}

export function MainNav({ items, isCollapsed }: MainNavProps) {
    const [openNav, setOpenNav] = useState(false);
    const { user, isBuyer, isSupplier, isBusinessVerified, isProfileCreated, roleLabel } = useAuthIdentity();
    const { notifications } = useChat();

    const notificationPopover = usePopover<HTMLButtonElement>();
    const userPopover = usePopover<HTMLButtonElement>();
    // const searchDialog = useDialog();

    // Check if nav should be hidden/rendered based on verification
    const finalRelease = isBusinessVerified && (!isSupplier || isProfileCreated);

    const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

    return (
        <header className={cn(
            // the layout's column already sits beside the sidebar
            "sticky top-0 z-50 w-full bg-canvas border-b border-hairline"
        )}>
            <div className="h-16 px-4 md:px-6 lg:px-8 flex items-center justify-between w-full">
                {/* Mobile Menu & Left section */}
                <div className="flex items-center gap-4">
                    {/* the phone menu is always reachable (the layout always shows the sidebar on larger screens) */}
                    {(
                        <button
                            type="button"
                            onClick={() => setOpenNav(true)}
                            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full text-slate hover:bg-surface-soft transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu size={20} />
                        </button>
                    )}
                </div>

                {/* Right section */}
                <div className="flex justify-end items-center  gap-3 lg:gap-5">
                    {finalRelease && (
                        <div className="relative">
                            <NotificationsPopover
                                trigger={
                                    <button
                                        ref={notificationPopover.anchorRef}
                                        onClick={notificationPopover.handleOpen}
                                        aria-label={unreadNotificationsCount > 0 ? `Notifications (${unreadNotificationsCount} unread)` : 'Notifications'}
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-slate hover:bg-brand-green-soft hover:text-primary-pressed transition-colors relative group"
                                    >
                                        <Bell size={20} strokeWidth={2.5} />
                                        {unreadNotificationsCount > 0 && (
                                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-semantic-error text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-bounce-subtle">
                                                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                                            </span>
                                        )}
                                    </button>
                                }
                                onClose={notificationPopover.handleClose}
                                open={notificationPopover.open}
                            />
                        </div>
                    )}

                    <div className="w-px h-8 bg-hairline hidden sm:block" />

                    <div className="relative" >
                        <UserPopover
                            trigger={
                                <button
                                    ref={userPopover.anchorRef}
                                    onClick={userPopover.handleOpen}
                                    className="flex min-h-11 items-center gap-3 p-1 rounded-full hover:bg-surface-soft transition-colors group"
                                >
                                    <Avatar className="h-6 w-6 ring-2 ring-white transition-transform group-hover:scale-105">
                                        <AvatarImage src={user?.profilePicture || user?.avatar || '/profile.svg'} alt="" />
                                        <span className="sr-only">Account menu</span>
                                        {/* <AvatarFallback className="bg-green-600 text-white font-bold text-xs uppercase">
                                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                                        </AvatarFallback> */}
                                    </Avatar>
                                    <div className="hidden lg:block text-left mr-2">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-ink leading-none">
                                                {user?.firstName} {user?.lastName}
                                            </p>
                                            {user?.team_role && (
                                                <Chip
                                                    label={user.team_role}
                                                    variant="soft"
                                                    color={user.team_role === 'owner' ? 'primary' : 'secondary'}
                                                    size="sm"
                                                    className="capitalize px-1.5 py-0 h-4 text-[9px]"
                                                />
                                            )}
                                        </div>
                                        <p className="text-[11px] font-semibold text-steel uppercase tracking-[1px] mt-1">
                                            {user?.companyName} {user?.role ? `• ${roleLabel}` : ''}
                                        </p>
                                    </div>
                                </button>
                            }
                            onClose={userPopover.handleClose}
                            open={userPopover.open}
                        />
                    </div>
                </div>
            </div>

            <MobileNav
                items={items}
                onClose={() => setOpenNav(false)}
                open={openNav}
            />


        </header>
    );
}
