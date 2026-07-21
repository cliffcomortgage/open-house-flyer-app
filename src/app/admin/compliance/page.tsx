"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Download,
  Loader2,
  Filter,
  FileText,
  User,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { US_STATES } from "@/lib/us-states";
import { Checkbox } from "@/components/ui/checkbox";

interface ComplianceFlyer {
  id: string;
  title: string | null;
  templateId: string;
  status: string;
  distributionState: string | null;
  createdAt: string;
  updatedAt: string;
  propertyData: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    price?: number;
  } | null;
  loanOfficer: {
    id: string;
    firstName: string;
    lastName: string;
    nmlsNumber: string;
    branchState: string | null;
    email: string;
  };
  realtor: {
    firstName: string;
    lastName: string;
    companyName: string;
  } | null;
}

const templateLabels: Record<string, string> = {
  "modern-minimal": "Modern Minimal",
  "gallery-grid": "Gallery Grid",
  "showcase-one-rate": "Showcase + Rate",
  "market-leader": "Market Leader",
};

export default function CompliancePage() {
  const [flyers, setFlyers] = useState<ComplianceFlyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState("ALL");
  const [filterLO, setFilterLO] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/compliance")
      .then((r) => r.json())
      .then((data) => { setFlyers(data); setLoading(false); })
      .catch(() => { toast.error("Failed to load compliance records"); setLoading(false); });
  }, []);

  const loOptions = useMemo(() => {
    const seen = new Map<string, string>();
    flyers.forEach((f) => {
      seen.set(f.loanOfficer.id, `${f.loanOfficer.firstName} ${f.loanOfficer.lastName}`);
    });
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [flyers]);

  const stateOptions = useMemo(() => {
    const seen = new Set<string>();
    flyers.forEach((f) => { if (f.distributionState) seen.add(f.distributionState); });
    return Array.from(seen).sort();
  }, [flyers]);

  const filtered = useMemo(() => flyers.filter((f) => {
    if (filterState !== "ALL" && f.distributionState !== filterState) return false;
    if (filterLO !== "ALL" && f.loanOfficer.id !== filterLO) return false;
    return true;
  }), [flyers, filterState, filterLO]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((f) => selected.has(f.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((f) => next.delete(f.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((f) => next.add(f.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one flyer to export");
      return;
    }
    setExporting(true);
    try {
      const res = await fetch("/api/admin/compliance/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flyerIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compliance-flyers.zip";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${selected.size} flyer${selected.size > 1 ? "s" : ""} exported`);
    } catch {
      toast.error("Export failed — check that Puppeteer is installed");
    } finally {
      setExporting(false);
    }
  };

  const stateName = (abbr: string | null) => {
    if (!abbr) return "—";
    return US_STATES.find((s) => s.abbr === abbr)?.name || abbr;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            All flyers created across loan officers, with distribution state tracking.
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={selected.size === 0 || exporting}
          style={{ backgroundColor: "#6633cc" }}
          className="text-white gap-2"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Archive className="w-4 h-4" />
          )}
          Export ZIP ({selected.size} selected)
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <Select value={filterState} onValueChange={(v) => { setFilterState(v ?? "ALL"); setSelected(new Set()); }}>
          <SelectTrigger className="w-52 h-9 text-sm">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <SelectValue placeholder="Filter by state" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="ALL">All states</SelectItem>
            {stateOptions.map((abbr) => (
              <SelectItem key={abbr} value={abbr}>
                {stateName(abbr)} ({abbr})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterLO} onValueChange={(v) => { setFilterLO(v ?? "ALL"); setSelected(new Set()); }}>
          <SelectTrigger className="w-56 h-9 text-sm">
            <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <SelectValue placeholder="Filter by LO" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="ALL">All loan officers</SelectItem>
            {loOptions.map(([id, name]) => (
              <SelectItem key={id} value={id}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-sm text-slate-500 flex items-center gap-1.5 ml-auto">
          <span className="font-semibold text-slate-700">{filtered.length}</span> record{filtered.length !== 1 ? "s" : ""}
          {(filterState !== "ALL" || filterLO !== "ALL") && " (filtered)"}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No flyers match the current filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Property Address
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Loan Officer
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                    Realtor
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Dist. State
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                    Prop. State
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                    Template
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((flyer) => {
                  const pd = flyer.propertyData;
                  const address = pd?.address
                    ? `${pd.address}${pd.city ? `, ${pd.city}` : ""}`
                    : flyer.title || "Untitled";

                  return (
                    <tr
                      key={flyer.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selected.has(flyer.id)}
                          onCheckedChange={() => toggleOne(flyer.id)}
                          aria-label="Select flyer"
                        />
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="font-medium text-slate-900 truncate">{address}</p>
                        {pd?.zipCode && (
                          <p className="text-xs text-slate-400">{pd.zipCode}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {flyer.loanOfficer.firstName} {flyer.loanOfficer.lastName}
                        </p>
                        <p className="text-xs text-slate-400">NMLS# {flyer.loanOfficer.nmlsNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                        {flyer.realtor ? (
                          <>
                            <p>{flyer.realtor.firstName} {flyer.realtor.lastName}</p>
                            <p className="text-xs text-slate-400">{flyer.realtor.companyName}</p>
                          </>
                        ) : (
                          <span className="text-slate-400 italic text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {flyer.distributionState ? (
                          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 font-mono text-xs">
                            {flyer.distributionState}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {pd?.state ? (
                          <span className="font-mono text-xs text-slate-600">{pd.state}</span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                        {templateLabels[flyer.templateId] || flyer.templateId}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={
                            flyer.status === "SAVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }
                        >
                          {flyer.status === "SAVED" ? "Saved" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden xl:table-cell tabular-nums">
                        {new Date(flyer.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              {selected.size > 0
                ? `${selected.size} of ${filtered.length} selected`
                : `${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}
            </span>
            {selected.size > 0 && (
              <button
                className="text-slate-400 hover:text-slate-600 underline"
                onClick={() => setSelected(new Set())}
              >
                Clear selection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
