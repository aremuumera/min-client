"use client";

import React, { useState } from "react";
import { Table } from '@/components/ui/table';
import { TableHead, TableHeader } from '@/components/ui/table';
import { TableBody } from '@/components/ui/table';
import { TableCell } from '@/components/ui/table';
import { TableRow } from '@/components/ui/table';
// TODO: Migrate styled from @mui/material
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiDeleteBinLine } from "react-icons/ri";
import DeleteRfQs from "../Delete/deleteRfqs";
import EditRfQs from "../Edit/RfqEdit";
import { useRouter } from "next/navigation";
import { formatDate } from "@/utils/helper";



const RfqDataTable = ({ columns = [], rows = [] }: any) => {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [modalState, setModalState] = useState<{
    RfqEdit: boolean,
    RfqDelete: boolean,
  }>({
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

  const handleNavigateUpdates = (listedRfqId: string) => {
    router.push(`/dashboard/rfq-list/update/${listedRfqId}`)
  }



  return (
    <div className="shadow-md rounded-lg bg-white overflow-x-auto">
      <Table>
        {/* Table Head */}
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
          {rows.map((row: any, index: number) => (
            <TableRow key={index} className="hover:bg-gray-50">
              <TableCell
              // className="flex items-center gap-[10px] space-x-2"
              >
                {/* {row?.attachments?.length > 0 && (
                 <img
                  src={row?.attachments > 0 ? row?.attachments[0]?.url : row?.attachments[0]?.url}
                  alt={row.rfqProductName}
                  className="w-16 h-16 rounded"
                />
                )} */}
                {row.rfqProductName}
              </TableCell>
              <TableCell>{row.rfqProductCategory}</TableCell>
              <TableCell>{row.quantityRequired}</TableCell>
              <TableCell>{formatDate(row.createdAt)}</TableCell>
              <TableCell>
                <span
                  className={
                    row.status === "Confirmed"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }
                >
                  {row.status}
                </span>
              </TableCell>
              <TableCell align="center">
                <div className="flex gap-[20px] justify-center items-start">
                  <button
                    className="text-blue-500 underline"
                    onClick={() => handleNavigateUpdates(row.rfqId)}
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
      <DeleteRfQs rows={selectedRow} open={modalState.RfqDelete} onClose={() => handleModalClose('RfqDelete')} />
      {/* <EditRfQs  rows={selectedRow} open={modalState.RfqEdit} onClose={() => handleModalClose('RfqEdit')} /> */}
    </div>
  );
};

export default RfqDataTable;
