"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, FileDown } from "lucide-react";
import { SearchableSelect } from "@/components/ui";
import { useTranslation, useAppDispatch, useAppSelector } from "@/store/hooks";
import { formatDate } from "@/lib/formatDate";
import { transactionOptionLabel } from "@/lib/listingLabel";
import { printValue } from "@/lib/printBlank";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import type {
  ApiResponse,
  Transaction,
  Client,
  Realtor,
  Property,
  Land,
  PropertyCategory,
  FloorLevel,
  LandCategory,
} from "@/lib/types";
import logo from "@/assets/img/webrealtor-logo.png";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./ReceiptPage.module.scss";

interface FormValues {
  date: string;
  amount: string;
  amountText: string;
  genderLavon: string;
  fullNameLavon: string;
  gender: string;
  fullName: string;
  reason: string;
}

const EMPTY: FormValues = {
  date: "",
  amount: "",
  amountText: "",
  genderLavon: "τον",
  fullNameLavon: "",
  gender: "τον",
  fullName: "",
  reason: "",
};

function reasonForTransaction(tx: Transaction): string {
  if (tx.listingType === "Property" && tx.action === "buy") return "Αμοιβή μεσιτείας για αγορά ακινήτου";
  if (tx.listingType === "Property" && tx.action === "rent") return "Αμοιβή μεσιτείας για μίσθωση ακινήτου";
  if (tx.listingType === "Land" && tx.action === "buy") return "Αμοιβή μεσιτείας για αγορά γης";
  if (tx.listingType === "Land" && tx.action === "rent") return "Αμοιβή μεσιτείας για μίσθωση γης";
  return "Αμοιβή μεσιτείας";
}

// Pure so it can be reused both by the manual transaction <select> and by the propertyId-driven
// auto-select below — both need to build FormValues from freshly-loaded data, not from React state
// that may not have settled yet in the same tick.
function buildValuesFromTransaction(
  tx: Transaction,
  clientList: Client[],
  realtorNameMap: Record<string, string>
): FormValues {
  const client = clientList.find((c) => c.id === tx.clientId);
  const clientName = client ? `${client.firstName} ${client.lastName}` : "";
  const clientGender = client?.gender === "Female" ? "την" : "τον";
  const realtorName = realtorNameMap[tx.realtorId] ?? "";
  const dateStr = tx.date ? new Date(tx.date).toISOString().substring(0, 10) : "";

  return {
    date: dateStr,
    // Total collected across both sides of the deal — see CLAUDE.md → "Transactions". Still a
    // plain editable text field below, so a receipt for just one side is a manual edit away.
    amount: (tx.buyerCommission + tx.sellerCommission).toFixed(2),
    amountText: "",
    genderLavon: "τον",
    fullNameLavon: realtorName,
    gender: clientGender,
    fullName: clientName,
    reason: reasonForTransaction(tx),
  };
}

function ReceiptCopy({ values, realtorImage }: { values: FormValues; realtorImage: string | null }) {
  const displayDate = values.date ? formatDate(values.date) : "";
  const receiverTitle = values.genderLavon === "τον" ? "ο υπογεγραμμένος" : "η υπογεγραμμένη";

  return (
    <div className={styles.receiptCopy}>
      <div className={styles.receiptHeader}>
        {/* Plain <img> instead of next/image — required for html2canvas compatibility. Shows the
            transaction's realtor's own photo when they have one uploaded (see RealtorImageUpload /
            Realtor.imageUrl), falling back to the WebRealtor logo otherwise. */}
        <img src={realtorImage ?? logo.src} alt={realtorImage ? "" : "WebRealtor"} className={styles.receiptLogo} />
        <span className={styles.receiptHeading}>Απόδειξη Είσπραξης</span>
      </div>
      <div className={styles.receiptMeta}>
        <span>
          Ημερομηνία: <strong>{printValue(displayDate)}</strong>
        </span>
        <span>
          Ποσό: <strong>{printValue(values.amount)}</strong> €
        </span>
      </div>
      <div className={styles.receiptBody}>
        <p>
          Έλαβα <strong>{receiverTitle}</strong> <strong>{printValue(values.fullNameLavon)}</strong>.
          <br />
          Από <strong>{values.gender}</strong> <strong>{printValue(values.fullName)}</strong>.
          <br />
          Το ποσό των <strong>{printValue(values.amountText)}</strong> <strong>ευρώ</strong>.
          <br />
          Με αιτιολογία <strong>{printValue(values.reason)}</strong>.
        </p>
      </div>
      <div className={styles.receiptSignature}>
        <span>Ο ΛΑΒΩΝ</span>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  const t = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId");
  // Arrived from TransactionTable's "Generate Receipt" action (shown only while that transaction
  // has no receipt yet) — preselects that exact transaction directly, no fuzzy match needed since
  // it's already known. Takes priority over propertyId when both are somehow present.
  const transactionId = searchParams.get("transactionId");

  const [values, setValues] = useState<FormValues>(EMPTY);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [propertyListings, setPropertyListings] = useState<Property[]>([]);
  const [landListings, setLandListings] = useState<Land[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<PropertyCategory[]>([]);
  const [floorLevels, setFloorLevels] = useState<FloorLevel[]>([]);
  const [landCategories, setLandCategories] = useState<LandCategory[]>([]);
  const [realtorNames, setRealtorNames] = useState<Record<string, string>>({});
  const [realtorImages, setRealtorImages] = useState<Record<string, string | null>>({});
  const [selectedTxId, setSelectedTxId] = useState("");
  const [selectedRealtorImage, setSelectedRealtorImage] = useState<string | null>(null);
  const [txLoading, setTxLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const printWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setTxLoading(true);
      try {
        const isRoot = user!.role === "Root";
        const realtorId = user!.realtorId;
        const qs = isRoot ? "" : `?realtorId=${realtorId}`;

        const [txRes, clientRes, propertiesRes, landsRes, propertyCategoriesRes, floorLevelsRes, landCategoriesRes] =
          await Promise.all([
            apiClient.get(`/api/transactions${qs}`),
            apiClient.get(`/api/clients${qs}`),
            apiClient.get<ApiResponse<Property[]>>(`/api/properties${qs}`),
            apiClient.get<ApiResponse<Land[]>>(`/api/lands${qs}`),
            apiClient.get<ApiResponse<PropertyCategory[]>>("/api/property-categories"),
            apiClient.get<ApiResponse<FloorLevel[]>>("/api/floor-levels"),
            apiClient.get<ApiResponse<LandCategory[]>>("/api/land-categories"),
          ]);

        const txList: Transaction[] = txRes.data.data ?? [];
        // Dropdown/manual-select only offers transactions without a receipt yet — one already has
        // one, edit or remove it from the Transactions table instead of regenerating here. The raw
        // txList (below) is still used for the transactionId/propertyId auto-select and realtor
        // name resolution, so a direct link from TransactionTable still resolves correctly.
        const availableTxList = txList.filter((tx) => !tx.receiptUrl);
        const clientList: Client[] = clientRes.data.data ?? [];
        setTransactions(availableTxList);
        setClients(clientList);
        setPropertyListings(propertiesRes.data.data ?? []);
        setLandListings(landsRes.data.data ?? []);
        setPropertyCategories(propertyCategoriesRes.data.data ?? []);
        setFloorLevels(floorLevelsRes.data.data ?? []);
        setLandCategories(landCategoriesRes.data.data ?? []);

        // Resolve realtor names (and profile photos, see CLAUDE.md → "Realtor management") — only
        // the unique ids referenced by this transaction list
        const uniqueRealtorIds = [...new Set(txList.map((tx) => tx.realtorId).filter(Boolean))];
        const entries = await Promise.all(
          uniqueRealtorIds.map((id) =>
            apiClient
              .get<ApiResponse<Realtor>>(`/api/realtors/${id}`)
              .then((r) => [id, r.data.data] as [string, Realtor])
              .catch(() => [id, null] as [string, Realtor | null])
          )
        );
        const realtorNameMap: Record<string, string> = {};
        const realtorImageMap: Record<string, string | null> = {};
        for (const [id, realtor] of entries) {
          realtorNameMap[id] = realtor ? `${realtor.firstName} ${realtor.lastName}` : "";
          realtorImageMap[id] = realtor?.imageUrl ?? null;
        }
        setRealtorNames(realtorNameMap);
        setRealtorImages(realtorImageMap);

        if (transactionId) {
          // Exact transaction already known — no search needed, unlike the propertyId path below.
          const match = txList.find((tx) => tx.id === transactionId);
          if (match) {
            setSelectedTxId(match.id);
            setValues(buildValuesFromTransaction(match, clientList, realtorNameMap));
            setSelectedRealtorImage(realtorImageMap[match.realtorId] ?? null);
          } else {
            MessageHandler.warning(dispatch, t("receipt.noMatchingTransaction"));
          }
        } else if (propertyId) {
          // Arrived from a property row's "Create Receipt" action (see PropertyTable) — preselect
          // that listing's most recent transaction instead of leaving the dropdown empty. Sorted
          // client-side by date rather than trusting list order, since Root's unscoped
          // /api/transactions response is createdAt-sorted (TransactionService.list →
          // BaseRepository.findAll), not date-sorted like the realtor-scoped listForRealtor() path.
          const propertyTxs = availableTxList.filter(
            (tx) => tx.listingType === "Property" && tx.listingId === propertyId
          );
          const match = propertyTxs.reduce<Transaction | undefined>(
            (latest, tx) => (!latest || new Date(tx.date) > new Date(latest.date) ? tx : latest),
            undefined
          );
          if (match) {
            setSelectedTxId(match.id);
            setValues(buildValuesFromTransaction(match, clientList, realtorNameMap));
            setSelectedRealtorImage(realtorImageMap[match.realtorId] ?? null);
          } else {
            MessageHandler.warning(dispatch, t("receipt.noMatchingTransaction"));
          }
        }
      } catch {
        // silent — form is still usable manually
      } finally {
        setTxLoading(false);
      }
    }

    loadData();
    // propertyId/transactionId/dispatch/t are stable for the lifetime of this mount-time load — only user
    // presence should re-trigger it, same as before this addition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleTransactionSelect = (txId: string) => {
    setSelectedTxId(txId);
    if (!txId) {
      setValues(EMPTY);
      setSelectedRealtorImage(null);
      return;
    }
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    setValues(buildValuesFromTransaction(tx, clients, realtorNames));
    setSelectedRealtorImage(realtorImages[tx.realtorId] ?? null);
  };

  const handleSavePdf = async () => {
    if (!selectedTxId || !printWrapperRef.current || saving) return;
    const tx = transactions.find((t) => t.id === selectedTxId);
    if (!tx) return;

    setSaving(true);
    try {
      const [html2canvas, { jsPDF }] = await Promise.all([
        import("html2canvas").then((m) => m.default),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(printWrapperRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, imgHeight);

      const blob = pdf.output("blob");
      const file = new File([blob], `receipt-${tx.id}.pdf`, { type: "application/pdf" });

      // Saved onto the selected transaction's own receipt slot (see models/Transaction.ts,
      // CLAUDE.md → "Transactions") regardless of how this page was reached — every generated
      // receipt belongs to a specific transaction, so that's always the right place for it, not
      // just when arriving via TransactionTable's "Generate Receipt" action.
      const formData = new FormData();
      formData.append("file", file);
      await apiClient.post(`/api/transactions/${tx.id}/files/receipt`, formData);

      MessageHandler.success(dispatch, t("receipt.saved"));
    } catch (err) {
      console.error("ReceiptPage: failed to save PDF", err);
      MessageHandler.error(dispatch, t("receipt.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const transactionOptions = transactions.map((tx) => ({
    value: tx.id,
    label: transactionOptionLabel(tx, propertyListings, landListings, propertyCategories, floorLevels, landCategories, t),
  }));

  return (
    <div className={sharedStyles.docToolPage}>
      {/* Form — hidden when printing */}
      <div className={sharedStyles.docToolFormSection}>
        <div className={sharedStyles.docToolFormCard}>
          <div className={sharedStyles.docToolFormHeader}>
            <h1 className={sharedStyles.docToolFormTitle}>{t("receipt.pageTitle")}</h1>
            <p className={sharedStyles.docToolFormSubtitle}>{t("receipt.pageSubtitle")}</p>
          </div>

          {/* Transaction selector */}
          <div className={sharedStyles.docToolSelectorSection}>
            <div className={sharedStyles.field}>
              <label className={sharedStyles.label}>{t("receipt.transactionSelect")}</label>
              <SearchableSelect
                value={selectedTxId}
                onChange={handleTransactionSelect}
                options={transactionOptions}
                placeholder={txLoading ? t("receipt.loading") : t("receipt.transactionSelectPlaceholder")}
                disabled={txLoading}
              />
            </div>
          </div>

          <div className={sharedStyles.docToolFormBody}>
            <div className={styles.rowThree}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("receipt.form.date")}</label>
                <input
                  type="date"
                  name="date"
                  value={values.date}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("receipt.form.amount")}</label>
                <input
                  type="text"
                  name="amount"
                  value={values.amount}
                  onChange={handleChange}
                  className={sharedStyles.input}
                  placeholder="0.00"
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("receipt.form.amountText")}</label>
                <input
                  type="text"
                  name="amountText"
                  value={values.amountText}
                  onChange={handleChange}
                  className={sharedStyles.input}
                  placeholder={t("receipt.form.amountTextPlaceholder")}
                />
              </div>
            </div>

            <div className={styles.rowFour}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>&nbsp;</label>
                <select
                  name="genderLavon"
                  value={values.genderLavon}
                  onChange={handleChange}
                  className={sharedStyles.input}
                >
                  <option value="τον">Τον</option>
                  <option value="την">Την</option>
                </select>
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("receipt.form.fullNameLavon")}</label>
                <input
                  type="text"
                  name="fullNameLavon"
                  value={values.fullNameLavon}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>&nbsp;</label>
                <select
                  name="gender"
                  value={values.gender}
                  onChange={handleChange}
                  className={sharedStyles.input}
                >
                  <option value="τον">Τον</option>
                  <option value="την">Την</option>
                </select>
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("receipt.form.fullName")}</label>
                <input
                  type="text"
                  name="fullName"
                  value={values.fullName}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
            </div>

            <div className={sharedStyles.field}>
              <label className={sharedStyles.label}>{t("receipt.form.reason")}</label>
              <textarea
                name="reason"
                value={values.reason}
                onChange={handleChange}
                rows={3}
                className={sharedStyles.input}
              />
            </div>
          </div>

          <div className={sharedStyles.docToolFormFooter}>
            <button type="button" className={sharedStyles.docToolPrintBtn} onClick={() => window.print()}>
              <Printer size={16} />
              {t("receipt.printButton")}
            </button>
            <button
              type="button"
              className={sharedStyles.docToolSavePdfBtn}
              onClick={handleSavePdf}
              disabled={!selectedTxId || saving}
            >
              <FileDown size={16} />
              {saving ? t("receipt.saving") : t("receipt.saveAsPdf")}
            </button>
          </div>
        </div>
      </div>

      {/* Print section — live preview on screen, sole content when printing */}
      <div className={sharedStyles.docToolPrintSection}>
        <p className={sharedStyles.docToolPreviewLabel}>{t("receipt.previewLabel")}</p>
        <div className={sharedStyles.docToolPrintWrapper} ref={printWrapperRef}>
          <div className={styles.receiptPage}>
            <ReceiptCopy values={values} realtorImage={selectedRealtorImage} />
            <hr className={styles.receiptDivider} />
            <ReceiptCopy values={values} realtorImage={selectedRealtorImage} />
          </div>
        </div>
      </div>
    </div>
  );
}
