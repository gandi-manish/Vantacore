import { apiClient } from "./client";

export async function lockUserAccount(params: {
  userId: string;
  justification: string;
}) {
  const response = await apiClient.post(`/admin/users/${params.userId}/lock`, {
    justification: params.justification,
  });

  return response.data.data;
}

export async function unlockUserAccount(params: {
  userId: string;
  justification: string;
}) {
  const response = await apiClient.post(`/admin/users/${params.userId}/unlock`, {
    justification: params.justification,
  });

  return response.data.data;
}

export async function containUserIp(params: {
  userId: string;
  ipAddress: string;
  justification: string;
}) {
  const response = await apiClient.post(
    `/admin/users/${params.userId}/contain-ip`,
    {
      ipAddress: params.ipAddress,
      justification: params.justification,
    }
  );

  return response.data.data;
}