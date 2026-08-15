"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, FileDown, Plus, Trash2 } from "lucide-react";
import { useTranslation, useAppDispatch, useAppSelector } from "@/store/hooks";
import { formatDate } from "@/lib/formatDate";
import { printValue } from "@/lib/printBlank";
import apiClient from "@/lib/apiClient";
import { MessageHandler } from "@/helpers/messageHandler";
import type { ApiResponse, Client, Realtor } from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./OrderPage.module.scss";

interface PropertyRow {
  id: string;
  address: string;
  price: string;
}

interface FormValues {
  date: string;
  realtorNumber: string;
  recipientRealtorName: string;
  signatureCity: string;
  referral: string;
  // Plain string, not a literal union, so the generic handleChange below (shared with every other
  // field) can assign to it — same convention ContractPage's ownerGender/renterGender use.
  gender: string;
  fullName: string;
  afm: string;
  idNumber: string;
  phone: string;
  city: string;
  address: string;
  addressNumber: string;
  payment: string;
}

const EMPTY: FormValues = {
  date: new Date().toISOString().substring(0, 10),
  realtorNumber: "",
  recipientRealtorName: "",
  signatureCity: "",
  referral: "",
  gender: "M",
  fullName: "",
  afm: "",
  idNumber: "",
  phone: "",
  city: "",
  address: "",
  addressNumber: "",
  payment: "",
};

function newPropertyRow(): PropertyRow {
  return { id: crypto.randomUUID(), address: "", price: "" };
}

// Pure so a fresh client/realtor pair can build a FormValues object without waiting for React
// state to settle in the same tick — same reasoning as Contract/ReceiptPage's own build helpers.
function buildValuesFromClient(client: Client, realtor: Realtor | undefined): FormValues {
  return {
    ...EMPTY,
    realtorNumber: realtor?.realtorNumber ?? "",
    recipientRealtorName: realtor ? `${realtor.firstName} ${realtor.lastName}` : "",
    signatureCity: realtor?.city ?? "",
    gender: client.gender === "Female" ? "F" : "M",
    fullName: `${client.firstName} ${client.lastName}`,
    afm: client.tin ?? "",
    phone: client.phone || client.mobile || "",
    city: client.city ?? "",
    address: client.address ?? "",
  };
}

function OrderCopy({ values, properties }: { values: FormValues; properties: PropertyRow[] }) {
  const displayDate = values.date ? formatDate(values.date) : "";
  const signedAs = values.gender === "F" ? "Η υπογεγραμμένη" : "Ο υπογεγραμμένος";

  return (
    <div className={styles.orderCopy}>
      <h1 className={styles.orderTitle}>ΑΠΟΦΑΣΗ ΟΜΟΣΠΟΝΔΙΑΣ ΜΕΣΙΤΩΝ ΑΣΤΙΚΩΝ ΣΥΜΒΑΣΕΩΝ ΕΛΛΑΔΟΣ</h1>
      <div className={styles.orderNumber}>
        Αριθμός: <strong>{printValue(values.realtorNumber)}</strong>
      </div>
      <p className={styles.orderTo}>
        ΠΡΟΣ ΤΟΝ ΚΥΡΙΟΝ <strong>{printValue(values.recipientRealtorName)}</strong>
      </p>
      <div className={styles.orderToSubtitle}>ΜΕΣΙΤΗ ΑΣΤΙΚΩΝ ΣΥΜΒΑΣΕΩΝ</div>
      <div className={styles.orderHeading}>ΕΝΤΟΛΗ</div>
      <p className={styles.orderIntro}>
        ΚΥΡΙΕ,
        <br />
        <strong>{signedAs}</strong> <strong>{printValue(values.fullName)}</strong> κάτοικος{" "}
        <strong>{printValue(values.city)}</strong> οδός <strong>{printValue(values.address)}</strong> αριθμός{" "}
        <strong>{printValue(values.addressNumber)}</strong> τηλέφωνο <strong>{printValue(values.phone)}</strong>{" "}
        Α.Δ.Τ <strong>{printValue(values.idNumber)}</strong> Α.Φ.Μ. <strong>{printValue(values.afm)}</strong>
      </p>
      <div className={styles.orderDeclares}>Δηλώνω ότι</div>
      <p className={styles.orderBody}>
        Με την εντολή που σας έδωσα να μου υποδείξετε <strong>{printValue(values.referral)}</strong> για να αγοράσω
        τις μετρητοίς ή με αντιπαροχή ή με ανταλλαγή ή και να ενοικιάσω, εσείς υπό την ιδιότητα σας ως Μεσίτης
        Αστικών Συμβάσεων μου υποδείξατε τα παρακάτω ακίνητα, που για πρώτη φορά γνωρίζω, με φέρατε σε επαφή με τους
        ιδιοκτήτες τους και ήδη ύστερα από την μεσολάβηση σας διαπραγματευόμαστε για την ολοκλήρωση της συναλλαγής.
      </p>
      <table className={styles.orderTable}>
        <thead>
          <tr>
            <th>Α/Α</th>
            <th>ΠΛΗΡΟΦΟΡΙΕΣ ΙΔΙΟΚΤΗΣΙΑΣ</th>
            <th>ΑΞΙΑ</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((row, index) => (
            <tr key={row.id}>
              <td>{index + 1}</td>
              <td>{printValue(row.address)}</td>
              <td>{row.price ? `${row.price}€` : printValue(row.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.orderBody}>
        Σας δηλώνω όταν αγοράσω με οποιονδήποτε τρόπο, ή μισθώσω κάποιο από τα παραπάνω ακίνητα είτε στο δικό μου
        όνομα, είτε σε μέλος της οικογένειας μου ή του συνεταίρου μου, για τους οποίους δηλώνω υπεύθυνως οτι ενεργώ
        ύστερα από εντολή των κατα εξουσιοδότηση και λογαριασμό των ή όταν η κατάρτηση της σχετικής δικαιοπραξίας
        ματαιωθεί από υπαιτιότητα μου είμαι υποχρεωμένος τόσο εγώ όσο και εκείνος στο όνομα του οποίου θα γίνει το
        συμβόλαιο αγοράς ή μισθώσεως και ασχέτως αν τα ίδια ακίνητα μου τα υποδείξει αργότερα άλλος μεσίτης ή η
        σύμβαση καταρτηθεί υπό αναβλητική αίρεση, να σας καταβάλλουμε αλληλεγγύως και εις ολόκληρο έκαστος την
        ειδικώς συμφωνηθείσα αμοιβή σας που ανέρχεται στο ποσό των <strong>{printValue(values.payment)}</strong>{" "}
        ευρώ και επιπλέον το προβλεπόμενο Φ.Π.Α. όπως καθορίζεται από τους ισχύοντες νόμους.
      </p>
      <p className={styles.orderBody}>
        Την αμοιβή σας αυτή θεωρώ δίκαια, εύλογη και όχι υπερβολική, λόγω της αναπτυχθείσης δραστηριότητα σας για
        την επιτυχία του σκοπού μου και υποχρεούμαι να την καταβάλλω την ημέρα της υπογραφής του προσύμφωνου κατά
        το ήμιση και του οριστικού συμβολαίου εξ ολοκλήρου.
      </p>
      <table className={styles.signatureTable}>
        <tbody>
          <tr>
            <td colSpan={2} className={styles.signatureCity}>
              <strong>{printValue(values.signatureCity)}</strong> {printValue(displayDate)}
            </td>
          </tr>
          <tr>
            <td className={styles.signatureLabel}>Μετά τιμής, Ο Εντολέας</td>
            <td className={styles.signatureLabel}>Παρέλαβα Αντίγραφο της εντολής αυτής</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function OrderPage() {
  const t = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");

  const [values, setValues] = useState<FormValues>(EMPTY);
  const [properties, setProperties] = useState<PropertyRow[]>(() => [newPropertyRow()]);
  const [loading, setLoading] = useState(!!clientId);
  const [saving, setSaving] = useState(false);

  const printWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !clientId) return;

    async function loadData() {
      setLoading(true);
      try {
        const clientRes = await apiClient.get<ApiResponse<Client>>(`/api/clients/${clientId}`);
        const client = clientRes.data.data;

        // Scope the realtor lookup off the session's own realtorId for non-Root — never off the
        // fetched client's own realtorId field — per CLAUDE.md → "Data scoping by realtor". Root
        // has no realtorId of its own, so it falls back to this specific client's realtor.
        const isRoot = user!.role === "Root";
        const effectiveRealtorId = isRoot ? client.realtorId : user!.realtorId;

        const realtor = effectiveRealtorId
          ? await apiClient
              .get<ApiResponse<Realtor>>(`/api/realtors/${effectiveRealtorId}`)
              .then((r) => r.data.data)
              .catch(() => undefined)
          : undefined;

        setValues(buildValuesFromClient(client, realtor));
      } catch {
        // silent — form is still usable manually, same as Contract/ReceiptPage's own mount-time load
      } finally {
        setLoading(false);
      }
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, clientId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handlePropertyChange = (id: string, field: "address" | "price", value: string) => {
    setProperties((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleAddPropertyRow = () => setProperties((prev) => [...prev, newPropertyRow()]);
  const handleRemovePropertyRow = (id: string) =>
    setProperties((prev) => prev.filter((row) => row.id !== id));

  const handleSavePdf = async () => {
    if (!clientId || !printWrapperRef.current || saving) return;

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
      const file = new File([blob], `order-${clientId}-${Date.now()}.pdf`, { type: "application/pdf" });

      // Saved as a Client Attachment (see CLAUDE.md → "Files (Attachments)") — an Order has no
      // Transaction of its own to hang a dedicated file slot off, unlike Receipt/Contract, so it
      // reuses the existing generic entityType/entityId upload resource instead of a new one.
      const formData = new FormData();
      formData.append("entityType", "Client");
      formData.append("entityId", clientId);
      formData.append("files", file);
      await apiClient.post("/api/attachments", formData);

      MessageHandler.success(dispatch, t("order.saved"));
    } catch (err) {
      console.error("OrderPage: failed to save PDF", err);
      MessageHandler.error(dispatch, t("order.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={sharedStyles.docToolPage}>
      {/* Form — hidden when printing */}
      <div className={sharedStyles.docToolFormSection}>
        <div className={sharedStyles.docToolFormCard}>
          <div className={sharedStyles.docToolFormHeader}>
            <h1 className={sharedStyles.docToolFormTitle}>{t("order.pageTitle")}</h1>
            <p className={sharedStyles.docToolFormSubtitle}>{t("order.pageSubtitle")}</p>
          </div>

          {!clientId ? (
            <div className={sharedStyles.docToolSelectorSection}>
              <p className={sharedStyles.docToolFormSubtitle}>{t("order.noClient")}</p>
            </div>
          ) : loading ? (
            <div className={sharedStyles.docToolSelectorSection}>
              <p className={sharedStyles.docToolFormSubtitle}>{t("order.loading")}</p>
            </div>
          ) : null}

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("order.sections.general")}</p>
            <div className={styles.row3}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("order.form.date")}</label>
                <input type="date" name="date" value={values.date} onChange={handleChange} className={sharedStyles.input} />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("order.form.realtorNumber")}</label>
                <input
                  type="text"
                  name="realtorNumber"
                  value={values.realtorNumber}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("order.form.recipientRealtorName")}</label>
                <input
                  type="text"
                  name="recipientRealtorName"
                  value={values.recipientRealtorName}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
            </div>
            <div className={styles.row3}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("order.form.signatureCity")}</label>
                <input
                  type="text"
                  name="signatureCity"
                  value={values.signatureCity}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("order.sections.referral")}</p>
            <div className={sharedStyles.field}>
              <label className={sharedStyles.label}>{t("order.form.referral")}</label>
              <textarea name="referral" value={values.referral} onChange={handleChange} rows={2} className={sharedStyles.input} />
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("order.sections.client")}</p>
            <div className={styles.row3}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("order.form.gender")}</label>
                <select name="gender" value={values.gender} onChange={handleChange} className={sharedStyles.input}>
                  <option value="M">Άντρας</option>
                  <option value="F">Γυναίκα</option>
                </select>
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("order.form.fullName")}</label>
                <input type="text" name="fullName" value={values.fullName} onChange={handleChange} className={sharedStyles.input} />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("order.form.afm")}</label>
                <input type="text" name="afm" value={values.afm} onChange={handleChange} className={sharedStyles.input} />
              </div>
            </div>
            <div className={styles.row3}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("order.form.idNumber")}</label>
                <input type="text" name="idNumber" value={values.idNumber} onChange={handleChange} className={sharedStyles.input} />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("order.form.phone")}</label>
                <input type="text" name="phone" value={values.phone} onChange={handleChange} className={sharedStyles.input} />
              </div>
            </div>
            <div className={styles.row3}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("order.form.city")}</label>
                <input type="text" name="city" value={values.city} onChange={handleChange} className={sharedStyles.input} />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("order.form.address")}</label>
                <input type="text" name="address" value={values.address} onChange={handleChange} className={sharedStyles.input} />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("order.form.addressNumber")}</label>
                <input
                  type="text"
                  name="addressNumber"
                  value={values.addressNumber}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("order.properties.sectionTitle")}</p>
            <table className={styles.propertyTable}>
              <thead>
                <tr>
                  <th>{t("order.properties.headerNumber")}</th>
                  <th>{t("order.properties.headerAddress")}</th>
                  <th>{t("order.properties.headerValue")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {properties.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        className={sharedStyles.input}
                        placeholder={t("order.properties.placeholderAddress")}
                        value={row.address}
                        onChange={(e) => handlePropertyChange(row.id, "address", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={sharedStyles.input}
                        placeholder={t("order.properties.placeholderValue")}
                        value={row.price}
                        onChange={(e) => handlePropertyChange(row.id, "price", e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.removeRowBtn}
                        title={t("order.properties.removeRow")}
                        aria-label={t("order.properties.removeRow")}
                        onClick={() => handleRemovePropertyRow(row.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className={styles.addRowBtn} onClick={handleAddPropertyRow}>
              <Plus size={14} />
              {t("order.properties.addRow")}
            </button>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("order.sections.payment")}</p>
            <div className={sharedStyles.field}>
              <label className={sharedStyles.label}>{t("order.form.payment")}</label>
              <input
                type="text"
                name="payment"
                value={values.payment}
                onChange={handleChange}
                className={sharedStyles.input}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className={sharedStyles.docToolFormFooter}>
            <button type="button" className={sharedStyles.docToolPrintBtn} onClick={() => window.print()}>
              <Printer size={16} />
              {t("order.printButton")}
            </button>
            <button
              type="button"
              className={sharedStyles.docToolSavePdfBtn}
              onClick={handleSavePdf}
              disabled={!clientId || saving || loading}
            >
              <FileDown size={16} />
              {saving ? t("order.saving") : t("order.saveAsPdf")}
            </button>
          </div>
        </div>
      </div>

      {/* Print section — live preview on screen, sole content when printing */}
      <div className={sharedStyles.docToolPrintSection}>
        <p className={sharedStyles.docToolPreviewLabel}>{t("order.previewLabel")}</p>
        <div className={sharedStyles.docToolPrintWrapper} ref={printWrapperRef}>
          <OrderCopy values={values} properties={properties} />
        </div>
      </div>
    </div>
  );
}
