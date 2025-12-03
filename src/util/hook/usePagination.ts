import { useState } from "react";

export const usePagination = (
  perPageReords: number,
  totalPageReords: number
) => {
  const [startPageIndex, setStartPageIndex] = useState<number>(0);
  const [endPageIndex, setEndPageIndex] = useState<number>(perPageReords - 1);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);

  const totalPages = Math.ceil(totalPageReords / perPageReords);

  const displayPage = (pageNo: number) => {
    setCurrentPageIndex(pageNo);
    let end_page_index = perPageReords * pageNo - 1;
    let start_page_index = perPageReords * pageNo - perPageReords;
    setStartPageIndex(start_page_index);
    if (end_page_index > totalPageReords) {
      setEndPageIndex(totalPageReords - 1);
    } else {
      setEndPageIndex(end_page_index);
    }
  };
  return {
    totalPages,
    startPageIndex,
    endPageIndex,
    currentPageIndex,
    displayPage,
  };
};
