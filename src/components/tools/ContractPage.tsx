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
  Property,
  Land,
  PropertyCategory,
  FloorLevel,
  LandCategory,
} from "@/lib/types";
import sharedStyles from "@/styles/shared.module.scss";
import styles from "./ContractPage.module.scss";

interface FormValues {
  areaGender: string;
  city: string;
  date: string;
  ownerGender: string;
  ownerFullname: string;
  ownerAfm: string;
  ownerCity: string;
  ownerAddress: string;
  ownerAddressNumber: string;
  renterGender: string;
  renterFullname: string;
  renterAfm: string;
  renterCity: string;
  renterAddress: string;
  renterAddressNumber: string;
  acceptanceOf: string;
  ownerOf: string;
  duration: string;
  dateStart: string;
  dateEnd: string;
  price: string;
  paragraph2Gender: string;
  receiverFullname: string;
  previousFullname: string;
  previousPrice: string;
  guaranteePrice: string;
  useFor: string;
  extra: string;
}

const EMPTY: FormValues = {
  areaGender: "Στην",
  city: "",
  date: "",
  ownerGender: "M",
  ownerFullname: "",
  ownerAfm: "",
  ownerCity: "",
  ownerAddress: "",
  ownerAddressNumber: "",
  renterGender: "M",
  renterFullname: "",
  renterAfm: "",
  renterCity: "",
  renterAddress: "",
  renterAddressNumber: "",
  acceptanceOf: "",
  ownerOf: "",
  duration: "",
  dateStart: "",
  dateEnd: "",
  price: "",
  paragraph2Gender: "στον",
  receiverFullname: "",
  previousFullname: "",
  previousPrice: "",
  guaranteePrice: "",
  useFor: "",
  extra: "",
};

// Pure so it can be reused both by the manual transaction <select> and by the
// transactionId/propertyId-driven auto-select below — see ReceiptPage's identical reasoning.
// The "owner" (landlord) is the listing's own client (Property/Land.clientId), never the
// transaction's clientId — that's the deal's counterparty (the tenant here), a different person.
function buildValuesFromTransaction(
  tx: Transaction,
  listing: Property | Land | undefined,
  ownerClient: Client | undefined,
  renterClient: Client | undefined
): FormValues {
  const dateStr = tx.date ? new Date(tx.date).toISOString().substring(0, 10) : "";
  const ownerGender = ownerClient?.gender === "Female" ? "F" : "M";
  const renterGender = renterClient?.gender === "Female" ? "F" : "M";
  const ownerFullname = ownerClient ? `${ownerClient.firstName} ${ownerClient.lastName}` : "";
  const renterFullname = renterClient ? `${renterClient.firstName} ${renterClient.lastName}` : "";

  return {
    ...EMPTY,
    city: listing?.city ?? "",
    date: dateStr,
    ownerGender,
    ownerFullname,
    ownerAfm: ownerClient?.tin ?? "",
    ownerCity: ownerClient?.city ?? "",
    ownerAddress: ownerClient?.address ?? "",
    renterGender,
    renterFullname,
    renterAfm: renterClient?.tin ?? "",
    renterCity: renterClient?.city ?? "",
    renterAddress: renterClient?.address ?? "",
    dateStart: dateStr,
    price: tx.price ? String(tx.price) : "",
    paragraph2Gender: ownerGender === "F" ? "στην" : "στον",
    receiverFullname: ownerFullname,
  };
}

