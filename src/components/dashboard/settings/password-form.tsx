"use client";
import * as React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';
import { Input as OutlinedInput } from '@/components/ui/input';
import { FormControl, InputLabel } from '@/components/ui/form-control';

import { Stack } from '@/components/ui/stack';
import { Password as PasswordIcon } from '@phosphor-icons/react/dist/ssr/Password';
import { useDispatch, useSelector } from 'react-redux';
// TODO: Migrate CircularProgress from @mui/material
import { useAlert } from '@/providers';
import { ChangePassword } from '@/redux/features/AuthFeature/auth_api';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { CircularProgress } from '@/components/ui';

export function PasswordForm() {
  const dispatch = useAppDispatch();
  const { showAlert } = useAlert();
  const { loading } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = React.useState<any>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [touched, setTouched] = React.useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev: any) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (e: any) => {
    const { name } = e.target;
    setTouched((prev: any) => ({
      ...prev,
      [name]: true
    }));
    validateField(name, (formData as any)[name]);
  };
  console.log('formData', formData);
  const validateField = (fieldName: string, value: any) => {
    let error = '';

    switch (fieldName) {
      case 'currentPassword':
        if (!value) error = 'Current password is required';
        break;
      case 'newPassword':
        if (!value) {
          error = 'New password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters';
        } else if (value === formData.currentPassword) {
          error = 'New password must be different from current password';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password';
        } else if (value !== formData.newPassword) {
          error = 'Passwords must match';
        }
        break;
      default:
        break;
    }

    setErrors((prev: any) => ({
      ...prev,
      [fieldName]: error
    }));

    return !error;
  };

  const validateForm = () => {
    let isValid = true;
    const fieldsToValidate = ['currentPassword', 'newPassword', 'confirmPassword'];

    fieldsToValidate.forEach(field => {
      const fieldValid = validateField(field, (formData as any)[field]);
      if (!fieldValid) isValid = false;
    });

    return isValid;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!validateForm()) {
      showAlert('Please fix the errors in the form', 'error');
      return;
    }

    try {
      // await dispatch(
      //   ChangePassword({
      //     currentPassword: formData.currentPassword,
      //     newPassword: formData.newPassword,
      //     confirmPassword: formData.confirmPassword,
      //   })
      // ).unwrap();

      showAlert('Password changed successfully', 'success');

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTouched({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
      });
    } catch (error: any) {
      showAlert(error.message || 'Failed to change password', 'error');
    }
  };

  return (
    <Card>
      <CardHeader
        avatar={
          <Avatar>
            <PasswordIcon fontSize="var(--Icon-fontSize)" />
          </Avatar>
        }
        title="Change password"
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Stack spacing={3}>
              <FormControl fullWidth error={touched.currentPassword && !!errors.currentPassword}>
                <InputLabel>Current password</InputLabel>
                <OutlinedInput
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.currentPassword && errors.currentPassword && (
                  <div style={{ color: 'red', fontSize: '0.75rem', marginTop: '4px' }}>
                    {errors.currentPassword}
                  </div>
                )}
              </FormControl>

              <FormControl fullWidth error={touched.newPassword && !!errors.newPassword}>
                <InputLabel>New password</InputLabel>
                <OutlinedInput
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.newPassword && errors.newPassword && (
                  <div style={{ color: 'red', fontSize: '0.75rem', marginTop: '4px' }}>
                    {errors.newPassword}
                  </div>
                )}
              </FormControl>

              <FormControl fullWidth error={touched.confirmPassword && !!errors.confirmPassword}>
                <InputLabel>Confirm new password</InputLabel>
                <OutlinedInput
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <div style={{ color: 'red', fontSize: '0.75rem', marginTop: '4px' }}>
                    {errors.confirmPassword}
                  </div>
                )}
              </FormControl>
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                type="submit"
                disabled={loading ||
                  !formData.currentPassword ||
                  !formData.newPassword ||
                  !formData.confirmPassword ||
                  !!errors.currentPassword ||
                  !!errors.newPassword ||
                  !!errors.confirmPassword
                }
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Update Password'
                )}
              </Button>
            </Box>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
}