import { useInfiniteQuery } from "@tanstack/react-query";

import axios from "axios";
import { useRef } from "react";
import apiAxios from "../../../api/api";
import { api } from "../api/endpoint";

export const useGetListMeasurementReport = (debouncedSearchValue?: string) => {
  const controllerRef = useRef<AbortController | null>(null);

  const fetchListMeasurementReport = async (
    currentPage?: number,
    status?: string,
    searchValue?: string,
    signal?: AbortSignal // Thêm signal vào để hủy yêu cầu
  ) => {
    try {
      const response = await apiAxios.get(
        api.getMeasurementReport(
          currentPage as number,
          status as string,
          searchValue as string
        ),
        {
          signal, // Truyền signal vào axios để hủy yêu cầu khi cần
        }
      );
      return {
        data: response.data.founds,
        totalCount: response.data.search_options.total_count,
        nextPage: (currentPage as number) + 1,
        hasMore:
          (currentPage as number) * 20 <
          response.data.search_options.total_count, // Kiểm tra còn trang tiếp theo
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Kiểm tra nếu lỗi là do axios
        console.error("Axios error:", error.response?.data || error.message);
      } else if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as { name: string }).name === "AbortError"
      ) {
        // Xử lý khi yêu cầu bị hủy
        console.log("API request was canceled");
      }
      throw new Error(
        "Failed to fetch data project code with measurement report"
      );
    }
  };

  const {
    data: dataListMeasurementReport,
    isFetching: isFetchingMeasurementReport,
    isFetchingNextPage: isFetchingNextPageMeasurementReport,
    fetchNextPage: fetchNextPageMeasurementReport,
    hasNextPage: hasNextPageMeasurementReport,
  } = useInfiniteQuery({
    queryKey: ["listMeasurementReport", debouncedSearchValue],
    queryFn: async ({ pageParam = 1 }) => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }

      controllerRef.current = new AbortController();

      return fetchListMeasurementReport(
        pageParam,
        "confirm",
        debouncedSearchValue,
        controllerRef.current.signal
      );
    },

    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 1,
    // enabled: selectedButtonProcess === 'unconfirmed',
  });

  return {
    dataListMeasurementReport,
    isFetchingMeasurementReport,
    isFetchingNextPageMeasurementReport,
    fetchNextPageMeasurementReport,
    hasNextPageMeasurementReport,
  };
};
