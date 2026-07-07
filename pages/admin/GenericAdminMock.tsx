import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNotify } from "../../components/Notifications";
import Icon from "../../components/Icon";

const GenericAdminMock: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotify();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Derived title based on path
  const pathBase = location.pathname.split("/").pop() || "";
  const titleMap: Record<string, string> = {
    coupons: "Coupons & Promos",
    riders: "Rider Management",
    analytics: "Sales Analytics",
    helpdesk: "Help Desk",
    refunds: "Refund Requests",
    affiliates: "Affiliate Program",
    staff: "Staff Accounts",
    seo: "SEO Manager",
    taxes: "Tax Configuration",
    bulk: "Inventory Export",
  };

  const pageTitle = titleMap[pathBase] || "Admin Module";

  useEffect(() => {
    const fetchGenericData = async () => {
      setLoading(true);
      try {
        // Determine if this is a settings doc or a collection
        if (["seo", "taxes"].includes(pathBase)) {
          const snap = await getDocs(collection(db, "settings"));
          const pData = snap.docs.find((d) => d.id === pathBase);
          if (pData) {
            setData([pData.data()]);
          } else {
            setData([]);
          }
        } else if (pathBase === "bulk") {
          const snap = await getDocs(collection(db, "products"));
          setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } else {
          // Regular CRUD collections
          const colName = pathBase === "analytics" ? "orders" : pathBase;
          const snap = await getDocs(collection(db, colName));
          setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchGenericData();
  }, [pathBase]);

  const handleCreateDummy = async () => {
    try {
      if (pathBase === "coupons") {
        await addDoc(collection(db, "coupons"), {
          code: "WELCOME10",
          discount: 10,
          type: "percent",
          createdAt: Date.now(),
        });
      } else if (pathBase === "riders") {
        await addDoc(collection(db, "riders"), {
          name: "New Rider",
          vehicle: "Bike",
          status: "Active",
          deliveries: 0,
        });
      } else if (pathBase === "refunds") {
        await addDoc(collection(db, "refunds"), {
          orderId: "RND-1234",
          reason: "Damaged item",
          status: "Pending",
          createdAt: Date.now(),
        });
      } else if (pathBase === "affiliates") {
        await addDoc(collection(db, "affiliates"), {
          name: "Influencer x",
          code: "PROMOX",
          commissions: 0,
        });
      } else if (pathBase === "staff") {
        await addDoc(collection(db, "staff"), {
          name: "Support Agent",
          role: "Support",
          email: "support@vibe.shop",
        });
      } else if (pathBase === "helpdesk") {
        await addDoc(collection(db, "helpdesk"), {
          subject: "Delivery delayed",
          status: "Open",
          userEmail: "user@example.com",
        });
      }
      notify("Item added for " + pathBase, "success");
      window.location.reload();
    } catch (e) {
      notify("Error adding item", "error");
    }
  };

  const handleExportConfig = async () => {
    if (pathBase === "bulk") {
      notify("Exporting " + data.length + " products to CSV...", "success");
      // Fake download logic
      setTimeout(() => {
        notify("products_export.csv downloaded.", "success");
      }, 1500);
    } else if (["seo", "taxes"].includes(pathBase)) {
      try {
        await setDoc(doc(db, "settings", pathBase), {
          updated_at: Date.now(),
          isActive: true,
        });
        notify("Configuration updated successfully.", "success");
      } catch (e) {
        notify("Error updating config.", "error");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800/50">
      

      <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
            Database Records: {data.length}
          </h3>
          <div className="flex space-x-3">
            {["seo", "taxes", "bulk"].includes(pathBase) ? (
              <button
                onClick={handleExportConfig}
                className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 rounded-full text-xs font-bold tracking-normal  hover:bg-emerald-900 transition-colors shadow-md"
              >
                {pathBase === "bulk" ? "Export CSV" : "Update Config"}
              </button>
            ) : (
              <button
                onClick={handleCreateDummy}
                className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2.5 rounded-full text-xs font-bold tracking-normal  hover:bg-emerald-900 transition-colors shadow-md"
              >
                <Icon name="plus" className="mr-2" /> Add Record
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Icon
              name="spinner"
              className="animate-spin text-zinc-900 dark:text-zinc-100 text-lg"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {data.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                    {Object.keys(data[0] || {})
                      .slice(0, 5)
                      .map((key) => (
                        <th
                          key={key}
                          className="py-4 px-5 text-[10px] font-bold  tracking-normal text-zinc-500"
                        >
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-zinc-50 hover:bg-zinc-50 dark:bg-zinc-800/30 transition-colors"
                    >
                      {Object.entries(item)
                        .slice(0, 5)
                        .map(([k, v], i) => (
                          <td
                            key={i}
                            className="py-4 px-5 text-sm text-zinc-800 dark:text-zinc-200 format max-w-[200px] truncate"
                          >
                            {typeof v === "object"
                              ? JSON.stringify(v)
                              : String(v)}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-16 text-center text-zinc-400">
                <Icon name="database" className="text-lg mb-4 text-zinc-200" />
                <p className="font-bold text-xs  tracking-normal">
                  No data entries found.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericAdminMock;
