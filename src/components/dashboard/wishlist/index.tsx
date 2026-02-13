'use client'

import React, { useState } from 'react';
import { useDeleteSavedItemMutation, useGetSavedItemsQuery } from '@/redux/features/savedFeature/saved_api';
import { Box } from '@/components/ui/box';
// TODO: Migrate CircularProgress from @mui/material
import { Grid } from '@/components/ui/grid';
import { Tabs, Tab } from '@/components/ui/tabs';
import { Typography } from '@/components/ui/typography';

import { motion, Variants } from 'framer-motion';
// import SavedProductWidget from './SavedProductWidget';
// import SavedRfqWidget from './SavedRfqWidget';
import { useSelector } from 'react-redux';

import NoSavedItems from './nowish';
import SavedRfqWidget from './savedRfqWiidget';
import SavedProductWidget from './wishProdWidget';
import { useAppSelector } from '@/redux';
import { useTheme } from '@/providers';
import { CircularProgress } from '@/components/ui';

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
    },
  },
};

const SavedItemsDashboard = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState('products');
  const { user } = useAppSelector((state) => state.auth);

  const { data, isLoading, error, refetch } = useGetSavedItemsQuery(
    { userId: user?.id },
    {
      skip: !user?.id,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const [deleteSavedItem, { isLoading: isDeleteLoading, isError: isDeleteError }] = useDeleteSavedItemMutation();

  const handleTabChange = (newValue: string) => {
    setTabValue(newValue);
  };

  const handleDelete = async (itemId: string, itemType: string) => {
    try {
      await deleteSavedItem({ userId: user.id, itemId, itemType });
      refetch();
    } catch (err) {
      console.error('Failed to delete saved item:', err);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <NoSavedItems />
      </Box>
    );
  }

  const { products = [], rfqs = [] } = data || {};
  const hasNoSavedItems = products.length === 0 && rfqs.length === 0;

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'background.paper',
        p: { xs: 2, md: 4 },
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{
          mb: 3,
          fontWeight: 600,
          color: 'primary.500',
        }}
      >
        My Saved Items
      </Typography>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        className="mb-8 border-b border-neutral-200"
      >
        <Tab value="products" label={`Products (${products.length})`} className="font-semibold" />
        <Tab value="rfqs" label={`RFQs (${rfqs.length})`} className="font-semibold" />
      </Tabs>

      {hasNoSavedItems ? (
        <NoSavedItems />
      ) : (
        <>
          {/* Products Section */}
          {tabValue === 'products' && (
            <Box sx={{ mb: 4 }}>
              {products.length > 0 ? (
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  <Grid container spacing={3}>
                    {products.map((product: any) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                        <motion.div variants={itemVariants}>
                          <SavedProductWidget
                            products={product}
                            onDelete={() => handleDelete(product.id, 'product')}
                            isSaved={true}
                          />
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </motion.div>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <NoSavedItems />
                </Box>
              )}
            </Box>
          )}

          {/* RFQs Section */}
          {tabValue === 'rfqs' && (
            <Box>
              {rfqs.length > 0 ? (
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  <Grid container spacing={3}>
                    {rfqs.map((rfq: any) => (
                      <Grid item xs={12} sm={6} md={4} key={rfq.rfqId || rfq.id}>
                        <motion.div variants={itemVariants}>
                          <SavedRfqWidget
                            rfqProduct={rfq}
                            onDelete={() => handleDelete(rfq.rfqId || rfq.id, 'rfq')}
                            isSaved={true}
                          />
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </motion.div>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <NoSavedItems />
                </Box>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default SavedItemsDashboard;
