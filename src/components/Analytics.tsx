import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Package, FileText } from "lucide-react";
import { useGlobalState } from "@/hooks/useGlobalState";

export const Analytics = () => {
  const { computed, asns, serials } = useGlobalState();
  const counts = computed.getSerialCounts();

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
              <div className="text-2xl font-bold">{asns.length}</div>
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
              {asns.slice(0, 3).map((asn, index) => (
                <div key={asn.id} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    asn.status === 'received' ? 'bg-success' : 
                    asn.status === 'submitted' ? 'bg-primary' : 'bg-warning'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {asn.asn_number} {asn.status === 'received' ? 'received' : 
                      asn.status === 'submitted' ? 'submitted' : 'draft'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {asn.items.length} items • {asn.updated_date.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {serials.slice(0, 2).map((serial, index) => (
                <div key={serial.id} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Serial {serial.serial_number} {serial.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {serial.updated_date.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {(!asns.length && !serials.length) && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};