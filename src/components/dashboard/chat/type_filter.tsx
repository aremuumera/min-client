import * as React from 'react';
import { Box } from '@/components/ui/box';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';

const FilterTab = ({ active, children, onClick }: any) => (
    <Box
        onClick={onClick}
        className={`cursor-pointer px-3 py-1 rounded-lg text-xs transition-colors duration-200 ${active ? 'font-bold bg-emerald-500 text-white! shadow-sm' : 'font-medium bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
    >
        {children}
    </Box>
);

// const FilterTab = styled(({ active, ...props }) => (
//   <Box {...props} />
// ))(({ theme, active }) => ({
//   cursor: 'pointer',
//   padding: theme.spacing(1, 1.5),
//   borderRadius: theme.shape.borderRadius,
//   fontSize: '0.75rem',
//   fontWeight: active ? 600 : 400,
//   backgroundColor: active ? theme.palette.action.selected : 'transparent',
//   '&:hover': {
//     backgroundColor: theme.palette.action.hover,
//   },
// }));

export function ConversationTypeFilter({ selectedType, onTypeChange, conversationCounts }: any) {
    const types = [
        { value: 'all', label: 'All', count: conversationCounts.all },
        { value: 'product', label: 'Product', count: conversationCounts.product },
        { value: 'rfq', label: 'RFQ', count: conversationCounts.rfq },
        { value: 'business', label: 'Business', count: conversationCounts.business },
        { value: 'admin', label: 'Admin', count: conversationCounts.admin },
    ];

    return (
        <Stack
            direction="row"
            spacing={1}
            className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-1"
        >
            {types.map((type) => (
                <FilterTab
                    key={type.value}
                    active={selectedType === type.value}
                    onClick={() => onTypeChange(type.value)}
                >
                    <Box className="flex items-center gap-2">
                        <Typography variant="body2" className={`${selectedType === type.value ? 'text-white!' : ''}`}>{type.label}</Typography>
                        {type.count > 0 && (
                            <Badge variant="primary" pill className="text-[10px] px-1 h-4">
                                {type.count}
                            </Badge>
                        )}
                    </Box>
                </FilterTab>
            ))}
        </Stack>
    );
}
