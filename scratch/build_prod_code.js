const fs = require('fs');

const componentCode = `_1=({prefillItemId:s,onClearPrefill:t,onSuccess:r})=>{
  const {items:a, movements:c, addMovementsBatch:u, staffName:d, adminSettings:f} = Vt();
  const m = B.useMemo(() => new Date().toISOString().split("T")[0], []);
  const [g, _] = B.useState(m);
  // Point 3: all input boxes blank by default
  const [x, b] = B.useState("");
  const [A, L] = B.useState("");
  const [w, E] = B.useState(() => {
    if (s && a.some(item => item.id === s)) return s;
    const lastProd = c && c.find(m => m.type === "production_in" && !m.is_residual);
    if (lastProd && a.some(item => item.id === lastProd.item_id)) return lastProd.item_id;
    return "";
  });
  const [j, k] = B.useState("Standard");
  const [ne, Y] = B.useState("");
  const [ae, fe] = B.useState([]);
  const [stagedBatches, setStagedBatches] = B.useState([]);
  const [editingBatchId, setEditingBatchId] = B.useState(null);
  const [xe, Ie] = B.useState(!1);
  const [Be, M] = B.useState("");
  const [ee, le] = B.useState("All");
  const [he, Pe] = B.useState("main");
  const [oe, G] = B.useState(null);
  const [showAuditModal, setShowAuditModal] = B.useState(!1);
  const [viewBatchDetail, setViewBatchDetail] = B.useState(null);
  const [ue, P] = B.useState(!1);
  const [y, O] = B.useState(null);
  const [showColorDropdown, setShowColorDropdown] = B.useState(!1);

  const z = B.useMemo(() => hg(a, c), [a, c]);

  const N = B.useMemo(() => a.find(K => K.id === w) || null, [a, w]);
  const S = B.useMemo(() => N ? lt(N) : null, [N]);

  // Helper to determine exact recipe ID for any item
  const getItemRecipeId = B.useCallback((item) => {
    if (!item) return "";
    if (item.recipe_id) return item.recipe_id;
    const meta = lt(item);
    if (meta && meta.recipeId) return meta.recipeId;
    const nameLow = ((item.name || "") + " " + (item.category || "")).toLowerCase();
    if (nameLow.includes("culvert")) return "culverts_heavy";
    if (nameLow.includes("kerb") || nameLow.includes("curb")) return nameLow.includes("press") ? "press_heavy_14_10" : "curbstones_vibro";
    if (nameLow.includes("mifuniko") || nameLow.includes("cover")) return "mifuniko_vibro";
    if (nameLow.includes("pole") || nameLow.includes("nguzo") || nameLow.includes("bicon")) return "poles_bicon";
    if (nameLow.includes("wall")) return "wall_tiles_vibro";
    if (nameLow.includes("paving")) return nameLow.includes("press") ? "press_heavy_14_10" : "paving_vibro";
    if (nameLow.includes("tofali") || nameLow.includes("hollow") || nameLow.includes("matofali")) {
      return (nameLow.includes("chip") || nameLow.includes("dust") || nameLow.includes('8"')) ? "press_chip_40_14" : "press_sand_54";
    }
    return "floor_tiles_vibro";
  }, []);

  // Filter residuals: ONLY products sharing the exact same recipe & materials with main product
  const isCompatibleResidual = B.useCallback((item, mainProd) => {
    if (!mainProd || !item) return false;
    if (item.id === mainProd.id) return false;
    const mainRecId = getItemRecipeId(mainProd);
    const itemRecId = getItemRecipeId(item);
    if (mainRecId && itemRecId && mainRecId === itemRecId) return true;
    if (mainProd.category && item.category && mainProd.category.toLowerCase() === item.category.toLowerCase()) return true;
    return false;
  }, [getItemRecipeId]);

  const T = B.useMemo(() => {
    let source = a;
    if (he === "residual" && N) {
      source = a.filter(item => isCompatibleResidual(item, N));
    }
    const K = new Set(source.map(item => item.category));
    return ["All", ...Array.from(K)];
  }, [a, he, N, isCompatibleResidual]);

  // Point 2: Detect whether product has colors enabled in product settings
  // If user turns off all colors for certain products, colors should not be seen in this area.
  // If user turns on some colors in product settings, the same colors should be seen.
  const validColors = B.useMemo(() => {
    if (!N || !N.colors || !Array.isArray(N.colors)) return [];
    return N.colors.filter(col => col && typeof col === "string" && col.trim() && col.trim().toLowerCase() !== "standard" && col.trim().toLowerCase() !== "none");
  }, [N]);

  const hasColors = validColors.length > 0;
  const availableColors = validColors;

  B.useEffect(() => {
    if (hasColors && availableColors.length > 0) {
      if (!availableColors.includes(j) || j === "Standard") {
        k(availableColors[0]);
      }
    } else {
      k("Standard");
    }
  }, [N, hasColors, availableColors, j]);

  B.useEffect(() => {
    if (s && a.some(K => K.id === s)) {
      E(s);
      if (t) t();
    }
  }, [s, a, t]);

  // Secondary products must inherit the exact same batch mix color
  B.useEffect(() => {
    const batchColor = hasColors && j && j !== "Standard" ? j : null;
    fe(prev => prev.map(r => ({ ...r, color: batchColor })));
  }, [j, hasColors]);

  // Prune incompatible residuals if main product changes
  B.useEffect(() => {
    if (N) {
      fe(prev => prev.filter(item => {
        const prod = a.find(it => it.id === item.itemId);
        return prod && isCompatibleResidual(prod, N);
      }));
    } else {
      fe([]);
    }
  }, [w, N, a, isCompatibleResidual]);

  // Point 1: Inspect ratios and molds doc carefully at each product material.
  // Culverts, kerbstones, mifuniko, poles, press blocks do NOT use dawa (chemicalLiters: 0).
  // Floor tiles, wall tiles, and vibro paving DO use dawa (chemicalLiters: 1).
  const D = B.useMemo(() => {
    if (!N) return null;
    const nameLow = ((N.name || "") + " " + (N.category || "")).toLowerCase();
    
    if (nameLow.includes("culvert")) {
      return {
        sandBuckets: 6,
        chippingBuckets: 2,
        aggregateBuckets: 7,
        chemicalLiters: 0,
        pigmentPerBag: { White: 0 }
      };
    }
    if (nameLow.includes("kerb") || nameLow.includes("curb")) {
      if (nameLow.includes("press")) {
        return {
          sandBuckets: 14,
          chippingBuckets: 10,
          aggregateBuckets: 0,
          chemicalLiters: 0,
          pigmentPerBag: { White: 0 }
        };
      }
      return {
        sandBuckets: 6,
        chippingBuckets: 2,
        aggregateBuckets: 7,
        chemicalLiters: 0,
        pigmentPerBag: { White: 0 }
      };
    }
    if (nameLow.includes("mifuniko") || nameLow.includes("cover")) {
      return {
        sandBuckets: 5,
        chippingBuckets: 6,
        aggregateBuckets: 0,
        chemicalLiters: 0,
        pigmentPerBag: { White: 0 }
      };
    }
    if (nameLow.includes("nguzo") || nameLow.includes("pole") || nameLow.includes("bicon")) {
      return {
        sandBuckets: 6,
        chippingBuckets: 2,
        aggregateBuckets: 7,
        chemicalLiters: 0,
        pigmentPerBag: { White: 0 }
      };
    }
    if (nameLow.includes("tofali") || (nameLow.includes("press") && !nameLow.includes("paving") && !nameLow.includes("kerb"))) {
      if (nameLow.includes("chip") || nameLow.includes("tundu")) {
        return {
          sandBuckets: 40,
          chippingBuckets: 14,
          aggregateBuckets: 0,
          chemicalLiters: 0,
          pigmentPerBag: { White: 0 }
        };
      }
      return {
        sandBuckets: 54,
        chippingBuckets: 0,
        aggregateBuckets: 0,
        chemicalLiters: 0,
        pigmentPerBag: { White: 0 }
      };
    }
    if (nameLow.includes("paving")) {
      if (nameLow.includes("press")) {
        return {
          sandBuckets: 14,
          chippingBuckets: 10,
          aggregateBuckets: 0,
          chemicalLiters: 0,
          pigmentPerBag: { White: 0, Red: 4, Grey: 1, Black: 2 }
        };
      }
      return {
        sandBuckets: 7,
        chippingBuckets: 11,
        aggregateBuckets: 0,
        chemicalLiters: 1,
        pigmentPerBag: { White: 0, Red: 4, Grey: 1, Black: 2 }
      };
    }
    if (nameLow.includes("wall")) {
      return {
        sandBuckets: 5,
        chippingBuckets: 6,
        aggregateBuckets: 0,
        chemicalLiters: 1,
        pigmentPerBag: { White: 0, Red: 4, Grey: 1, Black: 2 }
      };
    }
    const K = (N == null ? void 0 : N.recipe_id) || (S == null ? void 0 : S.recipeId) || "floor_tiles_vibro";
    return ns[K] || ns.floor_tiles_vibro;
  }, [N, S]);

  const F = parseFloat(x) || 0;
  const P_num = parseInt(A, 10) || 0;

  // Point 1: Pigment calculation for recipe & baseline
  // White products do NOT have color pigments (0 kg).
  // Red has 4 kg, Grey has 1 kg, Black has 2 kg.
  const pigmentKgPerBag = B.useMemo(() => {
    if (!hasColors || !j || j === "Standard" || j.toLowerCase() === "white") {
      return 0;
    }
    if (D && D.pigmentPerBag && D.pigmentPerBag[j] !== undefined) {
      return D.pigmentPerBag[j];
    }
    const jLow = j.toLowerCase();
    if (jLow === "red") return 4;
    if (jLow === "grey" || jLow === "gray") return 1;
    if (jLow === "black") return 2;
    if (jLow === "maroon" || jLow === "yellow") return 4;
    return 0;
  }, [hasColors, D, j]);

  // Point 1: Dynamic single-line baseline recipe reflecting colors and exact ingredients
  const recipeDescription = B.useMemo(() => {
    if (!N || !D) return "Select a product to view recipe baseline";
    const parts = ["1 Bag Cem"];
    if (D.sandBuckets > 0) parts.push(D.sandBuckets + " Sand");
    if (D.chippingBuckets > 0) parts.push(D.chippingBuckets + " Chip");
    if (D.aggregateBuckets > 0) parts.push(D.aggregateBuckets + " Kokoto");
    if (D.chemicalLiters > 0) parts.push(D.chemicalLiters + "L Dawa");
    if (pigmentKgPerBag > 0) parts.push(pigmentKgPerBag + "kg " + j + " Rangi");
    return "Baseline: " + parts.join(" : ");
  }, [N, D, pigmentKgPerBag, j]);

  const wastani = B.useMemo(() => {
    if (!N) return 0;
    return (N == null ? void 0 : N.wastani_per_bag) || (S == null ? void 0 : S.wastaniPcsPerBag) || 37;
  }, [N, S]);

  const pcsPerSqm = B.useMemo(() => {
    if (!N) return null;
    return (N == null ? void 0 : N.pcs_per_sqm) || (S == null ? void 0 : S.pcsPerSqm) || null;
  }, [N, S]);

  const isTilesOrPavings = B.useMemo(() => {
    if (!N) return false;
    if (N.unit === "sqm") return true;
    const s = ((N.category || "") + " " + (N.name || "")).toLowerCase();
    return s.includes("tile") || s.includes("paving") || s.includes("paver") || s.includes("slab");
  }, [N]);

  const actualSqm = B.useMemo(() => {
    if (!isTilesOrPavings) return 0;
    if (pcsPerSqm && pcsPerSqm > 0 && P_num > 0) {
      return Number((P_num / pcsPerSqm).toFixed(2));
    }
    return 0;
  }, [isTilesOrPavings, pcsPerSqm, P_num]);

  const scaledMaterials = B.useMemo(() => {
    if (!D || F <= 0) {
      return { sandBuckets: 0, chippingBuckets: 0, aggregateBuckets: 0, chemicalLiters: 0, pigmentKg: 0 };
    }
    return {
      sandBuckets: Number((F * (D.sandBuckets || 0)).toFixed(1)),
      chippingBuckets: Number((F * (D.chippingBuckets || 0)).toFixed(1)),
      aggregateBuckets: Number((F * (D.aggregateBuckets || 0)).toFixed(1)),
      chemicalLiters: Number((F * (D.chemicalLiters || 0)).toFixed(2)),
      pigmentKg: Number((F * pigmentKgPerBag).toFixed(1))
    };
  }, [D, F, pigmentKgPerBag]);

  // Point 1: Auto-hide unused materials. Single-line active materials only.
  const activeMaterials = B.useMemo(() => {
    const list = [
      {
        key: "cement",
        label: "Cement",
        value: F,
        unit: "BAGS",
        isPill: !0,
        color: "#f8fafc"
      }
    ];
    if (D && D.sandBuckets > 0) {
      list.push({
        key: "sand",
        label: "Sand",
        value: scaledMaterials.sandBuckets,
        unit: "BKT",
        color: "#f8fafc"
      });
    }
    if (D && D.chippingBuckets > 0) {
      list.push({
        key: "chipping",
        label: "Chipping",
        value: scaledMaterials.chippingBuckets,
        unit: "BKT",
        color: "#f8fafc"
      });
    }
    if (D && D.aggregateBuckets > 0) {
      list.push({
        key: "aggregate",
        label: "Kokoto",
        value: scaledMaterials.aggregateBuckets,
        unit: "BKT",
        color: "#f8fafc"
      });
    }
    if (D && D.chemicalLiters > 0) {
      list.push({
        key: "chemical",
        label: "Dawa",
        value: scaledMaterials.chemicalLiters,
        unit: "L",
        color: "#38bdf8"
      });
    }
    if (pigmentKgPerBag > 0) {
      list.push({
        key: "pigment",
        label: j + " Rangi",
        value: scaledMaterials.pigmentKg,
        unit: "KG",
        color: j.toLowerCase() === "red" ? "#f87171" : j.toLowerCase() === "black" ? "#94a3b8" : "#fb923c"
      });
    }
    return list;
  }, [D, F, scaledMaterials, pigmentKgPerBag, j]);

  const expectedTargetPcs = B.useMemo(() => {
    if (!N || F <= 0) return 0;
    return Math.round(F * wastani);
  }, [N, F, wastani]);

  const actualAveragePcsPerBag = B.useMemo(() => {
    if (F <= 0) return "0.0";
    return (P_num / F).toFixed(1);
  }, [F, P_num]);

  // Point 3: Steel reinforcement calculation (single line representation)
  const steelSpec = B.useMemo(() => {
    if (!N) return null;
    const nameLower = (N.name || "").toLowerCase();
    const catLower = (N.category || "").toLowerCase();
    
    if (nameLower.includes("400") || (catLower.includes("culvert") && (nameLower.includes("40") || nameLower.includes("400")))) {
      const isN = nameLower.includes("n");
      const steelType = isN ? "10mm (N)" : "6mm (R)";
      return {
        title: "Culvert 400",
        steelType: steelType,
        cmPerPiece: 1276,
        unitLabel: "culverts",
        isRollerTracked: !1
      };
    }
    if (nameLower.includes("600") || (catLower.includes("culvert") && (nameLower.includes("60") || nameLower.includes("600")))) {
      const isN = nameLower.includes("n");
      const steelType = isN ? "10mm (N)" : "6mm (R)";
      return {
        title: "Culvert 600",
        steelType: steelType,
        cmPerPiece: 1548,
        unitLabel: "culverts",
        isRollerTracked: !1
      };
    }
    if (nameLower.includes("900") || (catLower.includes("culvert") && (nameLower.includes("90") || nameLower.includes("900")))) {
      const isN = nameLower.includes("n");
      const steelType = isN ? "10mm (N)" : "6mm (R)";
      return {
        title: "Culvert 900",
        steelType: steelType,
        cmPerPiece: 1908,
        unitLabel: "culverts",
        isRollerTracked: !1
      };
    }
    if (nameLower.includes("nguzo") || catLower.includes("pole")) {
      return {
        title: "Nguzo / Post",
        steelType: "6mm (R)",
        cmPerPiece: 1620,
        unitLabel: "posts",
        isRollerTracked: !0
      };
    }
    if (nameLower.includes("bicon")) {
      return {
        title: "Bicon",
        steelType: "6mm (R)",
        cmPerPiece: 240,
        unitLabel: "bicons",
        isRollerTracked: !1
      };
    }
    return null;
  }, [N]);

  const steelDemand = B.useMemo(() => {
    if (!steelSpec) return null;
    const targetPieces = P_num > 0 ? P_num : (expectedTargetPcs > 0 ? expectedTargetPcs : (wastani > 0 ? Math.round(wastani) : 1));
    const totalCm = targetPieces * steelSpec.cmPerPiece;
    const totalM = Number((totalCm / 100).toFixed(2));
    const rollers = steelSpec.isRollerTracked ? Number((targetPieces / 25).toFixed(1)) : null;
    return {
      ...steelSpec,
      targetPieces,
      totalCm,
      totalM,
      rollers
    };
  }, [steelSpec, P_num, expectedTargetPcs, wastani]);

  const theoreticalCementMain = B.useMemo(() => {
    if (!N || wastani <= 0) return 0;
    return P_num / wastani;
  }, [N, wastani, P_num]);

  const theoreticalCementResiduals = B.useMemo(() => {
    return ae.reduce((acc, r) => {
      const rItem = a.find(it => it.id === r.itemId);
      const rMeta = rItem ? lt(rItem) : null;
      const rWastani = (rItem && rItem.wastani_per_bag) || (rMeta && rMeta.wastaniPcsPerBag) || 50;
      return acc + (rWastani > 0 ? (r.quantity_pcs || 0) / rWastani : 0);
    }, 0);
  }, [ae, a]);

  const totalTheoreticalCement = B.useMemo(() => {
    return Number((theoreticalCementMain + theoreticalCementResiduals).toFixed(2));
  }, [theoreticalCementMain, theoreticalCementResiduals]);

  const totalResidualPcs = B.useMemo(() => {
    return ae.reduce((acc, r) => acc + (r.quantity_pcs || 0), 0);
  }, [ae]);

  const yieldMetrics = B.useMemo(() => {
    if (F <= 0 && P_num <= 0 && totalResidualPcs <= 0) {
      return {
        yieldFactorPct: 0,
        badgeClass: "badge-neutral",
        badgeColor: "#94a3b8",
        statusKey: "unspecified",
        badgeTitle: "Yield Factor: 0%",
        badgeMessage: "Enter cement bags and actual physical count to calibrate batch yield factor."
      };
    }
    const factor = F > 0 ? Number(((totalTheoreticalCement / F) * 100).toFixed(1)) : 100.0;
    if (factor >= 95.0 && factor <= 105.0) {
      return {
        yieldFactorPct: factor,
        badgeClass: "badge-success",
        badgeColor: "#10b981",
        statusKey: "optimal",
        badgeTitle: "Optimal Blend (" + factor + "%)",
        badgeMessage: "Batch density within standard calibrated tolerance (95% - 105%). Compaction is standard."
      };
    } else if (factor < 95.0) {
      return {
        yieldFactorPct: factor,
        badgeClass: "badge-danger",
        badgeColor: "#ef4444",
        statusKey: "lean_warning",
        badgeTitle: "Yield Deficit Alert (" + factor + "%)",
        badgeMessage: "Yield factor is below 95% (-" + (100 - factor).toFixed(1) + "% deficit). Cement logged (" + F + " bags) exceeds theoretical (" + totalTheoreticalCement + " bags)."
      };
    } else {
      return {
        yieldFactorPct: factor,
        badgeClass: "badge-danger",
        badgeColor: "#ef4444",
        statusKey: "rich_notice",
        badgeTitle: "High Yield Alert (" + factor + "%)",
        badgeMessage: "Yield factor exceeds 105% (+" + (factor - 100).toFixed(1) + "% anomaly). Unusually high piece count per bag. Verify concrete compaction and mix strength!"
      };
    }
  }, [F, P_num, totalResidualPcs, totalTheoreticalCement]);

  const we = B.useMemo(() => {
    let source = z;
    if (he === "residual" && N) {
      source = z.filter(K => isCompatibleResidual(K, N));
    }
    return source.filter(K => {
      const be = ee === "All" || K.category === ee;
      const Ae = K.name.toLowerCase().includes(Be.toLowerCase()) || K.category.toLowerCase().includes(Be.toLowerCase());
      return be && Ae;
    });
  }, [z, he, N, ee, Be, isCompatibleResidual]);

  const openProductModal = (target, residualId) => {
    if (target === "residual" && !N) {
      alert("Please select a primary product first.");
      return;
    }
    Pe(target);
    G(residualId || null);
    M("");
    le("All");
    Ie(!0);
  };

  const handleSelectProduct = (product) => {
    if (he === "main") {
      E(product.id);
      const pColors = product.colors && Array.isArray(product.colors) ? product.colors.filter(c => c && c.trim() && c.toLowerCase() !== "standard") : [];
      k(pColors.length > 0 ? pColors[0] : "Standard");
    } else if (he === "residual" && oe) {
      const rMeta = lt(product);
      const rWastani = product.wastani_per_bag || (rMeta == null ? void 0 : rMeta.wastaniPcsPerBag) || 50;
      const batchColor = hasColors && j && j !== "Standard" ? j : null;
      fe(prev => prev.map(item => item.id === oe ? {
        ...item,
        itemId: product.id,
        color: batchColor,
        wastaniPerBag: rWastani
      } : item));
    }
    Ie(!1);
    G(null);
  };

  const handleAddResidual = () => {
    if (!N) {
      alert("Please select a primary product first.");
      return;
    }
    const compatibleList = a.filter(item => isCompatibleResidual(item, N));
    if (compatibleList.length === 0) {
      alert("No other products found that share the same recipe and materials with " + N.name + ".");
      return;
    }
    const fallbackItem = compatibleList[0];
    const rMeta = fallbackItem ? lt(fallbackItem) : null;
    const rWastani = (fallbackItem == null ? void 0 : fallbackItem.wastani_per_bag) || (rMeta == null ? void 0 : rMeta.wastaniPcsPerBag) || 50;
    const batchColor = hasColors && j && j !== "Standard" ? j : null;
    const newRes = {
      id: "residual-" + Date.now() + "-" + Math.random().toString(36).slice(2, 5),
      itemId: fallbackItem.id,
      color: batchColor,
      quantity_pcs: "",
      wastaniPerBag: rWastani
    };
    fe(prev => [...prev, newRes]);
  };

  const handleRemoveResidual = (id) => {
    fe(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateResidualQty = (id, qty) => {
    fe(prev => prev.map(r => r.id === id ? { ...r, quantity_pcs: qty } : r));
  };

  const handleUpdateResidualColor = (id, col) => {
    fe(prev => prev.map(r => r.id === id ? { ...r, color: col } : r));
  };

  const handleAddBatchToDaily = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!N) {
      alert("Please select a primary product first.");
      return;
    }
    if (F <= 0) {
      alert("Please enter the number of cement bags loaded.");
      return;
    }
    if (P_num <= 0 && totalResidualPcs <= 0) {
      alert("Please enter the actual physical pieces counted.");
      return;
    }

    const mainSqmVal = (isTilesOrPavings && pcsPerSqm && pcsPerSqm > 0)
      ? Number((P_num / pcsPerSqm).toFixed(2))
      : null;

    const formattedResiduals = ae.map(r => {
      const rItem = a.find(it => it.id === r.itemId) || null;
      const rMeta = rItem ? lt(rItem) : null;
      const rPcsPerSqm = (rItem && rItem.pcs_per_sqm) || (rMeta && rMeta.pcsPerSqm) || null;
      const rQty = parseInt(r.quantity_pcs, 10) || 0;
      return {
        id: r.id,
        itemId: r.itemId,
        productName: (rItem && rItem.name) || "Secondary Item",
        category: (rItem && rItem.category) || "",
        unit: (rItem && rItem.unit) || "pcs",
        color: r.color,
        quantity_pcs: rQty,
        quantity_sqm: (rItem && rItem.unit === "sqm" && rPcsPerSqm && rPcsPerSqm > 0)
          ? Number((rQty / rPcsPerSqm).toFixed(2))
          : null,
        wastani: (rItem && rItem.wastani_per_bag) || (rMeta && rMeta.wastaniPcsPerBag) || 50
      };
    });

    const newBatch = {
      id: editingBatchId || "batch-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      batchNumber: editingBatchId
        ? (stagedBatches.find(b => b.id === editingBatchId)?.batchNumber || (stagedBatches.length + 1))
        : (stagedBatches.length + 1),
      date: g,
      productId: N.id,
      productName: N.name,
      category: N.category,
      unit: N.unit,
      pcsPerSqm: pcsPerSqm,
      color: hasColors && j !== "Standard" ? j : null,
      mainPieces: P_num,
      mainSqm: mainSqmVal,
      cementBags: F,
      materialsUsed: {
        cement_bags: F,
        sand_buckets: scaledMaterials.sandBuckets,
        chipping_buckets: scaledMaterials.chippingBuckets,
        aggregate_buckets: scaledMaterials.aggregateBuckets,
        chemical_liters: scaledMaterials.chemicalLiters,
        pigment_kg: scaledMaterials.pigmentKg
      },
      residuals: formattedResiduals,
      averagePcsPerBag: F > 0 ? Number((P_num / F).toFixed(1)) : 0,
      expectedWastani: wastani,
      theoreticalCement: totalTheoreticalCement,
      yieldFactorPct: yieldMetrics.yieldFactorPct,
      qcStatus: yieldMetrics.statusKey,
      qcTitle: yieldMetrics.badgeTitle,
      qcBadgeClass: yieldMetrics.badgeClass,
      qcBadgeColor: yieldMetrics.badgeColor,
      steelSpec: steelDemand ? { title: steelDemand.title, totalCm: steelDemand.totalCm, totalM: steelDemand.totalM } : null,
      note: ne.trim()
    };

    if (editingBatchId) {
      setStagedBatches(prev => prev.map(b => b.id === editingBatchId ? newBatch : b));
      setEditingBatchId(null);
    } else {
      setStagedBatches(prev => [...prev, newBatch]);
    }

    // Reset inputs to blank
    b("");
    L("");
    fe([]);
    Y("");
  };

  const handleEditStagedBatch = (batch) => {
    setEditingBatchId(batch.id);
    E(batch.productId);
    k(batch.color || "Standard");
    b(batch.cementBags ? batch.cementBags.toString() : "");
    L(batch.mainPieces ? batch.mainPieces.toString() : "");
    fe(batch.residuals.map(r => ({
      id: r.id,
      itemId: r.itemId,
      color: r.color,
      quantity_pcs: r.quantity_pcs !== undefined && r.quantity_pcs !== null ? r.quantity_pcs.toString() : "",
      wastaniPerBag: r.wastani
    })));
    Y(batch.note || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteStagedBatch = (id) => {
    setStagedBatches(prev => prev.filter(b => b.id !== id));
    if (editingBatchId === id) {
      setEditingBatchId(null);
    }
  };

  const handleResetForm = () => {
    setEditingBatchId(null);
    b("");
    L("");
    fe([]);
    Y("");
  };

  const totalStagedOutput = B.useMemo(() => {
    const mainPcs = stagedBatches.reduce((acc, b) => acc + b.mainPieces, 0);
    const residualPcs = stagedBatches.reduce((acc, b) => acc + b.residuals.reduce((rAcc, r) => rAcc + r.quantity_pcs, 0), 0);
    const mainSqm = stagedBatches.reduce((acc, b) => acc + (b.mainSqm || 0), 0);
    const totalCement = stagedBatches.reduce((acc, b) => acc + b.cementBags, 0);
    return {
      mainPcs,
      residualPcs,
      totalPcs: mainPcs + residualPcs,
      mainSqm: Number(mainSqm.toFixed(2)),
      totalCement: Number(totalCement.toFixed(2))
    };
  }, [stagedBatches]);

  const aggregateMaterialsUsed = B.useMemo(() => {
    return stagedBatches.reduce((acc, b) => {
      acc.cement += b.cementBags || 0;
      acc.sand += (b.materialsUsed && b.materialsUsed.sand_buckets) || 0;
      acc.chipping += (b.materialsUsed && b.materialsUsed.chipping_buckets) || 0;
      acc.aggregate += (b.materialsUsed && b.materialsUsed.aggregate_buckets) || 0;
      acc.chemical += (b.materialsUsed && b.materialsUsed.chemical_liters) || 0;
      return acc;
    }, { cement: 0, sand: 0, chipping: 0, aggregate: 0, chemical: 0 });
  }, [stagedBatches]);

  const expectedInventoryAdditions = B.useMemo(() => {
    const map = {};
    for (const b of stagedBatches) {
      const keyMain = b.productId + "___" + (b.color || "Standard");
      if (!map[keyMain]) {
        map[keyMain] = {
          name: b.productName,
          category: b.category,
          color: b.color,
          unit: b.unit,
          pieces: 0,
          sqm: 0
        };
      }
      map[keyMain].pieces += b.mainPieces;
      if (b.mainSqm) map[keyMain].sqm += b.mainSqm;

      for (const r of b.residuals) {
        const keyRes = r.itemId + "___" + (r.color || "Standard");
        if (!map[keyRes]) {
          map[keyRes] = {
            name: r.productName,
            category: r.category,
            color: r.color,
            unit: r.unit,
            pieces: 0,
            sqm: 0
          };
        }
        map[keyRes].pieces += r.quantity_pcs;
        if (r.quantity_sqm) map[keyRes].sqm += r.quantity_sqm;
      }
    }
    return Object.values(map);
  }, [stagedBatches]);

  const handleConfirmSaveAllBatches = async () => {
    if (stagedBatches.length === 0) return;
    P(!0);

    const movementsToInsert = [];
    for (const b of stagedBatches) {
      const batchId = crypto.randomUUID ? crypto.randomUUID() : "batch-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
      
      if (b.mainPieces > 0) {
        movementsToInsert.push({
          item_id: b.productId,
          type: "production_in",
          color: b.color,
          quantity_pcs: b.mainPieces,
          quantity_sqm: b.mainSqm,
          delta: (b.unit === "sqm" && b.mainSqm !== null) ? b.mainSqm : b.mainPieces,
          date: b.date,
          note: b.note ? ("Batch #" + b.batchNumber + ": " + b.note) : ("Batch #" + b.batchNumber + " daily production run"),
          materials_used: b.materialsUsed,
          qc_status: b.qcStatus,
          expected_cement_bags: b.theoreticalCement,
          actual_cement_bags: b.cementBags,
          computed_materials_deducted: b.materialsUsed,
          batch_id: batchId,
          is_residual: !1,
          yield_factor_pct: b.yieldFactorPct
        });
      }

      for (const r of b.residuals) {
        if (r.quantity_pcs > 0) {
          movementsToInsert.push({
            item_id: r.itemId,
            type: "production_in",
            color: r.color,
            quantity_pcs: r.quantity_pcs,
            quantity_sqm: r.quantity_sqm,
            delta: (r.unit === "sqm" && r.quantity_sqm !== null) ? r.quantity_sqm : r.quantity_pcs,
            date: b.date,
            note: "Residual mold from Batch #" + b.batchNumber + " (" + b.productName + ")",
            materials_used: null,
            qc_status: b.qcStatus,
            expected_cement_bags: null,
            actual_cement_bags: null,
            computed_materials_deducted: null,
            batch_id: batchId,
            is_residual: !0,
            yield_factor_pct: b.yieldFactorPct
          });
        }
      }
    }

    try {
      const res = await u(movementsToInsert);
      P(!1);
      setShowAuditModal(!1);
      if (res) {
        try {
          Ga({ particleCount: 90, spread: 85, origin: { y: 0.6 }, colors: ["#f97316", "#10b981", "#38bdf8", "#fb923c", "#eab308"] });
        } catch(err) {}
        O({
          totalBatches: stagedBatches.length,
          totalPcs: totalStagedOutput.totalPcs,
          mainPcs: totalStagedOutput.mainPcs,
          residualPcs: totalStagedOutput.residualPcs,
          totalCement: totalStagedOutput.totalCement
        });
        setStagedBatches([]);
        handleResetForm();
      }
    } catch(err) {
      P(!1);
      alert("Error committing batches to ledger: " + (err.message || err));
    }
  };

  return o.jsxs("div", {
    style: { display: "flex", flexDirection: "column", gap: "16px", maxWidth: "900px", margin: "0 auto", width: "100%" },
    children: [
      o.jsxs("div", {
        style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" },
        children: [
          o.jsxs("div", {
            children: [
              o.jsxs("div", {
                style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
                children: [
                  o.jsx("h1", {
                    style: { fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, letterSpacing: "-0.02em", color: "#f8fafc", margin: 0 },
                    children: "Batch Production Logging"
                  }),
                  o.jsx("span", {
                    className: "badge",
                    style: { background: "rgba(249, 115, 22, 0.15)", border: "1px solid rgba(249, 115, 22, 0.35)", color: "var(--brand-400)", fontSize: "11px", fontWeight: 700, padding: "3px 8px" },
                    children: "Adaptive Recipe Engine"
                  })
                ]
              }),
              o.jsx("p", {
                style: { fontSize: "12.5px", color: "var(--text-muted)", marginTop: "3px" },
                children: "Dynamic proportional recipe scaling & multi-output residual calibration"
              })
            ]
          }),
          o.jsxs("div", {
            style: { display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-surface-elevated)", padding: "6px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" },
            children: [
              o.jsx(ni, { size: 15, color: "var(--brand-400)" }),
              o.jsx("input", {
                type: "date",
                value: g,
                onChange: K => _(K.target.value),
                style: { background: "transparent", border: "none", color: "#f8fafc", fontFamily: "var(--font-mono)", fontSize: "13.5px", fontWeight: 600, outline: "none", cursor: "pointer" }
              })
            ]
          })
        ]
      }),

      y && o.jsxs("div", {
        className: "card",
        style: { background: "linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(15, 23, 42, 0.95))", borderColor: "rgba(16, 185, 129, 0.5)", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 8px 24px rgba(16, 185, 129, 0.2)" },
        children: [
          o.jsxs("div", {
            style: { display: "flex", alignItems: "center", gap: "12px" },
            children: [
              o.jsx(pn, { size: 28, color: "#10b981" }),
              o.jsxs("div", {
                children: [
                  o.jsxs("div", { style: { fontWeight: 800, fontSize: "15px", color: "#34d399" }, children: ["Daily Productions Saved! (", y.totalBatches, " Batches Committed)"] }),
                  o.jsxs("div", { style: { fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }, children: ["Recorded ", o.jsx("strong", { children: y.totalPcs + " pcs" }), " (", y.mainPcs, " main + ", y.residualPcs, " residuals) across ", o.jsx("strong", { children: y.totalCement + " bags" }), " cement. Cloud inventory updated."] })
                ]
              })
            ]
          }),
          o.jsx("button", { onClick: () => O(null), className: "btn-ghost", style: { padding: "6px", color: "var(--text-muted)" }, children: o.jsx(Yn, { size: 18 }) })
        ]
      }),

      // CARD 1: BATCH MIX RECIPE SCALING
      o.jsxs("div", {
        className: "card-elevated",
        style: {
          padding: "16px",
          background: "var(--bg-surface-card)",
          border: "1px solid var(--border-subtle)",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflow: "visible"
        },
        children: [
          o.jsxs("div", {
            style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" },
            children: [
              o.jsx(Sx, { size: 16, color: "#eab308" }),
              o.jsx("span", {
                style: { fontSize: "12px", fontWeight: 800, color: "#eab308", letterSpacing: "0.06em", textTransform: "uppercase" },
                children: "BATCH MIX RECIPE SCALING"
              })
            ]
          }),
          // Two column grid that adjusts vertically, never horizontally
          o.jsxs("div", {
            style: {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "12px",
              alignItems: "stretch",
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box"
            },
            children: [
              // Left: Product Selector & Info
              o.jsxs("div", {
                style: {
                  background: "var(--bg-surface-elevated)",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "135px",
                  minWidth: 0,
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  overflow: "visible"
                },
                children: [
                  o.jsxs("div", {
                    children: [
                      o.jsx("span", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block" }, children: "Primary Product (High-Velocity Tracked)" }),
                      N ? o.jsxs("div", {
                        style: { display: "flex", alignItems: "baseline", gap: "8px", marginTop: "3px", flexWrap: "wrap" },
                        children: [
                          o.jsx("span", { style: { fontSize: "20px", fontWeight: 800, color: "#f8fafc" }, children: N.name }),
                          // Point 2: ONLY show color badge if product has colors enabled in settings!
                          hasColors && j && j !== "Standard" && o.jsxs("span", {
                            style: { display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(255, 255, 255, 0.08)", padding: "2px 7px", borderRadius: "999px", fontSize: "11px", color: "#f8fafc", border: "1px solid var(--border-subtle)" },
                            children: [
                              o.jsx(xr, { color: j, size: "sm", showCount: !1 }),
                              o.jsx("span", { children: j })
                            ]
                          })
                        ]
                      }) : o.jsx("div", {
                        style: { fontSize: "17px", fontWeight: 700, color: "var(--brand-400)", marginTop: "3px" },
                        children: "Select Product"
                      }),
                      N && o.jsxs("div", {
                        style: { display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" },
                        children: [
                          o.jsx("span", { className: "badge badge-neutral", style: { fontSize: "10px", padding: "1px 6px" }, children: N.category }),
                          o.jsxs("span", { style: { fontSize: "11.5px", color: "var(--text-secondary)" }, children: ["Wastani: ", o.jsx("strong", { style: { color: "#f8fafc" }, children: wastani }), " pcs/bag"] })
                        ]
                      })
                    ]
                  }),
                  // Buttons Row
                  o.jsxs("div", {
                    style: { display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap", alignItems: "center" },
                    children: [
                      o.jsxs("button", {
                        type: "button",
                        onClick: () => openProductModal("main"),
                        className: "btn btn-secondary btn-sm",
                        style: { fontSize: "12px", padding: "5px 11px", background: "rgba(0,0,0,0.3)" },
                        children: [
                          o.jsx("span", { children: N ? "Change Product" : "Select Product" }),
                          o.jsx("span", { style: { fontSize: "10px", opacity: 0.7, marginLeft: "4px" }, children: "▼" })
                        ]
                      }),
                      // Point 2: Fix color selection dropdown to show color options for products with color settings
                      hasColors && availableColors.length > 0 && o.jsxs("div", {
                        style: {
                          display: "inline-flex",
                          alignItems: "center",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "6px",
                          padding: "0 8px",
                          height: "30px",
                          gap: "6px"
                        },
                        children: [
                          o.jsx(xr, { color: j, size: "sm", showCount: !1 }),
                          o.jsx("label", {
                            htmlFor: "product-color-select",
                            style: { fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, margin: 0, padding: 0, cursor: "pointer" },
                            children: "Color:"
                          }),
                          o.jsx("select", {
                            id: "product-color-select",
                            value: j,
                            onChange: ev => k(ev.target.value),
                            "aria-label": "Select Product Color",
                            style: {
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#f8fafc",
                              background: "transparent",
                              border: "none",
                              outline: "none",
                              cursor: "pointer",
                              padding: "2px 4px",
                              margin: 0,
                              height: "100%"
                            },
                            children: availableColors.map(col => o.jsx("option", {
                              value: col,
                              style: { background: "#0f172a", color: "#f8fafc", padding: "6px 10px" },
                              children: col
                            }, col))
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),

              // Right: Baseline Reference & Scaled Materials (Material Card)
              o.jsxs("div", {
                style: {
                  background: "var(--bg-surface-elevated)",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "8px",
                  minHeight: "135px",
                  minWidth: 0,
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  overflow: "hidden"
                },
                children: [
                  // Point 1: Single-line baseline recipe reflecting actual recipe & colors, text centered
                  o.jsx("div", {
                    style: {
                      background: "rgba(0, 0, 0, 0.4)",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "clamp(10px, 1.1vw, 11.5px)",
                      color: "var(--text-secondary)",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: "100%",
                      boxSizing: "border-box"
                    },
                    title: recipeDescription,
                    children: o.jsx("strong", { style: { color: "#f8fafc" }, children: recipeDescription })
                  }),

                  // Point 1: Single-line material cards, numbers & text centered, auto-hiding unused materials
                  o.jsx("div", {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-around",
                      gap: "6px",
                      width: "100%",
                      padding: "2px 0",
                      flexWrap: "nowrap",
                      overflow: "hidden",
                      boxSizing: "border-box"
                    },
                    children: activeMaterials.map(mat => o.jsxs("div", {
                      key: mat.key,
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        flex: 1,
                        minWidth: 0,
                        padding: "2px 3px",
                        overflow: "hidden"
                      },
                      children: [
                        o.jsx("span", {
                          style: {
                            fontSize: "clamp(9px, 1vw, 10.5px)",
                            color: "var(--text-muted)",
                            display: "block",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            width: "100%",
                            textAlign: "center",
                            fontWeight: 600
                          },
                          title: mat.label,
                          children: mat.label
                        }),
                        o.jsxs("div", {
                          style: {
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "center",
                            gap: "2px",
                            marginTop: "1px",
                            width: "100%"
                          },
                          children: [
                            o.jsx("span", {
                              style: {
                                fontSize: "clamp(15px, 1.8vw, 20px)",
                                fontWeight: 800,
                                color: mat.color,
                                fontFamily: "var(--font-mono)",
                                lineHeight: 1.1
                              },
                              children: mat.value
                            }),
                            mat.isPill ? o.jsx("span", {
                              style: {
                                fontSize: "clamp(8px, 0.9vw, 9.5px)",
                                fontWeight: 700,
                                background: "rgba(255,255,255,0.1)",
                                padding: "1px 3px",
                                borderRadius: "3px",
                                color: "var(--text-secondary)"
                              },
                              children: mat.unit
                            }) : o.jsx("span", {
                              style: {
                                fontSize: "clamp(8px, 0.9vw, 9.5px)",
                                color: "var(--text-muted)",
                                fontWeight: 600
                              },
                              children: mat.unit
                            })
                          ]
                        })
                      ]
                    }))
                  }),

                  // Point 3: Single-line steel demand indicator (only if product uses steel, without card enlargement)
                  steelDemand && o.jsxs("div", {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "5px 8px",
                      background: "rgba(234, 179, 8, 0.08)",
                      border: "1px solid rgba(234, 179, 8, 0.25)",
                      borderRadius: "6px",
                      fontSize: "clamp(10px, 1.1vw, 11.5px)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: "100%",
                      boxSizing: "border-box"
                    },
                    title: "Steel: " + steelDemand.totalCm.toLocaleString() + " cm (" + steelDemand.totalM + " m)" + (steelDemand.steelType ? " • " + steelDemand.steelType : "") + (steelDemand.rollers !== null ? " • ~" + steelDemand.rollers + " Rollers" : ""),
                    children: [
                      o.jsx("span", { style: { color: "#eab308", fontSize: "11px" }, children: "⚙️" }),
                      o.jsxs("span", {
                        style: { color: "var(--text-secondary)", fontWeight: 600 },
                        children: [
                          "Steel: ",
                          o.jsx("strong", { style: { color: "#f8fafc", fontFamily: "var(--font-mono)" }, children: steelDemand.totalCm.toLocaleString() + " cm (" + steelDemand.totalM + " m)" })
                        ]
                      }),
                      steelDemand.steelType && o.jsx("span", {
                        style: { color: "var(--brand-400)", fontWeight: 700, fontSize: "clamp(9px, 1vw, 10.5px)" },
                        children: "• " + steelDemand.steelType
                      }),
                      steelDemand.rollers !== null && o.jsx("span", {
                        style: { color: "#38bdf8", fontWeight: 700, fontSize: "clamp(9px, 1vw, 10.5px)" },
                        children: "• ~" + steelDemand.rollers + " Rollers"
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }),

      // CARD 2: MAIN BATCH OUTPUT (CONTAINING PRIMARY PRODUCT OUTPUT & RESIDUALS AS SUB-CARDS)
      o.jsxs("div", {
        className: "card-elevated",
        style: {
          padding: "18px",
          background: "var(--bg-surface-card)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        },
        children: [
          // Main Batch Output Card Header (Yellow/Gold #eab308)
          o.jsxs("div", {
            style: { display: "flex", alignItems: "center", gap: "8px" },
            children: [
              o.jsx($a, { size: 16, color: "#eab308" }),
              o.jsx("span", {
                style: { fontSize: "12px", fontWeight: 800, color: "#eab308", letterSpacing: "0.06em", textTransform: "uppercase" },
                children: "MAIN BATCH OUTPUT"
              })
            ]
          }),

          // SUB-CARD 1: PRIMARY PRODUCT OUTPUT (White Heading)
          o.jsxs("div", {
            style: {
              background: "rgba(0, 0, 0, 0.22)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            },
            children: [
              o.jsxs("div", {
                style: { display: "flex", alignItems: "center", gap: "7px" },
                children: [
                  o.jsx($a, { size: 14, color: "#ffffff" }),
                  o.jsx("span", {
                    style: { fontSize: "11.5px", fontWeight: 800, color: "#ffffff", letterSpacing: "0.06em", textTransform: "uppercase" },
                    children: "PRIMARY PRODUCT OUTPUT"
                  })
                ]
              }),
              o.jsxs("div", {
                style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" },
                children: [
                  o.jsxs("div", {
                    style: { display: "flex", flexDirection: "column", gap: "10px" },
                    children: [
                      o.jsxs("div", {
                        style: { border: "1px dashed var(--border-subtle)", borderRadius: "10px", padding: "14px", background: "rgba(0,0,0,0.25)" },
                        children: [
                          o.jsx("span", { style: { fontSize: "10.5px", color: "var(--text-muted)", display: "block" }, children: (N && N.category) || "Product" }),
                          o.jsx("div", { style: { fontSize: "24px", fontWeight: 800, color: "#f8fafc", margin: "2px 0" }, children: (N && N.name) || "Select Product" }),
                          hasColors && j && j !== "Standard" && o.jsxs("span", {
                            style: { display: "inline-flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", color: "#f8fafc" },
                            children: [
                              o.jsx(xr, { color: j, size: "sm", showCount: !1 }),
                              o.jsx("span", { children: j })
                            ]
                          })
                        ]
                      }),
                      o.jsxs("div", {
                        style: { background: "var(--bg-surface-elevated)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)" },
                        children: [
                          o.jsxs("span", { style: { fontSize: "11px", color: "var(--text-muted)", display: "block" }, children: ["EXPECTED TARGET OUTPUT (", F, " BAGS × ", wastani, ")"] }),
                          o.jsxs("div", {
                            style: { display: "flex", alignItems: "baseline", gap: "6px", marginTop: "2px" },
                            children: [
                              o.jsx("span", { style: { fontSize: "24px", fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-mono)" }, children: expectedTargetPcs }),
                              o.jsx("span", { style: { fontSize: "12px", color: "var(--text-secondary)" }, children: "pcs" }),
                              isTilesOrPavings && pcsPerSqm && pcsPerSqm > 0 && expectedTargetPcs > 0 ? o.jsxs("span", {
                                style: { fontSize: "12px", color: "var(--brand-400)", marginLeft: "4px" },
                                children: ["(", Number((expectedTargetPcs / pcsPerSqm).toFixed(2)), " M²)"]
                              }) : null
                            ]
                          })
                        ]
                      })
                    ]
                  }),

                  o.jsxs("div", {
                    style: { display: "flex", flexDirection: "column", gap: "10px" },
                    children: [
                      o.jsxs("div", {
                        style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
                        children: [
                          o.jsxs("div", {
                            children: [
                              o.jsx("label", { style: { fontSize: "13px", fontWeight: 700, color: "#f8fafc", display: "block", marginBottom: "6px" }, children: "Cement bags" }),
                              o.jsx("input", {
                                type: "number",
                                step: "0.5",
                                min: "0",
                                className: "input mono",
                                style: { width: "100%", height: "54px", fontSize: "24px", fontWeight: 800, color: "#f8fafc", background: "var(--bg-input)", borderColor: "var(--border-subtle)", borderRadius: "8px", padding: "0 14px" },
                                value: x,
                                onChange: K => {
                                  let val = K.target.value;
                                  if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
                                    val = val.replace(/^0+(?=\\d)/, "");
                                  }
                                  b(val);
                                },
                                placeholder: ""
                              })
                            ]
                          }),
                          o.jsxs("div", {
                            children: [
                              o.jsx("label", { style: { fontSize: "13px", fontWeight: 700, color: "#f8fafc", display: "block", marginBottom: "6px" }, children: "Actual physical counted pcs" }),
                              o.jsx("input", {
                                type: "number",
                                min: "0",
                                className: "input mono",
                                style: { width: "100%", height: "54px", fontSize: "24px", fontWeight: 800, color: "#34d399", background: "var(--bg-input)", borderColor: "var(--border-subtle)", borderRadius: "8px", padding: "0 14px" },
                                value: A,
                                onChange: K => {
                                  let val = K.target.value;
                                  if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
                                    val = val.replace(/^0+(?=\\d)/, "");
                                  }
                                  L(val);
                                },
                                placeholder: ""
                              })
                            ]
                          })
                        ]
                      }),

                      o.jsxs("div", {
                        style: { display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "10px" },
                        children: [
                          o.jsxs("div", {
                            style: { background: "var(--bg-surface-elevated)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" },
                            children: [
                              o.jsx("span", { style: { fontSize: "11.5px", fontWeight: 700, color: "var(--text-secondary)", display: "block" }, children: "Avarage :" }),
                              o.jsxs("div", {
                                style: { display: "flex", alignItems: "baseline", gap: "6px", marginTop: "2px" },
                                children: [
                                  o.jsx("span", { style: { fontSize: "20px", fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-mono)" }, children: actualAveragePcsPerBag }),
                                  o.jsx("span", { style: { fontSize: "11px", color: "var(--text-muted)" }, children: "Pcs/Bag" })
                                ]
                              })
                            ]
                          }),
                          o.jsxs("div", {
                            style: { background: "var(--bg-surface-elevated)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" },
                            children: [
                              o.jsxs("span", {
                                style: { fontSize: "11px", color: "var(--text-muted)", display: "block" },
                                children: isTilesOrPavings
                                  ? ["ACTUAL PRODUCTION OUTPUT (", actualSqm, " M² / ", F, ")"]
                                  : ["ACTUAL PRODUCTION OUTPUT (", P_num, " PCS / ", F, ")"]
                              }),
                              o.jsxs("div", {
                                style: { display: "flex", alignItems: "baseline", gap: "6px", marginTop: "2px" },
                                children: [
                                  o.jsx("span", {
                                    style: { fontSize: "20px", fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-mono)" },
                                    children: isTilesOrPavings ? actualSqm : P_num
                                  }),
                                  o.jsx("span", {
                                    style: { fontSize: "11px", color: "var(--text-muted)" },
                                    children: isTilesOrPavings ? "M²" : "Pcs"
                                  }),
                                  isTilesOrPavings && P_num > 0 ? o.jsxs("span", {
                                    style: { fontSize: "11px", color: "var(--text-secondary)", marginLeft: "4px" },
                                    children: ["(", P_num, " pcs)"]
                                  }) : null
                                ]
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          // SUB-CARD 2: RESIDUALS (SECONDARY PRODUCTS) (White Heading)
          o.jsxs("div", {
            style: {
              background: "rgba(0, 0, 0, 0.22)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            },
            children: [
              o.jsxs("div", {
                style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" },
                children: [
                  o.jsxs("div", {
                    style: { display: "flex", alignItems: "center", gap: "7px" },
                    children: [
                      o.jsx(si, { size: 14, color: "#ffffff" }),
                      o.jsx("span", {
                        style: { fontSize: "11.5px", fontWeight: 800, color: "#ffffff", letterSpacing: "0.06em", textTransform: "uppercase" },
                        children: "RESIDUALS (SECONDARY PRODUCTS)"
                      })
                    ]
                  }),
                  o.jsxs("button", {
                    type: "button",
                    onClick: handleAddResidual,
                    className: "btn btn-secondary btn-sm",
                    style: { fontSize: "11.5px", padding: "5px 11px", display: "flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.06)", borderColor: "var(--border-subtle)" },
                    children: [
                      o.jsx(vr, { size: 13, color: "var(--brand-400)" }),
                      o.jsx("span", { children: "+ Add Residual Product" })
                    ]
                  })
                ]
              }),
              o.jsx("p", {
                style: { fontSize: "11px", color: "var(--text-muted)", margin: 0 },
                children: N ? ("Log minor pieces cast from leftover mixer batch of " + N.name + (hasColors && j && j !== "Standard" ? " (" + j + ")" : "") + ". Only products sharing the same recipe/materials are permitted.") : "Log minor pieces cast from leftover mixer batch. Select a primary product first."
              }),
              ae.length === 0 ? o.jsx("div", {
                style: { padding: "14px", textAlign: "center", background: "rgba(0, 0, 0, 0.2)", borderRadius: "8px", border: "1px dashed var(--border-subtle)", color: "var(--text-muted)", fontSize: "12px" },
                children: 'No secondary residual molds added. Click "+ Add Residual Product" if leftover mix was poured into other molds.'
              }) : o.jsx("div", {
                style: { display: "flex", flexDirection: "column", gap: "8px" },
                children: ae.map(item => {
                  const rItem = a.find(it => it.id === item.itemId) || null;
                  const rMeta = rItem ? lt(rItem) : null;
                  const rWastani = (rItem && rItem.wastani_per_bag) || (rMeta && rMeta.wastaniPcsPerBag) || 50;
                  const batchColor = hasColors && j && j !== "Standard" ? j : null;
                  const hasBatchColor = Boolean(batchColor);

                  return o.jsxs("div", {
                    style: {
                      display: "grid",
                      gridTemplateColumns: hasBatchColor ? "1.6fr 1.1fr 1fr auto" : "2fr 1fr auto",
                      gap: "10px",
                      alignItems: "center",
                      background: "var(--bg-surface-elevated)",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)"
                    },
                    children: [
                      o.jsxs("div", {
                        onClick: () => openProductModal("residual", item.id),
                        style: { cursor: "pointer" },
                        title: "Click to change secondary product (same mix recipe only)",
                        children: [
                          o.jsx("span", { style: { fontSize: "10px", color: "var(--text-muted)", display: "block" }, children: "Secondary Product" }),
                          o.jsx("strong", { style: { fontSize: "13.5px", color: "#f8fafc" }, children: (rItem && rItem.name) || "Select Product" }),
                          o.jsxs("div", { style: { fontSize: "10.5px", color: "var(--brand-400)" }, children: ["Wastani: ", rWastani, " pcs/bag"] })
                        ]
                      }),
                      hasBatchColor ? o.jsxs("div", {
                        children: [
                          o.jsx("span", { style: { fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: "3px" }, children: "Batch Color" }),
                          o.jsxs("div", {
                            style: {
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "rgba(255, 255, 255, 0.06)",
                              border: "1px solid var(--border-subtle)",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              color: "#f8fafc"
                            },
                            title: "Inherited from primary batch mix (" + batchColor + ")",
                            children: [
                              o.jsx(xr, { color: batchColor, size: "sm", showCount: !1 }),
                              o.jsx("span", { children: batchColor })
                            ]
                          })
                        ]
                      }) : null,
                      o.jsxs("div", {
                        children: [
                          o.jsx("span", { style: { fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: "2px" }, children: "Quantity (pcs)" }),
                          o.jsx("input", {
                            type: "number",
                            min: "1",
                            className: "input mono",
                            style: { fontSize: "14px", fontWeight: 700, height: "34px", padding: "0 10px" },
                            value: item.quantity_pcs,
                            onChange: ev => {
                              let val = ev.target.value;
                              if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
                                val = val.replace(/^0+(?=\\d)/, "");
                              }
                              handleUpdateResidualQty(item.id, val);
                            },
                            placeholder: ""
                          })
                        ]
                      }),
                      o.jsx("button", {
                        type: "button",
                        onClick: () => handleRemoveResidual(item.id),
                        className: "btn-ghost",
                        style: { color: "#f87171", padding: "6px" },
                        title: "Remove residual",
                        children: o.jsx(Yp, { size: 16 })
                      })
                    ]
                  }, item.id);
                })
              })
            ]
          }),

          // SUB-CARD 3: WEIGHTED BATCH YIELD CALIBRATION (White Heading)
          o.jsxs("div", {
            style: {
              background: "rgba(0, 0, 0, 0.22)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            },
            children: [
              o.jsxs("div", {
                style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" },
                children: [
                  o.jsxs("div", {
                    style: { display: "flex", alignItems: "center", gap: "7px" },
                    children: [
                      o.jsx(qa, { size: 14, color: "#ffffff" }),
                      o.jsx("span", {
                        style: { fontSize: "11.5px", fontWeight: 800, color: "#ffffff", letterSpacing: "0.06em", textTransform: "uppercase" },
                        children: "WEIGHTED BATCH YIELD CALIBRATION"
                      })
                    ]
                  }),
                  o.jsx("span", {
                    className: "badge " + yieldMetrics.badgeClass,
                    style: { fontSize: "11px", fontWeight: 700, padding: "3px 10px", border: "1px solid " + yieldMetrics.badgeColor },
                    children: "Yield Factor: " + yieldMetrics.yieldFactorPct + "%"
                  })
                ]
              }),
              o.jsx("p", {
                style: { fontSize: "11px", color: "var(--text-muted)", margin: 0 },
                children: yieldMetrics.badgeMessage
              }),
              o.jsxs("div", {
                style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
                children: [
                  o.jsxs("div", {
                    style: { background: "var(--bg-surface-elevated)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" },
                    children: [
                      o.jsx("span", { style: { fontSize: "11.5px", color: "var(--text-secondary)" }, children: "Total Pieces in Batch:" }),
                      o.jsxs("span", {
                        style: { fontSize: "14px", fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-mono)" },
                        children: [
                          P_num, " pcs",
                          totalResidualPcs > 0 ? o.jsx("span", { style: { fontSize: "11px", color: "var(--brand-400)", marginLeft: "4px" }, children: "(+" + totalResidualPcs + " res)" }) : null
                        ]
                      })
                    ]
                  }),
                  o.jsxs("div", {
                    style: { background: "var(--bg-surface-elevated)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" },
                    children: [
                      o.jsx("span", { style: { fontSize: "11.5px", color: "var(--text-secondary)" }, children: "Theoretical Cement Needed:" }),
                      o.jsxs("span", {
                        style: { fontSize: "14px", fontWeight: 800, color: "var(--brand-400)", fontFamily: "var(--font-mono)" },
                        children: [totalTheoreticalCement, " bags"]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }),

      // Supervisor Memo
      o.jsxs("div", {
        children: [
          o.jsx("label", { style: { fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }, children: "Supervisor Batch Note / Shift Memo (Optional)" }),
          o.jsx("input", {
            type: "text",
            className: "input",
            style: { width: "100%", height: "44px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "0 14px", fontSize: "13px", color: "#f8fafc" },
            value: ne,
            onChange: K => Y(K.target.value),
            placeholder: "e.g. Morning vibro run, batch calibrated on vibrating table #2..."
          })
        ]
      }),

      // Buttons: + Add Batch to Daily Productions & Reset Row
      o.jsxs("div", {
        style: { display: "flex", gap: "10px", alignItems: "center" },
        children: [
          o.jsxs("button", {
            type: "button",
            onClick: handleAddBatchToDaily,
            style: { flex: 1, height: "48px", background: "#eab308", border: "none", borderRadius: "8px", color: "#000", fontWeight: 800, fontSize: "14.5px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", transition: "transform 0.1s ease, filter 0.15s ease", boxShadow: "0 4px 14px rgba(234, 179, 8, 0.3)" },
            onMouseEnter: ev => ev.currentTarget.style.filter = "brightness(1.08)",
            onMouseLeave: ev => ev.currentTarget.style.filter = "none",
            children: [
              o.jsx(vr, { size: 16, color: "#000" }),
              o.jsx("span", { children: editingBatchId ? "Update Batch #" + (stagedBatches.find(b => b.id === editingBatchId)?.batchNumber || "") : "+Add Batch to Daily Productions" })
            ]
          }),
          (editingBatchId || F > 0 || P_num > 0 || ae.length > 0) && o.jsx("button", {
            type: "button",
            onClick: handleResetForm,
            className: "btn btn-secondary",
            style: { height: "48px", padding: "0 16px", fontSize: "13px" },
            children: editingBatchId ? "Cancel Edit" : "Reset"
          })
        ]
      }),

      // CARD 5: DAILY LEDGER VERIFICATION PREVIEW
      o.jsxs("div", {
        className: "card-elevated",
        style: { padding: "18px", background: "var(--bg-surface-card)", border: "1px solid var(--border-subtle)" },
        children: [
          o.jsxs("div", {
            style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "6px" },
            children: [
              o.jsxs("div", {
                style: { display: "flex", alignItems: "center", gap: "8px" },
                children: [
                  o.jsx(qa, { size: 16, color: "#eab308" }),
                  o.jsx("span", {
                    style: { fontSize: "12px", fontWeight: 800, color: "#eab308", letterSpacing: "0.06em", textTransform: "uppercase" },
                    children: "DAILY LEDGER VERIFICATION PREVIEW"
                  })
                ]
              }),
              o.jsxs("span", {
                className: "badge badge-neutral",
                style: { fontSize: "11px", fontWeight: 700, padding: "3px 10px" },
                children: [stagedBatches.length, " Batches Staged"]
              })
            ]
          }),
          o.jsx("p", {
            style: { fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "14px" },
            children: "Verify batch records before cloud commit. Click any row to reload its metrics back into editing fields for corrections."
          }),

          stagedBatches.length === 0 ? o.jsx("div", {
            style: { padding: "20px", textAlign: "center", background: "rgba(0, 0, 0, 0.2)", borderRadius: "8px", border: "1px dashed var(--border-subtle)", color: "var(--text-muted)", fontSize: "12.5px" },
            children: 'No batches staged yet. Build a batch mix above and click "+ Add Batch to Daily Productions".'
          }) : o.jsx("div", {
            style: { display: "flex", flexDirection: "column", gap: "8px" },
            children: stagedBatches.map(batch => o.jsxs("div", {
              style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", background: editingBatchId === batch.id ? "rgba(234, 179, 8, 0.1)" : "var(--bg-surface-elevated)", border: editingBatchId === batch.id ? "1px solid #eab308" : "1px solid var(--border-subtle)", padding: "10px 14px", borderRadius: "8px", cursor: "pointer", transition: "border-color 0.15s ease" },
              onClick: () => handleEditStagedBatch(batch),
              children: [
                o.jsxs("div", {
                  style: { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flex: 1 },
                  children: [
                    o.jsxs("span", { style: { fontWeight: 800, fontSize: "12px", color: "var(--brand-400)", fontFamily: "var(--font-mono)" }, children: ["Batch #", batch.batchNumber] }),
                    o.jsxs("div", {
                      style: { display: "flex", alignItems: "center", gap: "6px" },
                      children: [
                        o.jsx("strong", { style: { fontSize: "13.5px", color: "#f8fafc" }, children: batch.productName }),
                        batch.color && o.jsxs("span", { style: { fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }, children: ["•", batch.color] })
                      ]
                    }),
                    o.jsxs("span", {
                      style: { fontSize: "12.5px", color: "#34d399", fontWeight: 700, fontFamily: "var(--font-mono)" },
                      children: [
                        batch.mainPieces, " pcs",
                        batch.mainSqm ? o.jsxs("span", { style: { fontSize: "11px", color: "var(--text-secondary)", marginLeft: "4px" }, children: ["(", batch.mainSqm, " m²)"] }) : null
                      ]
                    }),
                    batch.residuals && batch.residuals.length > 0 && o.jsxs("span", {
                      style: { fontSize: "11px", color: "var(--text-muted)", background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" },
                      children: ["+", batch.residuals.reduce((s, r) => s + r.quantity_pcs, 0), " res (", batch.residuals.map(r => r.productName).join(", "), ")"]
                    }),
                    o.jsxs("span", {
                      style: { fontSize: "12px", color: "var(--text-secondary)" },
                      children: [o.jsx("strong", { style: { color: "#f8fafc" }, children: batch.cementBags }), " bags Cem"]
                    }),
                    o.jsxs("span", {
                      style: { fontSize: "11.5px", color: "var(--text-muted)" },
                      children: ["Avg: ", batch.averagePcsPerBag, "/bag"]
                    }),
                    o.jsx("span", {
                      className: "badge " + batch.qcBadgeClass,
                      style: { fontSize: "10px", padding: "1px 6px" },
                      children: batch.yieldFactorPct + "%"
                    })
                  ]
                }),
                o.jsxs("div", {
                  style: { display: "flex", alignItems: "center", gap: "4px" },
                  onClick: ev => ev.stopPropagation(),
                  children: [
                    o.jsx("button", {
                      type: "button",
                      onClick: () => setViewBatchDetail(batch),
                      className: "btn-ghost",
                      style: { padding: "6px", color: "var(--text-secondary)", fontSize: "12px" },
                      title: "View Batch Details",
                      children: "👁️"
                    }),
                    o.jsx("button", {
                      type: "button",
                      onClick: () => handleEditStagedBatch(batch),
                      className: "btn-ghost",
                      style: { padding: "6px", color: "var(--brand-400)", fontSize: "12px" },
                      title: "Edit Batch",
                      children: "✏️"
                    }),
                    o.jsx("button", {
                      type: "button",
                      onClick: () => handleDeleteStagedBatch(batch.id),
                      className: "btn-ghost",
                      style: { padding: "6px", color: "#f87171" },
                      title: "Delete Batch",
                      children: o.jsx(Yp, { size: 15 })
                    })
                  ]
                })
              ]
            }, batch.id))
          }),

          o.jsxs("div", {
            style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "14px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)", fontSize: "12.5px" },
            children: [
              o.jsxs("span", {
                style: { color: "var(--text-secondary)" },
                children: [
                  "Total Staged Output: ",
                  o.jsxs("strong", { style: { color: "#f8fafc" }, children: [totalStagedOutput.mainPcs, " pcs"] }),
                  totalStagedOutput.residualPcs > 0 ? o.jsx("span", { style: { color: "var(--brand-400)", marginLeft: "4px" }, children: "(+" + totalStagedOutput.residualPcs + " residuals)" }) : null,
                  totalStagedOutput.mainSqm > 0 ? o.jsx("span", { style: { color: "var(--text-muted)", marginLeft: "4px" }, children: "• " + totalStagedOutput.mainSqm + " m²" }) : null
                ]
              }),
              o.jsxs("span", {
                style: { color: "var(--text-secondary)" },
                children: [
                  "Total Cement: ",
                  o.jsxs("strong", { style: { color: "var(--brand-400)" }, children: [totalStagedOutput.totalCement, " bags"] })
                ]
              })
            ]
          })
        ]
      }),

      // Large Footer Save Button
      o.jsxs("button", {
        type: "button",
        disabled: stagedBatches.length === 0,
        onClick: () => setShowAuditModal(!0),
        style: {
          width: "100%",
          height: "48px",
          background: stagedBatches.length > 0 ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
          border: "1px solid " + (stagedBatches.length > 0 ? "var(--border-subtle)" : "rgba(255,255,255,0.05)"),
          borderRadius: "8px",
          color: stagedBatches.length > 0 ? "#eab308" : "var(--text-muted)",
          fontWeight: 700,
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          cursor: stagedBatches.length > 0 ? "pointer" : "not-allowed",
          transition: "all 0.15s ease"
        },
        children: [
          o.jsx(pn, { size: 16, color: stagedBatches.length > 0 ? "#eab308" : "var(--text-muted)" }),
          o.jsxs("span", {
            children: [
              "Save Daily Productions (",
              stagedBatches.length, " Batches • ",
              totalStagedOutput.totalPcs, " pcs)"
            ]
          })
        ]
      }),

      // AUDIT & INVENTORY VERIFICATION POPUP MODAL
      showAuditModal && o.jsx("div", {
        className: "modal-overlay",
        onClick: () => setShowAuditModal(!1),
        children: o.jsxs("div", {
          className: "modal-content",
          onClick: ev => ev.stopPropagation(),
          style: { padding: "22px", maxWidth: "620px", maxHeight: "90vh", display: "flex", flexDirection: "column", gap: "16px" },
          children: [
            o.jsxs("div", {
              style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" },
              children: [
                o.jsxs("div", {
                  children: [
                    o.jsx("h2", { style: { fontSize: "17px", fontWeight: 800, color: "#f8fafc", margin: 0 }, children: "Daily Production Verification Document" }),
                    o.jsxs("p", { style: { fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }, children: ["Production Date: ", o.jsx("strong", { style: { color: "#f8fafc" }, children: g }), " • Verified by: ", d || "Supervisor"] })
                  ]
                }),
                o.jsx("button", { type: "button", onClick: () => setShowAuditModal(!1), className: "btn-ghost", style: { padding: "4px", color: "var(--text-muted)" }, children: "✕" })
              ]
            }),

            o.jsxs("div", {
              style: { overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px", flex: 1 },
              children: [
                o.jsxs("div", {
                  children: [
                    o.jsxs("span", { style: { fontSize: "12px", fontWeight: 700, color: "var(--brand-400)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }, children: ["1. Batches to Commit (", stagedBatches.length, ")"] }),
                    o.jsx("div", {
                      style: { border: "1px solid var(--border-subtle)", borderRadius: "8px", overflow: "hidden" },
                      children: stagedBatches.map((b, idx) => o.jsxs("div", {
                        style: { padding: "8px 12px", background: idx % 2 === 0 ? "rgba(0,0,0,0.2)" : "var(--bg-surface-elevated)", borderBottom: idx < stagedBatches.length - 1 ? "1px solid var(--border-subtle)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" },
                        children: [
                          o.jsxs("div", {
                            children: [
                              o.jsxs("strong", { style: { color: "#f8fafc" }, children: ["Batch #", b.batchNumber, ": ", b.productName] }),
                              b.color && o.jsxs("span", { style: { color: "var(--text-muted)", marginLeft: "4px" }, children: ["(", b.color, ")"] }),
                              b.residuals && b.residuals.length > 0 && o.jsxs("div", { style: { fontSize: "11px", color: "var(--text-secondary)" }, children: ["+ Residuals: ", b.residuals.map(r => r.productName + " (" + r.quantity_pcs + " pcs)").join(", ")] })
                            ]
                          }),
                          o.jsxs("div", {
                            style: { textAlign: "right" },
                            children: [
                              o.jsxs("div", { style: { fontWeight: 700, color: "#34d399", fontFamily: "var(--font-mono)" }, children: [b.mainPieces, " pcs ", b.mainSqm ? "(" + b.mainSqm + " m²)" : ""] }),
                              o.jsxs("div", { style: { fontSize: "11px", color: "var(--text-muted)" }, children: [b.cementBags, " bags cem • ", b.yieldFactorPct, "% yield"] })
                            ]
                          })
                        ]
                      }, b.id))
                    })
                  ]
                }),

                o.jsxs("div", {
                  children: [
                    o.jsx("span", { style: { fontSize: "12px", fontWeight: 700, color: "var(--brand-400)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }, children: "2. Total Raw Materials Consumed" }),
                    o.jsxs("div", {
                      style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px" },
                      children: [
                        o.jsxs("div", {
                          style: { background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)", textAlign: "center" },
                          children: [
                            o.jsx("span", { style: { fontSize: "10.5px", color: "var(--text-muted)", display: "block" }, children: "Cement" }),
                            o.jsxs("strong", { style: { fontSize: "16px", color: "#f8fafc", fontFamily: "var(--font-mono)" }, children: [aggregateMaterialsUsed.cement, " bags"] })
                          ]
                        }),
                        o.jsxs("div", {
                          style: { background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)", textAlign: "center" },
                          children: [
                            o.jsx("span", { style: { fontSize: "10.5px", color: "var(--text-muted)", display: "block" }, children: "Sand (Mchanga)" }),
                            o.jsxs("strong", { style: { fontSize: "16px", color: "#f8fafc", fontFamily: "var(--font-mono)" }, children: [aggregateMaterialsUsed.sand, " bkt"] })
                          ]
                        }),
                        aggregateMaterialsUsed.chipping > 0 ? o.jsxs("div", {
                          style: { background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)", textAlign: "center" },
                          children: [
                            o.jsx("span", { style: { fontSize: "10.5px", color: "var(--text-muted)", display: "block" }, children: "Chipping" }),
                            o.jsxs("strong", { style: { fontSize: "16px", color: "#f8fafc", fontFamily: "var(--font-mono)" }, children: [aggregateMaterialsUsed.chipping, " bkt"] })
                          ]
                        }) : null,
                        aggregateMaterialsUsed.aggregate > 0 ? o.jsxs("div", {
                          style: { background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)", textAlign: "center" },
                          children: [
                            o.jsx("span", { style: { fontSize: "10.5px", color: "var(--text-muted)", display: "block" }, children: "Kokoto (Agg.)" }),
                            o.jsxs("strong", { style: { fontSize: "16px", color: "#f8fafc", fontFamily: "var(--font-mono)" }, children: [aggregateMaterialsUsed.aggregate, " bkt"] })
                          ]
                        }) : null,
                        aggregateMaterialsUsed.chemical > 0 ? o.jsxs("div", {
                          style: { background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)", textAlign: "center" },
                          children: [
                            o.jsx("span", { style: { fontSize: "10.5px", color: "var(--text-muted)", display: "block" }, children: "Chemical (Dawa)" }),
                            o.jsxs("strong", { style: { fontSize: "16px", color: "#38bdf8", fontFamily: "var(--font-mono)" }, children: [aggregateMaterialsUsed.chemical, " L"] })
                          ]
                        }) : null
                      ]
                    })
                  ]
                }),

                o.jsxs("div", {
                  children: [
                    o.jsx("span", { style: { fontSize: "12px", fontWeight: 700, color: "var(--brand-400)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }, children: "3. Expected Inventory Additions (Finished Goods)" }),
                    o.jsx("div", {
                      style: { border: "1px solid var(--border-subtle)", borderRadius: "8px", overflow: "hidden" },
                      children: expectedInventoryAdditions.map((inv, idx) => o.jsxs("div", {
                        style: { padding: "8px 12px", background: idx % 2 === 0 ? "rgba(0,0,0,0.2)" : "var(--bg-surface-elevated)", borderBottom: idx < expectedInventoryAdditions.length - 1 ? "1px solid var(--border-subtle)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" },
                        children: [
                          o.jsxs("div", {
                            style: { display: "flex", alignItems: "center", gap: "6px" },
                            children: [
                              o.jsx("strong", { style: { color: "#f8fafc" }, children: inv.name }),
                              inv.color && o.jsxs("span", { style: { color: "var(--text-muted)" }, children: ["(", inv.color, ")"] }),
                              o.jsx("span", { className: "badge badge-neutral", style: { fontSize: "10px", padding: "1px 5px" }, children: inv.category })
                            ]
                          }),
                          o.jsxs("div", {
                            style: { fontWeight: 800, color: "#34d399", fontFamily: "var(--font-mono)" },
                            children: [
                              "+", inv.pieces, " pcs",
                              inv.sqm > 0 ? o.jsxs("span", { style: { fontSize: "11px", color: "var(--text-secondary)", marginLeft: "4px" }, children: ["(+" + inv.sqm.toFixed(2) + " m²)"] }) : null
                            ]
                          })
                        ]
                      }, idx))
                    })
                  ]
                })
              ]
            }),

            o.jsxs("div", {
              style: { display: "flex", gap: "10px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)" },
              children: [
                o.jsx("button", {
                  type: "button",
                  onClick: () => setShowAuditModal(!1),
                  className: "btn btn-secondary",
                  style: { flex: 1, height: "46px" },
                  children: "Back to Editing"
                }),
                o.jsxs("button", {
                  type: "button",
                  disabled: ue,
                  onClick: handleConfirmSaveAllBatches,
                  className: "btn btn-primary",
                  style: { flex: 2, height: "46px", background: "linear-gradient(135deg, #10b981, #059669)", border: "none" },
                  children: [
                    o.jsx(pn, { size: 18 }),
                    o.jsx("span", { children: ue ? "Committing to Supabase..." : "Confirm & Commit to Unified Ledger" })
                  ]
                })
              ]
            })
          ]
        })
      }),

      // BATCH DETAIL MODAL
      viewBatchDetail && o.jsx("div", {
        className: "modal-overlay",
        onClick: () => setViewBatchDetail(null),
        children: o.jsxs("div", {
          className: "modal-content",
          onClick: ev => ev.stopPropagation(),
          style: { padding: "20px", maxWidth: "480px" },
          children: [
            o.jsxs("div", {
              style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px" },
              children: [
                o.jsxs("h3", { style: { fontSize: "16px", fontWeight: 800, color: "#f8fafc", margin: 0 }, children: ["Batch #", viewBatchDetail.batchNumber, " Details"] }),
                o.jsx("button", { type: "button", onClick: () => setViewBatchDetail(null), className: "btn-ghost", style: { padding: "4px" }, children: "✕" })
              ]
            }),
            o.jsxs("div", {
              style: { display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" },
              children: [
                o.jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [o.jsx("span", { style: { color: "var(--text-muted)" }, children: "Primary Product:" }), o.jsxs("strong", { style: { color: "#f8fafc" }, children: [viewBatchDetail.productName, " ", viewBatchDetail.color ? "(" + viewBatchDetail.color + ")" : ""] })] }),
                o.jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [o.jsx("span", { style: { color: "var(--text-muted)" }, children: "Main Output:" }), o.jsxs("strong", { style: { color: "#34d399" }, children: [viewBatchDetail.mainPieces, " pcs ", viewBatchDetail.mainSqm ? "(" + viewBatchDetail.mainSqm + " m²)" : ""] })] }),
                o.jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [o.jsx("span", { style: { color: "var(--text-muted)" }, children: "Cement Bags Loaded:" }), o.jsxs("strong", { style: { color: "#f8fafc" }, children: [viewBatchDetail.cementBags, " bags"] })] }),
                o.jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [o.jsx("span", { style: { color: "var(--text-muted)" }, children: "Actual Average per Bag:" }), o.jsxs("strong", { style: { color: "#f8fafc" }, children: [viewBatchDetail.averagePcsPerBag, " pcs/bag (Target: ", viewBatchDetail.expectedWastani, ")"] })] }),
                o.jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [o.jsx("span", { style: { color: "var(--text-muted)" }, children: "Theoretical Cement:" }), o.jsxs("strong", { style: { color: "var(--brand-400)" }, children: [viewBatchDetail.theoreticalCement, " bags"] })] }),
                o.jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [o.jsx("span", { style: { color: "var(--text-muted)" }, children: "Batch Yield Factor:" }), o.jsx("span", { className: "badge " + viewBatchDetail.qcBadgeClass, children: viewBatchDetail.yieldFactorPct + "%" })] }),
                viewBatchDetail.steelSpec && o.jsxs("div", {
                  style: { marginTop: "6px", background: "rgba(234, 179, 8, 0.1)", border: "1px solid rgba(234, 179, 8, 0.3)", padding: "10px", borderRadius: "8px" },
                  children: [
                    o.jsxs("strong", { style: { fontSize: "11px", color: "#eab308", display: "block", marginBottom: "4px" }, children: ["⚙️ ", viewBatchDetail.steelSpec.title] }),
                    o.jsxs("span", { style: { fontSize: "12px", color: "#f8fafc" }, children: ["Steel Consumed: ", viewBatchDetail.steelSpec.totalCm.toLocaleString(), " cm (", viewBatchDetail.steelSpec.totalM, " m)"] })
                  ]
                }),
                viewBatchDetail.residuals && viewBatchDetail.residuals.length > 0 && o.jsxs("div", {
                  style: { marginTop: "6px", background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px" },
                  children: [
                    o.jsx("strong", { style: { fontSize: "11px", color: "var(--brand-400)", display: "block", marginBottom: "4px" }, children: "Residual Molds in Batch:" }),
                    viewBatchDetail.residuals.map((r, i) => o.jsxs("div", {
                      style: { display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)" },
                      children: [
                        o.jsxs("span", { children: [r.productName, r.color ? " (" + r.color + ")" : ""] }),
                        o.jsxs("strong", { style: { color: "#f8fafc" }, children: [r.quantity_pcs, " pcs ", r.quantity_sqm ? "(" + r.quantity_sqm + " m²)" : ""] })
                      ]
                    }, i))
                  ]
                }),
                viewBatchDetail.note && o.jsxs("div", {
                  style: { marginTop: "6px", fontStyle: "italic", color: "var(--text-secondary)", fontSize: "12px", borderLeft: "2px solid var(--brand-500)", paddingLeft: "8px" },
                  children: ["Note: ", viewBatchDetail.note]
                })
              ]
            }),
            o.jsx("button", {
              type: "button",
              onClick: () => setViewBatchDetail(null),
              className: "btn btn-secondary",
              style: { width: "100%", marginTop: "16px" },
              children: "Close"
            })
          ]
        })
      }),

      // PRODUCT SELECTOR MODAL
      xe && o.jsx("div", {
        className: "modal-overlay",
        onClick: () => Ie(!1),
        children: o.jsxs("div", {
          className: "modal-content",
          onClick: K => K.stopPropagation(),
          style: { padding: "20px", maxWidth: "520px", maxHeight: "85vh", display: "flex", flexDirection: "column" },
          children: [
            o.jsxs("div", {
              style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" },
              children: [
                o.jsxs("div", {
                  children: [
                    o.jsxs("h3", { style: { fontSize: "17px", fontWeight: 800 }, children: ["Select ", he === "main" ? "Primary Product" : ("Secondary Product (" + (N ? N.name : "") + ")")] }),
                    o.jsx("p", { style: { fontSize: "11.5px", color: he === "residual" ? "var(--brand-400)" : "var(--text-muted)" }, children: he === "residual" ? "Showing only products sharing the exact same recipe & materials with this batch" : "Filter by product name, category, or mold catalog" })
                  ]
                }),
                o.jsx("button", { type: "button", onClick: () => Ie(!1), className: "btn-ghost", style: { padding: "6px", color: "var(--text-muted)" }, children: "✕" })
              ]
            }),
            o.jsxs("div", {
              className: "search-wrapper",
              style: { marginBottom: "10px" },
              children: [
                o.jsx(ii, { className: "search-icon", size: 16 }),
                o.jsx("input", {
                  type: "text",
                  className: "input-field search-input",
                  placeholder: "Search by product name...",
                  value: Be,
                  onChange: K => M(K.target.value),
                  autoFocus: !0
                }),
                Be && o.jsx("button", { className: "search-clear", onClick: () => M(""), children: "✕" })
              ]
            }),
            o.jsx("div", {
              className: "filter-tabs",
              style: { marginBottom: "10px" },
              children: T.map(K => o.jsx("button", {
                type: "button",
                onClick: () => le(K),
                className: "filter-tab " + (ee === K ? "active" : ""),
                style: { fontSize: "11px", padding: "3px 8px" },
                children: K
              }, K))
            }),
            o.jsx("div", {
              style: { display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto", flex: 1 },
              children: we.length === 0 ? o.jsx("div", {
                style: { padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" },
                children: "No matching compatible products found that share the same recipe and materials."
              }) : we.map((K, be) => {
                const Ae = lt(K);
                const qe = K.moldCount || (Ae == null ? void 0 : Ae.moldCount) || 0;
                const Ve = K.wastani_per_bag || (Ae == null ? void 0 : Ae.wastaniPcsPerBag) || 50;
                const Me = Ua(K);
                return o.jsxs("div", {
                  onClick: () => handleSelectProduct(K),
                  style: { padding: "10px 12px", borderRadius: "8px", background: "var(--bg-surface-elevated)", border: "1px solid var(--border-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", transition: "background 0.15s ease" },
                  onMouseEnter: Xe => Xe.currentTarget.style.borderColor = "var(--brand-500)",
                  onMouseLeave: Xe => Xe.currentTarget.style.borderColor = "var(--border-subtle)",
                  children: [
                    o.jsxs("div", {
                      children: [
                        o.jsxs("div", {
                          style: { display: "flex", alignItems: "center", gap: "6px" },
                          children: [
                            o.jsxs("span", { style: { fontSize: "10px", color: "var(--brand-400)", fontWeight: 800 }, children: ["#", be + 1] }),
                            o.jsx("strong", { style: { fontSize: "14px", color: "#f8fafc" }, children: K.name }),
                            o.jsx("span", { className: "badge badge-neutral", style: { fontSize: "10px", padding: "1px 5px" }, children: K.category })
                          ]
                        }),
                        o.jsxs("div", {
                          style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" },
                          children: [
                            "Size: ", Me, " • Wastani: ", Ve, " pcs/bag",
                            qe > 0 ? " • Molds: " + qe + " pcs" : ""
                          ]
                        })
                      ]
                    }),
                    he === "residual" && hasColors && j && j !== "Standard" ? o.jsxs("div", {
                      style: { display: "flex", alignItems: "center", gap: "5px", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "999px", fontSize: "11px", color: "#f8fafc", border: "1px solid var(--border-subtle)" },
                      children: [
                        o.jsx(xr, { color: j, size: "sm", showCount: !1 }),
                        o.jsx("span", { children: j })
                      ]
                    }) : (K.colors && K.colors.length > 0 && o.jsx("div", {
                      style: { display: "flex", gap: "3px" },
                      children: K.colors.map(col => o.jsx(xr, { color: col, size: "sm", showCount: !1 }, col))
                    }))
                  ]
                }, K.id);
              })
            })
          ]
        })
      })
    ]
  });
}`;