function ContractCopy({ values }: { values: FormValues }) {
  const displayDate = values.date ? formatDate(values.date) : "";
  const displayDateStart = values.dateStart ? formatDate(values.dateStart) : "";
  const displayDateEnd = values.dateEnd ? formatDate(values.dateEnd) : "";
  const ownerNamedAs = values.ownerGender === "F" ? "ονομαζόμενη" : "ονομαζόμενος";
  const renterNamedAs = values.renterGender === "F" ? "ονομαζόμενη" : "ονομαζόμενος";
  const paragraph2Suffix = values.paragraph2Gender === "στην" ? "ην" : "ον";

  return (
    <div className={styles.contractCopy}>
      <h1 className={styles.contractTitle}>ΙΔΙΩΤΙΚΟ ΣΥΜΦΩΝΗΤΙΚΟ ΜΙΣΘΩΣΗΣ</h1>
      <p className={styles.contractIntro}>
        {values.areaGender} <strong>{printValue(values.city)}</strong> σήμερα στις{" "}
        <strong>{printValue(displayDate)}</strong> οι παρακάτω υπογράφοντες, πρώτον{" "}
        <strong>{printValue(values.ownerFullname)}</strong> Α.Φ.Μ. <strong>{printValue(values.ownerAfm)}</strong>{" "}
        κάτοικος <strong>{printValue(values.ownerCity)}</strong> οδός <strong>{printValue(values.ownerAddress)}</strong>{" "}
        αριθμός <strong>{printValue(values.ownerAddressNumber)}</strong> {ownerNamedAs} στο εξής «εκμισθωτή», και
        δεύτερον <strong>{printValue(values.renterFullname)}</strong> Α.Φ.Μ.{" "}
        <strong>{printValue(values.renterAfm)}</strong> κάτοικος <strong>{printValue(values.renterCity)}</strong>{" "}
        οδός <strong>{printValue(values.renterAddress)}</strong> αριθμός{" "}
        <strong>{printValue(values.renterAddressNumber)}</strong> {renterNamedAs} στο εξής «μισθωτής», συμφώνησαν και
        συναποδέχτηκαν τα εξής: <strong>{printValue(values.acceptanceOf)}</strong> εκμισθωτής που έχει στην απόλυτη,
        κυριότητα, εξουσία και κατοχή του <strong>{printValue(values.ownerOf)}</strong> νοικιάζει την ιδιοκτησία στο
        μισθωτή με τους παρακάτω όρους και συμφωνίες:
      </p>
      <ol className={styles.contractList}>
        <li>
          Διάρκεια της μίσθωσης ορίζεται <strong>{printValue(values.duration)}</strong> που αρχίζει από τις{" "}
          <strong>{printValue(displayDateStart)}</strong> και λήγει στις <strong>{printValue(displayDateEnd)}</strong>.
        </li>
        <li>
          Το ενοίκιο ορίζεται στο ποσό των <strong>{printValue(values.price)}</strong> ευρώ τον μήνα και καταβάλλεται
          την πρώτη μέρα κάθε ημερολογιακού μήνα. Ο μισθωτής θα καταβάλει το ενοίκιο στ{paragraph2Suffix}{" "}
          <strong>{printValue(values.receiverFullname)}</strong> και θα αποδεικνύεται δε με έγγραφη απόδειξη του
          εκμισθωτή ή του πληρεξουσίου του, αποκλειομένου κάθε άλλου αποδεικτικού μέσου ακόμα και αυτού του όρκου.
        </li>
        <li>
          Το όνομα του προηγούμενου μισθωτή ήταν <strong>{printValue(values.previousFullname)}</strong> και πλήρωνε
          το ενοίκιο το ποσό των <strong>{printValue(values.previousPrice)}</strong> ευρώ.
        </li>
        <li>
          Για την ακριβή εκπλήρωση όλων των όρων της παρούσας μίσθωσης, ο μισθωτής έδωσε σήμερα άτοκα στα χέρια του
          εκμισθωτή για εγγύηση το ποσό των <strong>{printValue(values.guaranteePrice)}</strong> ευρώ που θα
          ξαναπάρει πίσω μετά την εμπρόθεσμη αποχώρηση του από το μίσθιο, κατά τη λήξη της μίσθωσης και την ακριβή
          εκπλήρωση όλων των όρων του παρόντος συμφωνητικού, ρητά συμφωνημένου, ότι η εγγύηση αυτή σε καμιά περίπτωση
          δεν μπορεί να συμψηφιστεί προς τα ενοίκια.
        </li>
        <li>
          Το μίσθιο θα χρησιμοποιηθεί αποκλειστικά και μόνο για <strong>{printValue(values.useFor)}</strong>.
          Απαγορεύεται
          απόλυτα οποιαδήποτε μετατροπή της χρήσης του μισθίου, όπως και η συνολική ή μερική υπεκμίσθωση, ή με
          οποιονδήποτε τίτλο με ή χωρίς αντάλλαγμα παραχώρηση της χρήσης του μισθίου σε τρίτους, χωρίς τη σαφή
          έγγραφη συγκατάθεση του εκμισθωτή.
        </li>
        <li>
          Απαγορεύεται στον μισθωτή να κάνει οποιαδήποτε τροποποίηση ή μεταρρύθμιση στο μίσθιο χωρίς την έγγραφη
          συγκατάθεση του εκμισθωτή. Κάθε δε παράβαση που γίνεται ανεξάρτητα από τις συνέπειες που αυτή συνεπάγεται,
          παραμένει προς όφελος του μισθίου, χωρίς κανένα δικαίωμα αποζημίωσης του μισθωτή. Ο εκμισθωτής έχει
          δικαίωμα πάντως να αξιώσει την επαναφορά των πραγμάτων στην αρχική τους κατάσταση με έξοδα του μισθωτή.
        </li>
        <li>
          Ο μισθωτής είναι υποχρεωμένος να κάνει καλή χρήση του μισθίου, διαφορετικά ευθύνεται με αποζημίωση για
          φθορές και βλάβες που έγιναν στο μίσθιο από αυτόν ή το προσωπικό του, εκτός από αυτές που προέρχονται από
          τη συνηθισμένη χρήση· ακόμα έχει χρέος να διατηρεί το μίσθιο καθαρό και να το χρησιμοποιεί κατά τρόπο που
          να μην θίγει καθόλου την ησυχία, την υγεία, εργασία, ασφάλεια και τα χρηστά ήθη των άλλων ενοίκων της
          πολυκατοικίας.
        </li>
        <li>
          Ο μισθωτής είναι υποχρεωμένος να συμμορφώνεται απόλυτα με όλους τους όρους και τις διατάξεις του
          κανονισμού της πολυόροφου οικοδομής που βρίσκεται το μίσθιο και ο οποίος συντάχθηκε με συμβολαιογραφική
          πράξη. Ο μισθωτής έλαβε πλήρη γνώση αυτού, θεωρείται δε αναπόσπαστο μέρος του παρόντος και έχει συμφωνηθεί
          ρητά, ότι κάθε απαγόρευση του κανονισμού που αφορά τους ιδιοκτήτες αφορά και τους μισθωτές.
        </li>
        <li>
          Ο μισθωτής είναι υποχρεωμένος να καταβάλει τους δημόσιους και δημοτικούς φόρους και τέλη (καθαριότητας,
          φωτισμού κ.λ.π.) τους σχετικούς με το μίσθιο που βαρύνουν τους μισθωτές, όπως και την καταβολή του τέλους
          χαρτοσήμου της προκείμενης μίσθωσης. Η σύνδεση του ηλεκτρικού ρεύματος, του νερού και η κατανάλωση αυτών
          βαρύνει τον μισθωτή.
        </li>
        <li>
          Η σιωπηρή αναμίσθωση ή παράταση του χρόνου της μίσθωσης αποκλείεται απόλυτα και για κανένα λόγο δεν
          θεωρείται σαν τέτοια η παραμονή του μισθωτή στο μίσθιο, για οποιονδήποτε λόγο, μετά τη λήξη της μίσθωσης.
          Εξάλλου το τυχόν ενοίκιο που έχει εισπραχθεί κατά τον χρόνο αυτό από τον εκμισθωτή θα θεωρείται ως καταβολή
          σε αυτόν λόγω αποζημίωσής του για τη μη εμπρόθεσμη παράδοση του μισθίου και όχι ως ρητή ή σιωπηρή παράταση
          της μίσθωσης.
        </li>
        <li>
          Κατά τον ισχύοντα νόμο, αν ο μισθωτής επιθυμεί την παράταση του χρόνου της μίσθωσης το δηλώνει με έγγραφο
          βέβαιης χρονολογίας προς τον εκμισθωτή τουλάχιστον τέσσερις μήνες πριν λήξει η μίσθωση. Ο εκμισθωτής
          υποχρεούται να δηλώσει με έγγραφο βέβαιης χρονολογίας μέσα σε προθεσμία τριάντα (30) ημερών από τη λήψη
          της παραπάνω δήλωσης του μισθωτή, αν αποδέχεται ή αρνείται την παράταση της μίσθωσης. Αν ο μισθωτής δεν
          απευθύνει εμπρόθεσμα την παραπάνω δήλωση ή ο εκμισθωτής απαντήσει αρνητικά, η μίσθωση δεν παρατείνεται. Αν
          ο εκμισθωτής δεν απαντήσει εμπρόθεσμα, η μίσθωση παρατείνεται για ένα έτος. Η αποδοχή από τον εκμισθωτή της
          δήλωσης του μισθωτή για παράταση της μίσθωσης παρατείνει τη διάρκεια της μίσθωσης κατά συμφωνία των
          συμβαλλομένων, αλλά όχι για διάστημα μικρότερο του ενός έτους. Νέα παράταση της μίσθωσης είναι δυνατή μόνο
          σύμφωνα με τις διατάξεις αυτού του άρθρου.
        </li>
        <li>
          Κάθε διαφορά για την ερμηνεία και την εφαρμογή του παρόντος όπως και κάθε διένεξη που προκύπτει από τα
          ανωτέρω για τη μίσθωση αυτή υπάγεται στην αρμοδιότητα του Μονομελούς Πρωτοδικείου ή Ειρηνοδικείου. Οι
          διαφορές αυτές εκδικάζονται κατά τη διαδικασία των άρθρων 647 έως 662 του Κώδικα Πολιτικής Δικονομίας.
        </li>
        {values.extra && (
          <li>
            ΕΙΔΙΚΟΙ ΟΡΟΙ
            <br />
            {values.extra}
          </li>
        )}
      </ol>
      <p className={styles.contractClosing}>
        Το παρόν συντάχτηκε σε δύο αντίτυπα, διαβάστηκε και εγκρίθηκε και από τους δύο συμβαλλόμενους, υπογράφτηκε
        από αυτούς και έλαβε ο καθένας από ένα όμοιο αντίτυπο.
      </p>
      <table className={styles.signatureTable}>
        <tbody>
          <tr>
            <td colSpan={2} className={styles.signatureHeader}>
              ΟΙ ΣΥΜΒΑΛΛΟΜΕΝΟΙ
            </td>
          </tr>
          <tr>
            <td className={styles.signatureLabel}>Ο ΕΚΜΙΣΘΩΤΗΣ</td>
            <td className={styles.signatureLabel}>Ο ΜΙΣΘΩΤΗΣ</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function ContractPage() {
  const t = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId");
  // Arrived from TransactionTable's "Generate Contract" action (shown only while that transaction
  // has no contract yet) — preselects that exact transaction directly, no fuzzy match needed since
  // it's already known. Takes priority over propertyId when both are somehow present — same
  // precedence ReceiptPage uses.
  const transactionId = searchParams.get("transactionId");

  const [values, setValues] = useState<FormValues>(EMPTY);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [propertyListings, setPropertyListings] = useState<Property[]>([]);
  const [landListings, setLandListings] = useState<Land[]>([]);
  const [propertyCategories, setPropertyCategories] = useState<PropertyCategory[]>([]);
  const [floorLevels, setFloorLevels] = useState<FloorLevel[]>([]);
  const [landCategories, setLandCategories] = useState<LandCategory[]>([]);
  const [selectedTxId, setSelectedTxId] = useState("");
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
        // Dropdown/manual-select only offers transactions without a contract yet — one already has
        // one, edit or remove it from the Transactions table instead of regenerating here. The raw
        // txList (below) is still used for the transactionId/propertyId auto-select, so a direct
        // link from TransactionTable still resolves correctly.
        const availableTxList = txList.filter((tx) => !tx.contractUrl);
        const clientList: Client[] = clientRes.data.data ?? [];
        const propertyList: Property[] = propertiesRes.data.data ?? [];
        const landList: Land[] = landsRes.data.data ?? [];
        setTransactions(availableTxList);
        setClients(clientList);
        setPropertyListings(propertyList);
        setLandListings(landList);
        setPropertyCategories(propertyCategoriesRes.data.data ?? []);
        setFloorLevels(floorLevelsRes.data.data ?? []);
        setLandCategories(landCategoriesRes.data.data ?? []);

        const resolveListing = (tx: Transaction) =>
          tx.listingType === "Property"
            ? propertyList.find((p) => p.id === tx.listingId)
            : landList.find((l) => l.id === tx.listingId);

        const preselect = (match: Transaction) => {
          const listing = resolveListing(match);
          const ownerClient = listing?.clientId ? clientList.find((c) => c.id === listing.clientId) : undefined;
          const renterClient = clientList.find((c) => c.id === match.clientId);
          setSelectedTxId(match.id);
          setValues(buildValuesFromTransaction(match, listing, ownerClient, renterClient));
        };

        if (transactionId) {
          const match = txList.find((tx) => tx.id === transactionId);
          if (match) {
            preselect(match);
          } else {
            MessageHandler.warning(dispatch, t("contract.noMatchingTransaction"));
          }
        } else if (propertyId) {
          // Same "most recent transaction for this listing" fuzzy match as ReceiptPage — see its
          // own comment for why this is sorted client-side rather than trusting list order.
          const propertyTxs = availableTxList.filter(
            (tx) => tx.listingType === "Property" && tx.listingId === propertyId
          );
          const match = propertyTxs.reduce<Transaction | undefined>(
            (latest, tx) => (!latest || new Date(tx.date) > new Date(latest.date) ? tx : latest),
            undefined
          );
          if (match) {
            preselect(match);
          } else {
            MessageHandler.warning(dispatch, t("contract.noMatchingTransaction"));
          }
        }
      } catch {
        // silent — form is still usable manually
      } finally {
        setTxLoading(false);
      }
    }

    loadData();
    // propertyId/transactionId/dispatch/t are stable for the lifetime of this mount-time load —
    // only user presence should re-trigger it, same as ReceiptPage.
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
      return;
    }
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    const listing =
      tx.listingType === "Property"
        ? propertyListings.find((p) => p.id === tx.listingId)
        : landListings.find((l) => l.id === tx.listingId);
    const ownerClient = listing?.clientId ? clients.find((c) => c.id === listing.clientId) : undefined;
    const renterClient = clients.find((c) => c.id === tx.clientId);
    setValues(buildValuesFromTransaction(tx, listing, ownerClient, renterClient));
  };

  const handleSavePdf = async () => {
    if (!selectedTxId || !printWrapperRef.current || saving) return;

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
      const file = new File([blob], `contract-${selectedTxId}.pdf`, { type: "application/pdf" });

      // Saved onto the selected transaction's own contract slot — same "belongs to a specific
      // transaction" reasoning as ReceiptPage's save.
      const formData = new FormData();
      formData.append("file", file);
      await apiClient.post(`/api/transactions/${selectedTxId}/files/contract`, formData);

      MessageHandler.success(dispatch, t("contract.saved"));
    } catch (err) {
      console.error("ContractPage: failed to save PDF", err);
      MessageHandler.error(dispatch, t("contract.saveError"));
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
            <h1 className={sharedStyles.docToolFormTitle}>{t("contract.pageTitle")}</h1>
            <p className={sharedStyles.docToolFormSubtitle}>{t("contract.pageSubtitle")}</p>
          </div>

          {/* Transaction selector */}
          <div className={sharedStyles.docToolSelectorSection}>
            <div className={sharedStyles.field}>
              <label className={sharedStyles.label}>{t("contract.transactionSelect")}</label>
              <SearchableSelect
                value={selectedTxId}
                onChange={handleTransactionSelect}
                options={transactionOptions}
                placeholder={txLoading ? t("contract.loading") : t("contract.transactionSelectPlaceholder")}
                disabled={txLoading}
              />
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("contract.sections.general")}</p>
            <div className={styles.row3}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>&nbsp;</label>
                <select name="areaGender" value={values.areaGender} onChange={handleChange} className={sharedStyles.input}>
                  <option value="Στην">Στην</option>
                  <option value="Στο">Στο</option>
                </select>
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.city")}</label>
                <input type="text" name="city" value={values.city} onChange={handleChange} className={sharedStyles.input} />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.date")}</label>
                <input type="date" name="date" value={values.date} onChange={handleChange} className={sharedStyles.input} />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("contract.sections.owner")}</p>
            <div className={styles.row3}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.gender")}</label>
                <select name="ownerGender" value={values.ownerGender} onChange={handleChange} className={sharedStyles.input}>
                  <option value="M">Άντρας</option>
                  <option value="F">Γυναίκα</option>
                </select>
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.fullname")}</label>
                <input
                  type="text"
                  name="ownerFullname"
                  value={values.ownerFullname}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.afm")}</label>
                <input
                  type="text"
                  name="ownerAfm"
                  value={values.ownerAfm}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
            </div>
            <div className={styles.row3}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.cityOfResidence")}</label>
                <input
                  type="text"
                  name="ownerCity"
                  value={values.ownerCity}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.address")}</label>
                <input
                  type="text"
                  name="ownerAddress"
                  value={values.ownerAddress}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.addressNumber")}</label>
                <input
                  type="text"
                  name="ownerAddressNumber"
                  value={values.ownerAddressNumber}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("contract.sections.renter")}</p>
            <div className={styles.row3}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.gender")}</label>
                <select name="renterGender" value={values.renterGender} onChange={handleChange} className={sharedStyles.input}>
                  <option value="M">Άντρας</option>
                  <option value="F">Γυναίκα</option>
                </select>
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.fullname")}</label>
                <input
                  type="text"
                  name="renterFullname"
                  value={values.renterFullname}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.afm")}</label>
                <input
                  type="text"
                  name="renterAfm"
                  value={values.renterAfm}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
            </div>
            <div className={styles.row3}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.cityOfResidence")}</label>
                <input
                  type="text"
                  name="renterCity"
                  value={values.renterCity}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.address")}</label>
                <input
                  type="text"
                  name="renterAddress"
                  value={values.renterAddress}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.addressNumber")}</label>
                <input
                  type="text"
                  name="renterAddressNumber"
                  value={values.renterAddressNumber}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("contract.sections.agreement")}</p>
            <div className={styles.row2}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.acceptanceOf")}</label>
                <input
                  type="text"
                  name="acceptanceOf"
                  value={values.acceptanceOf}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.ownerOf")}</label>
                <input
                  type="text"
                  name="ownerOf"
                  value={values.ownerOf}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("contract.sections.paragraph1")}</p>
            <div className={styles.row3}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.duration")}</label>
                <input
                  type="text"
                  name="duration"
                  value={values.duration}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.dateStart")}</label>
                <input
                  type="date"
                  name="dateStart"
                  value={values.dateStart}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.dateEnd")}</label>
                <input
                  type="date"
                  name="dateEnd"
                  value={values.dateEnd}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("contract.sections.paragraph2")}</p>
            <div className={styles.row3}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.price")}</label>
                <input
                  type="text"
                  name="price"
                  value={values.price}
                  onChange={handleChange}
                  className={sharedStyles.input}
                  placeholder="0.00"
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>&nbsp;</label>
                <select
                  name="paragraph2Gender"
                  value={values.paragraph2Gender}
                  onChange={handleChange}
                  className={sharedStyles.input}
                >
                  <option value="στον">στον</option>
                  <option value="στην">στην</option>
                </select>
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.receiverFullname")}</label>
                <input
                  type="text"
                  name="receiverFullname"
                  value={values.receiverFullname}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("contract.sections.paragraph3")}</p>
            <div className={styles.row2}>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.previousFullname")}</label>
                <input
                  type="text"
                  name="previousFullname"
                  value={values.previousFullname}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
              <div className={sharedStyles.field}>
                <label className={sharedStyles.label}>{t("contract.form.previousPrice")}</label>
                <input
                  type="text"
                  name="previousPrice"
                  value={values.previousPrice}
                  onChange={handleChange}
                  className={sharedStyles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("contract.sections.paragraph4")}</p>
            <div className={sharedStyles.field}>
              <label className={sharedStyles.label}>{t("contract.form.guaranteePrice")}</label>
              <input
                type="text"
                name="guaranteePrice"
                value={values.guaranteePrice}
                onChange={handleChange}
                className={sharedStyles.input}
              />
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("contract.sections.paragraph5")}</p>
            <div className={sharedStyles.field}>
              <label className={sharedStyles.label}>{t("contract.form.useFor")}</label>
              <input
                type="text"
                name="useFor"
                value={values.useFor}
                onChange={handleChange}
                className={sharedStyles.input}
              />
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionHeading}>{t("contract.sections.extra")}</p>
            <div className={sharedStyles.field}>
              <label className={sharedStyles.label}>{t("contract.form.extra")}</label>
              <textarea
                name="extra"
                value={values.extra}
                onChange={handleChange}
                rows={4}
                className={sharedStyles.input}
              />
            </div>
          </div>

          <div className={sharedStyles.docToolFormFooter}>
            <button type="button" className={sharedStyles.docToolPrintBtn} onClick={() => window.print()}>
              <Printer size={16} />
              {t("contract.printButton")}
            </button>
            <button
              type="button"
              className={sharedStyles.docToolSavePdfBtn}
              onClick={handleSavePdf}
              disabled={!selectedTxId || saving}
            >
              <FileDown size={16} />
              {saving ? t("contract.saving") : t("contract.saveAsPdf")}
            </button>
          </div>
        </div>
      </div>

      {/* Print section — live preview on screen, sole content when printing */}
      <div className={sharedStyles.docToolPrintSection}>
        <p className={sharedStyles.docToolPreviewLabel}>{t("contract.previewLabel")}</p>
        <div className={sharedStyles.docToolPrintWrapper} ref={printWrapperRef}>
          <ContractCopy values={values} />
        </div>
      </div>
    </div>
  );
}
