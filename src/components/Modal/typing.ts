import { OptionProps } from "ant-design-vue/lib/select";
import { AntInputType } from "/@/enums/antEnum";

export interface ModalInputProps {
  title?: string;
  className?: string;
  placeholder?: string;
  options?: OptionProps;
  value?: any;
  mode?: AntInputType;
  onOk: (value: any) => Promise<any>;
  onCancel?: () => void;
}
