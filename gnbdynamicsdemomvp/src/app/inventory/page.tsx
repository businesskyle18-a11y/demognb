import { prisma } from "@/lib/prisma";
import { getActingUser } from "@/lib/auth";
import { canAccess, formatDateTime } from "@/lib/constants";
import Restricted from "@/components/Restricted";
import { PageHeader, Card, Badge, EmptyState, Field, inputClass, Button } from "@/components/ui";
import { createInventoryItem, recordInventoryTransaction, createRestockRequest } from "./actions";

export default async function InventoryPage() {
  const user = await getActingUser();
  if (!user || !canAccess(user.role, "inventory")) return <Restricted moduleLabel="Inventory" />;

  const [items, transactions] = await Promise.all([
    prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
    prisma.inventoryTransaction.findMany({
      include: { item: true, user: true },
      orderBy: { timestamp: "desc" },
      take: 25,
    }),
  ]);

  const canWrite = ["WAREHOUSE", "MANAGEMENT"].includes(user.role);

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Stock in/out log, reorder-point flags, restock request cycle." />

      <Card className="overflow-x-auto mb-4">
        {items.length === 0 ? (
          <EmptyState text="No inventory items yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">On Hand</th>
                <th className="px-4 py-2">Reorder Pt</th>
                <th className="px-4 py-2">Location</th>
                {canWrite && <th className="px-4 py-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const low = i.qtyOnHand <= i.reorderPoint;
                return (
                  <tr key={i.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 text-slate-500">{i.sku}</td>
                    <td className="px-4 py-2 font-medium text-slate-800">{i.name}</td>
                    <td className="px-4 py-2 text-slate-600">{i.category}</td>
                    <td className="px-4 py-2">
                      {i.qtyOnHand} {i.unit}
                      {low && <Badge value="low stock" />}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {i.reorderPoint} {i.unit}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{i.location}</td>
                    {canWrite && (
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <form action={recordInventoryTransaction} className="flex items-center gap-1">
                            <input type="hidden" name="itemId" value={i.id} />
                            <select name="type" className="text-xs rounded border border-slate-300 px-1 py-1">
                              <option value="in">IN</option>
                              <option value="out">OUT</option>
                            </select>
                            <input name="qty" type="number" step="any" placeholder="qty" className="w-16 text-xs rounded border border-slate-300 px-1.5 py-1" />
                            <button className="text-xs bg-slate-900 text-white rounded px-2 py-1">Log</button>
                          </form>
                          {low && (
                            <form action={createRestockRequest}>
                              <input type="hidden" name="itemId" value={i.id} />
                              <input type="hidden" name="qty" value={Math.max(i.reorderPoint * 2 - i.qtyOnHand, 1)} />
                              <button className="text-xs text-amber-700 hover:underline whitespace-nowrap">
                                Request restock
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        {canWrite && (
          <Card className="p-4 lg:col-span-1 h-fit">
            <div className="font-medium text-sm mb-3">New Inventory Item</div>
            <form action={createInventoryItem}>
              <Field label="SKU">
                <input name="sku" required className={inputClass} />
              </Field>
              <Field label="Name">
                <input name="name" required className={inputClass} />
              </Field>
              <Field label="Category">
                <input name="category" required className={inputClass} />
              </Field>
              <Field label="Unit">
                <input name="unit" defaultValue="pcs" className={inputClass} />
              </Field>
              <Field label="Qty on hand">
                <input name="qtyOnHand" type="number" step="any" defaultValue={0} className={inputClass} />
              </Field>
              <Field label="Reorder point">
                <input name="reorderPoint" type="number" step="any" defaultValue={0} className={inputClass} />
              </Field>
              <Field label="Location">
                <input name="location" className={inputClass} />
              </Field>
              <Button>Add Item</Button>
            </form>
          </Card>
        )}

        <Card className={`overflow-x-auto ${canWrite ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <div className="px-4 pt-3 text-xs font-medium text-slate-500 uppercase">Recent Transactions</div>
          {transactions.length === 0 ? (
            <EmptyState text="No transactions yet." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Qty</th>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2 text-slate-700">{t.item.name}</td>
                    <td className="px-4 py-2">
                      <Badge value={t.type} />
                    </td>
                    <td className="px-4 py-2">{t.qty}</td>
                    <td className="px-4 py-2 text-slate-500">{t.user.name}</td>
                    <td className="px-4 py-2 text-slate-400 whitespace-nowrap">{formatDateTime(t.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
