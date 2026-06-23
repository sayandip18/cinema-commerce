import { useState, useEffect, useCallback } from "react";
import {
  fetchTheatres,
  fetchInventoryOverview,
  bulkRefillInventory,
  type Theatre,
  type InventoryOverviewItem,
} from "../api";

export default function Inventory() {
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [selectedTheatreId, setSelectedTheatreId] = useState("");
  const [inventory, setInventory] = useState<InventoryOverviewItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTheatres()
      .then(setTheatres)
      .catch(() => setError("Failed to load theatres"));
  }, []);

  const loadInventory = useCallback(async (theatreId: string) => {
    setLoading(true);
    setError("");
    try {
      const items = await fetchInventoryOverview(theatreId);
      setInventory(items);
      setQuantities(
        Object.fromEntries(
          items.map((item) => [item.menuItemId, item.quantity]),
        ),
      );
    } catch {
      setError("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTheatreChange = (theatreId: string) => {
    setSelectedTheatreId(theatreId);
    if (theatreId) {
      loadInventory(theatreId);
    } else {
      setInventory([]);
      setQuantities({});
    }
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [menuItemId]: Math.max(0, (prev[menuItemId] ?? 0) + delta),
    }));
  };

  const hasChanges = inventory.some(
    (item) => quantities[item.menuItemId] !== item.quantity,
  );

  const handleRefill = async () => {
    setSubmitting(true);
    setError("");
    try {
      const items = inventory.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: quantities[item.menuItemId] ?? 0,
      }));
      const updated = await bulkRefillInventory(selectedTheatreId, items);
      setInventory(updated);
      setQuantities(
        Object.fromEntries(
          updated.map((item) => [item.menuItemId, item.quantity]),
        ),
      );
      setShowConfirm(false);
    } catch {
      setError("Failed to update inventory");
    } finally {
      setSubmitting(false);
    }
  };

  const groupedInventory = inventory.reduce<
    Record<string, InventoryOverviewItem[]>
  >((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <>
      <div className="mb-8">
        <label
          htmlFor="theatre-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select Theatre
        </label>
        <select
          id="theatre-select"
          value={selectedTheatreId}
          onChange={(e) => handleTheatreChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Choose a theatre...</option>
          {theatres.map((theatre) => (
            <option key={theatre.id} value={theatre.id}>
              {theatre.name} — {theatre.location}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-gray-500 text-center py-12">
          Loading inventory...
        </p>
      )}

      {!loading && selectedTheatreId && inventory.length > 0 && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {Object.entries(groupedInventory).map(([category, items]) => (
              <div key={category}>
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {category}
                  </h2>
                </div>
                {items.map((item) => {
                  const currentQty = quantities[item.menuItemId] ?? 0;
                  const changed = currentQty !== item.quantity;
                  return (
                    <div
                      key={item.menuItemId}
                      className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Rs {item.basePrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {changed && (
                          <span className="text-xs text-gray-400">
                            was {item.quantity}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          disabled={currentQty <= 0}
                          className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          −
                        </button>
                        <span
                          className={`w-12 text-center text-sm font-medium tabular-nums ${
                            changed ? "text-blue-600" : "text-gray-900"
                          }`}
                        >
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={!hasChanges}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Refill quantities
            </button>
          </div>
        </>
      )}

      {!loading && selectedTheatreId && inventory.length === 0 && !error && (
        <p className="text-gray-500 text-center py-12">
          No menu items found.
        </p>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Are you sure to proceed?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              This will update the inventory quantities for the selected
              theatre.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRefill}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Updating..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
