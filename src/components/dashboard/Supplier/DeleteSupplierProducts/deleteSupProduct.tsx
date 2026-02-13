import React from 'react';
import CustomModal from '@/utils/CustomModal';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useDeleteProductMutation } from '@/redux/features/supplier-products/products_api';
import { CircularProgress } from '@/components/ui/progress';

const DeleteSupProducts = ({ open, rows, onClose }: any) => {
 
  const [deleteProduct, {data, isLoading, isError}] = useDeleteProductMutation();
  const { user } = useSelector((state: any) => state?.auth);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
   
    console.log('data:', data);
    try {
    const response =  await deleteProduct({
        productId: rows?.id,
        supplierId: user?.id
      }).unwrap();
      toast.success(`${response?.data?.message  || ` ${rows?.product_name} 'deleted successfully'` } `,   
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
        <div className="w-full">
          <form
          onSubmit={handleSubmit}
           className="!w-full">
            <div className="bg-white">
              <div className="flex justify-center items-center flex-col">
                <div className="rounded-full bg-[#f7f7f7] flex w-[140px] h-[140px] justify-center items-center text-[70px] text-red-500">
                  <RiDeleteBin6Line className="!text-[50px]" />
                </div>
              </div>
              <div className="pt-[30px] flex justify-start items-start">
                <div className="text-left">
                  <Typography className="text-lg font-medium">
                    You are about to delete <span style={{fontWeight: 'bold', fontSize:'1.4rem' }} >{rows?.product_name}</span>
                  </Typography>
                  <Typography className="text-sm font-normal text-[#b4b4b4] pt-[10px]">
                    Are you sure you want to delete?
                  </Typography>
                </div>
              </div>
            </div>
            <div className="pt-[30px] flex justify-start items-start gap-[10px] flex-col">
              <div className="text-left flex justify-start items-center w-full gap-[10px]">
                <div className="text-sm font-normal text-[#c6c6c6]">
                  {' '}
                  <img src="/assets/Check_box.svg" />{' '}
                </div>
                <Typography className="text-xs font-medium text-[#4B5560]">
                  All share/copy product links will be inaccessible
                </Typography>
              </div>

              <div className="text-left flex justify-start items-center w-full gap-[10px]">
                <div className="text-sm font-normal text-[#c6c6c6]">
                  {' '}
                  <img src="/assets/Check_box.svg" />{' '}
                </div>
                <Typography className="text-xs font-medium text-[#4B5560]">
                  All product information will be deleted from the market
                </Typography>
              </div>

              <div className="text-left flex justify-start items-center w-full gap-[10px]">
                <div className="text-sm font-normal text-[#c6c6c6]">
                  {' '}
                  <img src="/assets/Check_box.svg" />{' '}
                </div>
                <Typography className="text-xs font-medium text-[#4B5560]">
                  Product will be remove from the company catalog
                </Typography>
              </div>
            </div>

            <div className="flex pt-[50px] w-full justify-between gap-[20px]">
              <Button
                onClick={onClose}
                variant="outlined"
                className="w-full text-red-500 border-red-500 hover:bg-red-50"
                type='button'
              >
                Cancel
              </Button>
              <Button
                disabled={isLoading}
               variant="contained"
               className="w-full"
               type='submit'
               >
                 {isLoading ? (
                   "Deleting..."
                  ) : (
                    "Delete"
                  )}
              </Button>
            </div>
          </form>
        </div>
      </CustomModal>
    </div>
  );
};

export default DeleteSupProducts
;
