import { Sidebar } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function TestContentManagement() {
  // Test if TanStack Query is causing the issue
  const { data: posts, isLoading } = useQuery({
    queryKey: ['content-posts'],
    queryFn: () => apiRequest('/api/content-posts'),
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
        <p className="text-gray-600 mt-2">Testing with TanStack Query</p>
        
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Posts ({isLoading ? 'Loading...' : posts?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>Test Button</Button>
            {posts?.slice(0, 3).map((post: any) => (
              <div key={post.id} className="p-2 border rounded mt-2">
                <h3 className="font-medium">{post.title}</h3>
                <p className="text-sm text-gray-600">{post.platform}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
