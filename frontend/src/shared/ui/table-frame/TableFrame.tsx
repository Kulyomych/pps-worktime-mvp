import type { ReactNode } from "react";
import { Button, Modal, Space } from "antd";
import { ExpandOutlined } from "@ant-design/icons";
import { useState } from "react";

interface Props {
  children: ReactNode;
  fullscreenTitle: string;
  extraActions?: ReactNode;
}

export const TableFrame = ({ children, fullscreenTitle, extraActions }: Props) => {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <Space className="table-frame-actions" wrap>
        {extraActions}
        <Button icon={<ExpandOutlined />} onClick={() => setFullscreen(true)}>
          Развернуть таблицу
        </Button>
      </Space>
      <div className="table-responsive table-responsive--fixed">{children}</div>
      <Modal
        open={fullscreen}
        onCancel={() => setFullscreen(false)}
        title={fullscreenTitle}
        footer={null}
        width="100vw"
        style={{ top: 0, paddingBottom: 0 }}
        styles={{ body: { maxHeight: "calc(100vh - 110px)", overflow: "hidden" } }}
        destroyOnHidden
      >
        <div className="table-responsive table-responsive--fullscreen">{children}</div>
      </Modal>
    </>
  );
};
