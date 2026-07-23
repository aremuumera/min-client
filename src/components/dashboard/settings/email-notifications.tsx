"use client";
import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Stack } from '@/components/ui/stack';
import { Switch } from '@/components/ui/switch';
import { Typography } from '@/components/ui/typography';
import { EnvelopeSimple as EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { toast } from 'sonner';
import { setAnnouncementsEnabled } from '@/redux/features/AuthFeature/auth_slice';
import { useUpdateUserPreferencesMutation } from '@/redux/features/AuthFeature/settings';

export function EmailNotifications() {
    const dispatch = useAppDispatch();
    const { announcements_enabled } = useAppSelector((state) => state.auth);
    const [UpdateUserPreferences, { isLoading }] = useUpdateUserPreferencesMutation();

    const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        dispatch(setAnnouncementsEnabled(checked));

        try {
            const res = await UpdateUserPreferences({ announcements_enabled: checked }).unwrap();
            const serverValue = res?.data?.announcements_enabled ?? checked;
            dispatch(setAnnouncementsEnabled(serverValue));
            toast.success(`Announcements ${serverValue ? 'enabled' : 'disabled'}`);
        } catch (error) {
            dispatch(setAnnouncementsEnabled(!checked));
            // toast.error('Failed to update preferences');
        }
    };

    return (
        <Card>
            <CardHeader
                avatar={
                    <Avatar>
                        <EnvelopeSimpleIcon fontSize="var(--Icon-fontSize)" />
                    </Avatar>
                }
                title="Email"
            />
            <CardContent>
                <Stack divider={<Divider />} spacing={3}>
                    <Stack direction="row" spacing={3} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle1">Minmeg updates</Typography>
                            <Typography color="text.secondary" variant="body2">
                                Newsletter, announcements, and product updates.
                            </Typography>
                        </Stack>
                        <Switch
                            checked={Boolean(announcements_enabled)}
                            onChange={handleToggle}
                            disabled={isLoading}
                        />
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}