const bundlePath = 'assets/index-hgjhj-0G.js';
const bundleContent = fs.readFileSync(bundlePath, 'utf8');

const startPrefix = '_1=({prefillItemId:s';
const startIdx = bundleContent.indexOf(startPrefix);
if (startIdx === -1) {
  throw new Error('Could not find start of _1 component');
}

const endPrefix = ',b1=';
const endIdx = bundleContent.indexOf(endPrefix, startIdx);
if (endIdx === -1) {
  throw new Error('Could not find end of _1 component');
}

console.log('Replacing from', startIdx, 'to', endIdx);
console.log('Old length:', endIdx - startIdx);
console.log('New length:', componentCode.length);

let newBundle = bundleContent.substring(0, startIdx) + componentCode + bundleContent.substring(endIdx);
newBundle = newBundle.replace(/category:"Kerbstones",unit:"pcs",pcs_per_sqm:null,colors:\["White"\]/g, 'category:"Kerbstones",unit:"pcs",pcs_per_sqm:null,colors:[]');
newBundle = newBundle.replace(/category:"Culverts",unit:"pcs",pcs_per_sqm:null,colors:\["White"\]/g, 'category:"Culverts",unit:"pcs",pcs_per_sqm:null,colors:[]');
newBundle = newBundle.replace(/category:"Mifuniko \/ Covers",unit:"pcs",pcs_per_sqm:null,colors:\["White"\]/g, 'category:"Mifuniko / Covers",unit:"pcs",pcs_per_sqm:null,colors:[]');

