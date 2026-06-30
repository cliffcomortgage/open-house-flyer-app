import QRCode from "qrcode";

export async function generateQRCodeDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 200,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export async function generateQRCodeSVG(text: string): Promise<string> {
  return QRCode.toString(text, { type: "svg", margin: 1 });
}
