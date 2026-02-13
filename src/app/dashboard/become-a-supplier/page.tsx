

import { paths } from '@/config/paths';
import { Button } from '@/components/ui/button';
import React from 'react'
import { FiArrowUpRight } from 'react-icons/fi';
import { HiOutlineUser } from 'react-icons/hi2';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { PiWarningLight } from 'react-icons/pi';
import Link from 'next/link';

const BecomeASupplierD = () => {

  const BannerInfo = [
    {
      title: 'Company information',
      description:
        'We will need your company information such as company personal information, address details and other necessary details.',
      userIcon: <HiOutlineUser className='text-primary text-[24px]' />,
      buttonText: 'Get Started',
      buttonLink: `${paths.dashboard.companyInfoVerification}`,
    },
    {
      title: 'Certificate documents',
      description:
        'We will ask you to provide government official document to verify your company details and approval before becoming a supplier.',
      userIcon: <IoDocumentTextOutline className='text-primary text-[24px]' />,
      buttonText: 'List Product',
      buttonLink: '/products',
    },
  ];



  return (
    <div>

      <div className="py-[10px] px-4 lg:px-0">
        <div className=''>
          <div className="w-full py-[25px] ">
            <h1 className="text-[24px] lg:text-[32px] font-medium">
              Want to become a supplier on Minmeg?
            </h1>
            <p className="text-[16px] lg:text-[20px] text-[#8895A2] font-normal">
              It’s easy steps, We will ask for the details below before you can become a supplier.
            </p>
          </div>

          <div className="py-[20px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-[20px]">
            {BannerInfo.map((info, index) => (
              <div
                key={index}
                className="w-full max-w-full flex md:flex-row flex-col  gap-[26px] rounded-[20px] border border-[#c6c6c6] p-[22px] h-full bg-[#F9F9F9]"
              >
                <div className='w-[10%]'>
                  <div className="w-[50px]  h-[50px] flex justify-center items-center bg-white rounded-[30px]">
                    {info.userIcon}
                  </div>
                </div>
                <div>
                  <h2 className="text-[20px] lg:text-[24px] font-medium pb-[10px]">
                    {info.title}
                  </h2>
                  <p className="text-[#8895A2] text-[16px] lg:text-[20px]">
                    {info.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="flex w-full text-primary rounded-[8px] text-[14px] items-center bg-[#CCE6CC] justify-start py-[25px] my-[10px] px-[6px] gap-2">
            <PiWarningLight className="text-primary text-[18px] w-[30px] !sm:w-['10px'] " /> Please make sure that your company address is the same as what you have on your government license document.
          </h2>
        </div>
        <Link
          href={paths.dashboard.overview}
          className="w-full mt-[30px] bg-primary text-white p-[10px] px-[20px] mx-auto rounded-[8px] justify-center items-center flex"

        >
          {"Continue"}
        </Link>
      </div>
    </div>
  )
}

export default BecomeASupplierD
