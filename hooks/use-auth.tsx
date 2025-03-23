import { useMutation } from '@tanstack/react-query';

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}

export function useAuth() {
  const changePasswordMutation = useMutation<ChangePasswordResponse, Error, ChangePasswordData>({
    mutationFn: async ({ currentPassword, newPassword }: ChangePasswordData) => {
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      return response.json();
    },
  });

  return {
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
  };
}