import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Wand2, Package, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface VariantOption {
  id: string;
  name: string;
  [key: string]: any;
}

interface SelectedOptions {
  aspectRatios: string[];
  orientations: string[];
  sizes: string[];
  colors: string[];
  thicknesses: string[];
  mattingOptions: string[];
}

const BulkVariantGenerator = () => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [products, setProducts] = useState<VariantOption[]>([]);
  const [aspectRatios, setAspectRatios] = useState<VariantOption[]>([]);
  const [orientations, setOrientations] = useState<VariantOption[]>([]);
  const [sizes, setSizes] = useState<VariantOption[]>([]);
  const [colors, setColors] = useState<VariantOption[]>([]);
  const [thicknesses, setThicknesses] = useState<VariantOption[]>([]);
  const [mattingOptions, setMattingOptions] = useState<VariantOption[]>([]);
  
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({
    aspectRatios: [],
    orientations: [],
    sizes: [],
    colors: [],
    thicknesses: [],
    mattingOptions: []
  });
  
  const [defaultStock, setDefaultStock] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedCount, setEstimatedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateEstimatedCount();
  }, [selectedOptions]);

  const loadData = async () => {
    try {
      const [
        productsRes,
        sizesRes,
        thicknessRes,
        colorsRes,
        mattingRes
      ] = await Promise.all([
        supabase.from('products').select('*').eq('is_active', true),
        supabase.from('frame_sizes').select('*').eq('is_active', true),
        supabase.from('frame_thickness').select('*').eq('is_active', true),
        supabase.from('frame_colors').select('*').eq('is_active', true),
        supabase.from('matting_options').select('*').eq('is_active', true)
      ]);

      setProducts(productsRes.data || []);
      setSizes((sizesRes.data || []).map(size => ({ ...size, name: size.display_name })));
      setThicknesses(thicknessRes.data || []);
      setColors(colorsRes.data || []);
      setMattingOptions(mattingRes.data || []);
      
      // Use hardcoded data for new tables until types are updated
      setAspectRatios([
        { id: '1', name: '3:2', ratio_value: 1.5 },
        { id: '2', name: '4:3', ratio_value: 1.333 },
        { id: '3', name: '5:4', ratio_value: 1.25 },
        { id: '4', name: '1:1', ratio_value: 1.0 },
        { id: '5', name: '7:5', ratio_value: 1.4 },
        { id: '6', name: '16:9', ratio_value: 1.778 },
        { id: '7', name: '2:1', ratio_value: 2.0 },
        { id: '8', name: '3:1', ratio_value: 3.0 }
      ]);
      
      setOrientations([
        { id: '1', name: 'Landscape', code: 'landscape' },
        { id: '2', name: 'Portrait', code: 'portrait' },
        { id: '3', name: 'Square', code: 'square' }
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedCount = () => {
    const count = 
      Math.max(selectedOptions.aspectRatios.length, 1) *
      Math.max(selectedOptions.orientations.length, 1) *
      Math.max(selectedOptions.sizes.length, 1) *
      Math.max(selectedOptions.colors.length, 1) *
      Math.max(selectedOptions.thicknesses.length, 1);
    
    setEstimatedCount(count);
  };

  const toggleOption = (category: keyof SelectedOptions, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [category]: prev[category].includes(optionId)
        ? prev[category].filter(id => id !== optionId)
        : [...prev[category], optionId]
    }));
  };

  const selectAll = (category: keyof SelectedOptions, options: VariantOption[]) => {
    setSelectedOptions(prev => ({
      ...prev,
      [category]: options.map(option => option.id)
    }));
  };

  const clearAll = (category: keyof SelectedOptions) => {
    setSelectedOptions(prev => ({
      ...prev,
      [category]: []
    }));
  };

  const generateVariants = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }

    if (estimatedCount === 0) {
      toast.error('Please select at least one option from each category');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      // Simulate generation for now until database types are updated
      let processed = 0;
      const total = estimatedCount;

      for (let i = 0; i < total; i++) {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 10));
        processed++;
        setProgress((processed / total) * 100);
      }

      toast.info(`Bulk variant generation will be fully implemented after database types are updated. Would create ${estimatedCount} variants.`);
      
      // Reset form
      setSelectedOptions({
        aspectRatios: [],
        orientations: [],
        sizes: [],
        colors: [],
        thicknesses: [],
        mattingOptions: []
      });
      setProgress(0);

    } catch (error: any) {
      console.error('Error generating variants:', error);
      toast.error(`Failed to generate variants: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderOptionGroup = (
    title: string,
    category: keyof SelectedOptions,
    options: VariantOption[],
    displayKey: string = 'name'
  ) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => selectAll(category, options)}>
              Select All
            </Button>
            <Button size="sm" variant="ghost" onClick={() => clearAll(category)}>
              Clear
            </Button>
          </div>
        </div>
        <Badge variant="secondary">{selectedOptions[category].length} selected</Badge>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {options.map(option => (
          <div key={option.id} className="flex items-center space-x-2">
            <Checkbox
              id={`${category}-${option.id}`}
              checked={selectedOptions[category].includes(option.id)}
              onCheckedChange={() => toggleOption(category, option.id)}
            />
            <Label htmlFor={`${category}-${option.id}`} className="text-sm">
              {option[displayKey]}
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading options...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Bulk Variant Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label>Select Product</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a product to generate variants for" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generation Settings */}
          {selectedProduct && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Stock Quantity</Label>
                  <Input
                    type="number"
                    value={defaultStock}
                    onChange={(e) => setDefaultStock(Number(e.target.value))}
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Variants</Label>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <Package className="w-4 h-4" />
                    <span className="font-medium">{estimatedCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Option Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderOptionGroup('Aspect Ratios', 'aspectRatios', aspectRatios)}
                {renderOptionGroup('Orientations', 'orientations', orientations)}
                {renderOptionGroup('Sizes', 'sizes', sizes, 'display_name')}
                {renderOptionGroup('Colors', 'colors', colors)}
                {renderOptionGroup('Thickness', 'thicknesses', thicknesses)}
                {renderOptionGroup('Matting (Optional)', 'mattingOptions', mattingOptions)}
              </div>

              {/* Progress */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Generating Variants...</Label>
                    <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Generate Button */}
              <div className="flex justify-center">
                <Button
                  onClick={generateVariants}
                  disabled={isGenerating || estimatedCount === 0}
                  className="w-full max-w-md"
                  size="lg"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Generating...' : `Generate ${estimatedCount} Variants`}
                </Button>
              </div>

              {estimatedCount > 1000 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    You're about to generate {estimatedCount.toLocaleString()} variants. This feature will be available after database types are updated.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkVariantGenerator;