import type { CSSProperties } from "react";
import { SendOutlined } from "@ant-design/icons";

interface PlaneIconProps {
  className?: string;
  style?: CSSProperties;
}

export const PlaneIcon = ({ className, style }: PlaneIconProps) => (
  <SendOutlined className={className} style={style} />
);
