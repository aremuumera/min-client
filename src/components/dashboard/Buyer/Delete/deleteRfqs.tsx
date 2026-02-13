import React from 'react';
import CustomModal from '@/utils/CustomModal';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Stack } from '@/components/ui/stack';
import { TextField } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { RiDeleteBin6Line } from 'react-icons/ri';

import { Option } from '@/components/core/option';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useDeleteRFQMutation } from '@/redux/features/buyer-rfq/rfq-api';
import { CircularProgress } from '@/components/ui';

const DeleteRfQs = ({ open, rows, onClose }: { open: boolean, rows: any, onClose: () => void }) => {
 
    const { user } = useSelector((state: any) => state?.auth);

    const [deleteRFQ, {data, isLoading, isError}] = useDeleteRFQMutation();
  
  
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
       
        console.log('data:', data);
        try {
        const response =  await deleteRFQ({
             rfqId: rows?.rfqId,
            buyerId: user?.id
          }).unwrap();
          toast.success(`${response?.data?.message  || ` ${rows?.rfqProductName} 'deleted successfully'` } `,   
            {
              position: 'top-right',
              duration: 3000,
              style: {
                background: '#4CAF50',
                color: '#fff',
              }}
          );
          onClose();
        } catch (error: any) {
          toast.error(`Error deleting product: ${error?.data?.message || 'Something went wrong'}`, {
            position: 'top-right',
            duration: 3000,
            style: {
              background: '#f44336',
              color: '#fff',
            },
          });
          console.error('Error deleting product:', error);
        }
      }

   
  return (
    <div>
      <CustomModal open={open} onClose={onClose}>
        <div className="w-full  ">
          <form 
            onSubmit={handleSubmit}
          className="!w-full">
            <Box
              sx={{
                background: 'white',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'column',
                }}
                className="flex justify-center"
              >
                <Box
                  sx={{
                    borderRadius: '50%',
                    bgcolor: '#f7f7f7',
                    display: 'flex',
                    width: '140px',
                    height: '140px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '70px',
                    color: 'red',
                  }}
                >
                  <RiDeleteBin6Line className="!text-[50px]" />
                </Box>
              </Box>
              <Box
                sx={{
                  pt: '30px',
                  display: 'flex',
                  justifyContent: 'start',
                  alignItems: 'start',
                  // flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    textAlign: 'left',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '1.2rem',
                      fontWeight: '500',
                    }}
                  >
                    You are about to delete <span style={{fontWeight: 'bold', fontSize:'1.4rem' }} >{rows?.rfqProductName}</span>
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '.9rem',
                      fontWeight: '400',
                      color: '#b4b4b4',
                      pt: '10px',
                    }}
                  >
                    Are you sure you want to delete?
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box
              sx={{
                pt: '30px',
                display: 'flex',
                justifyContent: 'start',
                alignItems: 'start',
                gap: '10px',
                // backgroundColor: '#f7f7f7',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'start',
                  alignItems: 'center',
                  width: '100%',
                  gap: '10px',
                  // backgroundColor: '#f7f7f7',
                  // flexDirection: 'column',
                  // backgroundColor: '#f7f7f7',
                  // flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    fontSize: '.9rem',
                    fontWeight: '400',
                    color: '#c6c6c6',
                  }}
                >
                  {' '}
                  <img src="/assets/Check_box.svg" />{' '}
                </Box>
                <Typography
                  sx={{
                    fontSize: '.8rem',
                    fontWeight: '500',
                    color: '#4B5560',
                  }}
                >
                  All share/copy product links will be inaccessible
                </Typography>
              </Box>

              <Box
                sx={{
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'start',
                  alignItems: 'center',
                  width: '100%',
                  gap: '10px',
                  // pt: '10px',
                  // backgroundColor: '#f7f7f7',
                  // flexDirection: 'column',
                  // backgroundColor: '#f7f7f7',
                  // flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    fontSize: '.9rem',
                    fontWeight: '400',
                    color: '#c6c6c6',
                  }}
                >
                  {' '}
                  <img src="/assets/Check_box.svg" />{' '}
                </Box>
                <Typography
                  sx={{
                    fontSize: '.8rem',
                    fontWeight: '500',
                    color: '#4B5560',
                  }}
                >
                  All product information will be deleted from the market
                </Typography>
              </Box>

              <Box
                sx={{
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'start',
                  alignItems: 'center',
                  width: '100%',
                  gap: '10px',
                  // backgroundColor: '#f7f7f7',
                  // flexDirection: 'column',
                  // backgroundColor: '#f7f7f7',
                  // flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    fontSize: '.9rem',
                    fontWeight: '400',
                    color: '#c6c6c6',
                    // pt: '10px',
                  }}
                >
                  {' '}
                  <img src="/assets/Check_box.svg" />{' '}
                </Box>
                <Typography
                  sx={{
                    fontSize: '.8rem',
                    fontWeight: '500',
                    color: '#4B5560',
                  }}
                >
                  Product will be remove from the company catalog
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                pt: '50px',
                width: '100%',
                justifyContent: 'space-between',
                display: 'flex',
                gap: '20px',
              }}
              className="flex pt-[30px] w-full gap-[20px] justify-between mt-4"
            >
              <Button
                onClick={onClose}
                variant="outlined"
                color="error"
                
                className="w-full"
                fullWidth
                type='button'
              >
                Cancel
              </Button>
              <Button 
               variant="contained"
                color="error" 
                className="w-full"
                 fullWidth
                 type='submit'
                disabled={isLoading}
                 >
                 {isLoading ? (
                  <CircularProgress
                      size={24} 
                      color="inherit" 
                      className="text-white"
                  />
                  ) : (
                    "Delete"
                  )}
              </Button>
            </Box>
          </form>
        </div>
      </CustomModal>
    </div>
  );
};

export default DeleteRfQs;
