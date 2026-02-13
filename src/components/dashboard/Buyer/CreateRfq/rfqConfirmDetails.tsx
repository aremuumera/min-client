
import React from 'react'
import { TiTick } from 'react-icons/ti'

const RfqConfirmDetails = () => {
  return (
    <div>
      <div className="lg:px-6 h-screen py-2">
        <div className="">
          <div className="flex flex-col gap-[20px] justify-center items-center">
            <div className="  flex justify-center items-center bg-primary p-[40px] rounded-full">
              <TiTick className="text-[54px] text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-[20px] font-[500]">Your RFQ has been listed successfully</h2>
              <p className="text-[16px] mx-auto w-full max-w-[600px] mt-14 text-[#8895A2]">Thank you ! Your product has been listed successfully. Use the button below to share/copy your product link</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RfqConfirmDetails
