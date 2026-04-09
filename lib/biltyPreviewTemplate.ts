type BiltyPreviewCompany = {
  name?: string;
  gstin?: string;
  address?: string;
  phone?: string;
  logo_url?: string;
};

type BuildBiltyPreviewHtmlOptions = {
  company?: BiltyPreviewCompany;
  defaultTermsText?: string;
};

const DEFAULT_TERMS_TEXT = "This is electronically generated version therefore does not require signature.";

const escapeHtml = (value: string) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const buildBiltyPreviewHtml = (doc: any, options?: BuildBiltyPreviewHtmlOptions) => {
  const partyName = options?.company?.name || "TRUCKSARTHI";
  const partyGstin = options?.company?.gstin || "-";
  const partyAddress = options?.company?.address || "-";
  const partyPhone = options?.company?.phone || "-";
  const partyLogo = options?.company?.logo_url || "";
  const lrNo = doc?.bilty_number || String(doc?._id || "-").slice(-8).toUpperCase();
  const lrDate = String(doc?.bilty_date || new Date()).split("T")[0];

  const money = (value: number) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const rows = doc?.goods_rows || [];

  const termsLine = String(doc?.notes || options?.defaultTermsText || DEFAULT_TERMS_TEXT);

  const buildCopyPage = (copyLabel: string) => `
      <div class="page">
        <div class="copy-pill">${escapeHtml(copyLabel)}</div>
        <div class="sheet">
          <div class="header">
            ${partyLogo ? `<img class="logo-box logo-image" src="${escapeHtml(partyLogo)}" />` : `<div class="logo-box">TS</div>`}
            <div class="company-center">
              <div class="brand">${escapeHtml(partyName)}</div>
              <div class="sub">${escapeHtml(partyAddress)}</div>
            </div>
            <div class="company-right">
              <div><strong>Phone:</strong> ${escapeHtml(partyPhone)}</div>
              <div><strong>GSTIN:</strong> ${escapeHtml(partyGstin)}</div>
              <div><strong>PAN:</strong> ${escapeHtml(doc?.company_pan || "-")}</div>
            </div>
          </div>

          <div class="lr-details-box">
            <div class="lr-box"><div class="box-title">LR No</div><div><strong>${escapeHtml(lrNo)}</strong></div></div>
            <div class="lr-box"><div class="box-title">Date</div><div><strong>${escapeHtml(lrDate)}</strong></div></div>
            <div class="lr-box"><div class="box-title">Payment</div><div>${escapeHtml(doc?.payment_type || "to_pay")}</div></div>
          </div>

          <div class="party-section">
            <div class="party-block">
              <div class="section-title">Consignor</div>
              <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(doc?.consignor?.name || "-")}</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>Phone:</strong> ${escapeHtml(doc?.consignor?.phone || "-")}</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>Address:</strong> ${escapeHtml(doc?.consignor?.address || "-")}</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>GSTIN:</strong> ${escapeHtml(doc?.consignor?.gstin || "-")}</div>
            </div>
            <div class="party-block">
              <div class="section-title">Consignee</div>
              <div style="font-weight: 700; margin-bottom: 4px;">${escapeHtml(doc?.consignee?.name || "-")}</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>Phone:</strong> ${escapeHtml(doc?.consignee?.phone || "-")}</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>Address:</strong> ${escapeHtml(doc?.consignee?.address || "-")}</div>
              <div style="font-size: 9px;"><strong>GSTIN:</strong> ${escapeHtml(doc?.consignee?.gstin || "-")}</div>
            </div>
          </div>

          <div class="shipment-insurance-row">
            <div class="shipment-section">
              <div class="section-title">Shipment Details</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>From:</strong> ${escapeHtml(doc?.shipment?.from_location || "-")}</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>To:</strong> ${escapeHtml(doc?.shipment?.to_location || "-")}</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>Vehicle:</strong> ${escapeHtml(doc?.shipment?.vehicle_number || "-")}</div>
              <div style="font-size: 9px;"><strong>Driver:</strong> ${escapeHtml(doc?.shipment?.driver_name || "-")}</div>
            </div>
            <div class="insurance-section">
              <div class="section-title">Insurance</div>
              ${doc?.insurance?.policy_number ? `
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>Insurer:</strong> ${escapeHtml(doc?.insurance?.insurer_name || "-")}</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>Policy:</strong> ${escapeHtml(doc?.insurance?.policy_number || "-")}</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>Coverage:</strong> ₹ ${money(doc?.insurance?.coverage_amount || 0)}</div>
              <div style="font-size: 9px;"><strong>Expiry:</strong> ${escapeHtml(doc?.insurance?.expiry_date || "-")}</div>
              ` : `<div style="font-size: 9px; color: #666;">Not insured</div>`}
            </div>
          </div>

          <div class="freight-vehicle-row">
            <div class="freight-section">
              <div class="section-title">Freight Details</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>Paid By:</strong> ${escapeHtml(String(doc?.freight_paid_by || "-").toUpperCase())}</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>GST %:</strong> ${escapeHtml(String(doc?.gst_percentage ?? 0))}%</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>GST Type:</strong> ${escapeHtml((doc?.gst_type || "gst") === "igst" ? "IGST" : "CGST + SGST")}</div>
              <div style="font-size: 9px;"><strong>GST Paid By:</strong> ${escapeHtml(String(doc?.gst_paid_by || "-").toUpperCase())}</div>
            </div>
            <div class="vehicle-section">
              <div class="section-title">Vehicle Details</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>Vehicle:</strong> ${escapeHtml(doc?.shipment?.vehicle_number || "-")}</div>
              <div style="font-size: 9px; margin-bottom: 2px;"><strong>Driver:</strong> ${escapeHtml(doc?.shipment?.driver_name || "-")}</div>
              <div style="font-size: 9px;"><strong>Phone:</strong> ${escapeHtml(doc?.shipment?.driver_phone || "-")}</div>
            </div>
          </div>

          <div class="goods-and-route">
            <div class="goods-column">
              <div class="section-title">Goods Details</div>
              <table class="items-compact"><tbody>
              ${rows
                .map(
                  (row: any, idx: number) =>
                    `<tr><td class="sr">${idx + 1}</td><td class="desc">${escapeHtml(row.description || "-")}</td><td class="qty">${row.quantity || "-"} ${row.unit}</td><td class="amt">${money(row.total || 0)}</td></tr>`
                )
                .join("")}
              </tbody></table>
            </div>
          </div>

          <div class="charges-section">
            <table class="charges-table"><tbody>
              <tr><td><strong>Freight</strong></td><td class="right">₹ ${money(doc?.charges?.freight || 0)}</td></tr>
              <tr><td><strong>Loading</strong></td><td class="right">₹ ${money(doc?.charges?.loading || 0)}</td></tr>
              <tr><td><strong>Unloading</strong></td><td class="right">₹ ${money(doc?.charges?.unloading || 0)}</td></tr>
              <tr><td><strong>Other</strong></td><td class="right">₹ ${money(doc?.charges?.other || 0)}</td></tr>
              <tr style="border-top: 2px solid #111;"><td><strong>Total</strong></td><td class="right"><strong>₹ ${money(doc?.charges?.total || 0)}</strong></td></tr>
              <tr><td><strong>Advance</strong></td><td class="right">₹ ${money(doc?.charges?.advance || 0)}</td></tr>
              <tr style="border-top: 1px solid #111; font-weight: 700;"><td><strong>Balance</strong></td><td class="right"><strong>₹ ${money(doc?.charges?.balance || 0)}</strong></td></tr>
            </tbody></table>
          </div>

          <div class="footer-grid">
            <div class="terms">
              <div class="section-title">Terms & Conditions</div>
              <div style="font-size: 8px; line-height: 1.3;">1. ${escapeHtml(termsLine)}</div>
            </div>
            <div class="signature">
              <div style="font-size: 9px; margin-bottom: 8px;">Certified that the particulars given above are true and correct.</div>
              <div style="font-size: 9px; margin-bottom: 8px;"><strong>For, ${escapeHtml(partyName)}</strong></div>
              ${doc?.signature_url ? `<img src="${escapeHtml(doc.signature_url)}" style="height:32px; margin-bottom:4px; object-fit:contain;" />` : ""}
              <div class="sign-line">Signature</div>
            </div>
          </div>
        </div>
      </div>
    `;

  return `
<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
@page { size: A4; margin: 6mm; }
body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #111; font-size: 10px; background: #ececec; padding: 8px 0; }
.page { width: 198mm; margin: 0 auto 8px; background: #fff; box-sizing: border-box; box-shadow: 0 0 0 1px #ddd; }
.page-break { page-break-before: always; }
.copy-pill { display: inline-block; border: 1px solid #333; border-radius: 999px; padding: 3px 8px; font-weight: 700; margin: 0 0 6px 0; font-size: 9px; }
.sheet { border: 2px solid #111; padding: 8px; }
.header { display: grid; grid-template-columns: 50px 1fr 200px; gap: 8px; align-items: center; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 6px; }
.logo-box { width: 48px; height: 48px; border: 1px solid #111; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; }
.logo-image { object-fit: cover; width: 100%; height: 100%; }
.company-center { text-align: center; }
.brand { font-size: 18px; font-weight: 800; letter-spacing: 0.5px; }
.sub { font-size: 8px; color: #333; margin-top: 2px; }
.company-right { font-size: 8px; line-height: 1.3; }
.lr-details-box { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-bottom: 6px; }
.lr-box { border: 1px solid #111; padding: 4px 6px; font-size: 8px; }
.box-title { font-weight: 700; font-size: 7px; margin-bottom: 2px; }
.party-section { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; border-bottom: 1px solid #111; padding-bottom: 4px; }
.party-block { padding: 4px; font-size: 8px; }
.section-title { font-weight: 700; margin-bottom: 3px; font-size: 9px; border-bottom: 1px solid #999; padding-bottom: 2px; }
.shipment-insurance-row { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; border-bottom: 1px solid #111; padding-bottom: 4px; }
.shipment-section { font-size: 8px; padding: 4px; }
.insurance-section { font-size: 8px; padding: 4px; }
.freight-vehicle-row { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; border-bottom: 1px solid #111; padding-bottom: 4px; }
.freight-section { font-size: 8px; padding: 4px; }
.vehicle-section { font-size: 8px; padding: 4px; }
.goods-and-route { display: grid; grid-template-columns: 1fr; gap: 4px; margin-bottom: 6px; }
.goods-column { font-size: 8px; padding: 4px; }
.items-compact { width: 100%; border-collapse: collapse; font-size: 8px; }
.items-compact td { border: 1px solid #999; padding: 3px 2px; }
.sr { text-align: center; width: 20px; }
.desc { flex: 1; }
.qty { text-align: center; width: 40px; }
.amt { text-align: right; width: 40px; }
.charges-section { margin-bottom: 6px; border: 1px solid #111; padding: 4px; }
.charges-table { width: 100%; border-collapse: collapse; font-size: 8px; }
.charges-table td { padding: 2px 4px; }
.right { text-align: right; }
.footer-grid { display: grid; grid-template-columns: 1fr 1fr; border-top: 2px solid #111; gap: 2px; margin-top: 4px; }
.terms { padding: 4px; border-right: 1px solid #111; min-height: 60px; }
.signature { padding: 4px; min-height: 60px; position: relative; display: flex; flex-direction: column; justify-content: space-between; }
.sign-line { font-size: 8px; margin-top: 2px; }
@media print {
  body { background: #fff; padding: 0; }
  .page { width: 100%; margin: 0; box-shadow: none; }
}
</style></head><body>${buildCopyPage("Consignor LR")}<div class="page-break"></div>${buildCopyPage("Consignee LR")}</body></html>`;
};
