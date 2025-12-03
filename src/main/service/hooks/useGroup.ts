import { useQuery } from "@tanstack/react-query";
import apiAxios from "../../../api/api";

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
  endpoint: string;
  method: string;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  permissions: Permission[];
}

export const useGroups = () => {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const response = await apiAxios.get(
        "https://ec2api.deltatech-backend.com/api/v1/groups"
      );
      return response.data;
    },
  });
};
