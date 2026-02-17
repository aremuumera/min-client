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
import { UpdateUserPreferences } from '@/redux/features/AuthFeature/auth_api';
import { toast } from 'sonner';

export function EmailNotifications() {
    const dispatch = useAppDispatch();
    const { announcements_enabled } = useAppSelector((state) => state.auth);
    const [isToggling, setIsToggling] = React.useState(false);

    const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setIsToggling(true);
        try {
            const resultAction = await dispatch(UpdateUserPreferences({ announcements_enabled: checked }));
            if (UpdateUserPreferences.fulfilled.match(resultAction)) {
                toast.success(`Announcements ${checked ? 'enabled' : 'disabled'}`);
            } else {
                toast.error('Failed to update preferences');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsToggling(false);
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
                            checked={announcements_enabled}
                            onChange={handleToggle}
                            disabled={isToggling}
                        />
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}
