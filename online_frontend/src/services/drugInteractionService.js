// Simple rule-based drug interaction and allergy checking service

// Normalize a medicine name for matching
function normalizeName(name) {
  return (name || "").toLowerCase();
}

// Map a medicine to basic properties used for rules
function classifyMedicine(item) {
  const name = normalizeName(item.name || item.medicineName || "");
  const category = (item.category || "").toLowerCase();

  const tags = [];

  if (name.includes("ibuprofen")) {
    tags.push("nsaid");
  }

  if (name.includes("aspirin")) {
    tags.push("nsaid", "antiplatelet");
  }

  if (name.includes("paracetamol") || name.includes("acetaminophen")) {
    tags.push("paracetamol");
  }

  if (name.includes("amoxicillin")) {
    tags.push("penicillin-family", "antibiotic");
  }

  if (category.includes("allergy") || name.includes("cetirizine")) {
    tags.push("antihistamine");
  }

  if (name.includes("citrizine")) {
    tags.push("antihistamine");
  }

  if (name.includes("omeprazole")) {
    tags.push("ppi");
  }

  if (name.includes("alprazolam")) {
    tags.push("benzodiazepine");
  }

  return {
    id: item.id,
    name: item.name || item.medicineName || "Medicine",
    tags,
  };
}

// Normalize allergy strings for comparison
function normalizeAllergy(allergy) {
  return (allergy || "").toLowerCase();
}

// Derive a simple allergy list from user profile data, with safe fallbacks
export function extractUserAllergies(userDetails) {
  if (!userDetails) {
    return [];
  }

  if (Array.isArray(userDetails.allergies)) {
    return userDetails.allergies
      .map((a) => (typeof a === "string" ? a.trim() : ""))
      .filter(Boolean);
  }

  if (typeof userDetails.allergies === "string") {
    return userDetails.allergies
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
  }

  return [];
}

// Core analysis function
export function analyzeDrugSafety({ items, allergies = [] }) {
  const result = {
    interactions: [],
    allergyWarnings: [],
    hasSevereIssue: false,
  };

  if (!Array.isArray(items) || items.length === 0) {
    return result;
  }

  const classified = items.map(classifyMedicine);
  const normalizedAllergies = allergies.map(normalizeAllergy);

  const nsaidMeds = classified.filter((m) => m.tags.includes("nsaid"));
  const paracetamolMeds = classified.filter((m) => m.tags.includes("paracetamol"));

  if (nsaidMeds.length >= 1 && paracetamolMeds.length >= 1) {
    result.interactions.push({
      type: "interaction",
      severity: "moderate",
      code: "nsaid_paracetamol",
      message:
        "Paracetamol with NSAIDs like Ibuprofen should be taken only as per doctor recommendation.",
      medicines: [
        ...nsaidMeds.map((m) => m.name),
        ...paracetamolMeds.map((m) => m.name),
      ],
    });
  }

  if (nsaidMeds.length >= 2) {
    result.interactions.push({
      type: "interaction",
      severity: "severe",
      code: "multiple_nsaids",
      message:
        "Multiple NSAID medicines together can increase risk of stomach bleeding and other side effects.",
      medicines: nsaidMeds.map((m) => m.name),
    });
    result.hasSevereIssue = true;
  }

  const benzoMeds = classified.filter((m) => m.tags.includes("benzodiazepine"));
  if (benzoMeds.length >= 1 && classified.length > benzoMeds.length) {
    result.interactions.push({
      type: "interaction",
      severity: "moderate",
      code: "benzo_polypharmacy",
      message:
        "Alprazolam with other medicines may increase drowsiness or side effects. Use only under medical supervision.",
      medicines: classified.map((m) => m.name),
    });
  }

  const penAllergy = normalizedAllergies.find((a) => a.includes("penicillin"));
  const penFamilyMeds = classified.filter((m) => m.tags.includes("penicillin-family"));

  if (penAllergy && penFamilyMeds.length > 0) {
    result.allergyWarnings.push({
      type: "allergy",
      severity: "severe",
      code: "penicillin_allergy",
      message:
        "You have a recorded Penicillin allergy and this order contains a penicillin-family antibiotic (for example, Amoxicillin).",
      medicines: penFamilyMeds.map((m) => m.name),
    });
    result.hasSevereIssue = true;
  }

  const sampleAllergies = ["penicillin", "peanuts"]; // demo only
  if (!allergies || allergies.length === 0) {
    const demoAllergies = sampleAllergies;
    demoAllergies.forEach((a) => {
      if (!normalizedAllergies.includes(normalizeAllergy(a))) {
        normalizedAllergies.push(normalizeAllergy(a));
      }
    });
  }

  return result;
}
