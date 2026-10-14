import { AdditionalProps } from "ant-design-vue/lib/vc-table/interface";

export function useTableUtils() {
  function setColSpan(len: number): AdditionalProps {
    return {
      colSpan: len,
    };
  }

  function setRowSpan(len: number): AdditionalProps {
    return {
      rowSpan: len,
    };
  }

  return {
    setRowSpan,
    setColSpan,
  };
}
