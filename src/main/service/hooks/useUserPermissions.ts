import { useQuery } from "@tanstack/react-query";
import apiAxios from "../../../api/api";

export interface Permission {
  id: number;
  is_active: boolean;
  created_by: string | null;
  name: string;
  description: string;
  created_at: string;
}

export const useUserPermissions = (userId: number) => {
  return useQuery<any[]>({
    queryKey: ["userPermissions", userId],
    queryFn: async () => {
      const response = await apiAxios.get(
        `https://ec2api.deltatech-backend.com/api/v1/user/${userId}/permissions`
      );
      return response.data;
    },
    enabled: !!userId, // chỉ gọi nếu userId tồn tại
    refetchOnMount: true, // ✅ luôn gọi lại khi component mount
  });
};
