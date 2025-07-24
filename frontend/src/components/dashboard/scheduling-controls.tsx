import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function SchedulingControls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: platformConfigs = [] } = useQuery({
    queryKey: ['/api/platform-configs'],
  });

  const { data: scheduleConfigs = [] } = useQuery({
    queryKey: ['/api/schedule-configs'],
  });

  const updatePlatformMutation = useMutation({
    mutationFn: ({ platform, updates }: { platform: string; updates: any }) => 
      api.updatePlatformConfig(platform, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-configs'] });
      toast({
        title: "Platform updated",
        description: "Platform configuration has been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: ({ type, updates }: { type: string; updates: any }) => 
      api.updateScheduleConfig(type, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-configs'] });
      toast({
        title: "Schedule updated",
        description: "Schedule configuration has been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePlatformToggle = (platform: string, enabled: boolean) => {
    updatePlatformMutation.mutate({
      platform,
      updates: { enabled }
    });
  };

  const handleScheduleUpdate = (type: string, config: any) => {
    const currentConfig = Array.isArray(scheduleConfigs) ? scheduleConfigs.find((s: any) => s.type === type) : null;
    updateScheduleMutation.mutate({
      type,
      updates: {
        config: { ...currentConfig?.config, ...config }
      }
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'telegram':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
          </div>
        );
      case 'twitter':
        return (
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
        );
      case 'discord':
        return (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-600 rounded-sm"></div>
          </div>
        );
    }
  };

  const getPlatformName = (platform: string) => {
    const config = Array.isArray(platformConfigs) ? platformConfigs.find((p: any) => p.platform === platform) : null;
    return config?.config?.name || platform;
  };

  const getPlatformHandle = (platform: string) => {
    const config = Array.isArray(platformConfigs) ? platformConfigs.find((p: any) => p.platform === platform) : null;
    return config?.config?.handle || '';
  };

  const getPlatformStatus = (platform: string) => {
    const config = Array.isArray(platformConfigs) ? platformConfigs.find((p: any) => p.platform === platform) : null;
    return {
      status: config?.status || 'inactive',
      enabled: config?.enabled || false,
    };
  };

  const getScheduleConfig = (type: string) => {
    const config = Array.isArray(scheduleConfigs) ? scheduleConfigs.find((s: any) => s.type === type) : null;
    return config?.config || {};
  };

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Posting Schedule & Platform Settings</h3>
        <p className="text-sm text-slate-600 mt-1">Configure when and where your content gets published</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Platform Configuration */}
          <div>
            <h4 className="font-medium text-slate-900 mb-4">Platform Configuration</h4>
            <div className="space-y-4">
              {['telegram', 'twitter', 'discord', 'websites'].map((platform) => {
                const platformStatus = getPlatformStatus(platform);
                const statusText = platformStatus.status === 'active' ? 'Connected' : 
                                 platformStatus.status === 'pending' ? 'Pending' : 'Disconnected';
                const statusColor = platformStatus.status === 'active' ? 'text-green-600' : 
                                   platformStatus.status === 'pending' ? 'text-yellow-600' : 'text-red-600';

                return (
                  <div key={platform} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getPlatformIcon(platform)}
                      <div>
                        <p className="font-medium text-slate-900">{getPlatformName(platform)}</p>
                        <p className="text-sm text-slate-600">{getPlatformHandle(platform)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${statusColor}`}>{statusText}</span>
                      <Switch
                        checked={platformStatus.enabled}
                        onCheckedChange={(enabled) => handlePlatformToggle(platform, enabled)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scheduling Configuration */}
          <div>
            <h4 className="font-medium text-slate-900 mb-4">Posting Schedule</h4>
            <div className="space-y-4">
              {/* Economic Calendar Schedule */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-slate-900">Economic Calendar</h5>
                  <span className="text-sm text-green-600 font-medium">Active</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-slate-600 mb-1">Morning Summary</Label>
                    <Input
                      type="time"
                      value={getScheduleConfig('economic').morningTime || '08:00'}
                      onChange={(e) => handleScheduleUpdate('economic', { morningTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-600 mb-1">Real-time Updates</Label>
                    <Select
                      value={getScheduleConfig('economic').frequency || 'immediate'}
                      onValueChange={(value) => handleScheduleUpdate('economic', { frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="every_15_min">Every 15 min</SelectItem>
                        <SelectItem value="every_30_min">Every 30 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Market Updates Schedule */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-slate-900">Market Updates</h5>
                  <span className="text-sm text-green-600 font-medium">Active</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-slate-600 mb-1">Daily Summary</Label>
                    <Input
                      type="time"
                      value={getScheduleConfig('market').morningTime || '09:00'}
                      onChange={(e) => handleScheduleUpdate('market', { morningTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-600 mb-1">Frequency</Label>
                    <Select
                      value={getScheduleConfig('market').frequency || 'daily'}
                      onValueChange={(value) => handleScheduleUpdate('market', { frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="twice_daily">Twice daily</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Trading Signals Schedule */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-slate-900">Trading Signals</h5>
                  <span className="text-sm text-green-600 font-medium">Active</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-slate-600 mb-1">Check Interval</Label>
                    <Select
                      value={getScheduleConfig('signals').checkInterval || 'every_30_min'}
                      onValueChange={(value) => handleScheduleUpdate('signals', { checkInterval: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="every_15_min">Every 15 min</SelectItem>
                        <SelectItem value="every_30_min">Every 30 min</SelectItem>
                        <SelectItem value="every_hour">Every hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-600 mb-1">Auto Post</Label>
                    <Select
                      value={getScheduleConfig('signals').autoPost || 'immediate'}
                      onValueChange={(value) => handleScheduleUpdate('signals', { autoPost: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="review_first">Review first</SelectItem>
                        <SelectItem value="manual_only">Manual only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
