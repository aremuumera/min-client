import React, { useState } from "react";
import { Table, TableHeader } from '@/components/ui/table';
import { TableHead } from '@/components/ui/table';
import { TableBody } from '@/components/ui/table';
import { TableCell } from '@/components/ui/table';
import { TableRow } from '@/components/ui/table';
// import { styled } from '@mui/material';
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiDeleteBinLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import DeleteSupProducts from "../DeleteSupplierProducts/deleteSupProduct";
import EditSupProduct from "../Edit/EditProducts";
import { formatDate } from "@/utils/helper";

// const StyledTableContainer = styled("div")`
//   box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
//   border-radius: 8px;
//   background-color: white;
//   overflow-x: auto;
// `;

const ProductTableSet = ({ columns = [], rows = [] }: any) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [modalState, setModalState] = useState({
    RfqEdit: false,
    RfqDelete: false,
  });


  const handleModalOpen = (modalName: string, row: any) => {
    setSelectedRow(row);
    setModalState({ ...modalState, [modalName]: true });
  };

  const handleModalClose = (modalName: string) => {
    setModalState({ ...modalState, [modalName]: false });
  };

  const handleNavigateUpdates = (listedSupplierProductId: string) => {
    router.push(`/dashboard/supplier-list/update/${listedSupplierProductId}`)
  }



  return (
    <div className="shadow-[0px_4px_6px_rgba(0,0,0,0.1)] rounded-lg bg-white overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col: any) => (
              <TableHead
                key={col.id}
                style={{ width: col.width, maxWidth: col.width, minWidth: col.width, fontWeight: "bold" }}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        {/* Table Body */}
        <TableBody>
          {rows?.length > 0 && rows?.map((row: any, index: any) => (
            <TableRow key={index} className="hover:bg-gray-50">
              <TableCell className="flex items-center gap-[10px] space-x-2">
                <img
                  src={
                    row?.images?.length > 0
                      ? (
                        row.images.find((img: any) => {
                          const url = img?.url || img;
                          return typeof url === 'string' && !url.toLowerCase().endsWith('.mp4');
                        })?.url ||
                        row.images.find((img: any) => {
                          const url = img?.url || img;
                          return typeof url === 'string' && !url.toLowerCase().endsWith('.mp4');
                        }) ||
                        (row?.images[0]?.url || row?.images[0])
                      )
                      : '/assets/placeholder.png'
                  }
                  alt={row.product_name}
                  className="w-16 h-16 rounded object-cover"
                />
                {row.product_name}
              </TableCell>
              <TableCell>{row.product_category} </TableCell>
              <TableCell>{row?.quantity} {row?.measure}</TableCell>
              <TableCell>{formatDate(row.createdAt)}</TableCell>
              {/* <TableCell>{row.expirationDate}</TableCell> */}
              {/* <TableCell>
                <span
                  className={
                    row.status === "Confirmed"
                      ? "text-green-600"
                      : "text-yellow-600"
                    }
                >  
                  {row.status}
                </span>
              </TableCell> */}
              <TableCell align="center">
                <div className="flex gap-[20px] justify-center items-start">
                  <button
                    className="text-blue-500 underline"
                    onClick={() => handleNavigateUpdates(row?.id)}
                  >
                    <MdOutlineRemoveRedEye className="text-[24px] text-[#000]" />
                  </button>
                  <button
                    className="text-red-500 underline ml-2"
                    onClick={() => handleModalOpen('RfqDelete', row)}
                  >
                    <RiDeleteBinLine className="text-[24px] text-[#000]" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DeleteSupProducts rows={selectedRow} open={modalState.RfqDelete} onClose={() => handleModalClose('RfqDelete')} />
      {/* <EditSupProduct  rows={selectedRow} open={modalState.RfqEdit} onClose={() => handleModalClose('RfqEdit')} /> */}
    </div>
  );
};

export default ProductTableSet;
