import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Edit, Trash2, Send, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentCreatorModal } from "@/components/dashboard/content-creator-modal";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function ContentManagement() {
  const [isContentCreatorOpen, setIsContentCreatorOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['/api/content-posts'],
  });

  const { data: platformConfigs } = useQuery({
    queryKey: ['/api/platform-configs'],
  });

  const postContentMutation = useMutation({
    mutationFn: ({ postId, platforms }: { postId: number; platforms: string[] }) =>
      api.postContent(postId, platforms),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Content posted",
        description: "Your content has been published successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Publishing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted': return <CheckCircle className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Edit className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'economic': return 'bg-orange-100 text-orange-800';
      case 'market': return 'bg-blue-100 text-blue-800';
      case 'signal': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformIcon = (platform: string) => {
    const config = Array.isArray(platformConfigs) ? platformConfigs.find((p: any) => p.platform === platform) : null;
    const name = config?.config?.name || platform;
    
    switch (platform) {
      case 'telegram':
        return <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">T</div>;
      case 'twitter':
        return <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">X</div>;
      case 'discord':
        return <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">D</div>;
      case 'websites':
        return <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">W</div>;
      default:
        return <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{name.charAt(0)}</div>;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleString();
  };

  const filteredPosts = Array.isArray(posts) ? posts.filter((post: any) => {
    const statusMatch = filterStatus === 'all' || post.status === filterStatus;
    const typeMatch = filterType === 'all' || post.type === filterType;
    return statusMatch && typeMatch;
  }) : [];

  const handlePostContent = (post: any) => {
    postContentMutation.mutate({
      postId: post.id,
      platforms: post.platforms
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-50">
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Content Management</h1>
              <p className="text-sm text-slate-600 mt-1">Manage all your social media content and posts</p>
            </div>
            <Button onClick={() => setIsContentCreatorOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Content
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="economic">Economic Calendar</SelectItem>
                <SelectItem value="market">Market Updates</SelectItem>
                <SelectItem value="signal">Trading Signals</SelectItem>
                <SelectItem value="custom">Custom Posts</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1"></div>
            <div className="text-sm text-slate-600">
              {filteredPosts.length} posts
            </div>
          </div>

          {/* Content List */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Edit className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No content found</h3>
                  <p className="text-slate-600 mb-4">
                    {filterStatus !== 'all' || filterType !== 'all' 
                      ? 'No posts match your current filters.' 
                      : 'You haven\'t created any content yet.'}
                  </p>
                  <Button onClick={() => setIsContentCreatorOpen(true)}>
                    Create your first post
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredPosts.map((post: any) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <Badge className={getStatusColor(post.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(post.status)}
                              <span className="capitalize">{post.status}</span>
                            </div>
                          </Badge>
                          <Badge className={getTypeColor(post.type)}>
                            {post.type === 'economic' ? 'Economic' :
                             post.type === 'market' ? 'Market' :
                             post.type === 'signal' ? 'Signal' : 'Custom'}
                          </Badge>
                          {post.aiEnhanced && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              AI Enhanced
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{post.title}</h3>
                        <p className="text-slate-700 mb-4 line-clamp-3">{post.content}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-slate-600">Platforms:</span>
                              <div className="flex items-center space-x-1">
                                {post.platforms?.map((platform: string) => (
                                  <div key={platform} className="flex items-center space-x-1">
                                    {getPlatformIcon(platform)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {post.status === 'draft' && (
                              <Button
                                size="sm"
                                onClick={() => handlePostContent(post)}
                                disabled={postContentMutation.isPending}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Post Now
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                            <div>
                              <span className="font-medium">Created:</span> {formatDate(post.createdAt)}
                            </div>
                            <div>
                              <span className="font-medium">
                                {post.status === 'scheduled' ? 'Scheduled for:' : 'Posted at:'}
                              </span> {formatDate(post.scheduledAt || post.postedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>

      <ContentCreatorModal 
        isOpen={isContentCreatorOpen}
        onClose={() => setIsContentCreatorOpen(false)}
      />
    </div>
  );
}