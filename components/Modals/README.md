# Extracted Modals

This directory contains modular, reusable modal components extracted from screens to improve code organization and maintainability.

## Available Modals

### ClientEditModal
- **Usage**: Edit client business profile information
- **Props**:
  - `visible`: boolean - Controls modal visibility
  - `onClose`: () => void - Called when modal should close
  - `formData`: ClientEditFormData - Form data object
  - `onFormDataChange`: (data: ClientEditFormData) => void - Updates form data
  - `onSubmit`: () => void - Saves changes
  - `isDark`: boolean - Theme mode
  - `verifyingGstin`: boolean - Loading state for GSTIN verification
  - `onVerifyGstin`: () => void - Callback to verify GSTIN

### PaymentFormModal
- **Usage**: Add a new payment record for a client
- **Props**:
  - `visible`: boolean - Controls modal visibility
  - `onClose`: () => void - Called when modal should close
  - `clientName`: string - Client name for display
  - `paymentAmount`: string - Current amount value
  - `onPaymentAmountChange`: (value: string) => void - Updates amount
  - `paymentRemarks`: string - Payment remarks/notes
  - `onPaymentRemarksChange`: (value: string) => void - Updates remarks
  - `paymentMode`: "CASH" | "BANK" - Selected payment mode
  - `onPaymentModeChange`: (mode: "CASH" | "BANK") => void - Updates payment mode
  - `paymentDate`: Date - Selected date
  - `onPaymentDateChange`: (date: Date) => void - Updates date
  - `showDatePicker`: boolean - Controls date picker visibility
  - `onShowDatePickerChange`: (show: boolean) => void - Updates date picker visibility
  - `onSubmit`: () => void - Saves payment
  - `isDark`: boolean - Theme mode

### InvoiceConfigModal
- **Usage**: Configure and generate invoices from selected trips
- **Props**:
  - `visible`: boolean - Controls modal visibility
  - `onClose`: () => void - Called when modal should close
  - `selectedTripsCount`: number - Number of trips selected for invoice
  - `invoiceTaxPercentage`: 0 | 5 | 18 - Selected tax percentage
  - `onTaxPercentageChange`: (percent: 0 | 5 | 18) => void - Updates tax percentage
  - `invoiceTaxType`: "igst" | "cgst_sgst" - Selected tax type
  - `onTaxTypeChange`: (type: "igst" | "cgst_sgst") => void - Updates tax type
  - `invoiceDueDate`: Date - Invoice due date
  - `onInvoiceDueDateChange`: (date: Date) => void - Updates due date
  - `showInvoiceDueDatePicker`: boolean - Controls date picker visibility
  - `onShowInvoiceDueDatePickerChange`: (show: boolean) => void - Updates date picker visibility
  - `onSubmit`: () => void - Creates invoice
  - `isDark`: boolean - Theme mode

### LedgerDownloadModal
- **Usage**: Download ledger PDFs with date range selection
- **Props**:
  - `visible`: boolean - Controls modal visibility
  - `onClose`: () => void - Called when modal should close
  - `downloadRange`: { startDate: Date; endDate: Date } - Date range for download
  - `downloadDateField`: "start" | "end" | null - Which date field is being edited
  - `onOpenDatePicker`: (field: "start" | "end") => void - Opens date picker for field
  - `onCloseDatePicker`: () => void - Closes date picker
  - `onApplyDate`: (field: "start" | "end", date: Date) => void - Applies selected date
  - `onDownload`: () => void - Initiates PDF download
  - `downloading`: boolean - Loading state

## Integration Example

### Client Ledger Detail Screen

```tsx
import PaymentFormModal from "../../components/Modals/PaymentFormModal";
import InvoiceConfigModal from "../../components/Modals/InvoiceConfigModal";
import ClientEditModal from "../../components/Modals/ClientEditModal";
import LedgerDownloadModal from "../../components/Modals/LedgerDownloadModal";

export default function ClientLedgerDetailScreen() {
  // ... state management ...
  
  return (
    <View>
      {/* Screen content */}
      
      <PaymentFormModal
        visible={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        clientName={client?.client_name}
        paymentAmount={paymentAmount}
        onPaymentAmountChange={setPaymentAmount}
        paymentRemarks={paymentRemarks}
        onPaymentRemarksChange={setPaymentRemarks}
        paymentMode={paymentMode}
        onPaymentModeChange={setPaymentMode}
        paymentDate={paymentDate}
        onPaymentDateChange={setPaymentDate}
        showDatePicker={showDatePicker}
        onShowDatePickerChange={setShowDatePicker}
        onSubmit={handleAddPayment}
        isDark={isDark}
      />
      
      <InvoiceConfigModal
        visible={showInvoiceConfigForm}
        onClose={() => setShowInvoiceConfigForm(false)}
        selectedTripsCount={selectedTrips.length}
        invoiceTaxPercentage={invoiceTaxPercentage}
        onTaxPercentageChange={setInvoiceTaxPercentage}
        invoiceTaxType={invoiceTaxType}
        onTaxTypeChange={setInvoiceTaxType}
        invoiceDueDate={invoiceDueDate}
        onInvoiceDueDateChange={setInvoiceDueDate}
        showInvoiceDueDatePicker={showInvoiceDueDatePicker}
        onShowInvoiceDueDatePickerChange={setShowInvoiceDueDatePicker}
        onSubmit={handleGenerateInvoice}
        isDark={isDark}
      />
      
      <ClientEditModal
        visible={showEditModal}
        onClose={closeEditModal}
        formData={editFormData}
        onFormDataChange={setEditFormData}
        onSubmit={handleUpdateClient}
        isDark={isDark}
        verifyingGstin={verifyingGstin}
        onVerifyGstin={verifyGSTIN}
      />
      
      <LedgerDownloadModal
        visible={showDownloadSheet}
        onClose={() => {
          setShowDownloadSheet(false);
          setDownloadDateField(null);
        }}
        downloadRange={downloadRange}
        downloadDateField={downloadDateField}
        onOpenDatePicker={openDownloadDatePicker}
        onCloseDatePicker={closeDownloadDatePicker}
        onApplyDate={applyDownloadDate}
        onDownload={handleDownload}
        downloading={downloading}
      />
    </View>
  );
}
```

## Benefits

1. **Reusability**: Modals can be easily reused across different screens
2. **Maintainability**: Changes to modal UI are centralized
3. **Testability**: Modals can be tested independently
4. **Modularity**: Screens remain clean and focused on logic
5. **Type Safety**: Full TypeScript support with proper props interfaces

## Future Enhancements

- Create similar modals for driver-ledger-detail.tsx
- Extract modals from bilty-wizard.tsx
- Create modals for trip-detail.tsx (invoice sheet, bilty sheet, edit trip)
- Consider creating a modal factory for common patterns
