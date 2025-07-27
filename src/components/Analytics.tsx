import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Package, FileText } from "lucide-react";
import { useSerialStore } from "@/hooks/useSerialStore";
import { useEffect, useState } from "react";

export const Analytics = () => {
  const { getSerialCounts, store } = useSerialStore();
  const [counts, setCounts] = useState({
    total: 0,
    unassigned: 0,
    blocked: 0,
    assigned: 0,
  });

  useEffect(() => {
    const loadCounts = async () => {
      const serialCounts = await getSerialCounts();
      setCounts(serialCounts);
    };
    loadCounts();
  }, [getSerialCounts, store]);

  const assignmentRate = counts.total > 0 ? ((counts.assigned / counts.total) * 100).toFixed(1) : 0;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of serial number usage and ASN performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Serials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{counts.total}</div>
             <p className="text-xs text-muted-foreground">
               <TrendingUp className="inline h-3 w-3 mr-1" />
               Live from database
             </p>
           </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active ASNs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{store?.asns.length || 0}</div>
             <p className="text-xs text-muted-foreground">
               <TrendingUp className="inline h-3 w-3 mr-1" />
               Live from database
             </p>
           </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignment Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{assignmentRate}%</div>
             <p className="text-xs text-muted-foreground">
               <TrendingUp className="inline h-3 w-3 mr-1" />
               Assignment efficiency
             </p>
           </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processing</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">
              -0.3h faster than avg
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Serial Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-sm">Assigned</span>
                 <div className="flex items-center space-x-2">
                   <div className="w-32 bg-muted rounded-full h-2">
                     <div className="bg-success h-2 rounded-full" style={{ width: `${counts.total > 0 ? (counts.assigned / counts.total) * 100 : 0}%` }}></div>
                   </div>
                   <span className="text-sm font-medium">{counts.total > 0 ? Math.round((counts.assigned / counts.total) * 100) : 0}%</span>
                 </div>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-sm">Unassigned</span>
                 <div className="flex items-center space-x-2">
                   <div className="w-32 bg-muted rounded-full h-2">
                     <div className="bg-secondary h-2 rounded-full" style={{ width: `${counts.total > 0 ? (counts.unassigned / counts.total) * 100 : 0}%` }}></div>
                   </div>
                   <span className="text-sm font-medium">{counts.total > 0 ? Math.round((counts.unassigned / counts.total) * 100) : 0}%</span>
                 </div>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-sm">Blocked</span>
                 <div className="flex items-center space-x-2">
                   <div className="w-32 bg-muted rounded-full h-2">
                     <div className="bg-warning h-2 rounded-full" style={{ width: `${counts.total > 0 ? (counts.blocked / counts.total) * 100 : 0}%` }}></div>
                   </div>
                   <span className="text-sm font-medium">{counts.total > 0 ? Math.round((counts.blocked / counts.total) * 100) : 0}%</span>
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">ASN-2024-003 submitted</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">50 serials assigned to CPU-001-X7</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Batch import completed</p>
                  <p className="text-xs text-muted-foreground">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};