// Point 1: Culverts, kerbstones, mifuniko, poles do NOT use dawa (chemicalLiters: 0)
// Vibro paving DOES use dawa (chemicalLiters: 1)
newBundle = newBundle.replace(
  'paving_vibro:{id:"paving_vibro",name:"Paving Blocks (Vibro 1:7:11)",description:"1 Bag Cem : 7 Buckets Sand : 11 Buckets Chipping : Pigment",method:"vibro",cementBags:1,sandBuckets:7,chippingBuckets:11,aggregateBuckets:0,chemicalLiters:0,',
  'paving_vibro:{id:"paving_vibro",name:"Paving Blocks (Vibro 1:7:11)",description:"1 Bag Cem : 7 Buckets Sand : 11 Buckets Chipping : 1L Dawa + Pigment",method:"vibro",cementBags:1,sandBuckets:7,chippingBuckets:11,aggregateBuckets:0,chemicalLiters:1,'
);
newBundle = newBundle.replace(/(curbstones_vibro:\{[^}]+chemicalLiters:)\.5/g, "$10");
newBundle = newBundle.replace(/(mifuniko_vibro:\{[^}]+chemicalLiters:)\.5/g, "$10");
newBundle = newBundle.replace(/(culverts_heavy:\{[^}]+chemicalLiters:)\.5/g, "$10");
newBundle = newBundle.replace(/(poles_bicon:\{[^}]+chemicalLiters:)\.5/g, "$10");

fs.writeFileSync(bundlePath, newBundle);
console.log('Successfully updated assets/index-hgjhj-0G.js!');

const swPath = 'service-worker.js';
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  swContent = swContent.replace(/const CACHE_NAME = 'stumarcot-pwa-v[^']+';/, "const CACHE_NAME = 'stumarcot-pwa-v1.3.0-" + Date.now() + "';");
  fs.writeFileSync(swPath, swContent);
  console.log('Updated service-worker.js cache name');
}
