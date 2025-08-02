import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Upload, Trash2, Image, Download } from 'lucide-react';
import { toast } from 'sonner';

interface FrameAsset {
  id: string;
  aspect_ratio_id: string;
  color_id: string;
  thickness_id: string;
  image_url: string;
  image_path: string;
  file_size?: number;
  created_at: string;
}

interface AssetFormData {
  aspect_ratio_id: string;
  color_id: string;
  thickness_id: string;
  file: File | null;
}

const FrameAssetUploader = () => {
  const [assets, setAssets] = useState<FrameAsset[]>([]);
  const [aspectRatios, setAspectRatios] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [thicknesses, setThicknesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterRatio, setFilterRatio] = useState('all');
  const [filterColor, setFilterColor] = useState('all');
  const [formData, setFormData] = useState<AssetFormData>({
    aspect_ratio_id: '',
    color_id: '',
    thickness_id: '',
    file: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Use hardcoded data for new tables until Supabase types are updated
      const mockAspectRatios = [
        { id: '1', name: '3:2', is_active: true },
        { id: '2', name: '4:3', is_active: true },
        { id: '3', name: '16:9', is_active: true },
        { id: '4', name: '1:1', is_active: true }
      ];

      const [colorsResult, thicknessResult] = await Promise.all([
        supabase.from('frame_colors').select('*').eq('is_active', true),
        supabase.from('frame_thickness').select('*').eq('is_active', true)
      ]);

      if (colorsResult.error) throw colorsResult.error;
      if (thicknessResult.error) throw thicknessResult.error;

      // Mock assets data until table is available
      setAssets([]);
      setAspectRatios(mockAspectRatios);
      setColors(colorsResult.data || []);
      setThicknesses(thicknessResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load frame assets');
    } finally {
      setLoading(false);
    }
  };

  const generateAssetPath = (aspectRatio: string, color: string, thickness: string) => {
    // Generate structured path for frame assets
    const ratioCode = aspectRatio.replace(':', 'x');
    const colorCode = color.toLowerCase().replace(/\s+/g, '-');
    const thicknessCode = thickness.toLowerCase().replace(/\s+/g, '-');
    return `frame-assets/${ratioCode}/${colorCode}/${thicknessCode}`;
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.aspect_ratio_id || !formData.color_id || !formData.thickness_id) {
      toast.error('Please fill in all fields and select a file');
      return;
    }

    try {
      setUploading(true);

      // Get the display names for path generation
      const aspectRatio = aspectRatios.find(r => r.id === formData.aspect_ratio_id);
      const color = colors.find(c => c.id === formData.color_id);
      const thickness = thicknesses.find(t => t.id === formData.thickness_id);

      if (!aspectRatio || !color || !thickness) {
        throw new Error('Invalid selection');
      }

      // Generate structured file path
      const fileExt = formData.file.name.split('.').pop();
      const basePath = generateAssetPath(aspectRatio.name, color.name, thickness.name);
      const fileName = `frame-${Date.now()}.${fileExt}`;
      const filePath = `${basePath}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('customer-photos')
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('customer-photos')
        .getPublicUrl(filePath);

      // For now, just show success message - will save to DB once types are updated
      console.log('Would save asset:', {
        aspect_ratio_id: formData.aspect_ratio_id,
        color_id: formData.color_id,
        thickness_id: formData.thickness_id,
        image_url: data.publicUrl,
        image_path: filePath,
        file_size: formData.file.size
      });

      toast.success('Frame asset uploaded successfully');
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error uploading asset:', error);
      toast.error('Failed to upload frame asset');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (asset: FrameAsset) => {
    if (!confirm('Are you sure you want to delete this frame asset?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('customer-photos')
        .remove([asset.image_path]);

      if (storageError) {
        console.warn('Storage deletion warning:', storageError);
      }

      // For now, just show success message - will delete from DB once types are updated
      console.log('Would delete asset:', asset.id);

      toast.success('Frame asset deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete frame asset');
    }
  };

  const resetForm = () => {
    setFormData({
      aspect_ratio_id: '',
      color_id: '',
      thickness_id: '',
      file: null
    });
  };

  const filteredAssets = assets.filter(asset => {
    const matchesRatio = filterRatio === 'all' || asset.aspect_ratio_id === filterRatio;
    const matchesColor = filterColor === 'all' || asset.color_id === filterColor;
    return matchesRatio && matchesColor;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getDisplayName = (id: string, items: any[], field = 'name') => {
    const item = items.find(i => i.id === id);
    return item ? item[field] : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Frame Assets</h2>
          <p className="text-muted-foreground">Upload and manage frame preview images</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Frame Asset</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aspect_ratio">Aspect Ratio</Label>
                <Select value={formData.aspect_ratio_id} onValueChange={(value) => setFormData({ ...formData, aspect_ratio_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select aspect ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatios.map(ratio => (
                      <SelectItem key={ratio.id} value={ratio.id}>
                        {ratio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Frame Color</Label>
                <Select value={formData.color_id} onValueChange={(value) => setFormData({ ...formData, color_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frame color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map(color => (
                      <SelectItem key={color.id} value={color.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: color.hex_code }}
                          />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thickness">Frame Thickness</Label>
                <Select value={formData.thickness_id} onValueChange={(value) => setFormData({ ...formData, thickness_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frame thickness" />
                  </SelectTrigger>
                  <SelectContent>
                    {thicknesses.map(thickness => (
                      <SelectItem key={thickness.id} value={thickness.id}>
                        {thickness.name} ({thickness.width_inches}")
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Frame Image (PNG with transparency)</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/png"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Upload PNG images with transparent backgrounds for proper frame preview
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={filterRatio} onValueChange={setFilterRatio}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratios</SelectItem>
                {aspectRatios.map(ratio => (
                  <SelectItem key={ratio.id} value={ratio.id}>
                    {ratio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterColor} onValueChange={setFilterColor}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colors</SelectItem>
                {colors.map(color => (
                  <SelectItem key={color.id} value={color.id}>
                    {color.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Frame Assets ({filteredAssets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading assets...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No frame assets found. Upload some assets to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="border rounded-lg p-4 space-y-3">
                  <div className="aspect-square bg-muted rounded overflow-hidden">
                    <img 
                      src={asset.image_url} 
                      alt="Frame asset"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <div className="font-medium">
                        {getDisplayName(asset.aspect_ratio_id, aspectRatios)}
                      </div>
                      <div className="text-muted-foreground">
                        {getDisplayName(asset.color_id, colors)} • {getDisplayName(asset.thickness_id, thicknesses)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Size: {formatFileSize(asset.file_size)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(asset.image_url, '_blank')}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(asset)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FrameAssetUploader;