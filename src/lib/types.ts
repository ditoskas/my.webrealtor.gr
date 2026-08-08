import type { Locale } from "./i18n/locales";

// Auth

export type UserRole = "Root" | "Administrator" | "Operator";
export const USER_ROLES: UserRole[] = ["Root", "Administrator", "Operator"];

export interface User {
  id: string;
  email: string;
  role: UserRole;
  realtorId: string | null;
  // Self-service editable on the Profile page (POST /api/auth/display-name) — shown instead of
  // `email` in the Topbar and the post-login welcome message whenever it's non-empty, via
  // lib/displayName.ts's getDisplayName(). Empty string means "not set".
  displayName: string;
  // The user's own display-language preference, persisted server-side so it follows the account
  // across devices/browsers — distinct from store/localeSlice's localStorage-only guess, which is
  // only ever what a *browser* last had, not what the *account* has. Self-service editable on the
  // Profile page (POST /api/auth/language) — see CLAUDE.md → Profile.
  language: Locale;
  createdAt: string;
  updatedAt: string;
}

// password is only ever sent up (create/update), never returned by the API.
export interface UserInput {
  email: string;
  password?: string;
  role: UserRole;
  realtorId: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  message?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  realtorId: string | null;
  tokenVersion: number;
}

// Realtors

export interface Realtor {
  id: string;
  userId?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  mobile: string;
  email: string;
  city: string;
  address: string;
  postcode: string;
  googleMapsUrl: string;
  website: string;
  // Commission rates as a fraction of price (e.g. 0.1 = 10%) — see models/Realtor.ts. Drive
  // TransactionForm's price/commission auto-fill (see CLAUDE.md → "Realtor commission rates").
  saleCommission: number | null;
  rentCommission: number | null;
  createdAt: string;
  updatedAt: string;
  // Computed by RealtorService.list(), not stored on the document — present on list responses,
  // absent right after create/update (those don't recompute them). See CLAUDE.md → Realtor management.
  clientCount?: number;
  propertyCount?: number;
  landCount?: number;
}

export type RealtorInput = Omit<
  Realtor,
  "id" | "userId" | "createdAt" | "updatedAt" | "clientCount" | "propertyCount" | "landCount"
>;

// Clients

export type Gender = "Male" | "Female";
export const GENDERS: Gender[] = ["Male", "Female"];

export interface Client {
  id: string;
  realtorId: string;
  gender?: Gender | null;
  firstName: string;
  lastName: string;
  tin?: string;
  city?: string;
  address?: string;
  zipcode?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientInput = Omit<Client, "id" | "createdAt" | "updatedAt">;

// Properties

export type PropertyStatus = "active" | "pending" | "inactive";
export type TransactionType = "sale" | "rent";
export const TRANSACTION_TYPES: TransactionType[] = ["sale", "rent"];

// A listing photo — shared by Property.images and Land.images. `id` is assigned at upload time
// (see POST /api/uploads), not a Mongo _id, so it stays stable through reordering/edits.
export interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  description: string;
}

// Every *Id field below is a reference to one of the Settings pool entities documented in
// CLAUDE.md → "Property attribute pool entities" (or to EnergyClass/HeatingSystem, the first two).
// This shape was derived directly from auditing a real competing portal's property-edit form field
// by field — see CLAUDE.md → Property management for the full provenance note.
export interface Property {
  id: string;
  realtorId: string;
  clientId?: string | null;

  // Internal-only label — the source form has no such field (portals auto-title from
  // subtype+area+neighborhood), but the admin table needs *something* to display per row, and
  // letting an admin override it is cheap. Never required.
  title?: string;
  status: PropertyStatus;

  // Basic info
  transactionType: TransactionType;
  currency: string;
  propertyCategoryId?: string | null;
  isAuction: boolean;
  price: number;
  priceNegotiable: boolean;
  commonExpenses?: number | null;
  area: number;
  lotSize?: number | null;
  availableFrom?: string | null;
  isLeased: boolean;
  publishedAt?: string | null;

  // Property description (physical layout)
  floorLevelId?: string | null;
  isWholeFloorApartment: boolean;
  levels?: number | null;
  bedrooms?: number | null;
  kitchens?: number | null;
  bathrooms?: number | null;
  wc?: number | null;
  livingRooms?: number | null;
  hasStorage: boolean;
  storageArea?: number | null;
  hasAttic: boolean;
  hasPlayroom: boolean;

  // Heating & consumption
  energyClassId?: string | null;
  heatingSystemId?: string | null;
  heatingMediumId?: string | null;
  hasAC: boolean;
  hasSolarHeater: boolean;
  hasUnderfloorHeating: boolean;
  hasNightPower: boolean;

  // Construction
  yearBuilt?: number | null;
  isUnderConstruction: boolean;
  isUnfinished: boolean;
  buildingFloorsId?: string | null;
  hasElevator: boolean;
  hasInternalStairs: boolean;
  isNeoclassic: boolean;
  renovationYear?: number | null;
  isRenovated: boolean;
  requiresRenovation: boolean;
  isPreserved: boolean;
  netArea?: number | null;
  grossArea?: number | null;

  // Technical features & interior
  hasSecurityDoor: boolean;
  hasAlarm: boolean;
  isPainted: boolean;
  isFurnished: boolean;
  joineryTypeId?: string | null;
  glassTypeId?: string | null;
  hasPestNet: boolean;
  hasFireplace: boolean;
  isBright: boolean;
  isAiry: boolean;
  isLuxury: boolean;
  hasEvCharger: boolean;
  hasMannedReception: boolean;
  floorTypeId?: string | null;
  hasSatelliteDish: boolean;

  // Outdoor spaces & location on plot
  hasBalcony: boolean;
  hasAwning: boolean;
  balconyArea?: number | null;
  hasBuiltInBBQ: boolean;
  hasGarden: boolean;
  gardenTypeId?: string | null;
  hasPool: boolean;
  hasView: boolean;
  orientationId?: string | null;
  isCorner: boolean;
  isFacade: boolean;
  zoningTypeId?: string | null;
  isAccessibleForDisabled: boolean;
  isCaveBuilding: boolean;
  roadAccessTypeId?: string | null;
  distanceFromSea?: number | null;
  hasParking: boolean;

  // Suitable for
  suitableForStudents: boolean;
  suitableForHoliday: boolean;
  suitableForCommercialUse: boolean;
  suitableForShortTermLetting: boolean;
  suitableForMedicalOffice: boolean;
  suitableForInvestment: boolean;

  // Description — per-locale map (only "el" is exposed in the UI so far, see PropertyDetail).
  descriptions: Record<string, string>;

  // Location — not present in the source HTML (only the "Χαρακτηριστικά" tab was audited); this
  // shape follows the location fields already used on Realtor (city/address/postcode/googleMapsUrl).
  country?: string;
  region?: string;
  municipality?: string;
  neighborhood?: string;
  city?: string;
  address?: string;
  postcode?: string;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string;

  // Media
  images: PropertyImage[];

  createdAt: string;
  updatedAt: string;
}

export type PropertyInput = Omit<Property, "id" | "createdAt" | "updatedAt">;

// Land — a distinct entity from Property (not an extension of it), for plot/land listings. Field
// shape derived from auditing a real competing portal's land-listing edit form (the "Γη" property
// type), same provenance method as Property. Reuses PropertyStatus/TransactionType (same enums,
// no reason to duplicate) and several existing pool entities (Orientation, ZoningType,
// RoadAccessType) alongside two new ones built specifically for Land: LandCategory, Slope.
export interface Land {
  id: string;
  realtorId: string;
  clientId?: string | null;

  title?: string;
  status: PropertyStatus;

  // Basic info
  transactionType: TransactionType;
  currency: string;
  landCategoryId?: string | null;
  isAuction: boolean;
  price: number;
  priceNegotiable: boolean;
  area: number;
  isBuildable: boolean;
  availableFrom?: string | null;

