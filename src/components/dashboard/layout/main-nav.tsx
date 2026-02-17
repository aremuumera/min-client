
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
import { useAppSelector } from '@/redux/hooks';
import { cn } from '@/utils/helper';
import { Chip } from '@/components/ui/chip';

interface MainNavProps {
    items: NavItemConfig[];
    isCollapsed?: boolean;
}

export function MainNav({ items, isCollapsed }: MainNavProps) {
    const [openNav, setOpenNav] = useState(false);
    const { user, appData } = useAppSelector((state) => state.auth);
    const { notifications } = useChat();

    const notificationPopover = usePopover<HTMLButtonElement>();
    const userPopover = usePopover<HTMLButtonElement>();
    // const searchDialog = useDialog();

    const isBusinessVerified = appData?.businessVerification?.isVerified;
    const isSupplierProfileCreated = appData?.isProfileCreated;
    const userRole = user?.role;
    const isBuyer = userRole === 'buyer';

    // Check if nav should be hidden/rendered based on verification
    const finalRelease = isBusinessVerified && (userRole !== 'supplier' || isSupplierProfileCreated);

    const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300 ease-in-out",
            finalRelease && (isCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]")
        )}>
            <div className="h-20  lg:px-10 flex items-center justify-between">
                {/* Mobile Menu & Left section */}
                <div className="flex items-center gap-4">
                    {finalRelease && (
                        <button
                            onClick={() => setOpenNav(true)}
                            className="lg:hidden p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
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
                                        className="p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600 transition-all relative group"
                                    >
                                        <Bell size={20} strokeWidth={2.5} />
                                        {unreadNotificationsCount > 0 && (
                                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-bounce-subtle">
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

                    <div className="w-px h-8 bg-gray-100 hidden sm:block" />

                    <div className="relative" >
                        <UserPopover
                            trigger={
                                <button
                                    ref={userPopover.anchorRef}
                                    onClick={userPopover.handleOpen}
                                    className="flex items-center gap-3 p-1 rounded-full bg-gray-50 lg:bg-transparent lg:hover:bg-gray-50 transition-all group"
                                >
                                    <Avatar className="h-6 w-6 ring-2 ring-white shadow-sm transition-transform group-hover:scale-105">
                                        <AvatarImage src={user?.avatar || '/profile.svg'} />
                                        {/* <AvatarFallback className="bg-green-600 text-white font-bold text-xs uppercase">
                                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                                        </AvatarFallback> */}
                                    </Avatar>
                                    <div className="hidden lg:block text-left mr-2">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-gray-900 leading-none">
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
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">
                                            {user?.companyName} {user?.role ? `• ${user.role}` : ''}
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
