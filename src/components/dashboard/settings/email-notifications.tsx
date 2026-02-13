
"use client";
import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import { Stack } from '@/components/ui/stack';
import { Switch } from '@/components/ui/switch';
import { Typography } from '@/components/ui/typography';
import { EnvelopeSimple as EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';

export function EmailNotifications() {
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
                        <Switch defaultChecked />
                    </Stack>
                    {/* <Stack direction="row" spacing={3} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1">Security updates</Typography>
              <Typography color="text.secondary" variant="body2">
                Important notifications about your account security.
              </Typography>
            </Stack>
            <Switch />
          </Stack> */}
                </Stack>
            </CardContent>
        </Card>
    );
}
