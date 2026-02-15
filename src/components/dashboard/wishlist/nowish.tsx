
import React from 'react';
import { Box } from '@/components/ui/box';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { MdBookmarkBorder } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { paths } from '@/config/paths';

const NoSavedItems = () => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="text-center py-16 px-4 flex flex-col items-center justify-center"
      >
        <MdBookmarkBorder
          className="text-6xl text-gray-400 mb-4"
        />

        <Typography variant="h5" gutterBottom fontWeight={500}>
          No saved items yet
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          className="mb-6 max-w-md"
        >
          You haven't saved any products or RFQs. Browse our marketplace and save items for later by clicking the bookmark icon.
        </Typography>

        <div className="flex gap-4">
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push(paths.marketplace.allCp)}
          >
            Browse Products
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={() => router.push(paths.marketplace.recentRfQ)}
          >
            Browse RFQs
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default NoSavedItems;