  // Outdoor spaces & location on plot
  hasView: boolean;
  isWithinSettlement: boolean;
  orientationId?: string | null;
  isCorner: boolean;
  isFacade: boolean;
  zoningTypeId?: string | null;
  facadeLength?: number | null;
  distanceFromSea?: number | null;
  slopeId?: string | null;
  suitableForInvestment: boolean;
  suitableForAgriculturalUse: boolean;
  roadAccessTypeId?: string | null;
  coverageRatio?: number | null;
  buildingCoefficient?: number | null;
  isAntiparoxi: boolean;
  isWithinCityPlan: boolean;

  // Description — per-locale map, same convention as Property.
  descriptions: Record<string, string>;

  // Location — same field set as Property's Location tab.
  country?: string;
  region?: string;
  municipality?: string;
  neighborhood?: string;
  city?: string;
  address?: string;
  postcode?: string;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string;

  // Media
  images: PropertyImage[];

  createdAt: string;
  updatedAt: string;
}

export type LandInput = Omit<Land, "id" | "createdAt" | "updatedAt">;

// Energy classes (Settings lookup list)

export interface EnergyClass {
  id: string;
  name: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EnergyClassInput = Pick<EnergyClass, "name">;

// Heating systems (Settings lookup list)

export interface HeatingSystem {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type HeatingSystemInput = Pick<HeatingSystem, "name" | "slug">;

// Property categories (Settings lookup list)

export interface PropertyCategory {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PropertyCategoryInput = Pick<PropertyCategory, "name" | "slug">;

// Floor levels (Settings lookup list)

export interface FloorLevel {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FloorLevelInput = Pick<FloorLevel, "name" | "slug">;

// Building floors (Settings lookup list)

export interface BuildingFloors {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BuildingFloorsInput = Pick<BuildingFloors, "name" | "slug">;

// Heating mediums (Settings lookup list)

export interface HeatingMedium {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type HeatingMediumInput = Pick<HeatingMedium, "name" | "slug">;

// Joinery types (Settings lookup list)

export interface JoineryType {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type JoineryTypeInput = Pick<JoineryType, "name" | "slug">;

// Glass types (Settings lookup list)

export interface GlassType {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GlassTypeInput = Pick<GlassType, "name" | "slug">;

// Floor types (Settings lookup list)

export interface FloorType {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FloorTypeInput = Pick<FloorType, "name" | "slug">;

// Garden types (Settings lookup list)

export interface GardenType {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GardenTypeInput = Pick<GardenType, "name" | "slug">;

// Zoning types (Settings lookup list)

export interface ZoningType {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ZoningTypeInput = Pick<ZoningType, "name" | "slug">;

// Orientations (Settings lookup list)

export interface Orientation {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OrientationInput = Pick<Orientation, "name" | "slug">;

// Road access types (Settings lookup list)

export interface RoadAccessType {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RoadAccessTypeInput = Pick<RoadAccessType, "name" | "slug">;

// Land categories (Settings lookup list)

export interface LandCategory {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LandCategoryInput = Pick<LandCategory, "name" | "slug">;

// Slopes (Settings lookup list)

export interface Slope {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SlopeInput = Pick<Slope, "name" | "slug">;

// Log entries

export type LogType = "Information" | "Warning" | "Error";
export const LOG_TYPES: LogType[] = ["Information", "Warning", "Error"];

export interface LogEntry {
  id: string;
  category: string;
  logType: LogType;
  userId: string | null;
  realtorId: string | null;
  message: string;
  dataFrom?: Record<string, unknown> | null;
  dataTo?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// Price history — one entry per price the listing has ever had, see CLAUDE.md → "Price History"

export type PriceHistoryListingType = "Property" | "Land";
export const PRICE_HISTORY_LISTING_TYPES: PriceHistoryListingType[] = ["Property", "Land"];

export interface PriceHistoryEntry {
  id: string;
  listingId: string;
  listingType: PriceHistoryListingType;
  price: number;
  currency: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Shared by both Notes and Attachments (Files) — every entity either can be attached to. Kept as
// one canonical type rather than two near-duplicates; NoteEntityType is a compatible alias so the
// (many) existing Notes call sites didn't need renaming when Attachments introduced this name.
export type AttachableEntityType = "Realtor" | "Client" | "Property" | "Land";
export const ATTACHABLE_ENTITY_TYPES: AttachableEntityType[] = ["Realtor", "Client", "Property", "Land"];

// Interest For — a Client's stated interest in buying/renting a Property or Land, surfaced as the
// first tab of EntityDetailTabs on the Client View Page only (unlike Notes/Attachments this is
// Client-scoped, not polymorphic across all four entities, so it's a plain clientId FK rather
// than an entityType/entityId pair). categoryId points at a PropertyCategory or LandCategory
// record depending on listingType — same "no ref, resolved client-side" convention as Note.entityId.

export type InterestForListingType = "Property" | "Land";
export const INTEREST_FOR_LISTING_TYPES: InterestForListingType[] = ["Property", "Land"];

export interface InterestFor {
  id: string;
  clientId: string;
  date: string;
  transactionType: TransactionType;
  listingType: InterestForListingType;
  categoryId: string;
  price: number;
  city?: string;
  area?: number | null;
  remarks?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InterestForInput = Omit<InterestFor, "id" | "createdAt" | "updatedAt">;

// Viewings — a record of a Client viewing a specific Property or Land listing, surfaced as the
// third Client-only tab of EntityDetailTabs (after Owns and Interest For). Reuses InterestFor's
// `InterestForListingType`/`INTEREST_FOR_LISTING_TYPES` Property-or-Land discriminator rather than
// declaring a near-duplicate type — same reasoning as Land reusing Property's TransactionType.

export interface Viewing {
  id: string;
  clientId: string;
  date: string;
  listingType: InterestForListingType;
  listingId: string;
  comment?: string;
  // A single Attachment (see "Attachments (Files)" below), uploaded through the existing Files
  // flow (entityType="Client") and linked here by id — many Viewings may reference the same
  // Attachment (e.g. one signed document covering several viewings), so this is a plain optional
  // reference, not an owned upload.
  signatureDocumentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ViewingInput = Omit<Viewing, "id" | "createdAt" | "updatedAt">;

// Transactions — a completed deal (rent or buy) tying a Realtor's Client to one of that Realtor's
// own Property/Land listings, surfaced as its own top-level nav item/page (not Client-scoped like
// Owns/Interest For/Viewings — a transaction is a first-class record in its own right, with its
// own realtorId for the mandatory realtor-scoping convention, see CLAUDE.md → "Data scoping by
// realtor"). Reuses InterestFor's Property-or-Land discriminator, same reasoning as Viewing.

export type TransactionAction = "rent" | "buy";
export const TRANSACTION_ACTIONS: TransactionAction[] = ["rent", "buy"];

export interface Transaction {
  id: string;
  realtorId: string;
  clientId: string;
  date: string;
  listingType: InterestForListingType;
  listingId: string;
  action: TransactionAction;
  price: number;
  commission: number;
  tax: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionInput = Omit<Transaction, "id" | "createdAt" | "updatedAt">;

// Notes — polymorphic, attachable to a Realtor, Client, Property, or Land. One shared collection
// discriminated by entityType, same "generic audit-style collection" shape as LogEntry/PriceHistory.

export type NoteEntityType = AttachableEntityType;
export const NOTE_ENTITY_TYPES: NoteEntityType[] = ATTACHABLE_ENTITY_TYPES;

export type NoteImportance = "Low" | "Normal" | "High";
export const NOTE_IMPORTANCE_LEVELS: NoteImportance[] = ["Low", "Normal", "High"];

export interface Note {
  id: string;
  entityType: NoteEntityType;
  entityId: string;
  title: string;
  text: string;
  importance: NoteImportance;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NoteInput = Pick<Note, "entityType" | "entityId" | "title" | "text" | "importance">;

// Attachments (Files) — polymorphic like Notes, but backed by an actual uploaded file on disk
// rather than free text. See CLAUDE.md → "Files (Attachments)".
export interface Attachment {
  id: string;
  entityType: AttachableEntityType;
  entityId: string;
  title: string;
  description: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AttachmentInput = Pick<Attachment, "title" | "description">;

// Footer notifications

export type MessageStyle = "normal" | "success" | "error" | "warning" | "info";

export interface FooterMessage {
  text: string;
  style: MessageStyle;
}

export interface FooterState {
  message: FooterMessage | null;
}

// API

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
