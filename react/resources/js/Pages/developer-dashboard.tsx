import { Head } from '@inertiajs/react'
import { Code2, Zap, Bug, GitBranch, Terminal, Cpu } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import DeveloperLayout from '@/layouts/app/DeveloperLayout'

export default function DeveloperDashboard() {
  return (
    <DeveloperLayout>
      <div className="space-y-4 p-4 md:p-6">
        <Head title="Developer Dashboard" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Developer Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Kelola API, tools, dan integrasi Anda dari sini.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls</CardTitle>
              <Code2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,847</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Connected services</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <Bug className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.23%</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">145ms</div>
              <p className="text-xs text-muted-foreground">API latency</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.99%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Endpoints</CardTitle>
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">Active endpoints</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent API Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { method: 'GET', endpoint: '/api/products', status: '200', time: '2m' },
                  { method: 'POST', endpoint: '/api/orders', status: '201', time: '5m' },
                  { method: 'PUT', endpoint: '/api/users/123', status: '200', time: '12m' },
                  { method: 'DELETE', endpoint: '/api/sessions', status: '204', time: '1h' },
                  { method: 'GET', endpoint: '/api/analytics', status: '200', time: '2h' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {item.method}
                      </Badge>
                      <span className="text-sm font-medium">{item.endpoint}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.status}</div>
                      <div className="text-xs text-muted-foreground">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { service: 'API Server', status: 'Operational' },
                  { service: 'Database', status: 'Operational' },
                  { service: 'Cache Service', status: 'Operational' },
                  { service: 'Message Queue', status: 'Operational' },
                  { service: 'Storage', status: 'Optimal' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <span className="text-sm">{item.service}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-muted-foreground">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DeveloperLayout>
  )
}
