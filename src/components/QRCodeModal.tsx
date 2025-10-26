import { Modal } from "@/components/Modal";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: string;
  title?: string;
}

export function QRCodeModal({
  open,
  onOpenChange,
  link,
  title = "Scan QR Code",
}: QRCodeModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      dialogContentClassName="sm:max-w-md"
      drawerContentClassName="min-h-[500px]"
    >
      <div className="flex flex-col items-center gap-4 p-6 pb-8">
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG value={link} size={256} level="H" includeMargin={true} />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Scan this QR code to claim your BeamLink
        </p>
      </div>
    </Modal>
  );
}
