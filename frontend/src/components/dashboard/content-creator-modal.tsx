import { useState } from "react";
import { X, Eye, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ContentCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContentForm {
  type: 'economic' | 'market' | 'signal' | 'custom';
  platforms: string[];
  content: string;
  schedule: 'now' | 'later';
  scheduledAt?: string;
  aiEnhancement: 'none' | 'grammar' | 'engaging' | 'emojis' | 'professional';
}

export function ContentCreatorModal({ isOpen, onClose }: ContentCreatorModalProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ContentForm>({
    defaultValues: {
      type: 'custom',
      platforms: ['telegram', 'twitter'],
      content: '',
      schedule: 'now',
      aiEnhancement: 'none',
    },
  });

  const generateMutation = useMutation({
    mutationFn: (data: { type: string; content?: string }) => 
      api.generateContent({
        type: data.type as any,
        data: data.content,
        tone: 'professional',
        platforms: form.getValues('platforms'),
      }),
    onSuccess: (result) => {
      form.setValue('content', result.content);
      toast({
        title: "Content generated",
        description: "AI has generated content for your post.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const enhanceMutation = useMutation({
    mutationFn: (data: { content: string; enhancement: string }) =>
      api.enhanceContent(data.content, data.enhancement as any),
    onSuccess: (result) => {
      setPreviewContent(result.enhanced_content);
      setIsPreviewMode(true);
      toast({
        title: "Content enhanced",
        description: "AI has enhanced your content.",
      });
    },
    onError: (error) => {
      toast({
        title: "Enhancement failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createContentPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Content created",
        description: "Your content has been created successfully.",
      });
      onClose();
      form.reset();
      setIsPreviewMode(false);
      setPreviewContent('');
    },
    onError: (error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    const type = form.getValues('type');
    const content = form.getValues('content');
    generateMutation.mutate({ type, content });
  };

  const handlePreview = () => {
    const content = form.getValues('content');
    const enhancement = form.getValues('aiEnhancement');
    
    if (enhancement === 'none') {
      setPreviewContent(content);
      setIsPreviewMode(true);
    } else {
      enhanceMutation.mutate({ content, enhancement });
    }
  };

  const handleSubmit = form.handleSubmit((data) => {
    const finalContent = isPreviewMode ? previewContent : data.content;
    
    const postData = {
      type: data.type,
      title: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Post`,
      content: finalContent,
      originalContent: data.content !== finalContent ? data.content : null,
      aiEnhanced: data.aiEnhancement !== 'none' || isPreviewMode,
      platforms: data.platforms,
      status: data.schedule === 'now' ? 'posted' : 'scheduled',
      scheduledAt: data.schedule === 'later' ? data.scheduledAt : null,
    };

    createMutation.mutate(postData);
  });

  const handleClose = () => {
    onClose();
    form.reset();
    setIsPreviewMode(false);
    setPreviewContent('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Content</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="type">Content Type</Label>
            <Select value={form.watch('type')} onValueChange={(value: any) => form.setValue('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economic">Economic Calendar Update</SelectItem>
                <SelectItem value="market">Market Summary</SelectItem>
                <SelectItem value="signal">Trading Signal</SelectItem>
                <SelectItem value="custom">Custom Post</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Platforms</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { id: 'telegram', label: 'Telegram' },
                { id: 'twitter', label: 'X (Twitter)' },
                { id: 'discord', label: 'Discord' },
                { id: 'websites', label: 'Websites' },
              ].map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={form.watch('platforms').includes(platform.id)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues('platforms');
                      if (checked) {
                        form.setValue('platforms', [...current, platform.id]);
                      } else {
                        form.setValue('platforms', current.filter(p => p !== platform.id));
                      }
                    }}
                  />
                  <Label htmlFor={platform.id}>{platform.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="content">Content</Label>
              {form.watch('type') !== 'custom' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? 'Generating...' : 'AI Generate'}
                </Button>
              )}
            </div>
            <Textarea
              id="content"
              rows={6}
              placeholder="Enter your content or let AI generate it..."
              {...form.register('content', { required: true })}
              className={isPreviewMode ? 'opacity-50' : ''}
              disabled={isPreviewMode}
            />
            {isPreviewMode && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-blue-700 font-medium">Enhanced Preview:</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPreviewMode(false)}
                  >
                    Edit Original
                  </Button>
                </div>
                <p className="text-blue-900 text-sm leading-relaxed">{previewContent}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schedule">Schedule</Label>
              <Select value={form.watch('schedule')} onValueChange={(value: any) => form.setValue('schedule', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Post now</SelectItem>
                  <SelectItem value="later">Schedule for later</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="aiEnhancement">AI Enhancement</Label>
              <Select value={form.watch('aiEnhancement')} onValueChange={(value: any) => form.setValue('aiEnhancement', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="grammar">Improve grammar</SelectItem>
                  <SelectItem value="engaging">Make more engaging</SelectItem>
                  <SelectItem value="emojis">Add emojis</SelectItem>
                  <SelectItem value="professional">Make professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.watch('schedule') === 'later' && (
            <div>
              <Label htmlFor="scheduledAt">Scheduled Date/Time</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                {...form.register('scheduledAt')}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={!form.watch('content') || enhanceMutation.isPending}
              >
                <Eye className="w-4 h-4 mr-2" />
                {enhanceMutation.isPending ? 'Enhancing...' : 'Preview'}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !form.watch('content')}
              >
                <Send className="w-4 h-4 mr-2" />
                {createMutation.isPending ? 'Creating...' : 'Create & Post'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
