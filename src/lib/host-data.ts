import { getMyKyc, getPropertyBookings, listMyProperties, type HostProperty, type KycStatus, type PropertyBooking } from "./api";

export type HostBooking = PropertyBooking & { propertyId: string; propertyTitle: string };

export interface HostOverview {
  properties: HostProperty[];
  bookings: HostBooking[];
  kycStatus: KycStatus;
}

/** Une réservation attend-elle une action de l'hôte ? */
export function needsHostAction(booking: PropertyBooking) {
  if (booking.status === "NEGOTIATING") {
    // La dernière offre vient du voyageur : c'est à l'hôte de répondre.
    return booking.offers[0]?.proposedByUserId === booking.travelerId;
  }
  return booking.status === "CONFIRMED_ESCROW" && !booking.hostConfirmedAt;
}

/** Logements, réservations reçues (tous logements confondus) et statut KYC. */
export async function loadHostOverview(): Promise<HostOverview> {
  const [properties, kyc] = await Promise.all([listMyProperties(), getMyKyc()]);
  const lists = await Promise.all(
    properties.map((property) =>
      getPropertyBookings(property.id).then((bookings) =>
        bookings.map((booking): HostBooking => ({ ...booking, propertyId: property.id, propertyTitle: property.title })),
      ),
    ),
  );
  const bookings = lists.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { properties, bookings, kycStatus: kyc.kycStatus };
}
