/* Catalogue de démonstration — remplace librement ces données par tes vrais produits. */
const PRODUCTS = [
  {
    id: 1,
    name: "Pull en laine mérinos",
    category: "Vêtements",
    price: 79.90,
    emoji: "🧶",
    color1: "#e8dcd0",
    color2: "#c9b8a8",
    description: "Un pull doux et intemporel en laine mérinos, parfait pour toutes les saisons. Coupe ample et col rond.",
    badge: "Best-seller"
  },
  {
    id: 2,
    name: "Chemise en lin",
    category: "Vêtements",
    price: 54.90,
    emoji: "👔",
    color1: "#f2ede3",
    color2: "#d8ccb8",
    description: "Chemise légère en lin respirant, idéale pour l'été. Coupe droite unisexe.",
    badge: null
  },
  {
    id: 3,
    name: "Manteau oversize",
    category: "Vêtements",
    price: 149.00,
    emoji: "🧥",
    color1: "#dcdcdc",
    color2: "#a8a8a8",
    description: "Manteau ample en laine mélangée, chaud et structuré, pour un look affirmé.",
    badge: "Nouveau"
  },
  {
    id: 4,
    name: "Sac cabas en cuir",
    category: "Accessoires",
    price: 129.00,
    emoji: "👜",
    color1: "#e0c9a6",
    color2: "#b98b4e",
    description: "Sac cabas en cuir pleine fleur, grand format, avec poches intérieures.",
    badge: "Best-seller"
  },
  {
    id: 5,
    name: "Ceinture en cuir",
    category: "Accessoires",
    price: 39.90,
    emoji: "🎗️",
    color1: "#e8ddca",
    color2: "#c2a878",
    description: "Ceinture fine en cuir véritable, boucle métal brossé.",
    badge: null
  },
  {
    id: 6,
    name: "Écharpe en cachemire",
    category: "Accessoires",
    price: 69.00,
    emoji: "🧣",
    color1: "#f0e4e6",
    color2: "#d9b8bd",
    description: "Écharpe extra-douce en cachemire, légère et chaude.",
    badge: "Nouveau"
  },
  {
    id: 7,
    name: "Sneakers minimalistes",
    category: "Chaussures",
    price: 99.00,
    emoji: "👟",
    color1: "#eef0ef",
    color2: "#c7cbc9",
    description: "Sneakers en cuir blanc, design épuré, semelle confort.",
    badge: "Best-seller"
  },
  {
    id: 8,
    name: "Bottines en cuir",
    category: "Chaussures",
    price: 139.00,
    emoji: "🥾",
    color1: "#e3d3c4",
    color2: "#8a6749",
    description: "Bottines robustes en cuir, doublure douce, semelle antidérapante.",
    badge: null
  },
  {
    id: 9,
    name: "Sandales en cuir",
    category: "Chaussures",
    price: 59.90,
    emoji: "🩴",
    color1: "#f1e6d6",
    color2: "#d4b483",
    description: "Sandales légères en cuir tressé, idéales pour l'été.",
    badge: null
  }
];

function formatPrice(value) {
  return value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function getProductById(id) {
  return PRODUCTS.find(p => p.id === Number(id));
}
