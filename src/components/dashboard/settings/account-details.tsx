
"use client";

import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardActions } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';
import { Input, Input as OutlinedInput } from '@/components/ui/input';
import { Link } from '@/components/ui/link';
import { FormControl, FormHelperText, InputLabel } from '@/components/ui/form-control';
import pp from '../../../../public/profile.svg';

import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { Camera as CameraIcon } from '@phosphor-icons/react/dist/ssr/Camera';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
// TODO: Migrate useMediaQuery from @mui/material

import { Option } from '@/components/core/option';
import { useSelector } from 'react-redux';
import { useAppSelector } from '@/redux';
import { useTheme } from '@/providers';
import { useMediaQuery } from '@/hooks/use-media-query';
import { paths } from '@/config/paths';

import { useUpdateProfileMutation } from '@/redux/features/AuthFeature/auth_api_rtk';
import { toast } from 'sonner';

export function AccountDetails() {
    const { user } = useAppSelector((state) => state.auth);
    const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

    // For file input reference
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const currentPic = user?.profilePicture || user?.avatar || '/profile.svg';
    const [profileImage, setProfileImage] = React.useState<string>(currentPic);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

    React.useEffect(() => {
        if (currentPic) {
            setProfileImage(currentPic);
        }
    }, [currentPic]);

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setProfileImage(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle click on profile picture
    const handleProfilePictureClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleSave = async () => {
        try {
            await updateProfile({
                profilePicture: profileImage,
            }).unwrap();
            toast.success('Profile updated successfully!');
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to update profile');
        }
    };

    return (
        <Card outlined>
            <CardHeader
                avatar={
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 border border-gray-100">
                        <UserIcon size={20} />
                    </div>
                }
                title={<span className="text-lg font-bold">Profile Details</span>}
                subheader="Your personal information"
            />
            <CardContent>
                <div className="space-y-8">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {/* Profile Picture Section */}
                    <div className="flex items-center gap-6">
                        <div
                            className="relative group cursor-pointer"
                            onClick={handleProfilePictureClick}
                        >
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-50 shadow-sm relative">
                                <Avatar
                                    src={profileImage}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold">
                                    <CameraIcon size={20} className="mb-1" />
                                    <span>CHANGE</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                variant="outlined"
                                onClick={handleProfilePictureClick}
                                className="text-xs font-bold py-2 px-4 h-auto rounded-lg border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                                Upload New Photo
                            </Button>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                JPG, PNG or SVG. Max 2MB.
                            </p>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">First Name</label>
                            <OutlinedInput disabled defaultValue={user?.firstName} className="bg-gray-50/50 border-gray-100 italic" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Last Name</label>
                            <OutlinedInput disabled defaultValue={user?.lastName} className="bg-gray-50/50 border-gray-100 italic" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                            <OutlinedInput disabled value={user?.email} className="bg-gray-50/50 border-gray-100 italic" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                            <OutlinedInput disabled defaultValue={user?.phoneNumber || 'Not provided'} className="bg-gray-50/50 border-gray-100 italic" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Business Name</label>
                            <OutlinedInput disabled defaultValue={user?.businessName} className="bg-gray-50/50 border-gray-100 italic capitalize" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">User Role</label>
                            <OutlinedInput disabled defaultValue={user?.role} className="bg-gray-50/50 border-gray-100 italic uppercase" />
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardActions className="justify-end p-6 border-t border-gray-50 bg-gray-50/30">
                <Button
                    variant="outlined"
                    onClick={() => setProfileImage(user?.profilePicture || '/profile.svg')}
                    className="border-gray-200 text-gray-600 hover:bg-gray-100 rounded-lg px-6 font-bold text-xs"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 font-bold text-xs shadow-sm"
                >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
            </CardActions>
        </Card>
    );
}