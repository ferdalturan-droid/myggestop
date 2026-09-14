// RUNDE 6 (§G7): "Ordrestatus" er foldet ind i "Ordrer" (OrdersTable.tsx) -
// /admin/ordrestatus redirecter dertil, og intet importerer længere denne
// fil. Bevidst efterladt som en tom, type-sikker stub (kan ikke slettes
// fra outputs-mappen) i stedet for at referere fjernede felter
// (productionStartedAt, RUNDE 8 §2).
export default function OrdrestatusList() {
  return null;
}
