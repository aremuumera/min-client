import * as React from 'react';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { Key as KeyIcon } from '@phosphor-icons/react/dist/ssr/Key';

export function MultiFactor() {
    return (
        <Card>
            <CardHeader
                avatar={
                    <Avatar>
                        <KeyIcon fontSize="var(--Icon-fontSize)" />
                    </Avatar>
                }
                title="Multi factor authentication"
            />
            <CardContent>
                <Stack spacing={3}>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <Card outlined className="h-full">
                            <CardContent>
                                <Stack spacing={4}>
                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1} className="items-center">
                                            <Box
                                                className="rounded-full h-2 w-2 bg-red-500"
                                            />
                                            <Typography variant="body2" className="text-red-500 font-medium">
                                                Off
                                            </Typography>
                                        </Stack>
                                        <Typography variant="subtitle2">Authenticator app</Typography>
                                        <Typography color="text.secondary" variant="body2">
                                            Use an authenticator app to generate one time security codes.
                                        </Typography>
                                    </Stack>
                                    <div>
                                        <Button variant="contained" className="w-full sm:w-auto flex items-center gap-2">
                                            Set up authenticator <ArrowRightIcon />
                                        </Button>
                                    </div>
                                </Stack>
                            </CardContent>
                        </Card>

                        <Card outlined className="h-full">
                            <CardContent>
                                <Stack spacing={4}>
                                    <Stack spacing={1}>
                                        <Stack direction="row" spacing={1} className="items-center">
                                            <Box
                                                className="rounded-full h-2 w-2 bg-red-500"
                                            />
                                            <Typography variant="body2" className="text-red-500 font-medium">
                                                Off
                                            </Typography>
                                        </Stack>
                                        <Typography variant="subtitle2">Text message</Typography>
                                        <Typography color="text.secondary" variant="body2">
                                            Use your mobile phone to receive security codes via SMS.
                                        </Typography>
                                    </Stack>
                                    <div>
                                        <Button variant="contained" className="w-full sm:w-auto flex items-center gap-2">
                                            Set up phone <ArrowRightIcon />
                                        </Button>
                                    </div>
                                </Stack>
                            </CardContent>
                        </Card>
                    </div>

                    <Alert severity="success" variant="filled">
                        87% of the technology industry has already implemented MFA and it is the top sector with the highest MFA
                        adoption rate.
                    </Alert>
                </Stack>
            </CardContent>
        </Card>
    );
}
