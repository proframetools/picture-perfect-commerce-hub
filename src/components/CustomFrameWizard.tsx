import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check, Camera, Palette, Ruler, Eye, ShoppingCart } from 'lucide-react';

// Import step components
import PhotoStepComponent from './wizard-steps/PhotoStepComponent';
import SizeStepComponent from './wizard-steps/SizeStepComponent';
import FrameStepComponent from './wizard-steps/FrameStepComponent';
import StyleStepComponent from './wizard-steps/StyleStepComponent';
import ReviewStepComponent from './wizard-steps/ReviewStepComponent';

interface Product {
  id: string;
  name: string;
  base_price: number;
  material: string;
  style: string;
  image_url: string | null;
}

interface CustomFrameWizardProps {
  product: Product;
  onAddToCart: (customization: any) => void;
  onClose?: () => void;
}

export interface WizardData {
  photo?: any;
  photoPosition?: { x: number; y: number; scale: number; rotation: number };
  size?: any;
  customDimensions?: { width: number; height: number };
  color?: any;
  thickness?: any;
  matting?: any;
  glassType?: string;
  totalPrice: number;
}

const STEPS = [
  { id: 'photo', title: 'Photo', icon: Camera, description: 'Upload your photo' },
  { id: 'size', title: 'Size', icon: Ruler, description: 'Choose dimensions' },
  { id: 'frame', title: 'Frame', icon: Palette, description: 'Select style & color' },
  { id: 'style', title: 'Style', icon: Eye, description: 'Matting & finishing' },
  { id: 'review', title: 'Review', icon: ShoppingCart, description: 'Final preview' },
];

const CustomFrameWizard: React.FC<CustomFrameWizardProps> = ({
  product,
  onAddToCart,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    totalPrice: product.base_price
  });
  const [loading, setLoading] = useState(false);
  const [stepValidation, setStepValidation] = useState({
    photo: false,
    size: false,
    frame: false,
    style: false,
    review: false
  });

  // Save progress to localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(`frameWizard_${product.id}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setWizardData(parsed);
        // Validate loaded data
        validateCurrentStep(parsed);
      } catch (error) {
        console.error('Error loading saved wizard data:', error);
      }
    }
  }, [product.id]);

  useEffect(() => {
    localStorage.setItem(`frameWizard_${product.id}`, JSON.stringify(wizardData));
    validateCurrentStep(wizardData);
  }, [wizardData, product.id]);

  const validateCurrentStep = (data: WizardData) => {
    const validation = {
      photo: !!data.photo,
      size: !!(data.size || (data.customDimensions?.width && data.customDimensions?.height)),
      frame: !!(data.color && data.thickness),
      style: true, // Style step is optional
      review: !!(data.photo && (data.size || data.customDimensions) && data.color && data.thickness)
    };
    setStepValidation(validation);
  };

  const updateWizardData = (stepData: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...stepData }));
  };

  const calculateTotalPrice = (data: WizardData): number => {
    let price = product.base_price;

    if (data.size) {
      price *= data.size.price_multiplier || 1;
    }

    if (data.color) {
      price += data.color.price_adjustment || 0;
    }

    if (data.thickness) {
      price *= data.thickness.price_multiplier || 1;
    }

    if (data.matting) {
      price += data.matting.price_adjustment || 0;
    }

    // Custom size premium
    if (data.customDimensions && !data.size) {
      const customArea = data.customDimensions.width * data.customDimensions.height;
      const standardArea = 80; // 8x10 default
      const areaMultiplier = customArea / standardArea;
      price = price * areaMultiplier * 1.2; // 20% premium
    }

    return price;
  };

  const nextStep = () => {
    const currentStepKey = STEPS[currentStep].id as keyof typeof stepValidation;
    if (!stepValidation[currentStepKey] && currentStep < STEPS.length - 1) {
      toast.error(`Please complete the ${STEPS[currentStep].title} step`);
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    // Only allow going to completed steps or the next step
    const targetStepKey = STEPS[stepIndex].id as keyof typeof stepValidation;
    if (stepIndex <= currentStep || stepValidation[targetStepKey]) {
      setCurrentStep(stepIndex);
    }
  };

  const handleAddToCart = () => {
    if (!stepValidation.review) {
      toast.error('Please complete all required steps');
      return;
    }

    const customization = {
      product_id: product.id,
      photo_id: wizardData.photo?.id,
      size_id: wizardData.size?.id,
      color_id: wizardData.color?.id,
      thickness_id: wizardData.thickness?.id,
      matting_id: wizardData.matting?.id,
      custom_width_inches: wizardData.customDimensions?.width,
      custom_height_inches: wizardData.customDimensions?.height,
      photo_position: wizardData.photoPosition,
      total_price: wizardData.totalPrice,
      glass_type: wizardData.glassType
    };

    onAddToCart(customization);
    
    // Clear saved data
    localStorage.removeItem(`frameWizard_${product.id}`);
    
    toast.success('Custom frame added to cart!');
  };

  const renderStepContent = () => {
    const stepId = STEPS[currentStep].id;

    switch (stepId) {
      case 'photo':
        return (
          <PhotoStepComponent
            wizardData={wizardData}
            onUpdate={updateWizardData}
          />
        );
      case 'size':
        return (
          <SizeStepComponent
            product={product}
            wizardData={wizardData}
            onUpdate={updateWizardData}
            onPriceUpdate={(price) => updateWizardData({ totalPrice: price })}
          />
        );
      case 'frame':
        return (
          <FrameStepComponent
            product={product}
            wizardData={wizardData}
            onUpdate={updateWizardData}
            onPriceUpdate={(price) => updateWizardData({ totalPrice: price })}
          />
        );
      case 'style':
        return (
          <StyleStepComponent
            product={product}
            wizardData={wizardData}
            onUpdate={updateWizardData}
            onPriceUpdate={(price) => updateWizardData({ totalPrice: price })}
          />
        );
      case 'review':
        return (
          <ReviewStepComponent
            product={product}
            wizardData={wizardData}
            onUpdate={updateWizardData}
          />
        );
      default:
        return null;
    }
  };

  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl">Custom Frame Designer</CardTitle>
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Step {currentStep + 1} of {STEPS.length}</span>
                <span>{Math.round(progressPercentage)}% Complete</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Step Navigator */}
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = stepValidation[step.id as keyof typeof stepValidation];
                const isAccessible = index <= currentStep || isCompleted;

                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => goToStep(index)}
                      disabled={!isAccessible}
                      className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isCompleted
                          ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          : isAccessible
                          ? 'hover:bg-muted'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="relative">
                        <Icon className="h-5 w-5" />
                        {isCompleted && (
                          <Check className="h-3 w-3 absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5" />
                        )}
                      </div>
                      <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div className="hidden sm:block w-8 h-px bg-border mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Step Content */}
      <div className="min-h-[600px]">
        {renderStepContent()}
      </div>

      {/* Navigation Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Total</p>
              <p className="text-2xl font-bold">${wizardData.totalPrice.toFixed(2)}</p>
            </div>

            <div className="flex items-center gap-4">
              {currentStep === STEPS.length - 1 ? (
                <Button
                  onClick={handleAddToCart}
                  disabled={!stepValidation.review}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomFrameWizard;